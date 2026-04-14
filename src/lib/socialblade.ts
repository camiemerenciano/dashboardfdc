// ─── Social Blade profile registry ───────────────────────────────────────────
// Never imported by client components — only used in API routes and db helpers.

export type SBPlatform = "instagram" | "tiktok";

export interface SBProfile {
  id: string;          // unique key (same as username)
  username: string;    // without @
  platform: SBPlatform;
  displayName: string;
  adminName: string;
}

export const SOCIALBLADE_PROFILES: SBProfile[] = [
  // ── Instagram (24) ──────────────────────────────────────────────────────────
  { id: "repensamos",              username: "repensamos",              platform: "instagram", displayName: "Repensamos",            adminName: "Rafa"     },
  { id: "valordamente",            username: "valordamente",            platform: "instagram", displayName: "Valordamente",          adminName: "Lucas"    },
  { id: "menteinspiravel",         username: "menteinspiravel",         platform: "instagram", displayName: "Mente Inspirável",      adminName: "Lucas"    },
  { id: "mulherdevalor",            username: "mulherdevalor",            platform: "instagram", displayName: "Mulher de Valor",       adminName: "Tamires"  },
  { id: "precisavapensar",         username: "precisavapensar",         platform: "instagram", displayName: "Precisava Pensar",      adminName: "Luis"     },
  { id: "motivei",                 username: "motivei",                 platform: "instagram", displayName: "Motivei",               adminName: "Luis"     },
  { id: "acordeipravida",          username: "acordeipravida",          platform: "instagram", displayName: "Acordei Pra Vida",      adminName: "Illana"   },
  { id: "respostademulher",        username: "respostademulher",        platform: "instagram", displayName: "Resposta de Mulher",    adminName: "Illana"   },
  { id: "reflitars",               username: "reflitars",               platform: "instagram", displayName: "Reflitars",             adminName: "Davi"     },
  { id: "despertei",               username: "despertei",               platform: "instagram", displayName: "Despertei",             adminName: "Davi"     },
  { id: "vencinavida",             username: "vencinavida",             platform: "instagram", displayName: "Venci na Vida",         adminName: "Walter"   },
  { id: "palavrasboas",            username: "palavrasboas",            platform: "instagram", displayName: "Palavras Boas",         adminName: "Walter"   },
  { id: "obstinado.br",            username: "obstinado.br",            platform: "instagram", displayName: "Obstinado BR",          adminName: "Michel"   },
  { id: "resilienciamilionaria",   username: "resilienciamilionaria",   platform: "instagram", displayName: "Resiliência Milionária",adminName: "Michel"   },
  { id: "tribovisionaria",         username: "tribovisionaria",         platform: "instagram", displayName: "Tribo Visionária",      adminName: "Rodrigo"  },
  { id: "mania.de.cortes",         username: "mania.de.cortes",         platform: "instagram", displayName: "Mania de Cortes",       adminName: "Davy"     },
  { id: "smsindelicado",           username: "smsindelicado",           platform: "instagram", displayName: "SMS Indelicado",        adminName: "Marcela"  },
  { id: "historiaemimagens",        username: "historiaemimagens",        platform: "instagram", displayName: "História em Imagens",   adminName: "Hyeser"   },
  { id: "espetacular",             username: "espetacular",             platform: "instagram", displayName: "Espetacular",           adminName: "João"     },
  { id: "viralizou",               username: "viralizou",               platform: "instagram", displayName: "Viralizou",             adminName: "Eduardo"  },
  { id: "sensacional",             username: "sensacional",             platform: "instagram", displayName: "Sensacional",           adminName: "João"     },
  { id: "semspoiler",              username: "semspoiler",              platform: "instagram", displayName: "Sem Spoiler",           adminName: "Rodrigo 2"},
  { id: "elasmovemomundo",         username: "elasmovemomundo",         platform: "instagram", displayName: "Elas Movem o Mundo",    adminName: "Nataly"   },
  { id: "deusvaitesurpreender",    username: "deusvaitesurpreender",    platform: "instagram", displayName: "Deus Vai Te Surpreender",adminName:"Tamires"  },
  // ── TikTok (1) ──────────────────────────────────────────────────────────────
  { id: "sejasuaprioridade1",      username: "sejasuaprioridade1",      platform: "tiktok",    displayName: "Seja Sua Prioridade",   adminName: "Rafa"     },
];

// ─── API endpoints ─────────────────────────────────────────────────────────────

const BASE = "https://matrix.sbapis.com/b";

function endpoint(platform: SBPlatform, username: string) {
  return `${BASE}/${platform}/statistics?query=${encodeURIComponent(username)}`;
}

// ─── Parsed snapshot from SB response ─────────────────────────────────────────

export interface SBSnapshot {
  profileId:      string;
  fetchedAt:      string;  // ISO timestamp
  followers:      number | null;
  following:      number | null;
  mediaCount:     number | null;
  avgLikes:       number | null;
  avgComments:    number | null;
  engagementRate: number | null;  // decimal, e.g. 0.05 = 5%
  weeklyGrowth:   number | null;  // followers gained in last 7 days
  monthlyGrowth:  number | null;
  rawJson:        string;
  dailyPosts:     Array<{ date: string; posts: number }>;  // derived from consecutive media diffs
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSnapshot(profileId: string, raw: unknown): SBSnapshot {
  // Actual SB response shape:
  // raw.data.statistics.total.{ followers, following, media, engagement_rate }
  // raw.data.statistics.growth.followers.{ "7": n, "30": n }
  // raw.data.daily[].{ date, avg_likes, avg_comments, media_count? }
  const data   = (raw as any)?.data ?? {};
  const stats  = data?.statistics ?? {};
  const total  = stats?.total ?? {};
  const growth = stats?.growth?.followers ?? {};
  const daily  = Array.isArray(data?.daily) ? data.daily : [];
  const latest = daily[0] ?? {};

  // Derive posts-per-day from consecutive differences in media/uploads across daily entries.
  // SB returns daily[] sorted newest-first. Each entry has a cumulative count field:
  //   Instagram: media_count | media
  //   TikTok:    uploads
  // diff[i] = daily[i].count - daily[i+1].count = posts published on day i.
  const dailyPosts: Array<{ date: string; posts: number }> = [];
  for (let i = 0; i < daily.length - 1; i++) {
    const curr = daily[i];
    const prev = daily[i + 1];
    const currMedia = curr?.media_count ?? curr?.media ?? curr?.uploads ?? null;
    const prevMedia = prev?.media_count ?? prev?.media ?? prev?.uploads ?? null;
    const currDateRaw = curr?.date ?? curr?.day ?? null;
    const prevDateRaw = prev?.date ?? prev?.day ?? null;
    if (currMedia == null || prevMedia == null || !currDateRaw || !prevDateRaw) continue;

    // Only store when entries are exactly 1 day apart.
    // Larger gaps mean SB skipped days — the diff would be multi-day and misleading.
    const currDay = new Date(String(currDateRaw));
    const prevDay = new Date(String(prevDateRaw));
    const gapDays = Math.round((currDay.getTime() - prevDay.getTime()) / 86_400_000);
    if (gapDays !== 1) continue;

    const diff = Number(currMedia) - Number(prevMedia);
    if (diff > 0) {
      dailyPosts.push({ date: normaliseDate(String(currDateRaw)), posts: diff });
    }
  }

  return {
    profileId,
    fetchedAt:      new Date().toISOString(),
    followers:      total?.followers        ?? null,
    following:      total?.following        ?? null,
    mediaCount:     total?.media            ?? null,
    avgLikes:       latest?.avg_likes       ?? null,
    avgComments:    latest?.avg_comments    ?? null,
    engagementRate: total?.engagement_rate  ?? null,
    weeklyGrowth:   growth["7"]             ?? null,
    monthlyGrowth:  growth["30"]            ?? null,
    rawJson:        JSON.stringify(raw),
    dailyPosts,
  };
}

function normaliseDate(raw: string): string {
  // YYYY-MM-DD already
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // YYYYMMDD
  if (/^\d{8}$/.test(raw)) return `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`;
  // Try JS Date
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return raw;
}

// ─── Fetch a single profile ────────────────────────────────────────────────────

export async function fetchSBProfile(
  profile: SBProfile,
  token: string,
  clientId: string,
): Promise<SBSnapshot> {
  const url = endpoint(profile.platform, profile.username);
  const res = await fetch(url, {
    headers: {
      "clientid": clientId,
      "token":    token,
      "history":  "default",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`SocialBlade ${res.status} for @${profile.username}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  return parseSnapshot(profile.id, json);
}
