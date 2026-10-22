const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});
const dateOnly = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** Platform timestamps are shown in UTC so every super admin sees the same value. */
export const formatDateTime = (iso: string) => `${dateTime.format(new Date(iso))} UTC`;
export const formatDate = (iso: string) => dateOnly.format(new Date(iso));

export const formatPercent = (used: number, limit: number) => (limit > 0 ? Math.round((used / limit) * 100) : 0);
