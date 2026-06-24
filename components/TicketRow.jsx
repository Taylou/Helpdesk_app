import Link from "next/link";
import Avatar from "@/components/Avatar";
import StatusBadge from "@/components/StatusBadge";

// Colour dot for priority. Uses Tailwind's built-in palette rather than a
// token — a good talking point about when to tokenise a colour and when not.
const PRIORITY_DOT = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-slate-300",
};

// One ticket as a clickable row. Used on the dashboard and the tickets list.
export default function TicketRow({ ticket }) {
  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-canvas"
    >
      <Avatar name={ticket.customer.name} size="sm" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{ticket.subject}</p>
        <p className="truncate text-xs text-ink-soft">
          {ticket.customer.name} · #{ticket.id}
        </p>
      </div>

      <span className="hidden items-center gap-1.5 text-xs text-ink-soft sm:flex">
        <span
          aria-hidden
          className={`h-2 w-2 rounded-full ${PRIORITY_DOT[ticket.priority]}`}
        />
        {ticket.priority}
      </span>

      <StatusBadge status={ticket.status} />

      <span className="hidden w-20 text-right text-xs text-ink-soft md:inline">
        {ticket.updatedAt}
      </span>
    </Link>
  );
}
