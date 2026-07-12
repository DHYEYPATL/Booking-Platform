import ms from 'ms';

/**
 * Parses a string duration (e.g., '15m', '7d') into a numeric value in seconds.
 * Fallbacks to a default number of seconds if parsing fails.
 */
export function parseTimeToSeconds(
  timeStr: string | undefined,
  defaultSeconds: number,
): number {
  if (!timeStr) {
    return defaultSeconds;
  }

  try {
    // Type-safe cast using Parameters utility of ms function
    const parsed = ms(timeStr as Parameters<typeof ms>[0]);
    if (typeof parsed === 'number') {
      return Math.floor(parsed / 1000);
    }
  } catch {
    // Fallback to default if there is a parsing error
  }
  return defaultSeconds;
}
