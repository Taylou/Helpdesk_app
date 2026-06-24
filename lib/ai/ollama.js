// =============================================================================
// OLLAMA CLIENT  (runs on the server only)
// -----------------------------------------------------------------------------
// Talks to a local Ollama instance (https://ollama.com). This is the "real"
// provider that replaces the mock. It runs inside our Next.js API route, never
// in the browser — so there are no CORS issues and the model host stays private.
//
// Configure with env vars (see .env.local):
//   OLLAMA_HOST   default http://localhost:11434
//   OLLAMA_MODEL  default gemma3:latest
// =============================================================================

// Resolve the host we should *connect* to. The Ollama installer often sets a
// system env var like `OLLAMA_HOST=0.0.0.0:11434` (a bind-all *listen*
// address, with no scheme). We can't connect to that as-is, so normalise:
//   - add http:// if no scheme is present
//   - 0.0.0.0 is a listen address → connect to loopback instead
//   - localhost → 127.0.0.1 to dodge Windows IPv6 (::1) resolution issues
function resolveHost(raw) {
  let h = (raw || "").trim();
  if (!h) return "http://127.0.0.1:11434";
  if (!/^https?:\/\//i.test(h)) h = "http://" + h;
  h = h.replace("0.0.0.0", "127.0.0.1").replace("://localhost", "://127.0.0.1");
  return h.replace(/\/+$/, "");
}

export const OLLAMA_HOST = resolveHost(process.env.OLLAMA_HOST);
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral:7b";

// Some models (e.g. deepseek-r1) emit their chain-of-thought wrapped in
// <think>…</think>. A customer-facing reply shouldn't show that, so strip it.
export function stripThinking(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/^\s+/, "");
}

// Stream a chat completion from Ollama, yielding text chunks as they arrive.
// Ollama returns newline-delimited JSON; we parse each line and emit its
// message content. Throws if the instance can't be reached (caller falls back).
export async function* streamOllamaChat(messages, { signal } = {}) {
  const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_MODEL, messages, stream: true }),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`Ollama responded ${res.status} ${res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Process complete lines; keep any partial line in the buffer.
    let nl;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      try {
        const json = JSON.parse(line);
        const piece = json.message?.content;
        if (piece) yield piece;
      } catch {
        // Ignore malformed/partial JSON lines.
      }
    }
  }
}
