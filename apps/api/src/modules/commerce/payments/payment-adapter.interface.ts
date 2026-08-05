import type { OrderItemEntity } from '../entities/order-item.entity';
import type { OrderEntity } from '../entities/order.entity';

/**
 * DI token for the payment adapter. CommerceModule binds it to the
 * deterministic `TestPaymentAdapter` for this sprint — swapping in a real
 * provider later only changes the module wiring, never the service.
 */
export const PAYMENT_ADAPTER = Symbol('PAYMENT_ADAPTER');

export type PaymentSimulation = 'success' | 'decline';

export interface PaymentAdapterResult {
  status: 'paid' | 'failed';
  externalRef: string;
}

export interface PaymentAdapter {
  readonly name: string;
  process(
    order: OrderEntity,
    items: OrderItemEntity[],
    simulation: PaymentSimulation,
  ): PaymentAdapterResult;
}
