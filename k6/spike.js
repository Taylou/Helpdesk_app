// =============================================================================
// SPIKE test — "what happens when traffic arrives all at once?"
// -----------------------------------------------------------------------------
// A stress test ramps up gradually. A spike test jumps from almost nothing to a
// flood in seconds (think: a link goes viral, or a cron job fires). Two things
// matter: does it survive the surge, and — just as important — does it
// *recover* afterwards, or stay degraded?
//
// This uses the `ramping-arrival-rate` executor, which holds a target
// **request rate** rather than a VU count: k6 adds VUs as needed to keep up.
// That models "N users arrived per second" more honestly than fixing VUs.
//   npm run bench:spike
// =============================================================================

import { sleep } from "k6";
import { apiListTickets, apiGetTicket, pick, safeJson } from "./lib/api.js";

const PEAK_RPS = Number(__ENV.RPS) || 50;

export const options = {
  scenarios: {
    spike: {
      executor: "ramping-arrival-rate",
      startRate: 2,                 // iterations per second to begin with
      timeUnit: "1s",
      preAllocatedVUs: 10,          // VUs ready up front
      maxVUs: 100,                  // ceiling k6 may scale to
      stages: [
        { duration: "10s", target: 2 },        // calm baseline
        { duration: "5s", target: PEAK_RPS },  // 🚀 the spike
        { duration: "15s", target: PEAK_RPS }, // hold at peak
        { duration: "5s", target: 2 },         // drop back
        { duration: "20s", target: 2 },        // recovery window — watch latency
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.10"], // surges are allowed to be ugly, not broken
  },
};

export default function spikeScenario() {
  const { res } = apiListTickets();
  const tickets = res.status === 200 ? safeJson(res) : null;
  if (Array.isArray(tickets) && tickets.length > 0) {
    apiGetTicket(pick(tickets).id);
  }
  sleep(0.2);
}
