// GET  /api/competitors  — list all saved competitors from SQLite
// POST /api/competitors  — fetch from Social Blade, save, return as Competitor shape

import { NextRequest, NextResponse } from "next/server";
import { getAllCompetitors, upsertCompetitor, deleteCompetitor } from "@/lib/db";

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const rows = getAllCompetitors();
  return NextResponse.json({ competitors: rows.map(dbToWire) });
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const token    = process.env.SOCIALBLADE_TOKEN;
  const clientId = process.env.SOCIALBLADE_CLIENTID;
  if (!token || !clientId) {
    return NextResponse.json({ error: "SOCIALBLADE_TOKEN ou SOCIALBLADE_CLIENTID não configurado" }, { status: 500 });
  }

  let body: { username?: string; platform?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const username = (body.username ?? "").trim().replace(/^@/, "");
  const platform = (body.platform ?? "").toLowerCase();

  if (!username) return NextResponse.json({ error: "Username é obrigatório" }, { status: 400 });
  if (platform !== "instagram" && platform !== "tiktok")
    return NextResponse.json({ error: "Plataforma deve ser instagram ou tiktok" }, { status: 400 });

  // Fetch from Social Blade
  const url = `https://matrix.sbapis.com/b/${platform}/statistics?query=${encodeURIComponent(username)}`;
  let sbJson: unknown;
  try {
    const res = await fetch(url, {
      headers: { clientid: clientId, token, history: "default" },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json({ error: `Social Blade ${res.status}: ${text.slice(0, 200)}` }, { status: 502 });
    }
    sbJson = await res.json();
  } catch (e) {
    return NextResponse.json({ error: `Erro de rede: ${e instanceof Error ? e.message : String(e)}` }, { status: 502 });
  }

  // Parse response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data   = (sbJson as any)?.data ?? {};
  const stats  = data?.statistics ?? {};
  const total  = stats?.total ?? {};
  const growth = stats?.growth?.followers ?? {};
  const daily  = Array.isArray(data?.daily) ? data.daily : [];

  const displayName: string | null = data?.id?.display_name ?? null;
  const followers:      number | null = total?.followers     ?? null;
  const engagementRate: number | null = total?.engagement_rate ?? null;
  const weeklyGrowth:   number | null = growth["7"]           ?? null;
  const monthlyGrowth:  number | null = growth["30"]          ?? null;
  const avgLikes:       number | null = daily[0]?.avg_likes   ?? null;
  const avgComments:    number | null = daily[0]?.avg_comments ?? null;

  const row = {
    id:             username,
    username,
    platform:       platform as "instagram" | "tiktok",
    displayName,
    followers,
    engagementRate,
    weeklyGrowth,
    monthlyGrowth,
    avgLikes,
    avgComments,
    lastUpdated:    new Date().toISOString(),
    rawJson:        JSON.stringify(sbJson),
  };

  upsertCompetitor(row);

  // Build sparkline: 8 days of daily follower gains (oldest → newest)
  const weeklyData: number[] = [];
  for (let i = Math.min(daily.length - 2, 7); i >= 0; i--) {
    weeklyData.push(Math.max(0, (daily[i]?.followers ?? 0) - (daily[i + 1]?.followers ?? 0)));
  }
  while (weeklyData.length < 8) weeklyData.unshift(0);

  return NextResponse.json({ competitor: buildCompetitor(row, weeklyData) });
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  deleteCompetitor(id);
  return NextResponse.json({ ok: true });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-violet-500","bg-pink-500","bg-rose-500","bg-orange-500",
  "bg-amber-500","bg-green-500","bg-cyan-500","bg-blue-500","bg-indigo-500",
];

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToWire(row: any) {
  // Parse sparkline from raw_json if available
  let weeklyData: number[] = new Array(8).fill(0);
  try {
    const raw   = JSON.parse(row.rawJson ?? "{}");
    const daily = Array.isArray(raw?.data?.daily) ? raw.data.daily : [];
    const gains: number[] = [];
    for (let i = Math.min(daily.length - 2, 7); i >= 0; i--) {
      gains.push(Math.max(0, (daily[i]?.followers ?? 0) - (daily[i + 1]?.followers ?? 0)));
    }
    if (gains.length) weeklyData = [...new Array(8 - gains.length).fill(0), ...gains];
  } catch { /* ignore */ }

  return buildCompetitor(row, weeklyData);
}

function buildCompetitor(
  row: {
    id: string; username: string; platform: "instagram" | "tiktok";
    displayName: string | null; followers: number | null;
    engagementRate: number | null; weeklyGrowth: number | null;
    monthlyGrowth: number | null; lastUpdated: string | null;
  },
  weeklyData: number[],
) {
  const engPct    = row.engagementRate != null ? parseFloat((row.engagementRate * 100).toFixed(2)) : 0;
  const flw       = row.followers ?? 0;
  const monthly   = row.monthlyGrowth ?? 0;
  const growthPct = flw > 0 ? parseFloat(((monthly / flw) * 100).toFixed(1)) : 0;
  const color     = AVATAR_COLORS[strHash(row.username) % AVATAR_COLORS.length];

  const lastUpdatedFormatted = row.lastUpdated
    ? new Date(row.lastUpdated).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
      })
    : "—";

  return {
    id:           row.id,
    name:         row.displayName ?? `@${row.username}`,
    handle:       `@${row.username}`,
    platform:     row.platform === "instagram" ? "Instagram" : "TikTok",
    category:     "Social Blade",
    initials:     row.username.slice(0, 2).toUpperCase(),
    color,
    followers:    flw,
    growth:       growthPct,
    engagement:   engPct,
    postsPerWeek: 0,
    lastPost:     lastUpdatedFormatted,
    weeklyData,
    recentPosts:  [],
    // extra field used to identify DB competitors
    _fromDb:      true,
  };
}
