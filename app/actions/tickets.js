"use server";

// Server Actions: code that runs on the server when a <form> is submitted. No
// API route or client fetch needed — the form calls these directly. After a
// write we revalidate the affected pages so the server components re-render
// with fresh data.
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Create a ticket from the New-ticket form, then go to the new ticket.
export async function createTicketAction(formData) {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const subject = formData.get("subject")?.toString().trim();
  const priority = (formData.get("priority")?.toString() || "medium").toLowerCase();
  const channel = formData.get("channel")?.toString() || "Email";
  const description = formData.get("description")?.toString().trim();

  if (!name || !email || !subject) {
    throw new Error("Name, email and subject are required.");
  }

  // One customer per email: create on first contact, keep their name current.
  const customer = await prisma.customer.upsert({
    where: { email },
    update: { name },
    create: { name, email },
  });

  const ticket = await prisma.ticket.create({
    data: {
      subject,
      status: "open",
      priority,
      channel,
      customerId: customer.id,
      // The description becomes the customer's opening message (if provided).
      messages: description
        ? { create: { from: "customer", author: name, body: description } }
        : undefined,
    },
  });

  revalidatePath("/");
  revalidatePath("/tickets");
  redirect(`/tickets/${ticket.id}`);
}

// Add an agent reply to a ticket. Updating the ticket also bumps its updatedAt.
export async function addReplyAction(formData) {
  const ticketId = Number(formData.get("ticketId"));
  const body = formData.get("body")?.toString().trim();
  if (!Number.isInteger(ticketId) || !body) return;

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      messages: { create: { from: "agent", author: "Agent Demo", body } },
    },
  });

  revalidatePath("/");
  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
}
