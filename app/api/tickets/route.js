// =============================================================================
// /api/tickets  — REST collection endpoint.
// -----------------------------------------------------------------------------
//   GET  /api/tickets            → list tickets (query: status, q, take)
//   POST /api/tickets            → create a ticket (JSON body) → 201
//
// This is a second server boundary alongside the Server Actions in
// app/actions/tickets.js. Actions are tied to a <form> on the same origin; a
// REST route speaks plain HTTP + JSON, so ANY client (curl, k6, another app)
// can call it. Both sit on top of the same lib/tickets.js data layer.
// =============================================================================

import { listTicketsRaw, createTicket } from "@/lib/tickets";

// Route handlers are cached by default; ticket data is live, so opt out.
export const dynamic = "force-dynamic";

// Small helper for JSON error bodies with the right status code.
function bad(message, status) {
  return Response.json({ error: message }, { status });
}

// GET /api/tickets?status=open&q=login&take=20
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const q = searchParams.get("q") || undefined;
  const takeParam = searchParams.get("take");
  const take = takeParam != null ? Number(takeParam) : undefined;

  try {
    const tickets = await listTicketsRaw({ status, q, take });
    return Response.json(tickets); // 200
  } catch (err) {
    console.error("[GET /api/tickets]", err);
    return bad("Failed to list tickets.", 500);
  }
}

// POST /api/tickets  { name, email, subject, priority?, channel?, description? }
export async function POST(req) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return bad("Request body must be JSON.", 400);
  }

  try {
    const ticket = await createTicket(body);
    return Response.json(ticket, { status: 201 });
  } catch (err) {
    // createTicket throws a plain Error for missing required fields → 400.
    if (err instanceof Error && /required/i.test(err.message)) {
      return bad(err.message, 400);
    }
    console.error("[POST /api/tickets]", err);
    return bad("Failed to create ticket.", 500);
  }
}
