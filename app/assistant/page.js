"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";

// Conversation starters the user can click instead of typing.
const SUGGESTIONS = [
  "Draft a reply to a refund request",
  "How do I export data to CSV?",
  "Customer is locked out of their account",
];

const GREETING = {
  role: "assistant",
  content:
    "Hi! I'm your helpdesk assistant. Ask me to draft a reply, summarise a ticket, or explain a fix. (This week I'm a mock — a real model gets wired in later.)",
};

export default function AssistantPage() {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [provider, setProvider] = useState(null);
  const scrollRef = useRef(null);

  // Keep the latest message in view as the conversation grows.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  async function send(text) {
    const content = text.trim();
    if (!content || thinking) return;

    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setThinking(true);

    // The UI only talks to /api/chat — it doesn't know (or care) whether the
    // reply comes from Ollama or the mock fallback. The reply streams in.
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);
      setProvider(res.headers.get("x-ai-provider") || "unknown");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let started = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;

        if (!started) {
          // First token arrived: swap the typing indicator for a real bubble.
          started = true;
          setThinking(false);
          setMessages((m) => [...m, { role: "assistant", content: chunk }]);
        } else {
          setMessages((m) => {
            const copy = m.slice();
            const last = copy[copy.length - 1];
            copy[copy.length - 1] = { ...last, content: last.content + chunk };
            return copy;
          });
        }
      }

      if (!started) {
        setMessages((m) => [...m, { role: "assistant", content: "(No response.)" }]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry — I couldn't reach the assistant. Please try again." },
      ]);
    } finally {
      setThinking(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <span aria-hidden>🤖</span> AI Assistant
        </h1>
        <p className="text-sm text-ink-soft">
          Ask for help drafting replies or resolving tickets.{" "}
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
            {provider ? `via ${provider}` : "local · Ollama"}
          </span>
        </p>
      </div>

      {/* Message thread */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-card border border-border bg-surface p-4"
      >
        {messages.map((msg, i) => (
          <Message key={i} role={msg.role} content={msg.content} />
        ))}
        {thinking ? <ThinkingBubble /> : null}
      </div>

      {/* Suggestion chips (only before the first user message) */}
      {messages.length === 1 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      {/* Composer */}
      <form onSubmit={onSubmit} className="mt-3 flex items-end gap-2">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter makes a new line.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Ask the assistant…"
          className="max-h-32 flex-1 resize-none rounded-lg border border-border bg-canvas p-3 text-sm outline-none focus-visible:border-brand"
        />
        <Button type="submit" variant="primary" disabled={thinking || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}

function Message({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {isUser ? (
        <Avatar name="Agent Demo" size="sm" />
      ) : (
        <span
          aria-hidden
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-sm text-white"
        >
          🤖
        </span>
      )}
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-card px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-brand text-white"
            : "border border-border bg-canvas text-ink"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-sm text-white"
      >
        🤖
      </span>
      <div className="flex items-center gap-1 rounded-card border border-border bg-canvas px-3 py-3">
        <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
      </div>
    </div>
  );
}

function Dot({ delay = "0ms" }) {
  return (
    <span
      className="h-2 w-2 animate-bounce rounded-full bg-ink-soft"
      style={{ animationDelay: delay }}
    />
  );
}
