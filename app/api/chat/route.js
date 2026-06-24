// =============================================================================
// POST /api/chat  — the server boundary between the UI and "the AI".
// -----------------------------------------------------------------------------
// The browser sends { messages: [{role, content}] }. We prepend a system
// prompt and stream a reply back as plain text. We try the real provider
// (Ollama) first; if it isn't running we fall back to the mock so the chat
// never hard-fails during the lab. The `x-ai-provider` response header tells
// the UI which one actually answered.
// =============================================================================

import { mockProvider, SYSTEM_PROMPT } from "@/lib/ai/provider";
import { streamOllamaChat, stripThinking, OLLAMA_MODEL, OLLAMA_HOST } from "@/lib/ai/ollama";

// Filter <think>…</think> out of a stream of text chunks. We accumulate the
// full text, strip any *complete* think blocks, and if a think block is still
// open (no closing tag yet) we hold everything from it onward. Then we emit
// only the new, clean text since the last chunk. This handles tags that span
// chunk boundaries — important for reasoning models like deepseek-r1.
async function* filterThinking(chunks) {
  let full = "";
  let emitted = 0;
  for await (const piece of chunks) {
    full += piece;
    let clean = full.replace(/<think>[\s\S]*?<\/think>/g, "");
    const open = clean.indexOf("<think>");
    if (open !== -1) clean = clean.slice(0, open); // unclosed block — hold it
    clean = stripThinking(clean); // tidy leading whitespace once clean
    if (clean.length > emitted) {
      yield clean.slice(emitted);
      emitted = clean.length;
    }
  }
}

// Stream from generated text chunks into a Response body.
function streamResponse(chunkSource, providerName) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of chunkSource) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch {
        controller.enqueue(
          encoder.encode("\n\n[The assistant stopped unexpectedly.]")
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "x-ai-provider": providerName,
    },
  });
}

export async function POST(req) {
  const { messages = [] } = await req.json().catch(() => ({}));

  const chatMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content })),
  ];

  // Try Ollama. We peek at the first chunk so a connection failure is caught
  // *here* (and we can fall back) rather than mid-stream.
  try {
    const ollama = streamOllamaChat(chatMessages);
    const first = await ollama.next(); // throws if Ollama is unreachable

    async function* withFirst() {
      if (first.done) return;
      yield first.value;
      yield* ollama;
    }

    return streamResponse(filterThinking(withFirst()), `ollama:${OLLAMA_MODEL}`);
  } catch (err) {
    console.error("[/api/chat] Ollama failed, using mock. host=", OLLAMA_HOST, "err=", err?.message, err?.cause?.message);
    // Ollama unreachable — fall back to the canned mock so the lab keeps working.
    const reply = await mockProvider.chat(messages);
    const notice =
      "⚠️ Couldn't reach Ollama (is `ollama serve` running?). Showing a mock reply instead.\n\n";
    async function* once() {
      yield notice + reply;
    }
    return streamResponse(once(), "mock");
  }
}
