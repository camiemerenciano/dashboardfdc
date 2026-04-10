// GET /api/sheets/callback?code=...
// OAuth2 callback — exchanges the code for tokens and saves the refresh token.

import { NextRequest, NextResponse } from "next/server";
import { createOAuthClient } from "@/lib/google-sheets";
import { saveSheetsRefreshToken } from "@/lib/db";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ ok: false, error: "código OAuth ausente" }, { status: 400 });
  }

  try {
    const client = createOAuthClient();
    const { tokens } = await client.getToken(code);

    if (!tokens.refresh_token) {
      return new NextResponse(
        `<html><body style="font-family:sans-serif;padding:2rem;background:#0f172a;color:#e2e8f0">
          <h2 style="color:#f87171">⚠ refresh_token não retornado</h2>
          <p>O Google só retorna o refresh_token na primeira autorização.</p>
          <p>Acesse <a href="/api/sheets/auth" style="color:#818cf8">/api/sheets/auth</a>,
          clique em <strong>"Escolher conta"</strong> e depois em <strong>"Permitir"</strong> novamente.</p>
          <p style="font-size:12px;color:#64748b">Se continuar sem funcionar, revogue o acesso em
          <a href="https://myaccount.google.com/permissions" style="color:#818cf8">myaccount.google.com/permissions</a>
          e tente de novo.</p>
        </body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } },
      );
    }

    saveSheetsRefreshToken(tokens.refresh_token);

    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:2rem;background:#0f172a;color:#e2e8f0">
        <h2 style="color:#34d399">✓ Google Sheets conectado!</h2>
        <p>Refresh token salvo. O dashboard já pode ler a planilha.</p>
        <p><a href="/posts-volume" style="color:#818cf8">← Voltar para Volume de Publicações</a></p>
      </body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
