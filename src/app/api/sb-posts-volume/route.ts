// GET /api/sb-posts-volume
// Returns aggregated daily-post data from Social Blade,
// enriched with adminName from the profiles registry.

import { NextResponse } from "next/server";
import {
  getSBDailyPostsAgg, getSBDailyPostsHistory, getAllSBDailyPosts,
  getAllPagesAsProfiles,
} from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get("history");
  const allDaily  = req.nextUrl.searchParams.get("all");

  const adminMap = new Map(getAllPagesAsProfiles().map(p => [p.id, p]));

  // Return history for a single profile
  if (profileId) {
    const history = getSBDailyPostsHistory(profileId);
    return NextResponse.json({ history });
  }

  // Return full per-day breakdown for all profiles
  if (allDaily) {
    const raw = getAllSBDailyPosts();
    const rows = raw.map(r => {
      const reg = adminMap.get(r.profile_id);
      return {
        ...r,
        admin:       reg?.adminName   ?? "",
        displayName: reg?.displayName ?? r.profile_id,
        platform:    reg?.platform    ?? "instagram",
      };
    });
    return NextResponse.json({ rows });
  }

  const agg  = getSBDailyPostsAgg();
  const rows = agg.map(r => {
    const reg = adminMap.get(r.profile_id);
    return {
      ...r,
      admin:       reg?.adminName    ?? "",
      displayName: reg?.displayName  ?? r.pagina,
      platform:    reg?.platform     ?? "instagram",
    };
  });

  return NextResponse.json({ rows });
}
