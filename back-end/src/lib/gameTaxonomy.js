/**
 * Danh mục game cố định (slug) — dùng làm từ vựng cho vector đặc trưng.
 * Thể loại (genre) phục vụ nhánh "phân lớp mềm" trong không gian ghép cặp.
 */
export const GENRES = ["FPS", "MOBA", "BR", "TacShooter", "RPG", "Casual"];

/** slug -> { label, genres[] } */
export const GAME_CATALOG = Object.freeze({
    valorant: { label: "Valorant", genres: ["FPS", "TacShooter"] },
    lol: { label: "Liên Minh Huyền Thoại", genres: ["MOBA"] },
    lolwr: { label: "Tốc Chiến", genres: ["MOBA"] },
    pubgm: { label: "PUBG Mobile", genres: ["BR"] },
    freefire: { label: "Free Fire", genres: ["BR", "Casual"] },
    cs2: { label: "Counter-Strike 2", genres: ["FPS", "TacShooter"] },
    apex: { label: "Apex Legends", genres: ["BR", "FPS"] },
    genshin: { label: "Genshin Impact", genres: ["RPG"] },
    dota2: { label: "Dota 2", genres: ["MOBA"] },
    fortnite: { label: "Fortnite", genres: ["BR", "Casual"] },
});

export const ALLOWED_SLUGS = Object.keys(GAME_CATALOG);

export function normalizeSlug(s) {
    return String(s || "")
        .trim()
        .toLowerCase();
}

export function isAllowedSlug(slug) {
    return ALLOWED_SLUGS.includes(normalizeSlug(slug));
}

export function genresForSlug(slug) {
    const key = normalizeSlug(slug);
    return GAME_CATALOG[key]?.genres ?? [];
}
