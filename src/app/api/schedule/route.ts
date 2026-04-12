// GET /api/schedule        — returns current schedule
// POST /api/schedule       — saves schedule
// POST /api/schedule/run   — manual trigger (for testing)

import { NextRequest, NextResponse } from "next/server";
import { getUpdateSchedule, saveUpdateSchedule } from "@/lib/db";

export async function GET() {
  return NextResponse.json(getUpdateSchedule());
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    enabled: boolean;
    timeHHMM: string;
    daysOfWeek: number[];
  };

  if (!body.timeHHMM || !/^\d{2}:\d{2}$/.test(body.timeHHMM)) {
    return NextResponse.json({ error: "timeHHMM inválido (use HH:MM)" }, { status: 400 });
  }

  saveUpdateSchedule({
    enabled:    body.enabled,
    timeHHMM:   body.timeHHMM,
    daysOfWeek: body.daysOfWeek ?? [0,1,2,3,4,5,6],
  });

  return NextResponse.json({ ok: true });
}
