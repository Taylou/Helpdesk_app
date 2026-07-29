// =============================================================================
// /api/tickets/[id]/messages  — add a reply to a ticket.
// -----------------------------------------------------------------------------
//   POST /api/tickets/:id/messages  { body, from?, author? } → 201/400/404
//
// Nested resource: a message belongs to a ticket. Posting one also bumps the
// ticket's updatedAt (see addMessage in lib/tickets.js), mirroring the
// addReplyAction Server Action.
// =============================================================================

import { addMessage } from "@/lib/tickets";

export const dynamic = "force-dynamic";

function bad(message, status) {
  return Response.json({ error: message }, { status });
}

export async function POST(req, { params }) {
  const { id } = await params;
  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return bad("Request body must be JSON.", 400);
  }
  if (!payload.body?.toString().trim()) {
    return bad("Message body is required.", 400);
  }

  try {
    const message = await addMessage(id, payload);
    if (!message) return bad("Ticket not found.", 404);
    return Response.json(message, { status: 201 });
  } catch (err) {
    console.error("[POST /api/tickets/:id/messages]", err);
    return bad("Failed to add message.", 500);
  }
}
