"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types mirrored from the API response ────────────────────────────────────

export interface SBLatestSnapshot {
  id:             number;
  profileId:      string;
  fetchedAt:      string;
  followers:      number | null;
  following:      number | null;
  mediaCount:     number | null;
  avgLikes:       number | null;
  avgComments:    number | null;
  engagementRate: number | null;  // decimal, e.g. 0.05 = 5%
  weeklyGrowth:   number | null;
  monthlyGrowth:  number | null;
}

export interface SBProfileData {
  id:          string;
  username:    string;
  platform:    "instagram" | "tiktok";
  displayName: string;
  adminName:   string;
  lastUpdated: string | null;
  latest:      SBLatestSnapshot | null;
}

export interface UpdateResult {
  id:     string;
  ok:     boolean;
  error?: string;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSocialBlade() {
  const [profiles,  setProfiles]  = useState<SBProfileData[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [updating,  setUpdating]  = useState<Set<string>>(new Set());
  const [error,     setError]     = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/socialblade/data");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setProfiles(json.profiles ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateProfile = useCallback(async (profileId: string): Promise<UpdateResult[]> => {
    setUpdating(prev => new Set([...prev, profileId]));
    try {
      const res = await fetch("/api/socialblade/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      const json = await res.json();
      await fetchData();
      return json.results ?? [];
    } catch (e) {
      return [{ id: profileId, ok: false, error: e instanceof Error ? e.message : "Erro" }];
    } finally {
      setUpdating(prev => { const s = new Set(prev); s.delete(profileId); return s; });
    }
  }, [fetchData]);

  const updateAll = useCallback(async (ids: string[]): Promise<UpdateResult[]> => {
    setUpdating(new Set(ids));
    try {
      const res = await fetch("/api/socialblade/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileIds: ids }),
      });
      const json = await res.json();
      await fetchData();
      return json.results ?? [];
    } catch (e) {
      return ids.map(id => ({ id, ok: false, error: e instanceof Error ? e.message : "Erro" }));
    } finally {
      setUpdating(new Set());
    }
  }, [fetchData]);

  return {
    profiles,
    loading,
    updating,
    error,
    refresh: fetchData,
    updateProfile,
    updateAll,
  };
}
