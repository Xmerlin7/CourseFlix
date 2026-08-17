import type { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { CommerceService } from '../commerce/commerce.service';
import { PaymobController } from './paymob.controller';
import { PaymobService } from './paymob.service';

function makeController({
  getWebhookValid = true,
  success = true,
  context = { orderId: 'order-1', courseId: 'course-1' },
  fulfillError = null,
  inquiry = {
    id: 'txn-1',
    paymobOrderId: '9001',
    success: true,
    pending: false,
  },
  getOrderResult = { status: 'pending', paymentStatus: 'pending' },
  getOrderError = null,
}: {
  getWebhookValid?: boolean;
  success?: boolean;
  context?: { orderId: string; courseId: string } | null;
  fulfillError?: Error | null;
  inquiry?: {
    id: string;
    paymobOrderId: string;
    success: boolean;
    pending: boolean;
  } | null;
  getOrderResult?: Record<string, unknown>;
  getOrderError?: Error | null;
} = {}) {
  const paymobService = {
    verifyHmacGet: jest.fn().mockReturnValue(getWebhookValid),
    inquireTransaction: jest.fn().mockResolvedValue(inquiry),
  } as unknown as PaymobService;

  const commerceService = {
    findOrderContextByPaymobOrderId: jest.fn().mockResolvedValue(context),
    fulfillPaymobWebhook: jest
      .fn()
      .mockImplementation(
        fulfillError
          ? () => Promise.reject(fulfillError)
          : () => Promise.resolve(),
      ),
    getOrder: jest
      .fn()
      .mockImplementation(
        getOrderError
          ? () => Promise.reject(getOrderError)
          : () => Promise.resolve(getOrderResult),
      ),
  } as unknown as CommerceService;

  const configService = {
    get: jest.fn().mockReturnValue('http://localhost:5173'),
  } as unknown as ConfigService;

  const controller = new PaymobController(
    commerceService,
    paymobService,
    configService,
  );

  const res = { redirect: jest.fn() } as unknown as Response;

  return { controller, commerceService, paymobService, res };
}

function query({
  success = 'true',
  order = '9001',
  id = 'txn-1',
}: { success?: string; order?: string; id?: string } = {}) {
  return {
    amount_cents: '50000',
    currency: 'EGP',
    success,
    order,
    id,
    hmac: 'sig',
  };
}

describe('PaymobController webhook GET', () => {
  it('fulfils the order and redirects to the receipt page on a signed success', async () => {
    const { controller, commerceService, res } = makeController();

    await controller.handleWebhookGet({ query: query() } as never, res);

    expect(commerceService.fulfillPaymobWebhook).toHaveBeenCalledWith({
      merchantOrderId: 'order-1',
      paymobOrderId: '9001',
      transactionId: 'txn-1',
      success: true,
    });
    expect(res.redirect).toHaveBeenCalledWith(
      'http://localhost:5173/student/checkout/course-1?order=order-1',
    );
  });

  it('marks the order failed and sends the student back to retry on a signed decline', async () => {
    const { controller, commerceService, res } = makeController({
      success: false,
    });

    await controller.handleWebhookGet(
      { query: query({ success: 'false' }) } as never,
      res,
    );

    expect(commerceService.fulfillPaymobWebhook).toHaveBeenCalledWith({
      merchantOrderId: 'order-1',
      paymobOrderId: '9001',
      transactionId: 'txn-1',
      success: false,
    });
    expect(res.redirect).toHaveBeenCalledWith(
      'http://localhost:5173/student/checkout/course-1?order=order-1',
    );
  });

  it('ignores unsigned callbacks and never fulfils anything', async () => {
    const { controller, commerceService, res } = makeController({
      getWebhookValid: false,
    });

    await controller.handleWebhookGet({ query: query() } as never, res);

    expect(commerceService.fulfillPaymobWebhook).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(
      'http://localhost:5173/student/courses',
    );
  });

  it('falls back safely when the order context cannot be resolved', async () => {
    const { controller, commerceService, res } = makeController({
      context: null,
    });

    await controller.handleWebhookGet({ query: query() } as never, res);

    expect(commerceService.fulfillPaymobWebhook).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(
      'http://localhost:5173/student/courses',
    );
  });

  it('falls back safely when fulfillment fails but never throws', async () => {
    const { controller, commerceService, res } = makeController({
      fulfillError: new Error('db down'),
    });

    await controller.handleWebhookGet({ query: query() } as never, res);

    expect(commerceService.fulfillPaymobWebhook).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(
      'http://localhost:5173/student/courses',
    );
  });
});

describe('PaymobController payment status', () => {
  const user = {
    id: 'student-1',
    fullName: 'Test Student',
    email: 't@example.com',
  };

  it('fulfils and returns the settled order when Paymob reports a successful transaction', async () => {
    const { controller, commerceService, paymobService } = makeController();

    const result = await controller.paymentStatus('order-1', user as never);

    expect(paymobService.inquireTransaction).toHaveBeenCalledWith('order-1');
    expect(commerceService.fulfillPaymobWebhook).toHaveBeenCalledWith({
      merchantOrderId: 'order-1',
      paymobOrderId: '9001',
      transactionId: 'txn-1',
      success: true,
    });
    expect(commerceService.getOrder).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ status: 'pending', paymentStatus: 'pending' });
  });

  it('marks the order failed when Paymob reports a declined transaction', async () => {
    const { controller, commerceService } = makeController({
      inquiry: {
        id: 'txn-2',
        paymobOrderId: '9001',
        success: false,
        pending: false,
      },
    });

    await controller.paymentStatus('order-1', user as never);

    expect(commerceService.fulfillPaymobWebhook).toHaveBeenCalledWith({
      merchantOrderId: 'order-1',
      paymobOrderId: '9001',
      transactionId: 'txn-2',
      success: false,
    });
  });

  it('leaves the order untouched while the transaction is still pending', async () => {
    const { controller, commerceService, paymobService } = makeController({
      inquiry: {
        id: 'txn-3',
        paymobOrderId: '9001',
        success: false,
        pending: true,
      },
    });

    await controller.paymentStatus('order-1', user as never);

    expect(paymobService.inquireTransaction).toHaveBeenCalled();
    expect(commerceService.fulfillPaymobWebhook).not.toHaveBeenCalled();
  });

  it('leaves the order untouched when Paymob has no transaction yet', async () => {
    const { controller, commerceService } = makeController({ inquiry: null });

    await controller.paymentStatus('order-1', user as never);

    expect(commerceService.fulfillPaymobWebhook).not.toHaveBeenCalled();
    expect(commerceService.getOrder).toHaveBeenCalledTimes(1);
  });

  it('returns the order as-is when inquiry fulfillment fails, without throwing', async () => {
    const { controller, commerceService } = makeController({
      fulfillError: new Error('db down'),
      getOrderResult: { status: 'pending', paymentStatus: 'pending' },
    });

    const result = await controller.paymentStatus('order-1', user as never);

    expect(commerceService.fulfillPaymobWebhook).toHaveBeenCalled();
    expect(result).toEqual({ status: 'pending', paymentStatus: 'pending' });
  });

  it('propagates ownership/not-found errors from the order lookup', async () => {
    const { controller, paymobService } = makeController({
      getOrderError: new Error('not found'),
    });

    await expect(
      controller.paymentStatus('order-9', user as never),
    ).rejects.toThrow('not found');
    expect(paymobService.inquireTransaction).not.toHaveBeenCalled();
  });
});
