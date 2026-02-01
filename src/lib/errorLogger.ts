/**
 * Production-safe error logging utility.
 * Prevents sensitive error details from being exposed in browser console.
 */

const isDevelopment = import.meta.env.DEV;

/**
 * Log an error with context. In production, only logs a sanitized message.
 * In development, logs the full error details.
 */
export const logError = (context: string, error: unknown): void => {
  if (isDevelopment) {
    console.error(`[${context}]`, error);
  } else {
    // In production, only log a generic message without sensitive details
    console.error(`[${context}] An error occurred`);
  }
};

/**
 * Log a warning with context. In production, only logs a sanitized message.
 */
export const logWarning = (context: string, message: string, details?: unknown): void => {
  if (isDevelopment) {
    console.warn(`[${context}]`, message, details);
  } else {
    console.warn(`[${context}]`, message);
  }
};

/**
 * Log debug information. Only logs in development mode.
 */
export const logDebug = (context: string, message: string, details?: unknown): void => {
  if (isDevelopment) {
    console.log(`[${context}]`, message, details);
  }
};
