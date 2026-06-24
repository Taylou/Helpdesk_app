// =============================================================================
// AI PROVIDER  (swappable)
// -----------------------------------------------------------------------------
// The app talks to "an AI" only through the small interface below. This week
// there is NO real model — `mockProvider` returns canned / heuristic replies
// with a simulated delay so the chat and "suggested reply" features feel real.
//
// Later in the semester you replace `activeProvider` with a real one (e.g. an
// Ollama-backed provider) that implements the SAME two methods. Because the UI
// only ever calls `chat()` and `suggestReply()`, none of the screens change.
//
//   interface AIProvider {
//     name: string
//     chat(messages: {role: "user"|"assistant", content: string}[]): Promise<string>
//     suggestReply(ticket): Promise<string>
//   }
// =============================================================================

// Shared system prompt — used by the real (Ollama) provider to set its role.
// The mock ignores it, but keeping it here means both providers agree on the
// assistant's persona.
export const SYSTEM_PROMPT =
  "You are a concise, friendly customer-support assistant for 'HD Helpdesk'. " +
  "Help support agents draft replies, summarise tickets, and explain fixes. " +
  "Keep answers short and practical. When drafting a reply to a customer, be " +
  "warm and professional. Do not invent account details you weren't given.";

// Pretend the model is "thinking" for a moment. Keeps the typing indicator
// visible and makes a future async (network) provider a drop-in replacement.
const think = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

// Tiny keyword router: map words found in the user's message to a canned reply.
// A real model replaces all of this — but it's a useful, debuggable stand-in.
const CANNED = [
  {
    match: ["refund", "charge", "charged", "billing", "invoice", "payment"],
    reply:
      "For a refund I can help right away. Could you share the order number (e.g. #88231)? Most refunds land back on the original card within 3–5 business days once approved.",
  },
  {
    match: ["login", "log in", "sign in", "500", "error", "locked", "password", "reset"],
    reply:
      "Sorry you're hitting a sign-in problem. A few quick checks: try a private/incognito window, clear cookies for the site, and confirm Caps Lock is off. If you're fully locked out I can trigger a password reset to your email — want me to do that?",
  },
  {
    match: ["export", "csv", "spreadsheet", "download", "data"],
    reply:
      "You can export your records from Settings → Data → Export. Pick CSV, choose a date range, and the file is emailed to you when it's ready. Want the step-by-step with screenshots?",
  },
  {
    match: ["crash", "crashes", "freeze", "android", "ios", "app"],
    reply:
      "Thanks — app crashes are usually fixed by updating to the latest version and restarting the device. If it still closes on startup, could you tell me the device model and OS version so I can check for a known issue?",
  },
  {
    match: ["dark mode", "theme", "dark"],
    reply:
      "Good news — dark mode is now available! Use the 🌙 / ☀️ toggle in the top bar to switch. Your choice is remembered on this device.",
  },
  {
    match: ["hi", "hello", "hey", "thanks", "thank you"],
    reply:
      "Hi! I'm your helpdesk assistant. I can draft replies, summarise a ticket, or walk a customer through a fix. What are you working on?",
  },
];

function routeReply(text) {
  const lower = (text || "").toLowerCase();
  const hit = CANNED.find((c) => c.match.some((kw) => lower.includes(kw)));
  if (hit) return hit.reply;
  return (
    "Here's a suggested response you can adapt:\n\n“Thanks for getting in touch — I understand the issue and I'm on it. " +
    "Could you share a little more detail (account email, what you expected vs. what happened) so I can resolve this quickly?”\n\n" +
    "(This is a mock reply for the lab. A real AI model gets wired in later.)"
  );
}

export const mockProvider = {
  name: "mock",

  // Multi-turn chat. We only look at the latest user message for routing, but
  // the full history is passed in so a real model can use the context.
  async chat(messages) {
    await think();
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    return routeReply(lastUser?.content ?? "");
  },

  // Draft a reply for a whole ticket (used by the "AI suggested reply" panel
  // when that gets wired up). Routes on the latest customer message + subject.
  async suggestReply(ticket) {
    await think();
    const lastCustomer = [...(ticket?.messages ?? [])]
      .reverse()
      .find((m) => m.from === "customer");
    const seed = `${ticket?.subject ?? ""} ${lastCustomer?.body ?? ""}`;
    const name = ticket?.customer?.name?.split(" ")[0] ?? "there";
    return `Hi ${name},\n\n${routeReply(seed)}\n\nBest regards,\nSupport Team`;
  },
};

// The single provider the rest of the app imports. Swap this line later.
export const activeProvider = mockProvider;
