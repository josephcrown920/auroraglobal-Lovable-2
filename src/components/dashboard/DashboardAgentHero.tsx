import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, ArrowRight, Loader2, Video } from "lucide-react";
import { chatWithAuroraAgent, listAgentChat } from "@/lib/agent.functions";

/**
 * HeyGen-style "Say it with video" hero surfaced on the dashboard.
 * Wired to the persistent Aurora Video Agent — chat + memory + skills are
 * scoped per user in Supabase (agent_chat_messages + agent_user_memory), so
 * conversation state carries across hundreds of sessions and jobs.
 */
export function DashboardAgentHero() {
  const listFn = useServerFn(listAgentChat);
  const chatFn = useServerFn(chatWithAuroraAgent);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["agent-chat", "dashboard"],
    queryFn: () => listFn(),
    staleTime: 30_000,
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = (data?.messages ?? []).slice(-6);
  const memoryUpdated = data?.hasMemory;

  const send = useMutation({
    mutationFn: async (message: string) => chatFn({ data: { message } }),
    onSuccess: () => {
      setInput("");
      qc.invalidateQueries({ queryKey: ["agent-chat"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Agent failed"),
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, send.isPending]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = input.trim();
    if (!t || send.isPending) return;
    send.mutate(t);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/20 via-fuchsia-500/10 to-cyan-500/15 backdrop-blur-xl p-6 md:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-fuchsia-500/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full bg-cyan-400/20 blur-3xl"
      />

      <div className="relative flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="size-11 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-fuchsia-900/40">
            <Sparkles className="size-5 text-white" />
          </span>
          <div>
            <p className="aurora-kicker mb-1">Aurora Video Agent</p>
            <h2 className="text-2xl md:text-3xl font-semibold leading-tight tracking-tight">
              Say it with video.
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Drop an idea, a script, or a vibe. I remember every session and job — no re-briefing.
              {memoryUpdated && (
                <span className="ml-1 text-emerald-300">· memory synced</span>
              )}
            </p>
          </div>
        </div>
        <Link
          to="/agent"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium no-underline"
        >
          <Video className="size-3.5" /> Open full agent <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {messages.length > 0 && (
        <div
          ref={scrollRef}
          className="relative mt-5 max-h-56 overflow-y-auto rounded-2xl border border-white/10 bg-black/30 p-3 space-y-2"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === "user"
                  ? "ml-auto bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
                  : "bg-white/[0.06] border border-white/10 text-white/90"
              }`}
            >
              {m.role === "assistant" ? (
                <ReactMarkdown>{m.content}</ReactMarkdown>
              ) : (
                m.content
              )}
            </div>
          ))}
          {send.isPending && (
            <div className="inline-flex items-center gap-2 text-xs text-white/60">
              <Loader2 className="size-3 animate-spin" /> Aurora is thinking…
            </div>
          )}
        </div>
      )}

      <form onSubmit={submit} className="relative mt-4 flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={send.isPending || isLoading}
            maxLength={2000}
            placeholder={
              messages.length === 0
                ? "Ask for a video, an avatar, or anything in between — I can get you started."
                : "Keep going…"
            }
            className="w-full rounded-full bg-black/40 border border-white/10 focus:border-violet-400/60 outline-none px-5 py-3 text-sm text-white placeholder:text-white/40"
          />
        </div>
        <button
          type="submit"
          disabled={send.isPending || !input.trim()}
          className="size-11 shrink-0 rounded-full flex items-center justify-center text-white bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-fuchsia-900/40 disabled:opacity-50"
          aria-label="Send"
        >
          {send.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </button>
      </form>

      <div className="relative mt-3 flex flex-wrap gap-2">
        {[
          "Script to Video",
          "Course Lesson",
          "UGC Ad",
          "Photo to Video",
          "Translate any Video",
        ].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setInput(s)}
            className="rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-white/80"
          >
            {s}
          </button>
        ))}
      </div>
    </section>
  );
}
