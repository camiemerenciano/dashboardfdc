// GET/POST/PUT/DELETE /api/pages
// CRUD for pages_registry table.

import { NextRequest, NextResponse } from "next/server";
import { getAllPages, upsertPage, deletePage, PageType } from "@/lib/db";
import { SOCIALBLADE_PROFILES } from "@/lib/socialblade";

// Seed from SOCIALBLADE_PROFILES if table is empty
function ensureSeeded() {
  const existing = getAllPages();
  if (existing.length > 0) return;
  for (const p of SOCIALBLADE_PROFILES) {
    upsertPage({
      id:          p.id,
      username:    p.username,
      platform:    p.platform,
      displayName: p.displayName,
      adminName:   p.adminName,
      pageType:    "motivação" as PageType,
    });
  }
}

export async function GET() {
  ensureSeeded();
  return NextResponse.json(getAllPages());
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    id: string;
    username: string;
    platform: string;
    displayName?: string;
    adminName?: string;
    pageType: string;
  };

  if (!body.id || !body.username || !body.pageType) {
    return NextResponse.json({ error: "id, username e pageType são obrigatórios" }, { status: 400 });
  }

  upsertPage({
    id:          body.id,
    username:    body.username,
    platform:    (body.platform ?? "instagram") as "instagram" | "tiktok",
    displayName: body.displayName ?? null,
    adminName:   body.adminName   ?? null,
    pageType:    body.pageType    as PageType,
  });

  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
  deletePage(id);
  return NextResponse.json({ ok: true });
}
