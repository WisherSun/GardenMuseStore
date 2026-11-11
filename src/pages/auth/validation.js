export const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(email) {
  if (!email.trim()) return "Please enter your email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Please enter a valid email address.";
  return null;
}

export function validatePassword(password) {
  if (!password) return "Please enter a password.";
  if (password.length < MIN_PASSWORD_LENGTH)
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  return null;
}
