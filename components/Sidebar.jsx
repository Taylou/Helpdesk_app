"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Navigation items. Each one maps a label + emoji icon to a route.
const NAV = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/tickets", label: "Tickets", icon: "🎫" },
  { href: "/assistant", label: "AI Assistant", icon: "🤖" },
  { href: "/new", label: "New ticket", icon: "✏️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    // Exercise 4: this sidebar is always visible. On a phone it eats the
    // screen. Make it collapse (e.g. `hidden md:flex`) and add a way to
    // toggle it from the Topbar menu button.
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="grid h-9 w-9 place-items-center rounded-card bg-brand text-lg text-white">
          🛟
        </span>
        <span className="text-lg font-semibold">HD Helpdesk</span>
      </div>

      <nav className="flex flex-col gap-1 px-3 py-2">
        {NAV.map((item) => {
          // The dashboard ("/") should only be active on an exact match;
          // other routes are active when the path starts with their href.
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-soft text-brand"
                  : "text-ink-soft hover:bg-canvas hover:text-ink"
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-5 py-4 text-xs text-ink-soft">
        Higher Diploma · Project Lab
      </div>
    </aside>
  );
}
