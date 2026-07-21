// =============================================================================
// CRUD test — every endpoint, under concurrency, self-cleaning.
// -----------------------------------------------------------------------------
// `tickets-load.js` is read-heavy (what real traffic looks like). This one is
// write-heavy on purpose: each iteration runs a full ticket lifecycle —
// create → read → update → reply → delete — so PATCH, DELETE and the messages
// endpoint get exercised under load too.
//
// Because every iteration deletes the ticket it made, this test leaves the
// database roughly as it found it. Writes are slower than reads, so the
// latency threshold here is looser than the read-heavy test's.
//   npm run bench:crud
// =============================================================================

import { sleep } from "k6";
import { Rate } from "k6/metrics";
import {
  apiCreateTicket,
  apiGetTicket,
  apiPatchTicket,
  apiAddMessage,
  apiDeleteTicket,
} from "./lib/api.js";

const PEAK_VUS = Number(__ENV.VUS) || 5;
const DURATION = __ENV.DURATION;

// Did the whole create→…→delete lifecycle succeed for this iteration?
const lifecycleOk = new Rate("lifecycle_completed");

export const options = {
  stages: DURATION
    ? [{ duration: DURATION, target: PEAK_VUS }]
    : [
        { duration: "10s", target: PEAK_VUS },
        { duration: "30s", target: PEAK_VUS },
        { duration: "5s", target: 0 },
      ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    // Writes hit the DB harder than reads, and this is a dev server — hence the
    // looser target than tickets-load.js. Tighten it against a prod build.
    http_req_duration: ["p(95)<3000"],
    lifecycle_completed: ["rate>0.99"],
  },
};

export default function crudScenario() {
  let ok = true;
  const step = (result) => {
    if (!result.ok) ok = false;
    return result;
  };

  // CREATE
  const { id, ok: created } = step(apiCreateTicket("crud"));
  if (!created || !id) {
    lifecycleOk.add(false);
    return; // nothing to clean up
  }

  // READ
  step(apiGetTicket(id));

  // UPDATE — move it through the workflow.
  step(apiPatchTicket(id, { status: "pending" }));
  step(apiPatchTicket(id, { priority: "urgent", channel: "Phone" }));

  // REPLY — nested resource; also bumps the ticket's updatedAt.
  step(apiAddMessage(id, `Agent reply from VU ${__VU}.`));

  // DELETE — clean up after ourselves so the table doesn't grow.
  step(apiDeleteTicket(id));

  lifecycleOk.add(ok);
  sleep(1);
}
