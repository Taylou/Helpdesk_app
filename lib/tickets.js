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

// -----------------------------------------------------------------------------
// RAW helpers for the REST API (app/api/tickets/*).
// -----------------------------------------------------------------------------
// The functions above format dates for the UI ("10m ago", "08:14"). A REST API
// should return machine-readable data instead, so these return plain fields with
// ISO-8601 timestamps — the JSON any HTTP client (curl, k6, another service)
// expects. They're the write/read primitives the route handlers are built on;
// the create/reply logic mirrors app/actions/tickets.js minus the Next.js
// revalidate/redirect (a REST client doesn't need a page re-render).

// List tickets with optional status filter and subject search.
export async function listTicketsRaw({ status, q, take } = {}) {
  const where = {};
  if (status) where.status = status;
  if (q) where.subject = { contains: q, mode: "insensitive" };

  return prisma.ticket.findMany({
    where,
    include: { customer: true },
    orderBy: { updatedAt: "desc" },
    ...(Number.isInteger(take) && take > 0 ? { take } : {}),
  });
}

// One ticket with its messages, or null for a bad/unknown id.
export async function getTicketRaw(id) {
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId)) return null;

  return prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

// Create a ticket (and upsert its customer). Throws on missing required fields;
// the route handler maps that to a 400.
export async function createTicket({ name, email, subject, priority, channel, description }) {
  const cleanName = name?.toString().trim();
  const cleanEmail = email?.toString().trim().toLowerCase();
  const cleanSubject = subject?.toString().trim();

  if (!cleanName || !cleanEmail || !cleanSubject) {
    throw new Error("Name, email and subject are required.");
  }

  // One customer per email: create on first contact, keep their name current.
  const customer = await prisma.customer.upsert({
    where: { email: cleanEmail },
    update: { name: cleanName },
    create: { name: cleanName, email: cleanEmail },
  });

  const body = description?.toString().trim();
  return prisma.ticket.create({
    data: {
      subject: cleanSubject,
      status: "open",
      priority: (priority?.toString() || "medium").toLowerCase(),
      channel: channel?.toString() || "Email",
      customerId: customer.id,
      // The description becomes the customer's opening message (if provided).
      messages: body
        ? { create: { from: "customer", author: cleanName, body } }
        : undefined,
    },
    include: { customer: true },
  });
}

// Fields a client is allowed to change via PATCH. Anything else is ignored.
const TICKET_UPDATABLE = ["status", "priority", "subject", "channel"];

// Update whitelisted fields on a ticket. Returns the updated ticket, or null if
// the id doesn't exist (Prisma P2025 = record not found).
export async function updateTicket(id, patch = {}) {
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId)) return null;

  const data = {};
  for (const key of TICKET_UPDATABLE) {
    if (patch[key] != null) data[key] = patch[key].toString();
  }
  if (Object.keys(data).length === 0) return "no-fields"; // route → 400

  try {
    return await prisma.ticket.update({
      where: { id: ticketId },
      data,
      include: { customer: true },
    });
  } catch (err) {
    if (err?.code === "P2025") return null;
    throw err;
  }
}

// Delete a ticket (messages cascade). Returns true if deleted, false if missing.
export async function deleteTicket(id) {
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId)) return false;

  try {
    await prisma.ticket.delete({ where: { id: ticketId } });
    return true;
  } catch (err) {
    if (err?.code === "P2025") return false;
    throw err;
  }
}

// Add a message to a ticket and bump its updatedAt. Returns the created message,
// or null if the ticket doesn't exist / body is empty.
export async function addMessage(ticketId, { from, author, body } = {}) {
  const id = Number(ticketId);
  const cleanBody = body?.toString().trim();
  if (!Number.isInteger(id) || !cleanBody) return null;

  try {
    const message = { create: { from: from || "agent", author: author || "Agent Demo", body: cleanBody } };
    const ticket = await prisma.ticket.update({
      where: { id },
      data: { messages: message },
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    return ticket.messages[0];
  } catch (err) {
    if (err?.code === "P2025") return null;
    throw err;
  }
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
