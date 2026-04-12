// POST /api/socialblade/update
// Body: { profileId: string } | { profileIds: string[] }
// Reads SOCIALBLADE_TOKEN from env, fetches Social Blade, saves to SQLite.

import { NextRequest, NextResponse } from "next/server";
import { fetchSBProfile } from "@/lib/socialblade";
import { upsertProfile, insertSnapshot, markProfileUpdated, upsertSBDailyPosts, getAllPagesAsProfiles } from "@/lib/db";

export async function POST(req: NextRequest) {
  const token    = process.env.SOCIALBLADE_TOKEN;
  const clientId = process.env.SOCIALBLADE_CLIENTID;
  if (!token || !clientId) {
    return NextResponse.json(
      { error: "SOCIALBLADE_TOKEN or SOCIALBLADE_CLIENTID not configured" },
      { status: 500 },
    );
  }

  let body: { profileId?: string; profileIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Resolve which profiles to update
  let ids: string[];
  if (body.profileIds) {
    ids = body.profileIds;
  } else if (body.profileId) {
    ids = [body.profileId];
  } else {
    return NextResponse.json({ error: "Provide profileId or profileIds" }, { status: 400 });
  }

  const registry = getAllPagesAsProfiles();
  const profiles = ids.flatMap(id => {
    const p = registry.find(x => x.id === id);
    return p ? [p] : [];
  });

  if (profiles.length === 0) {
    return NextResponse.json({ error: "No valid profiles found" }, { status: 400 });
  }

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const profile of profiles) {
    try {
      // Ensure profile row exists in DB
      upsertProfile({
        id:          profile.id,
        username:    profile.username,
        platform:    profile.platform,
        displayName: profile.displayName,
      });

      const snapshot = await fetchSBProfile(profile, token, clientId);

      insertSnapshot({
        profileId:      snapshot.profileId,
        fetchedAt:      snapshot.fetchedAt,
        followers:      snapshot.followers,
        following:      snapshot.following,
        mediaCount:     snapshot.mediaCount,
        avgLikes:       snapshot.avgLikes,
        avgComments:    snapshot.avgComments,
        engagementRate: snapshot.engagementRate,
        weeklyGrowth:   snapshot.weeklyGrowth,
        monthlyGrowth:  snapshot.monthlyGrowth,
        rawJson:        snapshot.rawJson,
      });

      markProfileUpdated(profile.id, snapshot.fetchedAt);

      // Save daily post diffs extracted from SB daily array
      if (snapshot.dailyPosts.length > 0) {
        upsertSBDailyPosts(
          snapshot.dailyPosts.map(d => ({
            profile_id:  profile.id,
            post_date:   d.date,
            posts_count: d.posts,
          })),
        );
      }

      results.push({ id: profile.id, ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ id: profile.id, ok: false, error: msg });
    }
  }

  const allOk = results.every(r => r.ok);
  return NextResponse.json({ results }, { status: allOk ? 200 : 207 });
}
