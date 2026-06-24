import Link from "next/link";
import { notFound } from "next/navigation";
import { getTicket } from "@/data/tickets";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import StatusBadge from "@/components/StatusBadge";

export default async function TicketDetailPage({ params }) {
  // In the App Router, `params` is awaited before use.
  const { id } = await params;
  const ticket = getTicket(id);

  if (!ticket) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Link href="/tickets" className="text-sm font-medium text-brand hover:underline">
        ← Back to tickets
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{ticket.subject}</h1>
          <p className="text-sm text-ink-soft">
            #{ticket.id} · {ticket.channel} · opened {ticket.createdAt}
          </p>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      {/* Two columns: the conversation, and a customer info sidebar. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Conversation thread */}
        <section className="space-y-4 lg:col-span-2">
          <div className="space-y-3 rounded-card border border-border bg-surface p-4">
            {ticket.messages.map((msg, i) => (
              <div key={i} className="flex gap-3">
                <Avatar name={msg.author} size="sm" />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">{msg.author}</span>
                    <span className="text-xs text-ink-soft">
                      {msg.from === "agent" ? "Agent" : "Customer"} · {msg.time}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-ink">{msg.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Reply composer — visual only this week. */}
          <div className="rounded-card border border-border bg-surface p-4">
            <textarea
              rows={3}
              placeholder="Write a reply…"
              className="w-full resize-none rounded-lg border border-border bg-canvas p-3 text-sm outline-none focus-visible:border-brand"
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost">Save draft</Button>
              <Button variant="primary">Send reply</Button>
            </div>
          </div>

          {/* =====================================================================
              RESERVED FOR THE AI AGENT (later in the semester)
              ---------------------------------------------------------------------
              This panel is intentionally disabled. In a future lab it will be
              wired to a local AI agent (via a swappable provider — Ollama by
              default) that drafts a suggested reply from the conversation above.
              For UI/UX week it is just a component to style — make it look
              inviting but clearly "not yet active".
              ===================================================================== */}
          <div className="rounded-card border border-dashed border-brand/40 bg-brand-soft p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* <span aria-hidden className="text-lg">🤖</span> */}
                <h3 className="text-sm font-semibold text-brand">
                  AI suggested reply
                </h3>
              </div>
              <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-ink-soft">
                Coming soon
              </span>
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              An AI agent will read this conversation and draft a reply for you to
              review. This feature is reserved for a later lab.
            </p>
            <button
              type="button"
              disabled
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white opacity-50"
            >
              ✨ Generate suggestion
            </button>
          </div>
        </section>

        {/* Customer / details sidebar */}
        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Customer
            </h3>
            <div className="flex items-center gap-3">
              <Avatar name={ticket.customer.name} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{ticket.customer.name}</p>
                <p className="truncate text-xs text-ink-soft">
                  {ticket.customer.email}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Details
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Priority</dt>
                <dd className="font-medium capitalize">{ticket.priority}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Channel</dt>
                <dd className="font-medium">{ticket.channel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Status</dt>
                <dd className="font-medium capitalize">{ticket.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Updated</dt>
                <dd className="font-medium">{ticket.updatedAt}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
