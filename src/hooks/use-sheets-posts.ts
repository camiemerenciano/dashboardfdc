"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface SheetsPostRow {
  row_date:   string;
  pagina:     string;
  admin:      string;
  tipo_post:  string;
  quantidade: number;
}

export interface SheetsMeta {
  last_fetched: string;
  last_n8n:     string | null;
  row_count:    number;
}

const SHEETS_REFRESH_MS = 60 * 60 * 1000; // 1 hour — full Google Sheets sync
const POLL_MS           = 30 * 1000;       // 30 seconds — lightweight SQLite poll for n8n updates

export function useSheetsPosts() {
  const [rows,       setRows]       = useState<SheetsPostRow[]>([]);
  const [meta,       setMeta]       = useState<SheetsMeta | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [needsAuth,  setNeedsAuth]  = useState(false);

  const sheetsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastN8nRef     = useRef<string | null>(null);

  // Lightweight poll: just reads from SQLite cache, detects n8n inserts
  const poll = useCallback(async () => {
    try {
      const res  = await fetch("/api/volume-publicacoes");
      const json = await res.json() as { ok: boolean; meta: SheetsMeta | null; total_rows: number };
      if (!json.meta) return;
      // Only re-fetch full data if n8n pushed something new
      if (json.meta.last_n8n && json.meta.last_n8n !== lastN8nRef.current) {
        lastN8nRef.current = json.meta.last_n8n;
        const full = await fetch("/api/sheets");
        const data = await full.json() as { rows: SheetsPostRow[]; meta: SheetsMeta | null };
        setRows(data.rows ?? []);
        setMeta(data.meta ?? null);
      }
    } catch { /* silent — poll failures shouldn't surface */ }
  }, []);

  // Full load from SQLite (fast, no Google Sheets call)
  const load = useCallback(async () => {
    try {
      const res  = await fetch("/api/sheets");
      const json = await res.json() as { rows: SheetsPostRow[]; meta: SheetsMeta | null };
      setRows(json.rows ?? []);
      setMeta(json.meta ?? null);
      lastN8nRef.current = json.meta?.last_n8n ?? null;
      setError(null);
    } catch {
      setError("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  // Manual / scheduled full Google Sheets sync
  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    setNeedsAuth(false);
    try {
      const res  = await fetch("/api/sheets", { method: "POST" });
      const json = await res.json() as { ok: boolean; rows?: SheetsPostRow[]; meta?: SheetsMeta; error?: string; needsAuth?: boolean };
      if (json.needsAuth) { setNeedsAuth(true); return; }
      if (!json.ok) throw new Error(json.error ?? "Erro desconhecido");
      setRows(json.rows ?? []);
      setMeta(json.meta ?? null);
      // Reset the hourly Sheets sync timer
      if (sheetsTimerRef.current) clearTimeout(sheetsTimerRef.current);
      sheetsTimerRef.current = setTimeout(refresh, SHEETS_REFRESH_MS);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();

    // Hourly Google Sheets sync
    sheetsTimerRef.current = setTimeout(refresh, SHEETS_REFRESH_MS);

    // 30s poll for n8n updates
    pollTimerRef.current = setInterval(poll, POLL_MS);

    return () => {
      if (sheetsTimerRef.current) clearTimeout(sheetsTimerRef.current);
      if (pollTimerRef.current)   clearInterval(pollTimerRef.current);
    };
  }, [load, refresh, poll]);

  return { rows, meta, loading, refreshing, error, needsAuth, refresh };
}
