// POST /api/volume-publicacoes
// Receives individual post-volume records from n8n and saves them to SQLite.
//
// Expected body (single object or array):
// { "data": "09/04/2026", "pagina": "@repensamos", "admin": "Rafa", "tipo_post": "Reels", "quantidade": 2 }

import { NextRequest, NextResponse } from "next/server";
import { upsertSheetsRow, getSheetsRows, getSheetsMeta } from "@/lib/db";
import type { SheetsPostRow } from "@/lib/db";

// ─── Date normalisation ───────────────────────────────────────────────────────

function normaliseDate(raw: string): string | null {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

// ─── Validate and parse one record ───────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRecord(item: any): SheetsPostRow | { error: string } {
  if (typeof item !== "object" || item === null) return { error: "item must be an object" };

  const rawDate  = String(item.data      ?? item.date       ?? "").trim();
  const pagina   = String(item.pagina    ?? item.page       ?? "").trim();
  const admin    = String(item.admin     ?? "").trim();
  const tipPost  = String(item.tipo_post ?? item.tipo       ?? "").trim();
  const rawQtd   = item.quantidade       ?? item.quantity   ?? item.qtd;

  if (!rawDate)  return { error: "campo 'data' ausente" };
  if (!pagina)   return { error: "campo 'pagina' ausente" };
  if (!admin)    return { error: "campo 'admin' ausente" };
  if (!tipPost)  return { error: "campo 'tipo_post' ausente" };

  const row_date = normaliseDate(rawDate);
  if (!row_date) return { error: `data inválida: ${rawDate}` };

  const quantidade = parseInt(String(rawQtd), 10);
  if (isNaN(quantidade) || quantidade < 0) return { error: `quantidade inválida: ${rawQtd}` };

  return { row_date, pagina, admin, tipo_post: tipPost, quantidade };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const items = Array.isArray(body) ? body : [body];
  const saved:  SheetsPostRow[] = [];
  const errors: { index: number; error: string }[] = [];

  for (let i = 0; i < items.length; i++) {
    const result = parseRecord(items[i]);
    if ("error" in result) {
      errors.push({ index: i, error: result.error });
    } else {
      upsertSheetsRow(result);
      saved.push(result);
    }
  }

  const meta = getSheetsMeta();
  const rows = getSheetsRows();

  const status = saved.length === 0 ? 400 : 200;
  return NextResponse.json(
    {
      ok:     saved.length > 0,
      saved:  saved.length,
      errors: errors.length > 0 ? errors : undefined,
      meta,
      total_rows: rows.length,
    },
    { status },
  );
}

// GET: quick health-check — returns current cache state
export async function GET() {
  const meta = getSheetsMeta();
  const rows = getSheetsRows();
  return NextResponse.json({ ok: true, meta, total_rows: rows.length });
}
