export function useLocalStorage<T>(key: string, initialValue: T) {
  void key
  // TODO: implement typed localStorage state with SSR-safe fallback.
  return [initialValue, () => {}] as const
}
