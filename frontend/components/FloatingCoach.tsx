"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Send, X, Maximize2, Check, Flame } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type Role = "user" | "assistant";
interface LoggedAction { food_name: string; meal_type: string; quantity_g: number; calories: number }
interface Msg { role: Role; content: string; logged?: LoggedAction[] }
interface ChatResponse { reply: string; actions: LoggedAction[]; conversation_id: number }

const SUGGESTIONS = ["How much protein do I have left?", "I had 2 rotis and daal", "Make me a workout"];

// ChatGPT-style generous spacing so responses breathe.
const MD = {
  p: (p: any) => <p className="mb-3 leading-relaxed last:mb-0" {...p} />,
  strong: (p: any) => <strong className="font-semibold text-ink" {...p} />,
  em: (p: any) => <em className="italic" {...p} />,
  h1: (p: any) => <h3 className="mb-2 mt-5 text-[15px] font-bold first:mt-0" {...p} />,
  h2: (p: any) => <h3 className="mb-2 mt-5 text-[15px] font-bold first:mt-0" {...p} />,
  h3: (p: any) => <h4 className="mb-2 mt-4 font-semibold first:mt-0" {...p} />,
  ul: (p: any) => <ul className="mb-3 ml-4 list-disc space-y-2 marker:text-brand-400" {...p} />,
  ol: (p: any) => <ol className="mb-3 ml-4 list-decimal space-y-2" {...p} />,
  li: (p: any) => <li className="pl-1 leading-relaxed" {...p} />,
  hr: () => <hr className="my-4 border-white/10" />,
  a: (p: any) => <a className="text-brand-400 underline" target="_blank" rel="noreferrer" {...p} />,
  code: (p: any) => <code className="rounded bg-paper-warm px-1 text-[12px]" {...p} />,
  table: (p: any) => <div className="my-3 overflow-x-auto"><table className="w-full min-w-[420px] border-collapse text-[12px]" {...p} /></div>,
  th: (p: any) => <th className="border border-ink/[.1] px-2 py-1.5 text-left font-semibold" {...p} />,
  td: (p: any) => <td className="border border-ink/[.08] px-2 py-1.5" {...p} />,
};

export function FloatingCoach() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [convoId, setConvoId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || loading) return;
    setError(null);
    setMessages((m) => [...m, { role: "user", content: clean }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post<ChatResponse>("/api/ai/chat", { message: clean, conversation_id: convoId });
      setMessages((m) => [...m, { role: "assistant", content: res.reply, logged: res.actions }]);
      if (convoId !== res.conversation_id) setConvoId(res.conversation_id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Launcher FAB */}
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Open AI Coach"
          className="fixed bottom-20 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-brand-400 text-night shadow-glow transition hover:scale-105 active:scale-95 lg:bottom-6 lg:right-6">
          <Sparkles className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-x-3 bottom-20 top-16 z-50 flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-paper-card shadow-lift sm:inset-x-auto sm:right-6 sm:bottom-6 sm:top-auto sm:h-[580px] sm:w-[430px] lg:bottom-6">
          {/* header */}
          <div className="flex items-center gap-2.5 border-b border-white/[.07] px-4 py-3">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-400/15 text-brand-400"><Sparkles className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm font-semibold leading-tight">AI Coach</div>
              <div className="truncate text-[11px] text-ink-muted">Ask, log, or plan — right here</div>
            </div>
            <Link href="/coach" title="Open full coach" onClick={() => setOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted hover:bg-paper-warm hover:text-ink">
              <Maximize2 className="h-4 w-4" />
            </Link>
            <button onClick={() => setOpen(false)} title="Close"
              className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted hover:bg-paper-warm hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-400/10 text-brand-400"><Sparkles className="h-6 w-6" /></span>
                <p className="text-sm text-ink-muted">Hey! Tell me what you ate, ask about your day, or say "make me a plan".</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)}
                      className="rounded-full border border-ink/[.1] bg-paper-warm/60 px-2.5 py-1.5 text-xs text-ink-soft transition hover:border-brand-400/40 hover:text-brand-400">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user" ? "max-w-[85%] bg-brand-500 text-white" : "w-full bg-paper-warm/60 text-ink ring-1 ring-ink/[.06]"}`}>
                  {m.role === "user"
                    ? <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    : <div className="text-[13px]"><ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>{m.content.replace(/<br\s*\/?>/gi, "\n")}</ReactMarkdown></div>}
                  {m.logged && m.logged.length > 0 && (
                    <div className="mt-1.5 space-y-1 border-t border-ink/[.08] pt-1.5">
                      {m.logged.map((l, j) => (
                        <div key={j} className="flex items-center gap-1.5 text-[11px] font-medium text-brand-400">
                          <Check className="h-3 w-3 shrink-0" />{l.food_name} · {Math.round(l.quantity_g)}g
                          <span className="flex items-center gap-0.5 text-ink-muted"><Flame className="h-2.5 w-2.5" />{Math.round(l.calories)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-2xl bg-paper-warm/60 px-3 py-2.5 ring-1 ring-ink/[.06]">
                  {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </div>
              </div>
            )}
          </div>

          {/* composer */}
          <div className="border-t border-white/[.07] p-2.5">
            {error && <p className="mb-1.5 px-1 text-xs text-brand-400">{error}</p>}
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={1}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder="Message the coach…"
                className="max-h-28 flex-1 resize-none rounded-xl border border-ink/[.12] bg-paper-warm/50 px-3 py-2 text-sm outline-none transition focus:border-brand-400/50" />
              <button type="submit" disabled={loading || !input.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-400 text-night transition hover:bg-brand-300 disabled:opacity-40">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
