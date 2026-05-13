import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch, getApiUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { GameTaxonomyItem } from "@/types/match";

export default function ProviderStudioPage() {
  const { user, ready, refreshUser } = useAuth();
  const [taxonomy, setTaxonomy] = useState<GameTaxonomyItem[]>([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [listingCoverUrl, setListingCoverUrl] = useState("");
  const [pricePerHour, setPricePerHour] = useState(55000);
  const [rankLabel, setRankLabel] = useState("");
  const [primaryGameSlug, setPrimaryGameSlug] = useState("valorant");
  const [voiceOk, setVoiceOk] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(getApiUrl("/api/match/taxonomy"))
      .then((r) => r.json())
      .then((d: { games: GameTaxonomyItem[] }) => setTaxonomy(d.games ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    setAvatarUrl(user.avatarUrl?.trim() ?? "");
    setListingCoverUrl((user.playerListing as { listingCoverUrl?: string })?.listingCoverUrl?.trim() ?? "");
    const pl = user.playerListing;
    setPricePerHour(pl?.pricePerHour ?? 55000);
    setRankLabel(pl?.rankLabel ?? "");
    setPrimaryGameSlug(pl?.primaryGameSlug ?? "valorant");
    setVoiceOk(pl?.voiceOk !== false);
    setIsLive(Boolean(pl?.isLive));
  }, [user?._id, user?.playerListing, user?.avatarUrl]);

  if (!ready) return <p className="pd-text-body text-[#666666]">Đang tải...</p>;
  if (!user) {
    return (
      <div className="pd-card-default text-center">
        <p className="pd-text-body text-[#354052]">Đăng nhập để chỉnh studio.</p>
        <Link to="/signin" className="mt-4 inline-block font-semibold text-[#6460FF] underline">
          Đăng nhập
        </Link>
      </div>
    );
  }
  if (user.accountType !== "provider" && user.role !== "admin") {
    return <Navigate to="/profile/become-provider" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch("/api/user/provider-studio", {
        method: "PATCH",
        body: JSON.stringify({
          avatarUrl: avatarUrl.trim(),
          listingCoverUrl: listingCoverUrl.trim(),
          pricePerHour,
          rankLabel,
          primaryGameSlug,
          voiceOk,
          isLive,
        }),
      });
      const err = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof err.message === "string" ? err.message : "Lỗi lưu.");
      toast.success("Đã cập nhật hồ sơ cho thuê.");
      await refreshUser();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <div className="pd-card-default">
        <h2 className="pd-text-h2 text-[#354052]">Studio người cho thuê</h2>
        <p className="pd-text-body-sm mt-2 text-[#666666]">
          Chỉnh avatar, ảnh bìa, giá, game, rank và trạng thái online. Dữ liệu hiển thị trên{" "}
          <Link className="font-semibold text-[#6460FF]" to="/explore">
            Khám phá
          </Link>{" "}
          sau khi bạn là người cho thuê đã duyệt.
        </p>

        <div className="mt-6 space-y-6">
          <div>
            <label htmlFor="ps-avatar" className="pd-text-label mb-2 block text-[#354052]">
              URL ảnh đại diện (CDN / imgur…)
            </label>
            <input
              id="ps-avatar"
              className="pd-input-field w-full"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label htmlFor="ps-cover" className="pd-text-label mb-2 block text-[#354052]">
              URL ảnh bìa hồ sơ
            </label>
            <input
              id="ps-cover"
              className="pd-input-field w-full"
              value={listingCoverUrl}
              onChange={(e) => setListingCoverUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="ps-price" className="pd-text-label mb-2 block text-[#354052]">
                Giá / giờ (VNĐ)
              </label>
              <input
                id="ps-price"
                type="number"
                min={0}
                className="pd-input-field w-full"
                value={pricePerHour}
                onChange={(e) => setPricePerHour(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label htmlFor="ps-rank" className="pd-text-label mb-2 block text-[#354052]">
                Rank hiển thị
              </label>
              <input
                id="ps-rank"
                className="pd-input-field w-full"
                value={rankLabel}
                onChange={(e) => setRankLabel(e.target.value)}
                placeholder="vd: Immortal 2"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="ps-game" className="pd-text-label mb-2 block text-[#354052]">
                Game chính
              </label>
              <select
                id="ps-game"
                className="pd-input-field w-full max-w-md"
                value={primaryGameSlug}
                onChange={(e) => setPrimaryGameSlug(e.target.value)}
              >
                {taxonomy.map((g) => (
                  <option key={g.slug} value={g.slug}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-3 pd-text-body text-[#354052]">
              <input type="checkbox" className="size-5 accent-[#6460FF]" checked={voiceOk} onChange={(e) => setVoiceOk(e.target.checked)} />
              Chơi voice / party
            </label>
            <label className="flex cursor-pointer items-center gap-3 pd-text-body text-[#354052]">
              <input type="checkbox" className="size-5 accent-[#6460FF]" checked={isLive} onChange={(e) => setIsLive(e.target.checked)} />
              Hiển thị đang online (live)
            </label>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button type="submit" variant="pdPrimary" disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu hồ sơ"}
          </Button>
          <Button type="button" variant="pdSecondary" render={<Link to={`/players/${user.username}`} />}>
            Xem trang công khai
          </Button>
        </div>
      </div>
    </form>
  );
}
