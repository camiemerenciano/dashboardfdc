"use client";

import { useState, useEffect, useCallback } from "react";

export interface SBPostsVolumeRow {
  profile_id:     string;
  pagina:         string;
  displayName:    string;
  admin:          string;
  platform:       "instagram" | "tiktok";
  last_updated:   string | null;
  total_posts:    number;
  days_with_data: number;
  avg_per_day:    number;
}

export interface SBDailyRow {
  profile_id:  string;
  post_date:   string;
  posts_count: number;
  admin:       string;
  displayName: string;
  platform:    "instagram" | "tiktok";
}

export function useSBPostsVolume() {
  const [rows,      setRows]      = useState<SBPostsVolumeRow[]>([]);
  const [dailyRows, setDailyRows] = useState<SBDailyRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [aggRes, dailyRes] = await Promise.all([
        fetch("/api/sb-posts-volume"),
        fetch("/api/sb-posts-volume?all=1"),
      ]);
      const aggJson   = await aggRes.json()   as { rows: SBPostsVolumeRow[] };
      const dailyJson = await dailyRes.json() as { rows: SBDailyRow[] };
      setRows(aggJson.rows ?? []);
      setDailyRows(dailyJson.rows ?? []);
      setError(null);
    } catch {
      setError("Erro ao carregar dados do Social Blade");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { rows, dailyRows, loading, error, refresh: load };
}
