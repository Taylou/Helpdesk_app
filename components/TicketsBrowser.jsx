"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import TicketRow from "@/components/TicketRow";

// Filter chips. "All" plus one per status. Now they actually filter.
const FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "pending", label: "Pending" },
  { key: "closed", label: "Closed" },
];

export default function TicketsBrowser({ tickets }) {
  const searchParams = useSearchParams();
  // Initial query comes from the URL (?q=…) so the topbar search lands here.
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [status, setStatus] = useState("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((t) => {
      const matchesStatus = status === "all" || t.status === status;
      const matchesQuery =
        !q ||
        t.subject.toLowerCase().includes(q) ||
        t.customer.name.toLowerCase().includes(q) ||
        t.customer.email.toLowerCase().includes(q) ||
        String(t.id).includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [tickets, query, status]);

  return (
    <div className="space-y-6">
      {/* Page-level search box */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <span aria-hidden className="text-ink-soft">
          🔍
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by subject, customer, email or #id…"
          aria-label="Filter tickets"
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-xs text-ink-soft hover:text-ink"
          >
            Clear
          </button>
        ) : null}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = f.key === status;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatus(f.key)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand text-white"
                  : "border border-border bg-surface text-ink-soft hover:bg-canvas"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* The list, or a friendly empty state when nothing matches. */}
      <section className="rounded-card border border-border bg-surface">
        <div className="hidden items-center gap-4 border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-ink-soft md:flex">
          <span className="w-7" />
          <span className="flex-1">Subject</span>
          <span className="w-20">Priority</span>
          <span className="w-20">Status</span>
          <span className="w-20 text-right">Updated</span>
        </div>

        {visible.length > 0 ? (
          <div className="divide-y divide-border">
            {visible.map((ticket) => (
              <TicketRow key={ticket.id} ticket={ticket} />
            ))}
          </div>
        ) : (
          <div className="px-4 py-12 text-center">
            <p className="text-2xl">🔍</p>
            <p className="mt-2 text-sm font-medium">No matching tickets</p>
            <p className="mt-1 text-sm text-ink-soft">
              Try a different search or clear the filters.
            </p>
          </div>
        )}
      </section>

      <p className="text-xs text-ink-soft">
        Showing {visible.length} of {tickets.length} tickets
      </p>
    </div>
  );
}
