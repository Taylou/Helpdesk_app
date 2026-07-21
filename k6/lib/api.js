// =============================================================================
// Shared helpers for the k6 scripts in this folder.
// -----------------------------------------------------------------------------
// Every test needs the same things: the base URL, JSON headers, and a wrapper
// around each REST endpoint that fires the request AND checks the response.
// Keeping them here means each test script only describes its *load shape*
// (how many users, for how long) instead of repeating request plumbing.
//
// Each api* helper returns { res, ok } so a script can both inspect the
// response and record whether its checks passed.
// =============================================================================

import http from "k6/http";
import { check } from "k6";

export const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const JSON_HEADERS = { headers: { "Content-Type": "application/json" } };

// `tags` group metrics so a dashboard can chart each endpoint separately.
//
// The `name` tag matters more than it looks: by default k6 tags each metric
// with the full URL, so /api/tickets/1, /api/tickets/2 … each become their own
// time series. Over a long run that's thousands of near-useless series (high
// "cardinality"), which bloats Prometheus. Passing an explicit `name` groups
// them all under one label — this is k6's "URL grouping".
const tag = (endpoint, name) => ({ tags: name ? { endpoint, name } : { endpoint } });

const URL_TICKETS = "/api/tickets";
const URL_TICKET = "/api/tickets/:id";
const URL_MESSAGES = "/api/tickets/:id/messages";

// By default k6 counts any non-2xx/3xx response as a FAILED request. Our
// negative tests *want* a 404/400 — that's the correct behaviour, not an error.
// `expectedStatuses` overrides that judgement per request, so deliberate error
// cases don't pollute the http_req_failed metric.
const EXPECT_404 = http.expectedStatuses(404);
const EXPECT_400 = http.expectedStatuses(400);

// Parse a response body as JSON without throwing.
//
// Under heavy load a server may answer with an HTML error page instead of JSON.
// k6's r.json() *throws* on that, which aborts the whole iteration with a stack
// trace instead of simply recording a failed check — exactly the wrong
// behaviour in a stress test, where non-JSON responses are the thing you're
// trying to observe. Returning null lets the check fail cleanly.
export function safeJson(res) {
  try {
    return res.json();
  } catch {
    return null;
  }
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const NAMES = ["Ada Lovelace", "Alan Turing", "Grace Hopper", "Katherine Johnson"];

// Build a unique-enough ticket payload. __VU/__ITER are k6 built-ins (which
// virtual user, which iteration) — together they make each subject unique.
export function ticketPayload(prefix = "k6") {
  const name = pick(NAMES);
  return {
    name,
    email: `${name.split(" ")[0].toLowerCase()}@example.com`,
    subject: `${prefix} ticket ${Date.now()}-${__VU}-${__ITER}`,
    priority: pick(["low", "medium", "high"]),
    channel: "Web form",
    description: `Created by k6 (${prefix}).`,
  };
}

// --- Reads -------------------------------------------------------------------

export function apiListTickets(query = "") {
  const res = http.get(`${BASE_URL}/api/tickets${query}`, tag("list", URL_TICKETS));
  const ok = check(res, {
    "list: status 200": (r) => r.status === 200,
    "list: returns an array": (r) => Array.isArray(safeJson(r)),
  });
  return { res, ok };
}

export function apiGetTicket(id) {
  const res = http.get(`${BASE_URL}/api/tickets/${id}`, tag("detail", URL_TICKET));
  const ok = check(res, {
    "detail: status 200": (r) => r.status === 200,
    "detail: id matches": (r) => safeJson(r)?.id === id,
  });
  return { res, ok };
}

// --- Writes ------------------------------------------------------------------

export function apiCreateTicket(prefix) {
  const res = http.post(
    `${BASE_URL}/api/tickets`,
    JSON.stringify(ticketPayload(prefix)),
    { ...JSON_HEADERS, ...tag("create", URL_TICKETS) }
  );
  const ok = check(res, {
    "create: status 201": (r) => r.status === 201,
    "create: returns id": (r) => typeof safeJson(r)?.id === "number",
  });
  return { res, ok, id: ok ? safeJson(res).id : null };
}

export function apiPatchTicket(id, patch) {
  const res = http.patch(
    `${BASE_URL}/api/tickets/${id}`,
    JSON.stringify(patch),
    { ...JSON_HEADERS, ...tag("patch", URL_TICKET) }
  );
  const ok = check(res, {
    "patch: status 200": (r) => r.status === 200,
    "patch: field applied": (r) => {
      const j = safeJson(r);
      return j != null && Object.keys(patch).every((k) => j[k] === patch[k]);
    },
  });
  return { res, ok };
}

export function apiAddMessage(id, body = "Reply from k6.") {
  const res = http.post(
    `${BASE_URL}/api/tickets/${id}/messages`,
    JSON.stringify({ body }),
    { ...JSON_HEADERS, ...tag("message", URL_MESSAGES) }
  );
  const ok = check(res, {
    "message: status 201": (r) => r.status === 201,
    "message: echoes body": (r) => safeJson(r)?.body === body,
  });
  return { res, ok };
}

export function apiDeleteTicket(id) {
  const res = http.del(`${BASE_URL}/api/tickets/${id}`, null, tag("delete", URL_TICKET));
  const ok = check(res, { "delete: status 204": (r) => r.status === 204 });
  return { res, ok };
}

// --- Negative cases (the API should reject bad input) -------------------------

// Fetch a ticket we expect to be gone (bad id, or one we just deleted).
export function apiExpectNotFound(id = 99999999, label = "missing ticket") {
  const res = http.get(`${BASE_URL}/api/tickets/${id}`, {
    ...tag("404", URL_TICKET),
    responseCallback: EXPECT_404,
  });
  const ok = check(res, { [`${label}: status 404`]: (r) => r.status === 404 });
  return { res, ok };
}

export function apiExpectBadRequest() {
  const res = http.post(
    `${BASE_URL}/api/tickets`,
    JSON.stringify({ name: "no email or subject" }),
    { ...JSON_HEADERS, ...tag("400", URL_TICKETS), responseCallback: EXPECT_400 }
  );
  const ok = check(res, { "invalid create: status 400": (r) => r.status === 400 });
  return { res, ok };
}
