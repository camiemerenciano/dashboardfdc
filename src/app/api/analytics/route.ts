// GET  /api/analytics  — return latest saved import
// POST /api/analytics  — parse CSV body, save to SQLite, return processed data

import { NextRequest, NextResponse } from "next/server";
import { saveAnalyticsImport, getLatestAnalyticsImport } from "@/lib/db";
import type { DailyMetric, BarMetric, TopPost, AnalyticsData } from "@/lib/db";

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const row = getLatestAnalyticsImport();
  if (!row) return NextResponse.json({ import: null });
  return NextResponse.json({ import: row });
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let csvText: string;
  let filename: string | null = null;

  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Arquivo não encontrado no formulário" }, { status: 400 });
    }
    filename  = (file as File).name;
    csvText   = await (file as File).text();
  } else {
    csvText = await req.text();
    filename = req.headers.get("x-filename") ?? null;
  }

  if (!csvText.trim()) {
    return NextResponse.json({ error: "Arquivo CSV vazio" }, { status: 400 });
  }

  try {
    const data = parseMeta(csvText);
    if (!data.daily.length && !data.topPosts.length) {
      return NextResponse.json(
        { error: "Nenhum dado reconhecido no CSV. Verifique se é uma exportação do Meta Business Suite." },
        { status: 422 },
      );
    }
    const importedAt = saveAnalyticsImport(filename, data);
    return NextResponse.json({ import: { importedAt, filename, data } });
  } catch (e) {
    return NextResponse.json(
      { error: `Erro ao processar CSV: ${e instanceof Error ? e.message : String(e)}` },
      { status: 422 },
    );
  }
}

// ─── CSV parser ───────────────────────────────────────────────────────────────

function parseMeta(raw: string): AnalyticsData {
  // Remove BOM and normalise line endings
  const text  = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length < 2) throw new Error("CSV deve ter pelo menos 2 linhas");

  // Detect delimiter: semicolon is common in pt-BR exports
  const delim = lines[0].includes(";") ? ";" : ",";

  const headers = parseCsvLine(lines[0], delim).map(normalise);

  // ── Column index lookup ──────────────────────────────────────────────────────
  const idx = (candidates: string[]): number => {
    for (const c of candidates) {
      const i = headers.findIndex(h => h.includes(c));
      if (i >= 0) return i;
    }
    return -1;
  };

  const iDate  = idx(["periodo","data de publica","published time","date","dia","período"]);
  const iImp   = idx(["impressoes","impressões","impressions"]);
  const iEng   = idx(["engajamentos","engagements","engagement","engajamento"]);
  const iFlwr  = idx(["novos seguidores","new fans","new followers","followers gained","novos fas","crescimento de"]);
  const iType  = idx(["tipo de publica","tipo de post","post type","content type","tipo"]);
  const iTitle = idx(["legenda","caption","title","texto","titulo"]);
  const iLikes = idx(["curtidas","likes","reacoes","reações","reactions"]);
  const iEngR  = idx(["taxa de engaj","engagement rate","taxa de engajamento"]);

  const rows = lines.slice(1).map(l => parseCsvLine(l, delim));

  // Determine if this is a POST-level or PAGE-level (daily) CSV
  const isPostLevel = iTitle >= 0 && iType >= 0;
  const isDailyLevel = iDate >= 0 && iImp >= 0 && !isPostLevel;

  const daily:    DailyMetric[] = [];
  const barMap:   Record<string, { impressoes: number; engajamentos: number }> = {};
  const topPosts: TopPost[]     = [];

  for (const row of rows) {
    if (!row.length || row.every(c => !c.trim())) continue;

    const get = (i: number) => (i >= 0 ? row[i]?.trim() ?? "" : "");
    const num = (i: number) => {
      const s = get(i).replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "");
      return s ? parseFloat(s) : 0;
    };

    if (isDailyLevel) {
      const date = formatDate(get(iDate));
      if (!date) continue;
      daily.push({
        date,
        impressoes:   num(iImp),
        engajamentos: num(iEng),
        seguidores:   num(iFlwr),
      });
    } else if (isPostLevel) {
      // Aggregate bar data by post type
      const rawType = get(iType);
      const type    = normalisePostType(rawType);
      const imp     = num(iImp);
      const eng     = num(iEng);

      if (!barMap[type]) barMap[type] = { impressoes: 0, engajamentos: 0 };
      barMap[type].impressoes   += imp;
      barMap[type].engajamentos += eng;

      // Top posts
      const impressions = imp;
      const likes       = num(iLikes);
      const engRate     = iEngR >= 0 ? num(iEngR) : impressions > 0 ? (eng / impressions) * 100 : 0;
      const caption     = get(iTitle);
      const dateStr     = formatDate(get(iDate));
      if (caption && impressions > 0) {
        topPosts.push({
          id:          String(topPosts.length + 1),
          caption:     caption.slice(0, 120),
          type,
          impressions,
          engagement:  parseFloat(engRate.toFixed(1)),
          likes,
          publishedAt: dateStr ?? get(iDate).slice(0, 10),
        });
      }
    }
  }

  // If only daily data was found, synthesise barData from follower-gain peaks
  const barData: BarMetric[] = Object.entries(barMap).map(([type, v]) => ({
    type, ...v,
  }));

  // Sort top posts by engagement descending
  topPosts.sort((a, b) => b.engagement - a.engagement);

  return { daily, barData, topPosts: topPosts.slice(0, 10) };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseCsvLine(line: string, delim: string): string[] {
  const result: string[] = [];
  let cur   = "";
  let inQ   = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === delim && !inQ) {
      result.push(cur); cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

function normalise(s: string): string {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ").trim();
}

/** Try to parse a date string into DD/MM format */
function formatDate(raw: string): string | null {
  if (!raw) return null;
  // ISO: 2026-03-07 or 2026-03-07T10:00
  const iso = raw.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (iso) return `${iso[3].padStart(2,"0")}/${iso[2].padStart(2,"0")}`;
  // BR: 07/03/2026 or 07/03/26
  const br = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/);
  if (br) return `${br[1].padStart(2,"0")}/${br[2].padStart(2,"0")}`;
  return null;
}

const POST_TYPE_MAP: Record<string, string> = {
  reel: "Reels", reels: "Reels", video: "Reels",
  foto: "Feed", feed: "Feed", photo: "Feed", image: "Feed",
  story: "Stories", stories: "Stories",
  carrossel: "Carrossel", carousel: "Carrossel", album: "Carrossel",
};

function normalisePostType(raw: string): string {
  const key = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  for (const [k, v] of Object.entries(POST_TYPE_MAP)) {
    if (key.includes(k)) return v;
  }
  return raw || "Feed";
}
