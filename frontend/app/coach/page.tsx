"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles, Send, Check, Flame, Plus, Trash2, MessageSquare, PanelLeft,
  Leaf, LayoutDashboard, Salad, Dumbbell, LineChart, LogOut,
} from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/app/providers";
import { usePrefs } from "@/components/PrefsProvider";
import { api, ApiError } from "@/lib/api";

type Role = "user" | "assistant";
interface Msg { role: Role; content: string; logged?: LoggedAction[] }
interface LoggedAction { food_name: string; meal_type: string; quantity_g: number; calories: number }
interface Remaining { calories: number; protein: number; carbs: number; fat: number }
interface Convo { id: number; title: string; updated_at: string | null }
interface ChatResponse {
  reply: string; actions: LoggedAction[]; conversation_id: number; title: string;
  day: { remaining: Remaining | null };
}

const SUGGESTIONS = [
  "Log 2 rotis and a bowl of daal",
  "I had chicken karahi with rice for lunch",
  "How much protein do I have left today?",
  "Can I eat biryani tonight and stay on target?",
];

const APP_LINKS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/diet", label: "Diet", icon: Salad },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: LineChart },
];

/* ---------- structured markdown rendering (ChatGPT-style spacing) ---------- */
const MD = {
  p: (p: any) => <p className="mb-4 leading-relaxed last:mb-0" {...p} />,
  strong: (p: any) => <strong className="font-semibold text-ink" {...p} />,
  em: (p: any) => <em className="italic" {...p} />,
  ul: (p: any) => <ul className="mb-4 ml-5 list-disc space-y-2 marker:text-brand-400" {...p} />,
  ol: (p: any) => <ol className="mb-4 ml-5 list-decimal space-y-2" {...p} />,
  li: (p: any) => <li className="pl-1 leading-relaxed" {...p} />,
  h1: (p: any) => <h3 className="mb-2 mt-6 font-display text-lg font-semibold first:mt-0" {...p} />,
  h2: (p: any) => <h3 className="mb-2 mt-6 font-display text-base font-semibold first:mt-0" {...p} />,
  h3: (p: any) => <h4 className="mb-2 mt-5 font-semibold first:mt-0" {...p} />,
  hr: () => <hr className="my-5 border-white/10" />,
  a: (p: any) => <a className="text-brand-400 underline" target="_blank" rel="noreferrer" {...p} />,
  code: (p: any) => <code className="rounded bg-paper-warm px-1 py-0.5 text-[13px]" {...p} />,
  table: (p: any) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-[13px]" {...p} />
    </div>
  ),
  thead: (p: any) => <thead className="bg-paper-warm" {...p} />,
  th: (p: any) => <th className="border border-ink/[.1] px-2.5 py-2 text-left font-semibold" {...p} />,
  td: (p: any) => <td className="border border-ink/[.08] px-2.5 py-2" {...p} />,
};

function Bubble({ m }: { m: Msg }) {
  const isUser = m.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`rounded-2xl px-4 py-3 ${
        isUser ? "max-w-[80%] bg-brand-500 text-white" : "w-full bg-paper-card text-ink ring-1 ring-ink/[.06]"}`}>
        {isUser
          ? <p className="whitespace-pre-wrap text-sm leading-relaxed sm:text-[15px]">{m.content}</p>
          : <div className="text-sm sm:text-[15px]"><ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>{m.content.replace(/<br\s*\/?>/gi, "\n")}</ReactMarkdown></div>}
        {m.logged && m.logged.length > 0 && (
          <div className="mt-2 space-y-1 border-t border-ink/[.08] pt-2">
            {m.logged.map((l, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-medium text-brand-600">
                <Check className="h-3.5 w-3.5 shrink-0" />
                {l.food_name} · {Math.round(l.quantity_g)}g · {l.meal_type}
                <span className="flex items-center gap-0.5 text-ink-muted"><Flame className="h-3 w-3" />{Math.round(l.calories)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CoachInner() {
  const { user, logout } = useAuth();
  const { avatar } = usePrefs();
  const router = useRouter();
  const [convos, setConvos] = useState<Convo[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<Remaining | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [railOpen, setRailOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { refreshConvos(); }, []);
  // Auto-send a question passed from the dashboard quick-ask (/coach?ask=…)
  useEffect(() => {
    const ask = new URLSearchParams(window.location.search).get("ask");
    if (ask) {
      window.history.replaceState(null, "", "/coach");
      send(ask);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function refreshConvos() {
    try {
      const res = await api.get<{ conversations: Convo[] }>("/api/ai/conversations");
      setConvos(res.conversations);
    } catch { /* not fatal */ }
  }
  function newChat() { setActiveId(null); setMessages([]); setError(null); setRailOpen(false); }
  async function openConversation(id: number) {
    setError(null); setRailOpen(false);
    try {
      const res = await api.get<{ id: number; messages: Msg[] }>(`/api/ai/conversations/${id}`);
      setActiveId(id); setMessages(res.messages);
    } catch { setError("Couldn't open that conversation."); }
  }
  async function removeConversation(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await api.del(`/api/ai/conversations/${id}`);
      setConvos((c) => c.filter((x) => x.id !== id));
      if (activeId === id) newChat();
    } catch { /* ignore */ }
  }
  async function send(text: string) {
    const clean = text.trim();
    if (!clean || loading) return;
    setError(null);
    setMessages((m) => [...m, { role: "user", content: clean }]);
    setInput(""); setLoading(true);
    try {
      const res = await api.post<ChatResponse>("/api/ai/chat", { message: clean, conversation_id: activeId });
      setMessages((m) => [...m, { role: "assistant", content: res.reply, logged: res.actions }]);
      setRemaining(res.day?.remaining ?? null);
      if (activeId !== res.conversation_id) setActiveId(res.conversation_id);
      refreshConvos();
    } catch (e) {
      const msg = e instanceof ApiError && e.status === 503
        ? "The AI coach isn't switched on yet. (Set an AI provider key on the backend to enable it.)"
        : e instanceof ApiError ? e.message : "Something went wrong. Please try again.";
      setError(msg);
      setMessages((m) => m.slice(0, -1));
    } finally { setLoading(false); }
  }
  async function handleLogout() { await logout(); router.push("/"); }

  const rail = (
    <div className="flex h-full w-[17rem] shrink-0 flex-col border-r border-ink/[.07] bg-paper-card/60">
      {/* Brand */}
      <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-4">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-leaf-600 text-white"><Leaf className="h-5 w-5" /></span>
        <span className="font-display text-lg font-semibold">NutriFit<span className="text-leaf-600"> PK</span></span>
      </Link>

      <div className="px-3">
        <button onClick={newChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
          <Plus className="h-4 w-4" /> New chat
        </button>
      </div>

      {/* Recents */}
      <div className="mt-4 flex-1 overflow-y-auto px-3">
        <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">Recents</p>
        {convos.length === 0 && <p className="px-2 py-4 text-xs text-ink-faint">No conversations yet.</p>}
        {convos.map((c) => (
          <button key={c.id} onClick={() => openConversation(c.id)}
            className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
              activeId === c.id ? "bg-brand-500/12 text-brand-600" : "text-ink-soft hover:bg-paper-warm"}`}>
            <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
            <span className="min-w-0 flex-1 truncate">{c.title}</span>
            <span onClick={(e) => removeConversation(c.id, e)}
              className="shrink-0 rounded p-1 text-ink-faint opacity-0 transition hover:bg-ink/[.06] hover:text-brand-600 group-hover:opacity-100">
              <Trash2 className="h-3.5 w-3.5" />
            </span>
          </button>
        ))}
      </div>

      {/* Footer: app nav + account */}
      <div className="border-t border-ink/[.07] p-3">
        <div className="mb-2 grid grid-cols-4 gap-1">
          {APP_LINKS.map((l) => (
            <Link key={l.href} href={l.href} title={l.label}
              className="flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium text-ink-muted transition hover:bg-paper-warm hover:text-brand-600">
              <l.icon className="h-5 w-5" /> {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings" className="flex min-w-0 flex-1 items-center gap-2 rounded-lg p-1.5 hover:bg-paper-warm">
            <Avatar src={avatar} name={user?.name} size={30} />
            <span className="min-w-0 truncate text-sm font-medium">{user?.name || "Athlete"}</span>
          </Link>
          <ThemeToggle />
          <button onClick={handleLogout} title="Log out"
            className="grid h-9 w-9 place-items-center rounded-lg text-ink-muted transition hover:bg-paper-warm hover:text-ink">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-paper">
      {/* Desktop rail */}
      <div className="hidden lg:flex">{rail}</div>

      {/* Mobile rail drawer */}
      {railOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setRailOpen(false)} />
          <div className="absolute inset-y-0 left-0 shadow-lift">{rail}</div>
        </div>
      )}

      {/* Chat column */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Slim top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-ink/[.06] px-4">
          <button onClick={() => setRailOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg text-ink-muted hover:bg-paper-warm lg:hidden">
            <PanelLeft className="h-5 w-5" />
          </button>
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-500/12 text-brand-600"><Sparkles className="h-5 w-5" /></span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-base font-semibold leading-tight">AI Coach</h1>
            {remaining && (
              <p className="truncate text-xs text-ink-muted">
                {Math.round(remaining.calories)} kcal · {Math.round(remaining.protein)}g P · {Math.round(remaining.carbs)}g C · {Math.round(remaining.fat)}g F left today
              </p>
            )}
          </div>
        </header>

        {/* Messages (centered readable column) */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-6">
            {messages.length === 0 ? (
              <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-3xl bg-brand-500/10 text-brand-500"><Sparkles className="h-8 w-8" /></span>
                <div>
                  <h2 className="font-display text-2xl font-semibold">How can I help today?</h2>
                  <p className="mt-2 max-w-md text-sm text-ink-muted">
                    Tell me what you ate and I'll log it, or ask how to hit your goals. I understand desi foods and portions.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)}
                      className="rounded-full border border-ink/[.1] bg-paper-card px-3.5 py-2 text-sm font-medium text-ink-soft transition hover:border-brand-500/40 hover:text-brand-600">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m, i) => <Bubble key={i} m={m} />)}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex gap-1 rounded-2xl bg-paper-card px-4 py-3 ring-1 ring-ink/[.06]">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-ink-faint" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-ink/[.06] px-4 py-3">
          <div className="mx-auto w-full max-w-3xl">
            {error && <p className="mb-2 text-sm text-brand-600">{error}</p>}
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                rows={1}
                placeholder="Message NutriFit Coach…  e.g. I had aloo gosht with 2 roti"
                className="max-h-44 flex-1 resize-none rounded-2xl border border-ink/[.12] bg-paper-card px-4 py-3 text-sm outline-none transition focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/15"
              />
              <button type="submit" disabled={loading || !input.trim()}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-500 text-white transition hover:bg-brand-600 disabled:opacity-40">
                <Send className="h-5 w-5" />
              </button>
            </form>
            <p className="mt-2 text-center text-[11px] text-ink-faint">AI estimates for planning, not medical advice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoachPage() {
  return (
    <RequireAuth>
      <CoachInner />
    </RequireAuth>
  );
}
