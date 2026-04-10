// GET  /api/sheets  — returns cached rows + meta from SQLite
// POST /api/sheets  — fetches from Google Sheets, saves to SQLite, returns updated data

import { NextResponse } from "next/server";
import { getSheetsRows, getSheetsMeta, saveSheetsRows } from "@/lib/db";
import { fetchSheetsPostRows, SheetsError } from "@/lib/google-sheets";

const STALE_MS = 60 * 60 * 1000; // 1 hour

export async function GET() {
  const meta = getSheetsMeta();

  // Auto-refresh if cache is empty or stale — skip silently if not yet authorized
  const isStale = !meta || (Date.now() - new Date(meta.last_fetched).getTime() > STALE_MS);

  if (isStale) {
    try {
      const rows = await fetchSheetsPostRows();
      saveSheetsRows(rows);
    } catch {
      // Return stale/empty data silently — auth errors are surfaced via POST
    }
  }

  const rows    = getSheetsRows();
  const newMeta = getSheetsMeta();

  return NextResponse.json({ rows, meta: newMeta });
}

export async function POST() {
  try {
    const rows = await fetchSheetsPostRows();
    saveSheetsRows(rows);
    const meta = getSheetsMeta();
    return NextResponse.json({ ok: true, rows, meta });
  } catch (e) {
    const isAuth = e instanceof SheetsError && e.status === 401;
    const msg    = e instanceof SheetsError ? e.message : "Erro ao buscar planilha";
    return NextResponse.json(
      { ok: false, error: msg, needsAuth: isAuth },
      { status: isAuth ? 401 : 500 },
    );
  }
}
