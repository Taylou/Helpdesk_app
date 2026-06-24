// A small coloured pill that communicates a ticket's status.
//
// Exercise 3: each status maps to a soft background + a darker text colour,
// both pulled from the design tokens in globals.css. Try adding a new status
// or changing the colours and watch every badge in the app update.
const STYLES = {
  open: "bg-open-soft text-open",
  pending: "bg-pending-soft text-pending",
  closed: "bg-closed-soft text-closed",
};

const LABELS = {
  open: "Open",
  pending: "Pending",
  closed: "Closed",
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] ?? "bg-closed-soft text-closed";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style}`}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[status] ?? status}
    </span>
  );
}
