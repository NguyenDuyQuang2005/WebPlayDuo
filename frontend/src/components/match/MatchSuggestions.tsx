import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { MatchSuggestionsResponse } from "@/types/match";
import { cn } from "@/lib/utils";

export function MatchSuggestions() {
  const { user, ready } = useAuth();
  const [data, setData] = useState<MatchSuggestionsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready || !user) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiFetch("/api/match/suggestions?limit=8")
      .then(async (res) => {
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(typeof j.message === "string" ? j.message : "Không tải được gợi ý.");
        }
        return res.json() as Promise<MatchSuggestionsResponse>;
      })
      .then((j) => {
        if (!cancelled) setData(j);
      })
      .catch((e: unknown) => {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Lỗi gợi ý.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, user?._id]);

  if (!ready) return null;

  if (!user) {
    return (
      <section className="rounded-[14px] border border-[rgb(100_96_255_/_0.25)] bg-gradient-to-br from-[#F1EEFF] to-white p-6 shadow-[0_4px_24px_rgb(100_96_255_/_0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-[rgb(100_96_255_/_0.12)] px-3 py-1 pd-text-caption font-bold uppercase tracking-wide text-[#6460FF]">
              <Sparkles className="size-3.5" aria-hidden />
              Gợi ý đồng đội (AI)
            </p>
            <h2 className="mt-3 text-h1 text-brand-deep">Đăng nhập để nhận ghép cặp</h2>
            <p className="mt-2 max-w-xl text-body text-text-secondary">
              Hệ thống dùng vector đa nhãn trên game yêu thích và lịch sử giờ chơi, sau đó xếp hạng bằng độ tương đồng cosinus.
            </p>
          </div>
          <Link to="/signin" className={cn(buttonVariants({ variant: "playerduoPrimary" }), "inline-flex min-h-10 items-center justify-center px-5")}>
            Đăng nhập
          </Link>
        </div>
      </section>
    );
  }

  const shown = (data?.suggestions ?? []).filter((s) => s.scorePercent >= 30);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-[rgb(100_96_255_/_0.12)] px-3 py-1 pd-text-caption font-bold uppercase tracking-wide text-[#6460FF]">
            <Sparkles className="size-3.5" aria-hidden />
            Gợi ý đồng đội (AI)
          </p>
          <h2 className="mt-3 text-h1 text-brand-deep">Phân lớp & ghép cặp</h2>
          <p className="mt-2 max-w-2xl text-body text-text-secondary">
            Trọng số: sở thích {Math.round((data?.weights.preference ?? 0.45) * 100)}% · lịch sử{" "}
            {Math.round((data?.weights.playHistory ?? 0.35) * 100)}% · thể loại{" "}
            {Math.round((data?.weights.genreLayer ?? 0.2) * 100)}%. Chỉ hiển thị gợi ý có{" "}
            <strong>độ tương thích từ 30%</strong> trở lên.{" "}
            <Link to="/profile/gaming" className="font-semibold text-[#6460FF] underline-offset-2 hover:underline">
              Cập nhật hồ sơ game
            </Link>{" "}
            để gợi ý chính xác hơn.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-body text-text-secondary">Đang tính toán gợi ý...</p>
      ) : !shown.length ? (
        <div className="pd-card-default">
          <p className="pd-text-body text-[#354052]">
            Chưa có đủ người chơi khác hoặc điểm tương đồng thấp. Mời thêm bạn bè đăng ký hoặc điền &quot;Sở thích &amp; AI&quot; trong{" "}
            <Link to="/profile/gaming" className="font-semibold text-[#6460FF] underline">
              Hồ sơ
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((s) => (
            <article
              key={s.user.id}
              className={cn(
                "pd-card-default flex flex-col gap-3 transition-shadow hover:shadow-[0_8px_24px_-8px_rgb(100_96_255_/_0.25)]"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-full border-2 border-[#e8e4f5] bg-gradient-to-br from-[#6460FF] to-[#7B19D8]">
                    {s.user.avatarUrl?.trim() ? (
                      <img src={s.user.avatarUrl.trim()} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-lg font-black text-white">
                        {s.user.displayName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="pd-text-h3 truncate text-[#354052]">{s.user.displayName}</h3>
                    <p className="pd-text-caption text-[#999999]">@{s.user.username}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-[10px] bg-[#280071] px-3 py-1.5 text-sm font-black text-white">
                  {s.scorePercent}%
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {s.explanation.labels.length ? (
                  s.explanation.labels.map((lb) => (
                    <span
                      key={lb}
                      className="rounded-full border border-[#20AEFF]/40 bg-[rgb(32_174_255_/_0.12)] px-2 py-0.5 pd-text-caption font-semibold text-[#0066cc]"
                    >
                      Cùng thích: {lb}
                    </span>
                  ))
                ) : (
                  <span className="pd-text-caption text-[#666666]">Trùng khớp theo thể loại / giờ chơi</span>
                )}
                {s.explanation.sharedGenres.slice(0, 3).map((g) => (
                  <span
                    key={g}
                    className="rounded-full bg-muted px-2 py-0.5 pd-text-caption font-medium text-[#354052]"
                  >
                    {g}
                  </span>
                ))}
              </div>
              {s.user.bio ? <p className="pd-text-body-sm line-clamp-2 text-[#666666]">{s.user.bio}</p> : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
