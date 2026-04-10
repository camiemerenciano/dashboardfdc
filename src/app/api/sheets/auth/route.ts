// GET /api/sheets/auth
// Redirects to Google OAuth consent screen.
// After approval, Google redirects to /api/sheets/callback.

import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google-sheets";

export async function GET() {
  const url = getAuthUrl();
  return NextResponse.redirect(url);
}
