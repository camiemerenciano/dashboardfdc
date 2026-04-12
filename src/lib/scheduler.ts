// Server-side scheduler — called every minute from instrumentation.ts.
// Checks if there's a pending scheduled update and fires it if so.

import { getUpdateSchedule, markScheduleRan, getAllPagesAsProfiles, upsertProfile, insertSnapshot, markProfileUpdated, upsertSBDailyPosts } from "@/lib/db";
import { fetchSBProfile } from "@/lib/socialblade";

let _running = false;

export async function runScheduledUpdate(): Promise<void> {
  // Prevent concurrent runs
  if (_running) return;

  try {
    const schedule = getUpdateSchedule();
    if (!schedule.enabled) return;
    if (schedule.daysOfWeek.length === 0) return;

    const now = new Date();

    // Check day-of-week (0=Sun … 6=Sat)
    const todayDow = now.getDay();
    if (!schedule.daysOfWeek.includes(todayDow)) return;

    // Check time: we fire if current HH:MM matches the scheduled HH:MM
    const [schedH, schedM] = schedule.timeHHMM.split(":").map(Number);
    const curH = now.getHours();
    const curM = now.getMinutes();
    if (curH !== schedH || curM !== schedM) return;

    // Check we haven't already run today
    const todayISO = now.toISOString().slice(0, 10);
    if (schedule.lastRunDate === todayISO) return;

    // All checks passed — fire
    _running = true;
    console.log(`[scheduler] Auto-update triggered at ${now.toISOString()}`);

    const token    = process.env.SOCIALBLADE_TOKEN;
    const clientId = process.env.SOCIALBLADE_CLIENTID;
    if (!token || !clientId) {
      console.warn("[scheduler] SOCIALBLADE_TOKEN ou SOCIALBLADE_CLIENTID não configurados — abortando.");
      return;
    }

    // Mark as ran immediately to prevent duplicate fires within the same minute
    markScheduleRan(todayISO);

    let ok = 0, fail = 0;

    const profiles = getAllPagesAsProfiles();
    for (const profile of profiles) {
      try {
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

        if (snapshot.dailyPosts.length > 0) {
          upsertSBDailyPosts(
            snapshot.dailyPosts.map(d => ({
              profile_id:  profile.id,
              post_date:   d.date,
              posts_count: d.posts,
            })),
          );
        }

        ok++;
        // Small delay between profiles to avoid hammering the API
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        fail++;
        console.error(`[scheduler] Falha ao atualizar ${profile.id}:`, err);
      }
    }

    console.log(`[scheduler] Concluído: ${ok} ok, ${fail} falhas.`);
  } catch (err) {
    console.error("[scheduler] Erro inesperado:", err);
  } finally {
    _running = false;
  }
}
