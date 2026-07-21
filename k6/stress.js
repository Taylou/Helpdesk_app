// =============================================================================
// STRESS test — "where does it break?"
// -----------------------------------------------------------------------------
// A load test asks "is it fast enough at expected traffic?". A stress test
// deliberately pushes *past* that, ramping up in steps until latency climbs or
// errors appear. The goal isn't a green run — it's finding the point where the
// system degrades, so you know your ceiling.
//
// Reads only: hammering writes this hard would bloat the database for no extra
// insight. Watch the per-stage p95 climb in the dashboard (`npm run bench:dash`).
//   npm run bench:stress
// =============================================================================

import { sleep } from "k6";
import { apiListTickets, apiGetTicket, pick, safeJson } from "./lib/api.js";

const MAX_VUS = Number(__ENV.VUS) || 40;

export const options = {
  // Step up in stages so you can see which step degrades.
  stages: [
    { duration: "15s", target: Math.round(MAX_VUS * 0.25) },
    { duration: "15s", target: Math.round(MAX_VUS * 0.5) },
    { duration: "15s", target: Math.round(MAX_VUS * 0.75) },
    { duration: "20s", target: MAX_VUS },
    { duration: "10s", target: 0 }, // recovery
  ],
  thresholds: {
    // Deliberately lenient: we EXPECT this to hurt. We still want to know if
    // the API starts returning errors (not just getting slow) — that's the
    // real failure. `abortOnFail` stops the run early if it gets that bad.
    http_req_failed: [{ threshold: "rate<0.05", abortOnFail: true }],
  },
};

export default function stressScenario() {
  const { res } = apiListTickets();
  const tickets = res.status === 200 ? safeJson(res) : null;
  if (Array.isArray(tickets) && tickets.length > 0) {
    apiGetTicket(pick(tickets).id);
  }
  sleep(0.5); // shorter think-time than the load test = more pressure
}
