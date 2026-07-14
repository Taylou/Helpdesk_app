// =============================================================================
// /api/tickets/[id]  — REST item endpoint.
// -----------------------------------------------------------------------------
//   GET    /api/tickets/:id      → one ticket (+ customer + messages) → 200/404
//   PATCH  /api/tickets/:id      → update whitelisted fields → 200/400/404
//   DELETE /api/tickets/:id      → delete (messages cascade) → 204/404
//
// In the App Router, a dynamic segment's `params` is a Promise and must be
// awaited (same convention as app/tickets/[id]/page.js).
// =============================================================================

import { getTicketRaw, updateTicket, deleteTicket } from "@/lib/tickets";

export const dynamic = "force-dynamic";

function bad(message, status) {
  return Response.json({ error: message }, { status });
}

export async function GET(_req, { params }) {
  const { id } = await params;
  const ticket = await getTicketRaw(id);
  if (!ticket) return bad("Ticket not found.", 404);
  return Response.json(ticket); // 200
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const patch = await req.json().catch(() => null);
  if (!patch || typeof patch !== "object") {
    return bad("Request body must be JSON.", 400);
  }

  try {
    const result = await updateTicket(id, patch);
    if (result === "no-fields") {
      return bad("No updatable fields provided (status, priority, subject, channel).", 400);
    }
    if (!result) return bad("Ticket not found.", 404);
    return Response.json(result); // 200
  } catch (err) {
    console.error("[PATCH /api/tickets/:id]", err);
    return bad("Failed to update ticket.", 500);
  }
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  try {
    const ok = await deleteTicket(id);
    if (!ok) return bad("Ticket not found.", 404);
    return new Response(null, { status: 204 }); // no content
  } catch (err) {
    console.error("[DELETE /api/tickets/:id]", err);
    return bad("Failed to delete ticket.", 500);
  }
}
