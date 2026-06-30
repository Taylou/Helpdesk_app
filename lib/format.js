// Small date formatters so the DB's real DateTime values render the same way
// the old hardcoded strings did ("10m ago", "08:14", "9 Jun 2026, 08:14").

// "just now" / "10m ago" / "3h ago" / "Yesterday" / "5 days ago"
export function formatRelative(date) {
  const then = new Date(date).getTime();
  const mins = Math.round((Date.now() - then) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

// "08:14" (24-hour clock)
export function formatClock(date) {
  return new Date(date).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// "9 Jun 2026, 08:14"
export function formatDateTime(date) {
  const d = new Date(date);
  const month = d.toLocaleString("en-GB", { month: "short" });
  return `${d.getDate()} ${month} ${d.getFullYear()}, ${formatClock(d)}`;
}
