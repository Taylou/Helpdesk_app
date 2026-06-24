import { Suspense } from "react";
import Link from "next/link";
import { tickets } from "@/data/tickets";
import TicketsBrowser from "@/components/TicketsBrowser";

export default function TicketsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
          <p className="text-sm text-ink-soft">{tickets.length} conversations</p>
        </div>
        <Link
          href="/new"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          + New ticket
        </Link>
      </div>

      {/* Search + filtering happen client-side. useSearchParams (for the ?q=
          coming from the topbar) needs a Suspense boundary. */}
      <Suspense fallback={<p className="text-sm text-ink-soft">Loading tickets…</p>}>
        <TicketsBrowser tickets={tickets} />
      </Suspense>
    </div>
  );
}
