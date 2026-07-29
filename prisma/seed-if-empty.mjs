// Production-safe seeding for deploys.
//
// The regular seed (prisma/seed.mjs) CLEARS the tables first — perfect for the
// local lab, where every test run wants the same 8 known tickets, but wrong for
// a live deployment, where a redeploy would wipe whatever real data exists.
//
// This wrapper seeds ONLY when the database is empty: the first deploy gets the
// sample tickets so the live site isn't blank, and every deploy after that
// leaves the data alone.
//
// Used by `npm run db:seed:prod` (see the Render build command).
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

const prisma = new PrismaClient();
const count = await prisma.ticket.count().catch(() => 0);
await prisma.$disconnect();

if (count > 0) {
  console.log(`Database already has ${count} tickets — skipping seed.`);
} else {
  console.log("Empty database — seeding sample data...");
  // Run the existing seed to completion as a subprocess (it self-disconnects).
  execSync("node prisma/seed.mjs", { stdio: "inherit" });
}
