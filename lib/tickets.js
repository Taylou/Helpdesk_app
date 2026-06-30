// Server-only data-access layer. The pages used to import a hardcoded array from
// data/tickets.js; now they call these functions, which read from Postgres via
// Prisma and return the SAME object shape the components already expect. That's
// why the UI barely changed when the database was added.
import { prisma } from "@/lib/prisma";
import { formatRelative, formatClock, formatDateTime } from "@/lib/format";

// Map a Ticket (+customer) row to the shape used by TicketRow / TicketsBrowser.
function toRow(t) {
  return {
    id: t.id,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    channel: t.channel,
    customer: { name: t.customer.name, email: t.customer.email },
    updatedAt: formatRelative(t.updatedAt),
  };
}

export async function getTickets() {
  const rows = await prisma.ticket.findMany({
    include: { customer: true },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(toRow);
}

export async function getRecentTickets(n = 5) {
  const rows = await prisma.ticket.findMany({
    include: { customer: true },
    orderBy: { updatedAt: "desc" },
    take: n,
  });
  return rows.map(toRow);
}

export async function getTicket(id) {
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId)) return null;

  const t = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!t) return null;

  return {
    id: t.id,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    channel: t.channel,
    createdAt: formatDateTime(t.createdAt),
    updatedAt: formatRelative(t.updatedAt),
    customer: { name: t.customer.name, email: t.customer.email },
    messages: t.messages.map((m) => ({
      from: m.from,
      author: m.author,
      time: formatClock(m.createdAt),
      body: m.body,
    })),
  };
}

export async function getStats() {
  const [open, pending] = await Promise.all([
    prisma.ticket.count({ where: { status: "open" } }),
    prisma.ticket.count({ where: { status: "pending" } }),
  ]);

  // Open/Pending are live from the DB; the other two stay as illustrative
  // sample metrics for the lab (no historical data to compute them yet).
  return [
    { label: "Open tickets", value: open, hint: "Awaiting a first or next reply", icon: "🟢" },
    { label: "Pending", value: pending, hint: "Waiting on the customer", icon: "🟡" },
    { label: "Resolved today", value: 7, hint: "+2 vs. yesterday", icon: "✅" },
    { label: "Avg. first response", value: "18m", hint: "Target: under 30m", icon: "⏱️" },
  ];
}
