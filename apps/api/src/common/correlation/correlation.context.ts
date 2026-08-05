import { AsyncLocalStorage } from 'node:async_hooks';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

interface CorrelationStore {
  correlationId: string;
}

const storage = new AsyncLocalStorage<CorrelationStore>();

export function runWithCorrelationId<T>(
  correlationId: string,
  callback: () => T,
): T {
  return storage.run({ correlationId }, callback);
}

export function getCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}
