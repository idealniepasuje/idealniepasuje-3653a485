/**
 * Validates an email address format and checks for header injection characters.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false;
  if (email.includes('\n') || email.includes('\r') || email.includes('\0')) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitizes a string for use in email headers (subject, names).
 * Removes newlines and control characters to prevent header injection.
 */
export function sanitizeHeader(value: string, maxLength = 200): string {
  if (!value || typeof value !== 'string') return '';
  return value
    .replace(/[\r\n]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .substring(0, maxLength);
}
