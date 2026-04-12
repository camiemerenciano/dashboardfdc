// GET /api/socialblade/data
// Returns all profiles with their latest snapshot from SQLite.
// Optional query param: ?history=<profileId> returns snapshot history.
// Optional query param: ?bydate=1 returns all follower snapshots grouped by date.

import { NextRequest, NextResponse } from "next/server";
import {
  getAllProfilesWithLatest, getSnapshotHistory, getAllFollowersByDate,
  getAllPagesAsProfiles,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const historyFor = searchParams.get("history");
  const byDate     = searchParams.get("bydate");

  const registry  = getAllPagesAsProfiles();
  const adminMap  = new Map(registry.map(p => [p.id, p]));

  if (historyFor) {
    const history = getSnapshotHistory(historyFor, 60);
    return NextResponse.json({ history });
  }

  if (byDate) {
    const raw = getAllFollowersByDate();
    const rows = raw.map(r => ({
      ...r,
      displayName: adminMap.get(r.profile_id)?.displayName ?? r.profile_id,
      admin:       adminMap.get(r.profile_id)?.adminName   ?? "",
      platform:    adminMap.get(r.profile_id)?.platform    ?? "instagram",
    }));
    return NextResponse.json({ rows });
  }

  // Return all profiles from pages_registry merged with snapshot data
  const dbProfiles = getAllProfilesWithLatest();
  const dbMap      = new Map(dbProfiles.map(p => [p.id, p]));

  const profiles = registry.map(p => {
    const db = dbMap.get(p.id);
    return {
      id:          p.id,
      username:    p.username,
      platform:    p.platform,
      displayName: p.displayName,
      adminName:   p.adminName,
      lastUpdated: db?.lastUpdated ?? null,
      latest:      db?.latest     ?? null,
    };
  });

  return NextResponse.json({ profiles });
}
