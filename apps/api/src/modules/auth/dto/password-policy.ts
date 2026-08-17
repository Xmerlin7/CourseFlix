/**
 * Shared password strength rule for every DTO that sets a new password
 * (register, password reset). `MinLength(8)` alone let straight-through
 * dictionary/digit strings ("password", "12345678") through — the
 * frontend's strength meter flagged them as weak, but nothing stopped the
 * request that ignored it. This is the server-side floor that actually
 * enforces what the meter only suggested; `PASSWORD_HINT` is shown to the
 * user, `PASSWORD_PATTERN` is what class-validator checks.
 *
 * Deliberately does not require a symbol — for a student-facing platform,
 * one more mandatory character class buys little extra strength at real
 * cost to sign-up completion. Login (LoginDto) does not apply this: it
 * authenticates whatever password was already set, not a new one.
 */
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export const PASSWORD_HINT =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a digit.';
