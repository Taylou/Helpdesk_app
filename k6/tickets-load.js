// =============================================================================
// k6 load test for the helpdesk REST API (app/api/tickets/*).
// -----------------------------------------------------------------------------
// k6 spins up N "virtual users" (VUs) that each run the default function in a
// loop. Here every iteration is read-heavy with a light write: ~80% of the time
// we list + read a ticket, ~20% we create one. `checks` assert each response;
// `thresholds` turn latency/error rates into a pass/fail exit code (great for
// CI). Run it with `npm run bench` (see package.json) — the app must be running.
//
// Tunables via env (-e KEY=value):
//   BASE_URL   default http://localhost:3000
//   VUS        peak virtual users (default 20)
//   DURATION   if set, run a flat VUS-for-DURATION test instead of the ramp
//              (used by `npm run bench:smoke`)
// =============================================================================

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const PEAK_VUS = Number(__ENV.VUS) || 10;
const DURATION = __ENV.DURATION; // e.g. "10s" → flat smoke run

// Custom metric: share of iterations where every check passed.
const iterationOk = new Rate("iteration_checks_passed");

// A flat run (smoke) when DURATION is set, otherwise a ramp: warm up, hold at
// peak, ramp down. Stages are [target VUs, over duration].
const stages = DURATION
  ? [{ duration: DURATION, target: PEAK_VUS }]
  : [
      { duration: "10s", target: 5 },          // smoke / warm-up
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

const JSON_HEADERS = { headers: { "Content-Type": "application/json" } };

// Sample data for created tickets (writes).
const NAMES = ["Ada Lovelace", "Alan Turing", "Grace Hopper", "Katherine Johnson"];
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function ticketsScenario() {
  // 20% of iterations do a write; the rest are pure reads.
  const isWrite = Math.random() < 0.2;
  let allPassed = true;
  const track = (ok) => {
    if (!ok) allPassed = false;
  };

  // --- Read: list tickets --------------------------------------------------
  const listRes = http.get(`${BASE_URL}/api/tickets`);
  track(
    check(listRes, {
      "list: status 200": (r) => r.status === 200,
      "list: returns an array": (r) => Array.isArray(r.json()),
    })
  );

  // --- Read: fetch one of the returned tickets -----------------------------
  const tickets = listRes.status === 200 ? listRes.json() : [];
  if (Array.isArray(tickets) && tickets.length > 0) {
    const id = pick(tickets).id;
    const oneRes = http.get(`${BASE_URL}/api/tickets/${id}`);
    track(
      check(oneRes, {
        "detail: status 200": (r) => r.status === 200,
        "detail: id matches": (r) => r.json("id") === id,
      })
    );
  }

  // --- Write: create a ticket (light share) --------------------------------
  if (isWrite) {
    const name = pick(NAMES);
    const payload = JSON.stringify({
      name,
      // Unique-ish email keeps the customer set from exploding but still varied.
      email: `${name.split(" ")[0].toLowerCase()}@example.com`,
      subject: `Load test ticket ${Date.now()}-${__VU}-${__ITER}`,
      priority: "low",
      channel: "Web form",
      description: "Created by k6 load test.",
    });
    const createRes = http.post(`${BASE_URL}/api/tickets`, payload, JSON_HEADERS);
    track(
      check(createRes, {
        "create: status 201": (r) => r.status === 201,
        "create: returns id": (r) => typeof r.json("id") === "number",
      })
    );
  }

  iterationOk.add(allPassed);
  sleep(1); // brief think-time between iterations
}
