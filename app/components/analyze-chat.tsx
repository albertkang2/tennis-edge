"use client";

import { FormEvent, useState } from "react";
import { useChat } from "@ai-sdk/react";

function getMessageText(message: { parts?: Array<{ type: string; text?: string }> }) {
  if (!Array.isArray(message.parts)) return "";
  return message.parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("");
}

export function AnalyzeChat() {
  const { messages, sendMessage, status, error } = useChat({
    api: "/api/analyze",
  });
  const [input, setInput] = useState("");
  const isLoading = status === "submitted" || status === "streaming";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await sendMessage({ text });
  }

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
      <div className="bg-black/[.03] dark:bg-white/[.06] px-3 py-2 border-b border-black/10 dark:border-white/10">
        <h3 className="text-sm font-semibold">Ask the AI</h3>
        <p className="text-xs text-foreground/70 mt-0.5">
          Analyze matches or ask a question. Replies stream below.
        </p>
      </div>

      {messages.length > 0 && (
        <div className="p-3 space-y-3 max-h-64 overflow-y-auto text-sm border-b border-black/10 dark:border-white/10 bg-black/[.02] dark:bg-white/[.03]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? "text-foreground/90"
                  : "text-foreground/80 whitespace-pre-wrap"
              }
            >
              <span className="font-medium text-foreground/70">
                {m.role === "user" ? "You: " : "AI: "}
              </span>
              {getMessageText(m) || "—"}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mx-3 mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-900 dark:text-red-200">
          AI request failed: {error.message}
        </div>
      )}

      <form onSubmit={onSubmit} className="p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input ?? ""}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Which match has the best value?"
            className="flex-1 rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !(input ?? "").trim()}
            className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
