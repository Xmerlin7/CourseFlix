// jest-dom v6 augments the `vitest` module's `Assertion`, but vitest v4
// declares `Assertion` in `@vitest/expect`, so those matchers never attach.
// Re-apply the augmentation to the interface vitest v4 actually uses.
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare module '@vitest/expect' {
  interface Assertion<T = any> extends TestingLibraryMatchers<any, T> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<any, any> {}
}
