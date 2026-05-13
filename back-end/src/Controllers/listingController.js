import User from "../models/user.js";
import Booking from "../models/booking.js";
import { escapeRegex, hubProviderAccountQuery, mapUserToListingPayload } from "../lib/listingMappers.js";

/** Bảng xếp hạng: điểm kết hợp rating & số review (Wilson đơn giản hoá). */
function leaderboardScore(u) {
    const pl = u.playerListing ?? {};
    const r = typeof pl.ratingAvg === "number" ? pl.ratingAvg : 4.5;
    const n = typeof pl.reviewCount === "number" ? pl.reviewCount : 0;
    return r * Math.log10(n + 10);
}

export async function getLeaderboard(req, res) {
    try {
        const limit = Math.min(100, Math.max(5, parseInt(req.query.limit, 10) || 30));
        const docs = await User.find(hubProviderAccountQuery())
            .sort({ "playerListing.ratingAvg": -1, "playerListing.reviewCount": -1 })
            .limit(120)
            .lean();

        const ranked = [...docs]
            .map((u) => {
                const base = mapUserToListingPayload(u);
                return {
                    ...base,
                    rank: 0,
                    leaderboardScore: Math.round(leaderboardScore(u) * 100) / 100,
                };
            })
            .sort((a, b) => b.leaderboardScore - a.leaderboardScore)
            .slice(0, limit);

        ranked.forEach((row, i) => {
            row.rank = i + 1;
        });

        return res.json({
            entries: ranked,
            formula: "ratingAvg * log10(reviewCount + 10)",
        });
    } catch (e) {
        console.error("getLeaderboard:", e);
        return res.status(500).json({ message: "Không tải được bảng xếp hạng." });
    }
}

/** Xếp hạng nền tảng: nạp tiền, chi tiêu thuê, thu nhập provider (từ booking). */
export async function getSocialLeaderboards(req, res) {
    try {
        const limit = Math.min(40, Math.max(5, parseInt(req.query.limit, 10) || 15));

        const topTopUpDocs = await User.find({})
            .select("username displayName avatarUrl totalTopUpVnd")
            .sort({ totalTopUpVnd: -1, createdAt: -1 })
            .limit(limit)
            .lean();

        const topTopUp = topTopUpDocs.map((u, i) => ({
            rank: i + 1,
            username: u.username,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl ? String(u.avatarUrl).trim() : undefined,
            totalTopUpVnd: Math.max(0, Number(u.totalTopUpVnd) || 0),
        }));

        const topRenters = await Booking.aggregate([
            { $match: { status: "completed" } },
            { $group: { _id: "$renterUserId", totalSpendVnd: { $sum: "$grossVnd" }, bookingCount: { $sum: 1 } } },
            { $sort: { totalSpendVnd: -1 } },
            { $limit: limit },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 0,
                    username: "$user.username",
                    displayName: "$user.displayName",
                    avatarUrl: "$user.avatarUrl",
                    totalSpendVnd: 1,
                    bookingCount: 1,
                },
            },
        ]);

        const topProviderEarners = await Booking.aggregate([
            { $match: { status: "completed" } },
            {
                $group: {
                    _id: "$providerUserId",
                    totalEarnedVnd: { $sum: { $subtract: ["$grossVnd", "$platformFeeVnd"] } },
                    bookingCount: { $sum: 1 },
                },
            },
            { $sort: { totalEarnedVnd: -1 } },
            { $limit: limit },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 0,
                    username: "$user.username",
                    displayName: "$user.displayName",
                    avatarUrl: "$user.avatarUrl",
                    totalEarnedVnd: 1,
                    bookingCount: 1,
                },
            },
        ]);

        return res.json({
            topTopUp,
            topRenters: topRenters.map((r, i) => ({ rank: i + 1, ...r })),
            topProviderEarners: topProviderEarners.map((r, i) => ({ rank: i + 1, ...r })),
        });
    } catch (e) {
        console.error("getSocialLeaderboards:", e);
        return res.status(500).json({ message: "Không tải được bảng xếp hạng." });
    }
}

export async function getListings(req, res) {
    try {
        const game = typeof req.query.game === "string" ? req.query.game.trim().toLowerCase() : "";
        const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

        const conditions = [hubProviderAccountQuery()];
        if (game && game !== "all") {
            conditions.push({
                $or: [{ "playerListing.primaryGameSlug": game }, { "gamingProfile.favoriteSlugs": game }],
            });
        }
        if (q) {
            const rx = new RegExp(escapeRegex(q), "i");
            conditions.push({
                $or: [{ displayName: rx }, { username: rx }, { "playerListing.rankLabel": rx }],
            });
        }

        const filter = conditions.length > 1 ? { $and: conditions } : conditions[0];

        const page = Math.min(500, Math.max(1, parseInt(req.query.page, 10) || 1));
        const pageSize = Math.min(36, Math.max(1, parseInt(req.query.pageSize, 10) || 12));
        const skip = (page - 1) * pageSize;

        const [total, docs] = await Promise.all([
            User.countDocuments(filter),
            User.find(filter).sort({ "playerListing.ratingAvg": -1, createdAt: -1 }).skip(skip).limit(pageSize).lean(),
        ]);

        const totalPages = Math.max(1, Math.ceil(total / pageSize));

        return res.json({
            listings: docs.map(mapUserToListingPayload),
            total,
            page,
            pageSize,
            totalPages,
        });
    } catch (e) {
        console.error("getListings:", e);
        return res.status(500).json({ message: "Không tải được danh sách." });
    }
}
