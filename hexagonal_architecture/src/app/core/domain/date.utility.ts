/**
 * CORE · DOMAIN — Calendar-date parsing shared by the domain and the adapters.
 * PURE TypeScript, ZERO @angular.
 *
 * WHY THIS EXISTS: `new Date('2026-08-03')` parses an ISO *date-only* string as
 * UTC midnight, then every local-time getter and `toLocaleDateString` renders it
 * shifted. West of UTC that lands on the previous day — and when the date is the
 * 1st of a month it lands in the previous MONTH, so a loan maturing 2031-05-01
 * reads "April 2031".
 *
 * Angular's `DatePipe` already parses date-only strings as LOCAL, which is why
 * a stat tile and the sentence beside it could disagree. This helper makes the
 * hand-formatted paths agree with the pipe.
 */

/** Parse a `yyyy-MM-dd` string as a LOCAL calendar date (no timezone shift). */
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
