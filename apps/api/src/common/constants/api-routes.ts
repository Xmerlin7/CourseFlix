export const API_V1_PREFIX = 'api/v1';

/**
 * Shared route constants for Sprint 3 commerce/sales endpoints
 * (sprint3-plan.md §8 "New Or Changed Endpoints"). Centralized here so
 * the checkout UI (Elgendy), sales UI + Analytics Agent (Nabile), and
 * e2e suites all build against the same strings.
 */
export const API_ROUTES = {
  checkout: {
    createOrder: `${API_V1_PREFIX}/checkout/orders`,
    confirmOrder: (orderId: string) =>
      `${API_V1_PREFIX}/checkout/orders/${orderId}/confirm`,
  },
  orders: {
    getOrder: (orderId: string) => `${API_V1_PREFIX}/orders/${orderId}`,
  },
  sales: {
    summary: `${API_V1_PREFIX}/teacher/sales/summary`,
  },
} as const;
