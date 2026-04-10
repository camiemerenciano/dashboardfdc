"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users, TrendingUp, CalendarDays, ChevronDown,
  Zap, ArrowUp, ArrowDown, Minus, CircleDot, RefreshCw,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSocialBlade, type SBLatestSnapshot } from "@/hooks/use-socialblade";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("pt-BR");
}

function fmtShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function fmtDay(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function fmtEngRate(er: number | null): string {
  if (er == null) return "—";
  return `${(er * 100).toFixed(2)}%`;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FollowerDateRow {
  profile_id:  string;
  snap_date:   string;
  followers:   number;
  displayName: string;
  admin:       string;
  platform:    "instagram" | "tiktok";
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number; name: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur px-3.5 py-2.5 text-xs shadow-2xl">
      <p className="mb-1.5 font-semibold text-muted-foreground text-[11px] uppercase tracking-wide">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full shrink-0 bg-[#818cf8]" />
          <span className="text-muted-foreground">Seguidores</span>
          <span className="ml-auto font-bold tabular-nums text-[#818cf8]">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── By-date view ─────────────────────────────────────────────────────────────

function FollowersByDateView({ adminFilter }: { adminFilter: string | null }) {
  const [allRows,      setAllRows]      = useState<FollowerDateRow[]>([]);
  const [loadingRows,  setLoadingRows]  = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/socialblade/data?bydate=1")
      .then(r => r.json())
      .then(j => setAllRows(j.rows ?? []))
      .catch(() => {})
      .finally(() => setLoadingRows(false));
  }, []);

  // All distinct dates sorted newest-first
  const dates = useMemo(
    () => Array.from(new Set(allRows.map(r => r.snap_date))).sort().reverse(),
    [allRows],
  );

  // Auto-select most recent date
  useEffect(() => {
    if (dates.length > 0 && !selectedDate) setSelectedDate(dates[0]);
  }, [dates, selectedDate]);

  // Rows for selected date, filtered by admin
  const dateRows = useMemo(() => {
    if (!selectedDate) return [];
    return allRows
      .filter(r => r.snap_date === selectedDate && (!adminFilter || r.admin === adminFilter))
      .sort((a, b) => b.followers - a.followers);
  }, [allRows, selectedDate, adminFilter]);

  // Previous date for delta calculation (unfiltered by admin — same dates)
  const prevDate = useMemo(() => {
    if (!selectedDate) return null;
    const idx = dates.indexOf(selectedDate);
    return idx < dates.length - 1 ? dates[idx + 1] : null;
  }, [dates, selectedDate]);

  const prevMap = useMemo(() => {
    if (!prevDate) return new Map<string, number>();
    return new Map(
      allRows
        .filter(r => r.snap_date === prevDate)
        .map(r => [r.profile_id, r.followers]),
    );
  }, [allRows, prevDate]);

  const totalFollowers = dateRows.reduce((s, r) => s + r.followers, 0);
  const maxFollowers   = dateRows[0]?.followers ?? 1;

  if (loadingRows) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card px-5 py-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin" />Carregando histórico…
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card px-5 py-10 text-center space-y-2">
        <RefreshCw className="h-8 w-8 text-muted-foreground/30 mx-auto" />
        <p className="text-sm font-medium text-muted-foreground">Nenhum histórico ainda</p>
        <p className="text-xs text-muted-foreground/60">
          Atualize os perfis no <span className="font-medium text-foreground/60">Rastreador de Concorrentes</span> regularmente para acumular histórico.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date pills */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mr-1">Data:</span>
        {dates.map(d => (
          <button
            key={d}
            onClick={() => setSelectedDate(d)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors border ${
              selectedDate === d
                ? "bg-primary/20 border-primary/40 text-primary"
                : "bg-background/40 border-border/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            {fmtDay(d)}
          </button>
        ))}
      </div>

      {selectedDate && (
        <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold">Seguidores em {fmtDay(selectedDate)}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {dateRows.length} perfil{dateRows.length !== 1 ? "s" : ""} · total{" "}
                <span className="font-semibold text-foreground">{fmt(totalFollowers)}</span>
                {prevDate && <span className="text-muted-foreground/60"> · delta vs {fmtDay(prevDate)}</span>}
              </p>
            </div>
          </div>
          <Separator className="opacity-40" />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border/30 bg-muted/5">
                <tr>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">#</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Perfil</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Admin</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Seguidores</th>
                  {prevDate && (
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Δ vs {fmtDay(prevDate)}
                    </th>
                  )}
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider min-w-[120px]">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {dateRows.map((row, i) => {
                  const prev   = prevMap.get(row.profile_id) ?? null;
                  const delta  = prev != null ? row.followers - prev : null;
                  const barW   = Math.round((row.followers / maxFollowers) * 100);
                  const isIG   = row.platform === "instagram";
                  return (
                    <tr key={row.profile_id} className="hover:bg-muted/15 transition-colors">
                      <td className="px-5 py-3 text-[11px] text-muted-foreground/40 tabular-nums">{i + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center justify-center h-4 w-4 rounded-full shrink-0 ${isIG ? "bg-violet-500/20" : "bg-cyan-500/20"}`}>
                            {isIG
                              ? <CircleDot className="h-2.5 w-2.5 text-violet-400" />
                              : <Zap        className="h-2.5 w-2.5 text-cyan-400" />}
                          </span>
                          <div>
                            <p className="text-[13px] font-semibold">{row.displayName}</p>
                            <p className="text-[11px] text-muted-foreground">@{row.profile_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[13px] text-muted-foreground">{row.admin || "—"}</td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-bold tabular-nums">{fmt(row.followers)}</span>
                      </td>
                      {prevDate && (
                        <td className="px-5 py-3">
                          {delta == null ? (
                            <span className="text-[11px] text-muted-foreground/40">—</span>
                          ) : (
                            <span className={`text-sm font-semibold tabular-nums flex items-center gap-1 ${
                              delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-muted-foreground"
                            }`}>
                              {delta > 0 ? <ArrowUp className="h-3 w-3" /> : delta < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                              {delta > 0 ? "+" : ""}{fmt(delta)}
                            </span>
                          )}
                        </td>
                      )}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted/30 min-w-[80px]">
                            <div
                              className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                              style={{ width: `${barW}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground tabular-nums w-6 text-right">{barW}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {dateRows.length === 0 && (
                  <tr>
                    <td colSpan={prevDate ? 6 : 5} className="px-5 py-6 text-center text-sm text-muted-foreground">
                      Nenhum dado nesta data{adminFilter ? ` para ${adminFilter}` : ""}.
                    </td>
                  </tr>
                )}
              </tbody>
              {dateRows.length > 0 && (
                <tfoot>
                  <tr className="border-t border-border/30 bg-muted/5">
                    <td colSpan={3} className="px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Total</td>
                    <td className="px-5 py-3 text-sm font-bold tabular-nums">{fmt(totalFollowers)}</td>
                    {prevDate && (
                      <td className="px-5 py-3">
                        {(() => {
                          const totalDelta = dateRows.reduce((s, r) => {
                            const p = prevMap.get(r.profile_id);
                            return p != null ? s + (r.followers - p) : s;
                          }, 0);
                          return (
                            <span className={`text-sm font-bold tabular-nums flex items-center gap-1 ${totalDelta > 0 ? "text-emerald-400" : totalDelta < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                              {totalDelta > 0 ? "+" : ""}{fmt(totalDelta)}
                            </span>
                          );
                        })()}
                      </td>
                    )}
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared chart sub-component ───────────────────────────────────────────────

function FollowersChart({
  chartData, loading, title, subtitle, rightLabel,
}: {
  chartData: { date: string; followers: number }[];
  loading: boolean;
  title: string;
  subtitle: string;
  rightLabel?: string;
}) {
  const avg = chartData.length > 1
    ? Math.round(chartData.reduce((s, d) => s + d.followers, 0) / chartData.length)
    : null;

  const axisStyle = { fontSize: 10, fill: "oklch(0.56 0.010 265)" };
  const gridStyle = { stroke: "oklch(1 0 0 / 5%)", strokeDasharray: "4 4" };

  return (
    <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        {rightLabel && (
          <p className="text-xs font-bold mt-0.5 shrink-0">{rightLabel}</p>
        )}
      </div>
      <Separator className="opacity-40" />
      <div className="px-2 pb-4 pt-4">
        {loading && (
          <div className="flex items-center justify-center h-[210px] gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />Carregando histórico…
          </div>
        )}
        {!loading && chartData.length < 2 && (
          <div className="flex flex-col items-center justify-center h-[210px] gap-2 text-center px-6">
            <RefreshCw className="h-7 w-7 text-muted-foreground/25" />
            <p className="text-sm text-muted-foreground">
              {chartData.length === 1
                ? `${fmt(chartData[0].followers)} seguidores registrados em ${chartData[0].date}.`
                : "Nenhum dado registrado ainda."}
            </p>
            <p className="text-xs text-muted-foreground/60">Atualize os perfis regularmente para acumular histórico.</p>
          </div>
        )}
        {!loading && chartData.length >= 2 && (
          <>
            <div className="px-3 pb-2 text-[11px] text-muted-foreground">
              Variação total:{" "}
              <span className={`font-semibold ${chartData[chartData.length-1].followers - chartData[0].followers >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {chartData[chartData.length-1].followers - chartData[0].followers >= 0 ? "+" : ""}
                {fmt(chartData[chartData.length-1].followers - chartData[0].followers)}
              </span>{" "}
              desde a primeira amostra{avg != null ? ` · média ${fmt(avg)}` : ""}
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={chartData} margin={{ top: 4, right: 12, left: -4, bottom: 0 }}>
                <defs>
                  <linearGradient id="gFollowers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} {...gridStyle} />
                <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={50}
                  tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v/1_000).toFixed(0)}k` : String(v)} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "oklch(1 0 0 / 8%)", strokeWidth: 1 }} />
                {avg != null && (
                  <ReferenceLine y={avg}
                    stroke="#818cf8" strokeDasharray="4 3" strokeOpacity={0.4}
                    label={{ value: "média", position: "insideTopRight", fontSize: 9, fill: "oklch(0.56 0.010 265)", dy: -4 }} />
                )}
                <Area type="monotone" dataKey="followers" name="Seguidores"
                  stroke="#818cf8" strokeWidth={2} fill="url(#gFollowers)"
                  dot={{ r: 3, fill: "#818cf8", strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: "#818cf8" }} />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Per-profile chart view ────────────────────────────────────────────────────

const ALL = "__all__";

function FollowersByProfileView({
  profiles, loading, adminFilter,
}: {
  profiles: ReturnType<typeof useSocialBlade>["profiles"];
  loading: boolean;
  adminFilter: string | null;
}) {
  const [profileId,   setProfileId]   = useState<string>(ALL);
  const [history,     setHistory]     = useState<SBLatestSnapshot[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  // For "Todos" — per-date summed data fetched from bydate endpoint
  const [allDateRows,     setAllDateRows]     = useState<FollowerDateRow[]>([]);
  const [allDateLoading,  setAllDateLoading]  = useState(true);

  const filtered = adminFilter ? profiles.filter(p => p.adminName === adminFilter) : profiles;
  const withData = filtered.filter(p => p.latest != null);

  // Keep profileId valid when filter changes: stay on ALL or switch to first profile
  useEffect(() => {
    if (profileId !== ALL && !withData.find(p => p.id === profileId)) {
      setProfileId(ALL);
    }
  }, [withData, profileId]);

  // Fetch per-date data for aggregate view (load once)
  useEffect(() => {
    fetch("/api/socialblade/data?bydate=1")
      .then(r => r.json())
      .then(j => setAllDateRows(j.rows ?? []))
      .catch(() => {})
      .finally(() => setAllDateLoading(false));
  }, []);

  // Fetch snapshot history for a single profile
  useEffect(() => {
    if (profileId === ALL) { setHistory([]); return; }
    setHistLoading(true);
    fetch(`/api/socialblade/data?history=${profileId}`)
      .then(r => r.json())
      .then(j => setHistory((j.history ?? []).sort(
        (a: SBLatestSnapshot, b: SBLatestSnapshot) =>
          new Date(a.fetchedAt).getTime() - new Date(b.fetchedAt).getTime(),
      )))
      .catch(() => setHistory([]))
      .finally(() => setHistLoading(false));
  }, [profileId]);

  // IDs of filtered profiles (for aggregate calculations)
  const filteredIds = useMemo(() => new Set(withData.map(p => p.id)), [withData]);

  // ── Aggregate (Todos) derived values ──────────────────────────────────────
  const aggSnap = useMemo(() => {
    if (profileId !== ALL) return null;
    const snaps = withData.map(p => p.latest!);
    const totalFollowers  = snaps.reduce((s, sn) => s + (sn.followers  ?? 0), 0);
    const totalWeekly     = snaps.reduce((s, sn) => s + (sn.weeklyGrowth  ?? 0), 0);
    const totalMonthly    = snaps.reduce((s, sn) => s + (sn.monthlyGrowth ?? 0), 0);
    return { followers: totalFollowers, weeklyGrowth: totalWeekly, monthlyGrowth: totalMonthly };
  }, [profileId, withData]);

  // Aggregate chart: sum followers per day across filtered profiles
  const aggChartData = useMemo(() => {
    if (profileId !== ALL) return [];
    const byDate = new Map<string, number>();
    for (const row of allDateRows) {
      if (!filteredIds.has(row.profile_id)) continue;
      byDate.set(row.snap_date, (byDate.get(row.snap_date) ?? 0) + row.followers);
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([snap_date, followers]) => ({ date: fmtDay(snap_date), followers }));
  }, [profileId, allDateRows, filteredIds]);

  // ── Single-profile derived values ─────────────────────────────────────────
  const selectedProfile = filtered.find(p => p.id === profileId);
  const snap = selectedProfile?.latest;

  const singleChartData = useMemo(() =>
    history
      .filter(h => h.followers != null)
      .map(h => ({ date: fmtShortDate(h.fetchedAt), followers: h.followers! })),
    [history],
  );

  const { trendLabel, TrendIcon, trendColor, trendSub } = useMemo(() => {
    const data = profileId === ALL ? aggChartData : singleChartData;
    if (data.length < 4) return { trendLabel: "—", TrendIcon: Minus, trendColor: "text-muted-foreground", trendSub: "Poucas amostras para tendência" };
    const mid  = Math.floor(data.length / 2);
    const avg1 = data.slice(0, mid).reduce((s, d) => s + d.followers, 0) / mid;
    const avg2 = data.slice(mid).reduce((s, d) => s + d.followers, 0) / (data.length - mid);
    const ratio = avg2 / (avg1 || 1);
    if (ratio > 1.02) return { trendLabel: "Crescendo", TrendIcon: ArrowUp,   trendColor: "text-emerald-400", trendSub: `+${Math.round((ratio-1)*100)}% vs período anterior` };
    if (ratio < 0.98) return { trendLabel: "Caindo",    TrendIcon: ArrowDown, trendColor: "text-red-400",     trendSub: `${Math.round((ratio-1)*100)}% vs período anterior` };
    return               { trendLabel: "Estável",       TrendIcon: Minus,     trendColor: "text-amber-400",  trendSub: "Crescimento constante no histórico" };
  }, [profileId, aggChartData, singleChartData]);

  // Average daily gain: mean of consecutive diffs across chart points
  const avgDailyGain = useMemo(() => {
    const data = profileId === ALL ? aggChartData : singleChartData;
    if (data.length < 2) return null;
    const diffs = data.slice(1).map((d, i) => d.followers - data[i].followers);
    return Math.round(diffs.reduce((s, d) => s + d, 0) / diffs.length);
  }, [profileId, aggChartData, singleChartData]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card px-5 py-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin" />Carregando perfis…
      </div>
    );
  }

  if (withData.length === 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card px-5 py-10 text-center space-y-2">
        <RefreshCw className="h-8 w-8 text-muted-foreground/30 mx-auto" />
        <p className="text-sm font-medium text-muted-foreground">Nenhum dado ainda</p>
        <p className="text-xs text-muted-foreground/60">Atualize os perfis em <span className="font-medium text-foreground/60">Rastreador de Concorrentes</span>.</p>
      </div>
    );
  }

  const isAll = profileId === ALL;
  const displayFollowers  = isAll ? aggSnap!.followers      : snap?.followers      ?? null;
  const displayWeekly     = isAll ? aggSnap!.weeklyGrowth   : snap?.weeklyGrowth   ?? null;
  const displayMonthly    = isAll ? aggSnap!.monthlyGrowth  : snap?.monthlyGrowth  ?? null;
  const chartData         = isAll ? aggChartData            : singleChartData;
  const chartLoading      = isAll ? allDateLoading          : histLoading;

  return (
    <div className="space-y-6">
      {/* Selector row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Todos pill */}
        <button
          onClick={() => setProfileId(ALL)}
          className={`rounded-xl px-3.5 py-1.5 text-[12px] font-semibold transition-colors border ${
            isAll
              ? "bg-primary/20 border-primary/40 text-primary"
              : "bg-background/40 border-border/40 text-muted-foreground hover:text-foreground"
          }`}
        >
          Todos ({withData.length})
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <select
            value={isAll ? "" : profileId}
            onChange={e => e.target.value && setProfileId(e.target.value)}
            className={`appearance-none h-9 rounded-xl border pl-3 pr-8 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer ${
              !isAll
                ? "bg-primary/10 border-primary/40 text-primary"
                : "bg-card border-border/60 text-muted-foreground"
            }`}
          >
            <option value="" disabled>Selecionar página…</option>
            {withData.map(p => (
              <option key={p.id} value={p.id}>{p.displayName} (@{p.username})</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <div className="card-lift relative rounded-2xl border border-violet-500/20 bg-card overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] bg-violet-500" />
          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-violet-500/10 rounded-xl p-2 shrink-0 border border-violet-500/20">
                <Users className="h-4 w-4 text-violet-400" />
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                {isAll ? "Total seguidores" : "Seguidores"}
              </p>
            </div>
            <p className="text-2xl font-bold leading-none tracking-tight tabular-nums">{fmt(displayFollowers)}</p>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {isAll ? `${withData.length} perfis somados` : "total atual"}
            </p>
          </div>
        </div>

        <div className="card-lift relative rounded-2xl border border-indigo-500/20 bg-card overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] bg-indigo-500" />
          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-indigo-500/10 rounded-xl p-2 shrink-0 border border-indigo-500/20">
                <CalendarDays className="h-4 w-4 text-indigo-400" />
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Últ. 7 dias</p>
            </div>
            <p className={`text-2xl font-bold leading-none tracking-tight tabular-nums ${displayWeekly != null && displayWeekly >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {displayWeekly != null ? `${displayWeekly >= 0 ? "+" : ""}${fmt(displayWeekly)}` : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5">novos seguidores</p>
          </div>
        </div>

        <div className="card-lift relative rounded-2xl border border-border/40 bg-card overflow-hidden">
          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-muted/40 rounded-xl p-2 shrink-0 border border-border/40">
                <Zap className={`h-4 w-4 ${trendColor}`} />
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Tendência</p>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendIcon className={`h-4 w-4 ${trendColor} shrink-0`} />
              <p className={`text-2xl font-bold leading-none tracking-tight ${trendColor}`}>{trendLabel}</p>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">{trendSub}</p>
          </div>
        </div>

        <div className="card-lift relative rounded-2xl border border-border/40 bg-card overflow-hidden">
          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-muted/40 rounded-xl p-2 shrink-0 border border-border/40">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                {isAll ? "Últ. 30 dias" : "Engajamento"}
              </p>
            </div>
            {isAll ? (
              <>
                <p className={`text-2xl font-bold leading-none tracking-tight tabular-nums ${displayMonthly != null && displayMonthly >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {displayMonthly != null ? `${displayMonthly >= 0 ? "+" : ""}${fmt(displayMonthly)}` : "—"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1.5">novos seguidores (soma)</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold leading-none tracking-tight tabular-nums">{fmtEngRate(snap?.engagementRate ?? null)}</p>
                <div className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <CircleDot className={`h-2.5 w-2.5 ${selectedProfile?.platform === "instagram" ? "text-violet-400" : "text-cyan-400"}`} />
                  {selectedProfile?.platform === "instagram" ? "Instagram" : "TikTok"}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Avg daily gain */}
        <div className="card-lift relative rounded-2xl border border-emerald-500/20 bg-card overflow-hidden col-span-2 sm:col-span-1">
          <div className="absolute inset-0 opacity-[0.03] bg-emerald-500" />
          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-emerald-500/10 rounded-xl p-2 shrink-0 border border-emerald-500/20">
                <ArrowUp className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Média/atualização</p>
            </div>
            {avgDailyGain == null ? (
              <p className="text-2xl font-bold leading-none tracking-tight tabular-nums text-muted-foreground">—</p>
            ) : (
              <p className={`text-2xl font-bold leading-none tracking-tight tabular-nums ${avgDailyGain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {avgDailyGain >= 0 ? "+" : ""}{fmt(avgDailyGain)}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {avgDailyGain == null
                ? "poucas amostras"
                : `média entre ${(profileId === ALL ? aggChartData : singleChartData).length - 1} registro${(profileId === ALL ? aggChartData : singleChartData).length - 1 !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <FollowersChart
        chartData={chartData}
        loading={chartLoading}
        title="Histórico de Seguidores"
        subtitle={
          isAll
            ? `${withData.length} perfis · soma total de seguidores por data`
            : `${selectedProfile?.displayName} · ${singleChartData.length} amostra${singleChartData.length !== 1 ? "s" : ""} registrada${singleChartData.length !== 1 ? "s" : ""}`
        }
        rightLabel={!isAll && selectedProfile ? selectedProfile.adminName : undefined}
      />

      {!isAll && selectedProfile && (
        <p className="text-[11px] text-muted-foreground/50 text-center">
          @{selectedProfile.username} · {selectedProfile.platform} · administrado por{" "}
          <span className="font-medium text-muted-foreground/70">{selectedProfile.adminName}</span>
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FollowersPage() {
  const { profiles, loading } = useSocialBlade();
  const [adminFilter, setAdminFilter] = useState<string | null>(null);
  const [view,        setView]        = useState<"perfil" | "pordata">("perfil");

  const admins = useMemo(
    () => Array.from(new Set(profiles.map(p => p.adminName))).sort(),
    [profiles],
  );

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Crescimento de Seguidores</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-muted-foreground">Dados do Social Blade por perfil</p>
              <Badge variant="outline" className="gap-1.5 border-violet-500/30 bg-violet-500/10 text-violet-400 text-[10px] px-2 py-0 h-4">
                <CalendarDays className="h-2.5 w-2.5" />Social Blade
              </Badge>
            </div>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex rounded-lg border border-border/40 overflow-hidden text-[11px] font-medium self-start">
          <button
            onClick={() => setView("perfil")}
            className={`px-3.5 py-2 transition-colors ${view === "perfil" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Por perfil
          </button>
          <button
            onClick={() => setView("pordata")}
            className={`px-3.5 py-2 transition-colors border-l border-border/40 ${view === "pordata" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Por data
          </button>
        </div>
      </div>

      {/* Admin filter pills */}
      {admins.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setAdminFilter(null)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors border ${
              adminFilter === null
                ? "bg-primary/20 border-primary/40 text-primary"
                : "bg-background/40 border-border/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos
          </button>
          {admins.map(a => (
            <button key={a} onClick={() => setAdminFilter(prev => prev === a ? null : a)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors border ${
                adminFilter === a
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-background/40 border-border/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {view === "perfil" && (
        <FollowersByProfileView profiles={profiles} loading={loading} adminFilter={adminFilter} />
      )}

      {view === "pordata" && (
        <FollowersByDateView adminFilter={adminFilter} />
      )}
    </div>
  );
}
