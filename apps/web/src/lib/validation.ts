// Client-side checks that mirror the api rules (`registerSchema`). The api stays
// the source of truth; these only give early, plain-language feedback. Each
// validator returns an error message, or null when the value is fine.

export type Validator = (value: string) => string | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const validateEmail: Validator = (value) => {
  if (value.trim() === '') return 'Enter your email address';
  return EMAIL_PATTERN.test(value.trim())
    ? null
    : 'Enter a valid email address';
};

/** Rules for choosing a password (sign-up). */
export const validateNewPassword =
  (minLength: number): Validator =>
  (value) => {
    if (value === '') return 'Enter a password';
    return value.length < minLength
      ? `Password must be at least ${minLength} characters`
      : null;
  };

/** Sign-in only checks that something was entered: old passwords keep working. */
export const validateCurrentPassword: Validator = (value) =>
  value === '' ? 'Enter your password' : null;
