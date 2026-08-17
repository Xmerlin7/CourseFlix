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
}: {
  getWebhookValid?: boolean;
  success?: boolean;
  context?: { orderId: string; courseId: string } | null;
  fulfillError?: Error | null;
} = {}) {
  const paymobService = {
    verifyHmacGet: jest.fn().mockReturnValue(getWebhookValid),
  } as unknown as PaymobService;

  const commerceService = {
    findOrderContextByPaymobOrderId: jest.fn().mockResolvedValue(context),
    fulfillPaymobWebhook: jest
      .fn()
      .mockImplementation(fulfillError ? () => Promise.reject(fulfillError) : () => Promise.resolve()),
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
    const { controller, commerceService, res } = makeController({ success: false });

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
    const { controller, commerceService, res } = makeController({ getWebhookValid: false });

    await controller.handleWebhookGet({ query: query() } as never, res);

    expect(commerceService.fulfillPaymobWebhook).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/student/courses');
  });

  it('falls back safely when the order context cannot be resolved', async () => {
    const { controller, commerceService, res } = makeController({ context: null });

    await controller.handleWebhookGet({ query: query() } as never, res);

    expect(commerceService.fulfillPaymobWebhook).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/student/courses');
  });

  it('falls back safely when fulfillment fails but never throws', async () => {
    const { controller, commerceService, res } = makeController({
      fulfillError: new Error('db down'),
    });

    await controller.handleWebhookGet({ query: query() } as never, res);

    expect(commerceService.fulfillPaymobWebhook).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/student/courses');
  });
});