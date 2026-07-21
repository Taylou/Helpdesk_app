// =============================================================================
// SMOKE test — "does the API work at all?"
// -----------------------------------------------------------------------------
// Minimal load (1 VU, a handful of iterations). Its job is *correctness*, not
// performance: it walks the whole ticket lifecycle and both error cases, so a
// broken endpoint fails here in seconds instead of halfway through a load test.
// Run this first, always. `npm run bench:smoke`
// =============================================================================

import {
  apiListTickets,
  apiGetTicket,
  apiCreateTicket,
  apiPatchTicket,
  apiAddMessage,
  apiDeleteTicket,
  apiExpectNotFound,
  apiExpectBadRequest,
  safeJson,
} from "./lib/api.js";

export const options = {
  vus: 1,
  iterations: 3,
  thresholds: {
    // A smoke test should be perfect: zero failures, every check passing.
    http_req_failed: ["rate<0.01"],
    checks: ["rate==1.0"],
  },
};

export default function smokeScenario() {
  // --- Reads ---------------------------------------------------------------
  const { res: listRes } = apiListTickets();
  const tickets = listRes.status === 200 ? safeJson(listRes) : null;
  if (tickets?.length > 0) apiGetTicket(tickets[0].id);

  // Filters still return an array.
  apiListTickets("?status=open");
  apiListTickets("?q=login&take=5");

  // --- Full lifecycle of one ticket ----------------------------------------
  const { id } = apiCreateTicket("smoke");
  if (id) {
    apiGetTicket(id);
    apiPatchTicket(id, { status: "pending", priority: "high" });
    apiAddMessage(id, "Smoke test reply.");
    apiDeleteTicket(id);

    // After deleting, it must be gone.
    apiExpectNotFound(id, "deleted ticket");
  }

  // --- Error handling ------------------------------------------------------
  apiExpectNotFound();
  apiExpectBadRequest();
}
