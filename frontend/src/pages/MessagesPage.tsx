import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Navigate } from "react-router";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { useSupportWebSocket, type SupportChatMessage } from "@/hooks/useSupportWebSocket";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

export default function MessagesPage() {
  const { user, ready } = useAuth();
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const load = useCallback(async () => {
    const res = await apiFetch("/api/messages/support");
    if (!res.ok) {
      throw new Error("Không tải được hội thoại.");
    }
    const data = (await res.json()) as { messages: SupportChatMessage[] };
    setMessages(data.messages);
  }, []);

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    setLoading(true);
    load()
      .catch(() => {
        if (!cancelled) toast.error("Không tải được tin nhắn.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, user, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const onWs = useCallback((ev: { threadUserId: string; message: SupportChatMessage }) => {
    if (user && ev.threadUserId !== user._id) return;
    setMessages((prev) => (prev.some((m) => m.id === ev.message.id) ? prev : [...prev, ev.message]));
  }, [user]);

  useSupportWebSocket(token, (payload) => {
    if (payload.type === "support_message") onWs(payload);
  });

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await apiFetch("/api/messages/support", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.message === "string" ? err.message : "Gửi thất bại.");
      }
      const data = (await res.json()) as { message: SupportChatMessage };
      setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
      setDraft("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gửi thất bại.");
    } finally {
      setSending(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#666666]">
        Đang tải…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: "/messages" }} />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#280071]">Tin nhắn hỗ trợ</h1>
        <p className="mt-1 text-sm text-[#666666]">Chat realtime với đội ngũ quản trị. Tin mới hiển thị ngay khi admin phản hồi.</p>
      </div>

      <div className="flex max-h-[min(560px,calc(100vh-220px))] flex-col overflow-hidden rounded-2xl border border-[#e8e4f5] bg-white shadow-sm">
        <div className="border-b border-[#e8e4f5] bg-[#f7f5fc] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6460FF]">Hội thoại của bạn</p>
          <p className="text-sm text-[#354052]">@{user.username}</p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {loading ? (
            <p className="text-center text-sm text-[#999999]">Đang tải…</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-[#999999]">Chưa có tin nhắn. Hãy gửi câu hỏi bên dưới.</p>
          ) : (
            messages.map((m) => {
              const mine = m.authorId === user._id && m.authorRole === "user";
              const adminSide = m.authorRole === "admin";
              return (
                <div key={m.id} className={cn("flex", adminSide ? "justify-start" : mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                      adminSide ? "rounded-tl-sm bg-white ring-1 ring-[#e8e4f5]" : "rounded-tr-sm bg-gradient-to-br from-[#6460FF] to-[#7B19D8] text-white"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    <p className={cn("mt-1 text-[10px]", adminSide ? "text-[#999999]" : "text-white/80")}>
                      {adminSide ? "Quản trị" : "Bạn"} · {formatTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={(e) => void handleSend(e)} className="border-t border-[#e8e4f5] bg-white p-3">
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={2000}
              placeholder="Nhập tin nhắn…"
              className="min-h-10 flex-1 rounded-xl border border-[#e8e4f5] bg-[#faf9ff] px-3 text-sm text-[#280071] outline-none focus:border-[#6460FF] focus:ring-2 focus:ring-[#6460FF]/20"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#6460FF] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#554fd9] disabled:opacity-50"
            >
              <Send className="size-4" aria-hidden />
              Gửi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
