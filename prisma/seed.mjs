// Seed the database from the original sample data (data/tickets.js), so the app
// looks identical to the pre-database version on first run.
//
// Run with:  npx prisma db seed     (or)     npm run db:seed
//
// It clears the tables first, so it's safe to re-run.
import { PrismaClient } from "@prisma/client";
import { tickets } from "../data/tickets.js";

const prisma = new PrismaClient();

// Turn a human "updated X ago" label into a number of minutes, so seeded
// timestamps keep the lively "10m ago / 1h ago / 2 days ago" look.
function agoMinutes(label = "") {
  const s = label.toLowerCase().trim();
  if (s === "yesterday") return 24 * 60;
  let m;
  if ((m = s.match(/^(\d+)\s*m/))) return Number(m[1]);
  if ((m = s.match(/^(\d+)\s*h/))) return Number(m[1]) * 60;
  if ((m = s.match(/^(\d+)\s*day/))) return Number(m[1]) * 24 * 60;
  return 30;
}

async function main() {
  // Clear existing rows (children first because of foreign keys).
  await prisma.message.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.customer.deleteMany();

  // Insert customers once each, keyed by email.
  const customerIdByEmail = new Map();
  for (const t of tickets) {
    if (!customerIdByEmail.has(t.customer.email)) {
      const c = await prisma.customer.create({
        data: { name: t.customer.name, email: t.customer.email },
      });
      customerIdByEmail.set(t.customer.email, c.id);
    }
  }

  const now = Date.now();
  for (const t of tickets) {
    const createdAt = new Date(now - agoMinutes(t.updatedAt) * 60_000);

    await prisma.ticket.create({
      data: {
        id: t.id, // keep the original #1035–#1042 numbers
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        channel: t.channel,
        createdAt,
        customerId: customerIdByEmail.get(t.customer.email),
        messages: {
          create: t.messages.map((msg, i) => ({
            from: msg.from,
            author: msg.author,
            body: msg.body,
            // Space messages a few minutes apart, never into the future.
            createdAt: new Date(Math.min(createdAt.getTime() + i * 5 * 60_000, now)),
          })),
        },
      },
    });

    // `updatedAt` is @updatedAt, so create() set it to "now". Backdate it so the
    // list shows the intended "X ago". New replies will bump it to now again.
    await prisma.$executeRaw`UPDATE "Ticket" SET "updatedAt" = ${createdAt} WHERE id = ${t.id}`;
  }

  // We inserted tickets with explicit ids, which doesn't advance the id
  // sequence. Push it past the max so new tickets continue from #1043.
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Ticket"', 'id'), (SELECT MAX(id) FROM "Ticket"))`
  );

  console.log(`Seeded ${tickets.length} tickets and ${customerIdByEmail.size} customers.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
