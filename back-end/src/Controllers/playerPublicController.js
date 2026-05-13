import User from "../models/user.js";
import { GAME_CATALOG, normalizeSlug } from "../lib/gameTaxonomy.js";
import {
    avatarGradientForUsername,
    gameSlugsForFilter,
    primarySlugFromUser,
} from "../lib/listingMappers.js";

export async function getPublicPlayer(req, res) {
    try {
        const username = normalizeSlug(req.params.username);
        if (!username) {
            return res.status(400).json({ message: "Thiếu username." });
        }

        const u = await User.findOne({ username })
            .select("-hashedPassword -email -phone")
            .lean();

        if (!u) {
            return res.status(404).json({ message: "Không tìm thấy người chơi." });
        }

        const slug = primarySlugFromUser(u);
        const pl = u.playerListing ?? {};
        const player = {
            id: String(u._id),
            username: u.username,
            displayName: u.displayName,
            bio: u.bio,
            role: u.role,
            accountType: u.accountType ?? "renter",
            createdAt: u.createdAt,
            gamingProfile: u.gamingProfile,
            playerListing: u.playerListing,
            primaryGameLabel: GAME_CATALOG[slug]?.label ?? slug,
            gameSlugs: gameSlugsForFilter(u),
            avatarClassName: avatarGradientForUsername(u.username),
            avatarUrl: u.avatarUrl?.trim() ? u.avatarUrl.trim() : undefined,
            listingCoverUrl: pl.listingCoverUrl?.trim() ? String(pl.listingCoverUrl).trim() : undefined,
        };

        return res.json({ player });
    } catch (e) {
        console.error("getPublicPlayer:", e);
        return res.status(500).json({ message: "Lỗi tải hồ sơ." });
    }
}
