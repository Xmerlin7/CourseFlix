import type { OrderItemEntity } from '../entities/order-item.entity';
import type { OrderEntity } from '../entities/order.entity';
import type {
  PaymentAdapter,
  PaymentAdapterResult,
  PaymentSimulation,
} from './payment-adapter.interface';

/**
 * Deterministic Sprint 3 payment adapter (sprint3-plan.md "No real
 * payments"): `success` always pays, `decline` always fails. No real
 * card data is accepted or stored — the confirm request may only carry
 * `simulate`, never payment instrument fields, and the client can never
 * set price, currency, or paid status (all enforced in CommerceService).
 */
export class TestPaymentAdapter implements PaymentAdapter {
  readonly name = 'test_adapter';

  process(
    _order: OrderEntity,
    _items: OrderItemEntity[],
    simulation: PaymentSimulation,
  ): PaymentAdapterResult {
    if (simulation === 'decline') {
      return { status: 'failed', externalRef: 'test-declined' };
    }
    return { status: 'paid', externalRef: 'test-ok' };
  }
}
