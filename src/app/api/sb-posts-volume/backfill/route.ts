// POST /api/sb-posts-volume/backfill
// Re-extracts daily post diffs from raw_json already stored in snapshots.
// No Social Blade API call — uses existing data only.

import { NextResponse } from "next/server";
import { backfillSBDailyPostsFromSnapshots } from "@/lib/db";

export async function POST() {
  const count = backfillSBDailyPostsFromSnapshots();
  return NextResponse.json({ ok: true, rowsUpserted: count });
}
