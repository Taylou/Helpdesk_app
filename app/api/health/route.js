// =============================================================================
// GET /api/health — liveness + readiness probe.
// -----------------------------------------------------------------------------
// Render (and any load balancer) polls this to decide whether the instance is
// healthy enough to receive traffic. We ALWAYS return 200 for liveness — a
// transient database blip shouldn't make the platform kill and restart a
// perfectly good web process — and report the DB state in the body instead, so
// you can still see at a glance whether Postgres is reachable.
// =============================================================================

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // never cache a health check

export async function GET() {
  let db = "disconnected";
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = "connected";
  } catch {
    // Swallow: we report the state, we don't fail the probe on it.
  }

  return Response.json({
    status: "ok",
    db,
    time: new Date().toISOString(),
  });
}
