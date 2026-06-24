import { tickets } from "./tickets";

// Dashboard summary numbers. A couple are derived from the tickets array so
// they stay in sync; the rest are hardcoded sample metrics for this week.
export const stats = [
  {
    label: "Open tickets",
    value: tickets.filter((t) => t.status === "open").length,
    hint: "Awaiting a first or next reply",
    icon: "🟢",
  },
  {
    label: "Pending",
    value: tickets.filter((t) => t.status === "pending").length,
    hint: "Waiting on the customer",
    icon: "🟡",
  },
  {
    label: "Resolved today",
    value: 7,
    hint: "+2 vs. yesterday",
    icon: "✅",
  },
  {
    label: "Avg. first response",
    value: "18m",
    hint: "Target: under 30m",
    icon: "⏱️",
  },
];
