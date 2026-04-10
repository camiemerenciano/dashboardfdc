// ─── Google Sheets integration — OAuth2 ───────────────────────────────────────
// Server-side only. Never import in client components.
//
// Auth flow (one-time setup):
//   1. GET /api/sheets/auth  → redirects to Google consent screen
//   2. Google redirects to /api/sheets/callback?code=...
//   3. Refresh token is saved to SQLite
//   4. All future calls use the saved refresh token silently

import { google } from "googleapis";
import { getSheetsRefreshToken } from "@/lib/db";
import type { SheetsPostRow } from "@/lib/db";

const CLIENT_ID     = process.env.GOOGLE_OAUTH_CLIENT_ID     ?? "";
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "";
const REDIRECT_URI  = process.env.GOOGLE_OAUTH_REDIRECT_URI  ?? "http://localhost:3000/api/sheets/callback";
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? "";

const RANGE = "A2:E"; // row 1 = headers, skip

export class SheetsError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "SheetsError";
  }
}

export function createOAuthClient() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export function getAuthUrl(): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt:      "consent",  // forces refresh_token to be returned every time
    scope: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

export async function fetchSheetsPostRows(): Promise<SheetsPostRow[]> {
  if (!SPREADSHEET_ID) throw new SheetsError("GOOGLE_SHEETS_SPREADSHEET_ID não configurado");
  if (!CLIENT_ID)      throw new SheetsError("GOOGLE_OAUTH_CLIENT_ID não configurado");
  if (!CLIENT_SECRET)  throw new SheetsError("GOOGLE_OAUTH_CLIENT_SECRET não configurado");

  const refreshToken = getSheetsRefreshToken();
  if (!refreshToken) {
    throw new SheetsError(
      "Planilha não autorizada. Acesse /api/sheets/auth para conectar sua conta Google.",
      401,
    );
  }

  const client = createOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });

  const sheets = google.sheets({ version: "v4", auth: client });

  let values: string[][] = [];
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range:         RANGE,
    });
    values = (res.data.values ?? []) as string[][];
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    const msg    = (err as { message?: string })?.message ?? String(err);
    throw new SheetsError(`Google Sheets API: ${msg}`, status);
  }

  const rows: SheetsPostRow[] = [];

  for (const cols of values) {
    const rawDate   = (cols[0] ?? "").trim();
    const pagina    = (cols[1] ?? "").trim();
    const admin     = (cols[2] ?? "").trim();
    const tipo_post = (cols[3] ?? "").trim();
    const rawQtd    = (cols[4] ?? "").trim();

    if (!pagina || !admin || !tipo_post) continue;

    const quantidade = parseInt(rawQtd, 10);
    if (isNaN(quantidade)) continue;

    const row_date = normaliseDate(rawDate) ?? rawDate;
    rows.push({ row_date, pagina, admin, tipo_post, quantidade });
  }

  return rows;
}

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
