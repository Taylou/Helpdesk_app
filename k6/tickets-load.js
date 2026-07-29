// =============================================================================
// LOAD test — "is it fast enough at the traffic we expect?"
// -----------------------------------------------------------------------------
// This is the baseline benchmark. It models realistic helpdesk traffic: mostly
// people reading tickets, occasionally someone filing a new one (~80% reads /
// ~20% writes). Thresholds turn the result into a pass/fail exit code, so CI
// can gate on it.
//
// Request plumbing lives in ./lib/api.js — this file only describes the *load
// shape*. See smoke.js (correctness), tickets-crud.js (all endpoints),
// stress.js (find the ceiling) and spike.js (sudden surge).
//
// Tunables via env (-e KEY=value):
//   BASE_URL   default http://localhost:3000
//   VUS        peak virtual users (default 10)
//   DURATION   if set, run a flat VUS-for-DURATION test instead of the ramp
// =============================================================================

import { sleep } from "k6";
import { Rate } from "k6/metrics";
import { apiListTickets, apiGetTicket, apiCreateTicket, pick, safeJson } from "./lib/api.js";

const PEAK_VUS = Number(__ENV.VUS) || 10;
const DURATION = __ENV.DURATION; // e.g. "10s" → flat run

// Custom metric: share of iterations where every check passed.
const iterationOk = new Rate("iteration_checks_passed");

// A flat run when DURATION is set, otherwise a ramp: warm up, hold at peak,
// ramp down. Stages are [target VUs, over duration].
const stages = DURATION
  ? [{ duration: DURATION, target: PEAK_VUS }]
  : [
      { duration: "10s", target: 5 },          // warm-up
      { duration: "30s", target: PEAK_VUS },   // ramp to peak
      { duration: "30s", target: PEAK_VUS },   // hold
      { duration: "10s", target: 0 },          // ramp down
    ];

export const options = {
  stages,
  thresholds: {
    // <1% of requests may fail (non-2xx/3xx or transport error).
    http_req_failed: ["rate<0.01"],
    // 95th-percentile request duration. This is lenient on purpose: the Next.js
    // *dev* server compiles on demand and serializes work, so it's much slower
    // under load than a production build. Tighten toward ~500ms once you run
    // against `next build && next start`, or raise VUS to watch this fail.
    http_req_duration: ["p(95)<2000"],
    // At least 99% of iterations should pass all their checks.
    iteration_checks_passed: ["rate>0.99"],
  },
};

export default function ticketsScenario() {
  // 20% of iterations do a write; the rest are pure reads.
  const isWrite = Math.random() < 0.2;
  let allPassed = true;
  const track = (result) => {
    if (!result.ok) allPassed = false;
    return result;
  };

  // --- Read: list tickets --------------------------------------------------
  const { res: listRes } = track(apiListTickets());

  // --- Read: fetch one of the returned tickets -----------------------------
  const tickets = listRes.status === 200 ? safeJson(listRes) : null;
  if (Array.isArray(tickets) && tickets.length > 0) {
    track(apiGetTicket(pick(tickets).id));
  }

  // --- Write: create a ticket (light share) --------------------------------
  if (isWrite) track(apiCreateTicket("load"));

  iterationOk.add(allPassed);
  sleep(1); // brief think-time between iterations
}
