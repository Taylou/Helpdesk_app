import Link from "next/link";
import { tickets } from "@/data/tickets";
import { stats } from "@/data/stats";
import StatCard from "@/components/StatCard";
import TicketRow from "@/components/TicketRow";

export default function DashboardPage() {
  const recent = tickets.slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-ink-soft">
          Here&apos;s what&apos;s happening in your support queue today.
        </p>
      </div>

      {/* Stat cards.
          Exercise 4: this grid is fixed at 4 columns, so it overflows on a
          phone. Make it responsive (e.g. 1 column on mobile, 2 on small,
          4 on large). */}
      <section className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </section>

      {/* Recent tickets list */}
      <section className="rounded-card border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Recent tickets</h2>
          <Link href="/tickets" className="text-sm font-medium text-brand hover:underline">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recent.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} />
          ))}
        </div>
      </section>
    </div>
  );
}
