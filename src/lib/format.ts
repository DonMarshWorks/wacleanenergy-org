/**
 * Date formatting helpers. All formatters pin `timeZone: "UTC"` so a
 * date written as `2026-04-15` in YAML/frontmatter renders the same
 * everywhere — without this, a build on a Pacific-timezone machine
 * would render UTC-midnight dates as the previous calendar day.
 */

const FULL_DATE: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
};

const MONTH_YEAR: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  timeZone: "UTC",
};

export const formatDate = (date: Date): string =>
  date.toLocaleDateString("en-US", FULL_DATE);

export const formatMonth = (date: Date): string =>
  date.toLocaleDateString("en-US", MONTH_YEAR);
