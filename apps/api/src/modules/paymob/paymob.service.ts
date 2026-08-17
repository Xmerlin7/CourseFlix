import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import type { OrderEntity } from '../commerce/entities/order.entity';

const PAYMOB_BASE_URL = 'https://accept.paymob.com/api';

/**
 * Coerces an arbitrary webhook field to a string for HMAC concatenation.
 * Objects (e.g. a nested source_data instead of the flat param) are dropped
 * rather than stringified to "[object Object]", which Paymob never signs.
 */
export function toSafeString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

export interface PaymobInitiateResult {
  paymobOrderId: string;
  paymentUrl: string;
}

export interface PaymobTransactionInquiry {
  id: string;
  paymobOrderId: string;
  success: boolean;
  pending: boolean;
}

interface PaymobAuthResponse {
  token: string;
}

interface PaymobOrderResponse {
  id: number;
}

interface PaymobPaymentKeyResponse {
  token: string;
}

/**
 * Talks to the Paymob Accept API (native `fetch`, no axios dependency).
 *
 * Flow: authenticate -> create Paymob order (`merchant_order_id` is our
 * order UUID) -> get payment key -> build the iframe URL. Price/currency
 * always come from the server order (`total_minor`, `EGP`) — never from
 * the client. Billing data is built from the authenticated session user.
 *
 * HMAC helpers verify the two Paymob callbacks:
 *  - POST "transaction processed" callback (server-to-server, `obj` shape)
 *  - GET redirect (browser, flat query params)
 */
@Injectable()
export class PaymobService {
  private readonly logger = new Logger(PaymobService.name);

  constructor(private readonly configService: ConfigService) {}

  private get baseUrl(): string {
    return this.configService.get<string>('PAYMOB_BASE_URL') ?? PAYMOB_BASE_URL;
  }

  private get apiKey(): string {
    const key = this.configService.get<string>('PAYMOB_API_KEY');
    if (!key || key === 'replace-me') {
      throw new InternalServerErrorException(
        'PAYMOB_API_KEY is not configured. Set it in the root .env.',
      );
    }
    return key;
  }

  private get hmacSecret(): string {
    const secret = this.configService.get<string>('PAYMOB_HMAC_SECRET');
    if (!secret || secret === 'replace-me') {
      throw new InternalServerErrorException(
        'PAYMOB_HMAC_SECRET is not configured. Set it in the root .env.',
      );
    }
    return secret;
  }

  private get iframeId(): number {
    return Number(this.configService.get<string>('PAYMOB_IFRAME_ID'));
  }

  private get integrationId(): number {
    return Number(this.configService.get<string>('PAYMOB_INTEGRATION_ID'));
  }

  private async postJson<T>(
    path: string,
    body: Record<string, unknown>,
    headers: Record<string, string> = {},
  ): Promise<T> {
    // Transient network failures (DNS, TLS, proxy, timeouts) are retried a
    // couple of times with short backoff — a single blip must not kill the
    // whole checkout. Paymob's HTTP answers (4xx/5xx) are never retried.
    let lastReason = 'unknown';

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      let response: Response;
      try {
        response = await fetch(`${this.baseUrl}${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10_000),
        });
      } catch (caught) {
        lastReason = caught instanceof Error ? caught.message : String(caught);
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
          continue;
        }
        this.logger.error(`Paymob ${path} unreachable: ${lastReason}`);
        throw new BadGatewayException(
          `Could not reach Paymob at ${path} (${lastReason})`,
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Paymob ${path} failed (${response.status}): ${errorText}`,
        );
        throw new BadGatewayException(
          `Paymob ${path} failed with status ${response.status}`,
        );
      }

      return (await response.json()) as T;
    }

    throw new BadGatewayException(
      `Could not reach Paymob at ${path} (${lastReason})`,
    );
  }

  async authenticate(): Promise<string> {
    const data = await this.postJson<PaymobAuthResponse>('/auth/tokens', {
      api_key: this.apiKey,
    });
    return data.token;
  }

  async createOrder(
    token: string,
    amountCents: number,
    merchantOrderId: string,
    currency = 'EGP',
  ): Promise<PaymobOrderResponse> {
    const data = await this.postJson<PaymobOrderResponse>('/ecommerce/orders', {
      auth_token: token,
      delivery_needed: false,
      amount_cents: amountCents,
      currency,
      merchant_order_id: merchantOrderId,
      items: [],
    });
    return { id: data.id };
  }

  async getPaymentKey(
    token: string,
    orderId: number,
    amountCents: number,
    billingData: Record<string, unknown>,
    currency = 'EGP',
  ): Promise<string> {
    const data = await this.postJson<PaymobPaymentKeyResponse>(
      '/acceptance/payment_keys',
      {
        auth_token: token,
        amount_cents: amountCents,
        expiration: 3600,
        order_id: orderId,
        billing_data: billingData,
        currency,
        integration_id: this.integrationId,
      },
    );
    return data.token;
  }

  /**
   * Full checkout: authenticate -> Paymob order -> payment key -> iframe URL.
   * `merchant_order_id` carries our order UUID so the POST webhook can find it.
   */
  async processPayment(
    order: OrderEntity,
    user: AuthenticatedUser,
  ): Promise<PaymobInitiateResult> {
    if (!Number.isInteger(this.iframeId) || this.iframeId <= 0) {
      throw new InternalServerErrorException(
        'PAYMOB_IFRAME_ID is not configured. Set it in the root .env.',
      );
    }
    if (!Number.isInteger(this.integrationId) || this.integrationId <= 0) {
      throw new InternalServerErrorException(
        'PAYMOB_INTEGRATION_ID is not configured. Set it in the root .env.',
      );
    }

    const authToken = await this.authenticate();
    const amountCents = order.totalMinor;
    const paymobOrder = await this.createOrder(
      authToken,
      amountCents,
      order.id,
      order.currency,
    );
    const billingData = this.buildBillingData(user);
    const paymentKey = await this.getPaymentKey(
      authToken,
      paymobOrder.id,
      amountCents,
      billingData,
      order.currency,
    );

    const paymentUrl = `${this.baseUrl}/acceptance/iframes/${this.iframeId}?payment_token=${paymentKey}`;

    return { paymobOrderId: String(paymobOrder.id), paymentUrl };
  }

  /**
   * Asks Paymob for the most recent transaction of our merchant order
   * (Transaction Inquiry API). This is what lets a local developer machine
   * finish payments end-to-end even though the dashboard callbacks point
   * at the deployed API: the local API verifies the outcome directly.
   *
   * 404 ("Transaction Not Found") is the normal answer while the customer
   * is still inside the iframe/3DS flow, so it returns null silently.
   * Other failures are logged and also return null — never throws.
   */
  async inquireTransaction(
    merchantOrderId: string,
  ): Promise<PaymobTransactionInquiry | null> {
    try {
      const token = await this.authenticate();

      let data: Record<string, unknown> | null = null;

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        let response: Response;
        try {
          response = await fetch(
            `${this.baseUrl}/ecommerce/orders/transaction_inquiry`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ merchant_order_id: merchantOrderId }),
              signal: AbortSignal.timeout(10_000),
            },
          );
        } catch (caught) {
          const reason =
            caught instanceof Error ? caught.message : String(caught);
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
            continue;
          }
          this.logger.warn(
            `Paymob transaction inquiry for ${merchantOrderId} unreachable: ${reason}`,
          );
          return null;
        }

        if (response.status === 404) {
          return null;
        }

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.warn(
            `Paymob transaction inquiry for ${merchantOrderId} failed (${response.status}): ${errorText}`,
          );
          return null;
        }

        data = (await response.json()) as Record<string, unknown>;
        break;
      }

      const transaction = Array.isArray(data) ? data[0] : data;
      if (!transaction || typeof transaction !== 'object') {
        return null;
      }

      const success = transaction['success'];
      if (typeof success !== 'boolean') {
        return null;
      }

      const order = transaction['order'] as Record<string, unknown> | undefined;

      return {
        id: String(transaction['id'] ?? ''),
        paymobOrderId: String(order?.['id'] ?? ''),
        success,
        pending: transaction['pending'] === true,
      };
    } catch (caught) {
      this.logger.warn(
        `Paymob transaction inquiry for ${merchantOrderId} failed: ${
          caught instanceof Error ? caught.message : String(caught)
        }`,
      );
      return null;
    }
  }

  private buildBillingData(user: AuthenticatedUser): Record<string, unknown> {
    const nameParts = user.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] ?? 'NA';
    const lastName = nameParts.slice(1).join(' ') || 'NA';

    return {
      apartment: 'NA',
      email: user.email,
      floor: 'NA',
      first_name: firstName,
      street: 'NA',
      building: 'NA',
      phone_number: 'NA',
      shipping_method: 'NA',
      postal_code: 'NA',
      city: 'Cairo',
      country: 'EG',
      last_name: lastName,
      state: 'NA',
    };
  }

  private computeHmac(concatenated: string): string {
    return createHmac('sha512', this.hmacSecret)
      .update(concatenated)
      .digest('hex');
  }

  private safeEqual(a: string, b: string): boolean {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    return aBuf.length === bBuf.length && timingSafeEqual(aBuf, bBuf);
  }

  /**
   * GET redirect (browser): flat query params. Paymob signs the transaction
   * response fields with the transaction id (`id`) and order id (`order`).
   */
  verifyHmacGet(query: Record<string, string | undefined>): boolean {
    const received = query.hmac;
    if (!received) {
      return false;
    }
    const concatenated =
      `${query.amount_cents ?? ''}` +
      `${query.created_at ?? ''}` +
      `${query.currency ?? ''}` +
      `${query.error_occured ?? ''}` +
      `${query.has_parent_transaction ?? ''}` +
      `${query.id ?? ''}` +
      `${query.integration_id ?? ''}` +
      `${query.is_3d_secure ?? ''}` +
      `${query.is_auth ?? ''}` +
      `${query.is_capture ?? ''}` +
      `${query.is_refunded ?? ''}` +
      `${query.is_standalone_payment ?? ''}` +
      `${query.is_voided ?? ''}` +
      `${query.order ?? ''}` +
      `${query.owner ?? ''}` +
      `${query.pending ?? ''}` +
      `${query.source_data_pan ?? query['source_data.pan'] ?? ''}` +
      `${query.source_data_sub_type ?? query['source_data.sub_type'] ?? ''}` +
      `${query.source_data_type ?? query['source_data.type'] ?? ''}` +
      `${query.success ?? ''}`;
    return this.safeEqual(this.computeHmac(concatenated), received);
  }

  /**
   * POST "transaction processed" callback: Paymob posts `{ obj: {...} }` and
   * the hmac as a query param. The `obj` carries `order.merchant_order_id`.
   */
  verifyHmacPost(
    obj: Record<string, unknown> | undefined,
    receivedHmac: string,
  ): boolean {
    if (!receivedHmac || !obj) {
      return false;
    }
    const source = obj.source_data as Record<string, unknown> | undefined;
    const order = obj.order as Record<string, unknown> | undefined;

    const concatenated =
      `${toSafeString(obj.amount_cents)}` +
      `${toSafeString(obj.created_at)}` +
      `${toSafeString(obj.currency)}` +
      `${toSafeString(obj.error_occured)}` +
      `${toSafeString(obj.has_parent_transaction)}` +
      `${toSafeString(obj.id)}` +
      `${toSafeString(obj.integration_id)}` +
      `${toSafeString(obj.is_3d_secure)}` +
      `${toSafeString(obj.is_auth)}` +
      `${toSafeString(obj.is_capture)}` +
      `${toSafeString(obj.is_refunded)}` +
      `${toSafeString(obj.is_standalone_payment)}` +
      `${toSafeString(obj.is_voided)}` +
      `${toSafeString(order?.id)}` +
      `${toSafeString(obj.owner)}` +
      `${toSafeString(obj.pending)}` +
      `${toSafeString(source?.pan)}` +
      `${toSafeString(source?.sub_type)}` +
      `${toSafeString(source?.type)}` +
      `${toSafeString(obj.success)}`;
    return this.safeEqual(this.computeHmac(concatenated), receivedHmac);
  }
}
