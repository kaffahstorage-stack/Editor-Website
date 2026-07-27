import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SendHorizonal, Sparkles } from "lucide-react";
import { chat } from "@/lib/api";

export default function ChatPanel({
  context = "assistant",
  initialSuggestions = [],
  onLatestReply,
  attachedImages = [],
  placeholder = "Tulis apa yang ada di pikiran kamu…",
  className = "",
  seedMessage = null,
  minHeight = "480px",
}) {
  const [messages, setMessages] = useState(() =>
    seedMessage
      ? [{ role: "assistant", text: seedMessage, suggestions: initialSuggestions }]
      : []
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId] = useState(
    () => `sess-${Math.random().toString(36).slice(2, 10)}`
  );
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  const send = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;
    setInput("");
    const userMsg = { role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setSending(true);
    try {
      const res = await chat({
        session_id: sessionId,
        message: text,
        images_base64: attachedImages,
        context,
      });
      const aiMsg = {
        role: "assistant",
        text: res.reply,
        suggestions: res.suggestions || [],
      };
      setMessages((m) => [...m, aiMsg]);
      onLatestReply?.(aiMsg);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "Maaf, ada kendala menghubungi AI. Coba lagi sebentar ya.",
          suggestions: [],
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={`flex flex-col rounded-[32px] border border-border bg-card overflow-hidden ${className}`}
      style={{ minHeight }}
      data-testid="chat-panel"
    >
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-foreground text-background grid place-items-center">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="text-sm font-semibold">Creative Assistant</div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Gemini 3 Flash
          </div>
        </div>
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-5 py-6 space-y-4"
        data-testid="chat-messages"
      >
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Mulai percakapan. Bilang aja santai — misalnya &ldquo;buat langitnya jadi sunset lembut&rdquo;.
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-[22px] px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-foreground text-background rounded-br-md"
                    : "bg-secondary text-foreground rounded-bl-md"
                }`}
              >
                {m.text}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.suggestions.map((s, j) => (
                      <button
                        key={j}
                        onClick={() => send(s)}
                        data-testid={`suggestion-${j}`}
                        className="text-[12px] px-3 py-1.5 rounded-full border border-foreground/20 hover:bg-foreground hover:text-background transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sending && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-[22px] rounded-bl-md px-4 py-3 flex items-center gap-1.5">
              <span className="dot-flash w-1.5 h-1.5 rounded-full bg-foreground/60" />
              <span className="dot-flash w-1.5 h-1.5 rounded-full bg-foreground/60" />
              <span className="dot-flash w-1.5 h-1.5 rounded-full bg-foreground/60" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border p-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={placeholder}
          data-testid="chat-input"
          className="flex-1 bg-transparent outline-none px-3 py-2 text-sm placeholder:text-muted-foreground"
        />
        <button
          onClick={() => send()}
          disabled={sending || !input.trim()}
          data-testid="chat-send"
          className="w-9 h-9 rounded-full bg-foreground text-background grid place-items-center disabled:opacity-40 hover:scale-105 active:scale-95 transition-transform"
        >
          <SendHorizonal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
