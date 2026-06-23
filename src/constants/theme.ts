/**
 * Shared design tokens. Kept intentionally small for the scaffold — the UI
 * tickets (MI-14/15 Home, MI-21 day cards) will expand this alongside the
 * Tailwind theme in tailwind.config.js.
 */

/** The three fertility readings recorded once per charting day. */
export const READINGS = ["low", "high", "peak"] as const;
export type Reading = (typeof READINGS)[number];

/** Color per reading — mirrors `theme.colors.reading` in tailwind.config.js. */
export const READING_COLORS: Record<Reading, string> = {
  low: "#16a34a",
  high: "#eab308",
  peak: "#f97316",
};
