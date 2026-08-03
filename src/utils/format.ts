/**
 * Shared display formatters.
 *
 * These live in one place because the app previously formatted the same value
 * four different ways — a testimony card showed "11.8k" while the trending card
 * beside it showed "11,834" for the identical number.
 */

/**
 * Compact count for views, members, results and similar tallies.
 *
 *   942      → "942"
 *   1_000    → "1k"      (a bare ".0" reads as noise)
 *   11_834   → "11.8k"
 *   118_000  → "118k"    (a decimal is meaningless at this magnitude)
 *   1_250_000→ "1.3M"
 */
export function formatCount(value: number | null | undefined): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const abs = Math.abs(n);

  if (abs < 1_000) return String(n);

  const compact = (divisor: number, suffix: string) => {
    const scaled = n / divisor;
    // One decimal only below 100, where it still carries information.
    const text = Math.abs(scaled) < 100 ? scaled.toFixed(1) : String(Math.round(scaled));
    return `${text.replace(/\.0$/, '')}${suffix}`;
  };

  // Thresholds are 999_500 rather than 1_000_000 because 999,999 rounds up to
  // "1000k" at the k scale — it has to promote to "1M" before that happens.
  if (abs < 999_500) return compact(1_000, 'k');
  if (abs < 999_500_000) return compact(1_000_000, 'M');
  return compact(1_000_000_000, 'B');
}

/** "views" / "view", "testimonies" / "testimony" — pluralised off the raw count. */
export function pluralise(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

function toDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Compact date for cards and lists: "Apr 14, 1994". */
export function formatDate(iso: string | null | undefined): string {
  const date = toDate(iso);
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Full date where there is room for it, e.g. a detail header: "April 14, 1994". */
export function formatDateLong(iso: string | null | undefined): string {
  const date = toDate(iso);
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Relative time for recent activity, falling back to a date once "Nd ago"
 * stops being meaningful: "Just now", "5m ago", "3h ago", "2d ago", "Apr 14".
 */
export function formatRelativeTime(iso: string | null | undefined): string {
  const date = toDate(iso);
  if (!date) return '';

  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;

  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
