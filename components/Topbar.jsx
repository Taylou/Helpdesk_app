"use client";

import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import ThemeToggle from "@/components/ThemeToggle";

export default function Topbar() {
  const router = useRouter();

  // Submitting the search sends you to the tickets list, filtered by the query.
  function onSearch(e) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim() ?? "";
    router.push(q ? `/tickets?q=${encodeURIComponent(q)}` : "/tickets");
  }

  return (
    <header className="flex items-center gap-4 border-b border-border bg-surface px-6 py-3">
      {/* Mobile menu button. It does nothing yet — wiring it up to toggle the
          Sidebar is part of Exercise 4. It is hidden on medium+ screens. */}
      <button
        type="button"
        className="rounded-lg p-2 text-ink-soft hover:bg-canvas md:hidden"
        aria-label="Open navigation menu"
      >
        ☰
      </button>

      {/* Search box — submitting navigates to /tickets?q=… */}
      <form
        onSubmit={onSearch}
        className="flex flex-1 items-center gap-2 rounded-lg bg-canvas px-3 py-2"
      >
        <span aria-hidden className="text-ink-soft">
          🔍
        </span>
        <input
          type="search"
          name="q"
          placeholder="Search tickets, customers…"
          aria-label="Search tickets and customers"
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft"
        />
      </form>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <span className="hidden text-sm text-ink-soft sm:inline">Agent Demo</span>
        <Avatar name="Agent Demo" />
      </div>
    </header>
  );
}
