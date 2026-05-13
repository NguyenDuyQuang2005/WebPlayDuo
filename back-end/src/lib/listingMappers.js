import { GAME_CATALOG, ALLOWED_SLUGS, normalizeSlug } from "./gameTaxonomy.js";

const GRADIENTS = [
    "from-[#4C1D95] to-[#06B6D4]",
    "from-[#1E3A8A] to-[#38BDF8]",
    "from-[#B45309] to-[#FBBF24]",
    "from-[#BE185D] to-[#FB7185]",
    "from-[#EA580C] to-[#F97316]",
    "from-[#78350F] to-[#D97706]",
    "from-[#0369A1] to-[#22D3EE]",
    "from-[#4338CA] to-[#A78BFA]",
];

export function avatarGradientForUsername(username) {
    const s = String(username || "x");
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return GRADIENTS[h % GRADIENTS.length];
}

export function primarySlugFromUser(u) {
    const pl = u.playerListing?.primaryGameSlug;
    if (pl && ALLOWED_SLUGS.includes(normalizeSlug(pl))) return normalizeSlug(pl);
    const fav = u.gamingProfile?.favoriteSlugs?.[0];
    if (fav && ALLOWED_SLUGS.includes(normalizeSlug(fav))) return normalizeSlug(fav);
    return "valorant";
}

export function gameSlugsForFilter(u) {
    const set = new Set();
    const p = primarySlugFromUser(u);
    set.add(p);
    for (const s of u.gamingProfile?.favoriteSlugs ?? []) {
        const x = normalizeSlug(s);
        if (ALLOWED_SLUGS.includes(x)) set.add(x);
    }
    return [...set];
}

export function mapUserToListingPayload(u) {
    const slug = primarySlugFromUser(u);
    const label = GAME_CATALOG[slug]?.label ?? slug;
    const pl = u.playerListing ?? {};
    return {
        id: String(u._id),
        username: u.username,
        name: u.displayName,
        game: label,
        rank: pl.rankLabel?.trim() || "—",
        pricePerHour: typeof pl.pricePerHour === "number" ? pl.pricePerHour : 55000,
        rating: typeof pl.ratingAvg === "number" ? pl.ratingAvg : 4.5,
        reviewCount: typeof pl.reviewCount === "number" ? pl.reviewCount : 0,
        online: Boolean(pl.isLive),
        badge: pl.ratingAvg >= 4.85 ? "Uy tín" : pl.isLive ? "Live" : undefined,
        voiceOk: pl.voiceOk !== false,
        games: gameSlugsForFilter(u),
        avatarClassName: avatarGradientForUsername(u.username),
        avatarUrl: u.avatarUrl?.trim() ? String(u.avatarUrl).trim() : undefined,
        listingCoverUrl: pl.listingCoverUrl?.trim() ? String(pl.listingCoverUrl).trim() : undefined,
    };
}

export function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Chỉ người cho thuê đã được duyệt; không hiển thị tài khoản admin trên hub/trang chủ. */
export function hubProviderAccountQuery() {
    return { accountType: "provider", role: { $ne: "admin" } };
}
