// Hardcoded sample data for the lab. There is no database this week — every
// screen reads from this file. Later in the semester this gets replaced by a
// real data layer, but the shape below is a good starting contract.

export const tickets = [
  {
    id: 1042,
    subject: "Login page returns a 500 error",
    customer: { name: "Aoife Byrne", email: "aoife.byrne@example.com" },
    status: "open",
    priority: "urgent",
    channel: "Email",
    createdAt: "9 Jun 2026, 08:14",
    updatedAt: "10m ago",
    messages: [
      {
        from: "customer",
        author: "Aoife Byrne",
        time: "08:14",
        body: "Hi, every time I try to sign in I get a server error page. I've tried two different browsers. Can you help? This is blocking my whole team.",
      },
      {
        from: "agent",
        author: "Agent Demo",
        time: "08:31",
        body: "Hi Aoife, thanks for reporting this. We're looking into the login service now and will update you shortly.",
      },
    ],
  },
  {
    id: 1041,
    subject: "Request a refund for duplicate charge",
    customer: { name: "Liam O'Connor", email: "liam.oconnor@example.com" },
    status: "pending",
    priority: "high",
    channel: "Web form",
    createdAt: "9 Jun 2026, 07:50",
    updatedAt: "42m ago",
    messages: [
      {
        from: "customer",
        author: "Liam O'Connor",
        time: "07:50",
        body: "I was charged twice for my June subscription. Could you refund the duplicate? Order #88231.",
      },
      {
        from: "agent",
        author: "Agent Demo",
        time: "08:05",
        body: "Thanks Liam — I can see the duplicate charge. I've requested the refund; it usually takes 3–5 business days.",
      },
    ],
  },
  {
    id: 1040,
    subject: "How do I export my data to CSV?",
    customer: { name: "Mary Walsh", email: "mary.walsh@example.com" },
    status: "open",
    priority: "low",
    channel: "Chat",
    createdAt: "9 Jun 2026, 07:20",
    updatedAt: "1h ago",
    messages: [
      {
        from: "customer",
        author: "Mary Walsh",
        time: "07:20",
        body: "Is there a way to export all my records to a spreadsheet? I couldn't find the option.",
      },
    ],
  },
  {
    id: 1039,
    subject: "Mobile app crashes on startup",
    customer: { name: "Seán Murphy", email: "sean.murphy@example.com" },
    status: "open",
    priority: "high",
    channel: "Email",
    createdAt: "8 Jun 2026, 21:02",
    updatedAt: "3h ago",
    messages: [
      {
        from: "customer",
        author: "Seán Murphy",
        time: "21:02",
        body: "Since the last update the Android app closes immediately when I open it. Phone is a Pixel 7.",
      },
    ],
  },
  {
    id: 1038,
    subject: "Change billing email address",
    customer: { name: "Niamh Kelly", email: "niamh.kelly@example.com" },
    status: "pending",
    priority: "medium",
    channel: "Email",
    createdAt: "8 Jun 2026, 16:45",
    updatedAt: "Yesterday",
    messages: [
      {
        from: "customer",
        author: "Niamh Kelly",
        time: "16:45",
        body: "Please update the billing email on my account to finance@niamhkelly.ie.",
      },
      {
        from: "agent",
        author: "Agent Demo",
        time: "17:10",
        body: "Happy to help. For security, can you confirm the last four digits of the card on file?",
      },
    ],
  },
  {
    id: 1037,
    subject: "Feature request: dark mode",
    customer: { name: "Tomás Ryan", email: "tomas.ryan@example.com" },
    status: "closed",
    priority: "low",
    channel: "Web form",
    createdAt: "7 Jun 2026, 11:30",
    updatedAt: "2 days ago",
    messages: [
      {
        from: "customer",
        author: "Tomás Ryan",
        time: "11:30",
        body: "Any chance of a dark theme? The white screen is hard on the eyes at night.",
      },
      {
        from: "agent",
        author: "Agent Demo",
        time: "12:02",
        body: "Thanks for the suggestion! I've logged it with our product team. Closing this ticket for now.",
      },
    ],
  },
  {
    id: 1036,
    subject: "Invoice PDF won't download",
    customer: { name: "Grace Doyle", email: "grace.doyle@example.com" },
    status: "closed",
    priority: "medium",
    channel: "Chat",
    createdAt: "6 Jun 2026, 09:15",
    updatedAt: "3 days ago",
    messages: [
      {
        from: "customer",
        author: "Grace Doyle",
        time: "09:15",
        body: "The download invoice button just spins forever and nothing happens.",
      },
      {
        from: "agent",
        author: "Agent Demo",
        time: "09:40",
        body: "That was a temporary glitch on our side — it should work now. Let us know if not!",
      },
    ],
  },
  {
    id: 1035,
    subject: "Account locked after too many attempts",
    customer: { name: "Cormac Burke", email: "cormac.burke@example.com" },
    status: "open",
    priority: "urgent",
    channel: "Phone",
    createdAt: "6 Jun 2026, 08:00",
    updatedAt: "3 days ago",
    messages: [
      {
        from: "customer",
        author: "Cormac Burke",
        time: "08:00",
        body: "I'm locked out after mistyping my password. Can you reset it? I have a deadline today.",
      },
    ],
  },
];

// Helper used by the ticket detail page.
export function getTicket(id) {
  return tickets.find((t) => String(t.id) === String(id));
}
