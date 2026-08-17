import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { StudentRoleGuard } from '../auth/guards/student-role.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CommerceService } from '../commerce/commerce.service';
import { PaymobService, toSafeString } from './paymob.service';

/**
 * Real Paymob checkout (CF-S4). The `pay` endpoint is student-guarded and
 * only returns a Paymob payment URL — it never accepts price or billing
 * data from the client (server price + session user only).
 *
 * Both webhook routes are deliberately public (Paymob servers can't carry a
 * session cookie). The POST "transaction processed" callback is the
 * authoritative fulfillment source, verified by HMAC; the GET redirect only
 * routes the browser afterwards.
 */
@Controller('api/v1/paymob')
export class PaymobController {
  private readonly logger = new Logger(PaymobController.name);

  constructor(
    private readonly commerceService: CommerceService,
    private readonly paymobService: PaymobService,
    private readonly configService: ConfigService,
  ) {}

  @Post('orders/:orderId/pay')
  @UseGuards(AuthGuard, StudentRoleGuard)
  async initiatePayment(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const order = await this.commerceService.getPendingPayableOrder(
      user.id,
      orderId,
    );
    const { paymobOrderId, paymentUrl } =
      await this.paymobService.processPayment(order, user);
    await this.commerceService.recordPaymobPaymentAttempt(
      order.id,
      paymobOrderId,
    );
    return { paymentUrl, paymobOrderId };
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhookPost(
    @Query('hmac') hmac: string,
    @Body() body: { obj?: Record<string, unknown> },
  ) {
    const obj = body?.obj;
    if (!this.paymobService.verifyHmacPost(obj, hmac)) {
      throw new UnauthorizedException('Invalid HMAC signature.');
    }

    const order = (obj?.order ?? {}) as Record<string, unknown>;
    await this.commerceService.fulfillPaymobWebhook({
      merchantOrderId: toSafeString(order.merchant_order_id),
      paymobOrderId: toSafeString(order.id),
      transactionId: toSafeString(obj?.id),
      success: obj?.success === true,
    });

    return { status: 'received' };
  }

  @Get('webhook')
  async handleWebhookGet(@Req() req: Request, @Res() res: Response) {
    const query = req.query as Record<string, string | undefined>;
    const frontendBase =
      this.configService.get<string>('WEB_ORIGIN') ?? 'http://localhost:5173';

    const fallback = (path: string) => res.redirect(`${frontendBase}${path}`);

    if (!this.paymobService.verifyHmacGet(query)) {
      // Safe fallback: never throws, never trusts an unsigned redirect.
      return fallback('/student/courses');
    }

    const paymobOrderId = String(query.order ?? '');
    const context =
      await this.commerceService.findOrderContextByPaymobOrderId(paymobOrderId);
    if (!context) {
      return fallback('/student/courses');
    }

    const success = query.success === 'true';

    // Fulfil straight from the browser callback (idempotent — the same
    // order can be resolved by the POST webhook again without side
    // effects). This keeps the flow working end-to-end even when the
    // server-to-server POST webhook can't reach the API (e.g. local dev
    // without a public tunnel), since the GET redirect always lands on
    // the API from the student's own browser.
    try {
      await this.commerceService.fulfillPaymobWebhook({
        merchantOrderId: context.orderId,
        paymobOrderId,
        transactionId: String(query.id ?? ''),
        success,
      });
    } catch (caught) {
      this.logger.error(
        `GET webhook fulfillment failed for order ${context.orderId}: ${
          caught instanceof Error ? caught.message : String(caught)
        }`,
      );
      return fallback('/student/courses');
    }

    if (!success) {
      // Declined / abandoned — route back to the checkout so the student
      // sees the "تم رفض عملية الدفع" state and can retry the payment.
      return fallback(
        `/student/checkout/${context.courseId}?order=${context.orderId}`,
      );
    }

    // Route the browser to the checkout receipt page (which shows the
    // "تم الدفع بنجاح" state for a paid order), passing our internal order
    // id so the page can fetch the paid receipt.
    return fallback(
      `/student/checkout/${context.courseId}?order=${context.orderId}`,
    );
  }
}
