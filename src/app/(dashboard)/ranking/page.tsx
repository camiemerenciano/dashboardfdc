"use client";

import { useMemo, useState } from "react";
import {
  Trophy, TrendingUp, TrendingDown, Users, ChevronDown, ChevronUp,
  Medal, Flame, Minus, CircleDot, Zap, RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSocialBlade, type SBProfileData } from "@/hooks/use-socialblade";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("pt-BR");
}

function fmtGrowth(n: number | null): string {
  if (n == null) return "—";
  return `${n >= 0 ? "+" : ""}${fmt(n)}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = "weeklyGrowth" | "monthlyGrowth" | "followers";

// ─── Medal badge ──────────────────────────────────────────────────────────────

const MEDAL_CFG = [
  { bg: "bg-amber-400/15",  border: "border-amber-400/40",  text: "text-amber-300",  ring: "ring-1 ring-amber-400/30"  },
  { bg: "bg-slate-400/10",  border: "border-slate-400/30",  text: "text-slate-300",  ring: "ring-1 ring-slate-400/20"  },
  { bg: "bg-orange-700/15", border: "border-orange-700/30", text: "text-orange-400", ring: "ring-1 ring-orange-700/20" },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const m = MEDAL_CFG[rank - 1];
    return (
      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${m.bg} ${m.border} border ${m.ring}`}>
        <Medal className={`h-3.5 w-3.5 ${m.text}`} />
      </div>
    );
  }
  return (
    <span className="h-7 w-7 flex items-center justify-center text-[12px] font-bold text-muted-foreground/40 tabular-nums shrink-0">
      {rank}
    </span>
  );
}

// ─── Intensity badge ──────────────────────────────────────────────────────────

function IntensityBadge({ weeklyGrowth }: { weeklyGrowth: number | null }) {
  if (weeklyGrowth == null) return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-muted/20 border-border/30 text-muted-foreground">
      <Minus className="h-2.5 w-2.5" />Sem dados
    </span>
  );
  const daily = weeklyGrowth / 7;
  if (daily >= 1000) return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-orange-500/15 border-orange-500/30 text-orange-400">
      <Flame className="h-2.5 w-2.5" />Em chamas
    </span>
  );
  if (daily >= 300) return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-emerald-500/15 border-emerald-500/30 text-emerald-400">
      <TrendingUp className="h-2.5 w-2.5" />Crescendo
    </span>
  );
  if (daily >= 50) return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-amber-500/15 border-amber-500/30 text-amber-400">
      <Minus className="h-2.5 w-2.5" />Estável
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-red-500/15 border-red-500/30 text-red-400">
      <TrendingDown className="h-2.5 w-2.5" />Lento
    </span>
  );
}

// ─── Ranking table ────────────────────────────────────────────────────────────

function RankingTable({ rows, sortKey, onToggleSort }: {
  rows: SBProfileData[];
  sortKey: SortKey;
  onToggleSort: () => void;
}) {
  const sorted = useMemo(
    () => [...rows].sort((a, b) =>
      ((b.latest?.[sortKey] ?? -Infinity) as number) - ((a.latest?.[sortKey] ?? -Infinity) as number)
    ),
    [rows, sortKey],
  );

  const leader = sorted[0];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-border/30 bg-muted/5">
          <tr>
            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-12">#</th>
            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Perfil</th>
            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Admin</th>
            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Plataforma</th>
            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Intensidade</th>
            <th
              onClick={onToggleSort}
              className={`px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider cursor-pointer select-none transition-colors whitespace-nowrap ${sortKey === "weeklyGrowth" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <div className="flex items-center gap-1">
                Crescimento 7d
                {sortKey === "weeklyGrowth" ? <ChevronDown className="h-3 w-3 text-primary" /> : <ChevronUp className="h-3 w-3 opacity-30" />}
              </div>
            </th>
            <th
              onClick={onToggleSort}
              className={`px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider cursor-pointer select-none transition-colors whitespace-nowrap ${sortKey === "monthlyGrowth" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <div className="flex items-center gap-1">
                Crescimento 30d
                {sortKey === "monthlyGrowth" ? <ChevronDown className="h-3 w-3 text-primary" /> : <ChevronUp className="h-3 w-3 opacity-30" />}
              </div>
            </th>
            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Seguidores</th>
            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Proj. 30d</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/20">
          {sorted.map((p, i) => {
            const rank    = i + 1;
            const isTop3  = rank <= 3;
            const s       = p.latest!;
            const gap     = leader?.latest?.weeklyGrowth != null && rank > 1 && s.weeklyGrowth != null
                            ? leader.latest.weeklyGrowth - s.weeklyGrowth : null;
            const proj30  = s.weeklyGrowth != null ? Math.round((s.weeklyGrowth / 7) * 30) : null;
            const isIG    = p.platform === "instagram";
            return (
              <tr key={p.id} className={`transition-colors ${isTop3 ? "hover:bg-primary/[0.03]" : "hover:bg-muted/15"}`}>
                <td className="px-5 py-4"><RankBadge rank={rank} /></td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-[13px] font-semibold ${isTop3 ? "text-foreground" : ""}`}>{p.displayName}</span>
                    <span className="text-[11px] text-muted-foreground/60">@{p.username}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[13px] text-muted-foreground">{p.adminName}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    isIG
                      ? "bg-violet-500/10 border-violet-500/20 text-violet-400"
                      : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                  }`}>
                    {isIG ? <CircleDot className="h-2.5 w-2.5" /> : <Zap className="h-2.5 w-2.5" />}
                    {isIG ? "Instagram" : "TikTok"}
                  </span>
                </td>
                <td className="px-5 py-4"><IntensityBadge weeklyGrowth={s.weeklyGrowth} /></td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className={`text-sm font-bold tabular-nums ${isTop3 ? "text-emerald-400" : "text-foreground"}`}>
                        {fmtGrowth(s.weeklyGrowth)}
                      </span>
                    </div>
                    {gap != null && (
                      <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                        −{fmt(gap)} vs líder
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                    {fmtGrowth(s.monthlyGrowth)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm font-semibold tabular-nums">{fmt(s.followers)}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm font-semibold tabular-nums text-indigo-400">
                    {proj30 != null ? `+${fmt(proj30)}` : "—"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RankingPage() {
  const { profiles, loading } = useSocialBlade();
  const [adminFilter, setAdminFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("weeklyGrowth");

  function toggleSort() {
    setSortKey(k => k === "weeklyGrowth" ? "monthlyGrowth" : "weeklyGrowth");
  }

  const admins = useMemo(
    () => Array.from(new Set(profiles.map(p => p.adminName))).sort(),
    [profiles],
  );

  const withData = useMemo(
    () => (adminFilter ? profiles.filter(p => p.adminName === adminFilter) : profiles)
          .filter(p => p.latest != null),
    [profiles, adminFilter],
  );

  // Summary KPIs
  const sorted = useMemo(
    () => [...withData].sort((a, b) =>
      ((b.latest?.weeklyGrowth ?? -Infinity)) - ((a.latest?.weeklyGrowth ?? -Infinity))
    ),
    [withData],
  );

  const topRow       = sorted[0];
  const totalWeekly  = withData.reduce((s, p) => s + (p.latest?.weeklyGrowth ?? 0), 0);
  const totalMonthly = withData.reduce((s, p) => s + (p.latest?.monthlyGrowth ?? 0), 0);

  // Group by admin
  const byAdmin = useMemo(() => {
    const map = new Map<string, SBProfileData[]>();
    for (const p of withData) {
      const list = map.get(p.adminName) ?? [];
      list.push(p);
      map.set(p.adminName, list);
    }
    return Array.from(map.entries()).sort((a, b) => {
      const aMax = Math.max(...a[1].map(p => p.latest?.weeklyGrowth ?? 0));
      const bMax = Math.max(...b[1].map(p => p.latest?.weeklyGrowth ?? 0));
      return bMax - aMax;
    });
  }, [withData]);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ranking de Crescimento</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Melhores perfis por ganho de seguidores · Social Blade
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs px-2 self-start mt-1">
          Social Blade
        </Badge>
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

      {/* Loading state */}
      {loading && (
        <div className="rounded-2xl border border-border/40 bg-card px-5 py-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />Carregando perfis…
        </div>
      )}

      {/* Empty state */}
      {!loading && withData.length === 0 && (
        <div className="rounded-2xl border border-border/40 bg-card px-5 py-10 text-center space-y-2">
          <RefreshCw className="h-8 w-8 text-muted-foreground/30 mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum dado ainda</p>
          <p className="text-xs text-muted-foreground/60">Atualize os perfis em <span className="font-medium text-foreground/60">Rastreador de Concorrentes</span>.</p>
        </div>
      )}

      {!loading && withData.length > 0 && (
        <>
          {/* KPI strip */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            <div className="card-lift relative rounded-2xl border border-amber-500/20 bg-card overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] bg-amber-500" />
              <div className="relative flex items-center gap-3 p-5">
                <div className="bg-amber-500/10 rounded-xl p-2.5 shrink-0 border border-amber-500/20">
                  <Trophy className="h-4 w-4 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold leading-none tracking-tight tabular-nums">
                    {fmtGrowth(topRow?.latest?.weeklyGrowth ?? null)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 font-medium truncate">
                    Líder 7d: {topRow?.displayName ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-lift relative rounded-2xl border border-emerald-500/20 bg-card overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] bg-emerald-500" />
              <div className="relative flex items-center gap-3 p-5">
                <div className="bg-emerald-500/10 rounded-xl p-2.5 shrink-0 border border-emerald-500/20">
                  <Users className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none tracking-tight tabular-nums text-emerald-400">
                    {fmtGrowth(totalWeekly)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 font-medium">Crescimento total 7d</p>
                </div>
              </div>
            </div>

            <div className="card-lift relative rounded-2xl border border-indigo-500/20 bg-card overflow-hidden col-span-2 sm:col-span-1">
              <div className="absolute inset-0 opacity-[0.03] bg-indigo-500" />
              <div className="relative flex items-center gap-3 p-5">
                <div className="bg-indigo-500/10 rounded-xl p-2.5 shrink-0 border border-indigo-500/20">
                  <TrendingUp className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none tracking-tight tabular-nums">
                    {fmtGrowth(totalMonthly)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 font-medium">Crescimento total 30d</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Ranking geral ── */}
          <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold">Ranking Geral</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {withData.length} perfis · ordenar por{" "}
                  <button onClick={toggleSort} className="text-primary underline underline-offset-2 font-medium">
                    {sortKey === "weeklyGrowth" ? "crescimento 7d" : "crescimento 30d"}
                  </button>
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-muted/10 p-1">
                <button
                  onClick={() => setSortKey("weeklyGrowth")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    sortKey === "weeklyGrowth"
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >7 dias</button>
                <button
                  onClick={() => setSortKey("monthlyGrowth")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    sortKey === "monthlyGrowth"
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >30 dias</button>
              </div>
            </div>
            <Separator className="opacity-40" />
            <RankingTable rows={withData} sortKey={sortKey} onToggleSort={toggleSort} />
          </div>

          {/* ── Ranking por admin ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Ranking por Admin</h2>
              <span className="text-[11px] text-muted-foreground/50">— ordenado pelo maior crescimento do admin</span>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {byAdmin.map(([adminName, rows]) => {
                const adminRows = [...rows]
                  .filter(p => p.latest != null)
                  .sort((a, b) => ((b.latest?.[sortKey] ?? -Infinity) as number) - ((a.latest?.[sortKey] ?? -Infinity) as number));
                return (
                  <div key={adminName} className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
                    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/30">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{adminName}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
                        {rows.length} perfil{rows.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="divide-y divide-border/20">
                      {adminRows.map((p, i) => {
                        const rank  = i + 1;
                        const isTop = rank === 1;
                        const isIG  = p.platform === "instagram";
                        return (
                          <div key={p.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/10 transition-colors">
                            <RankBadge rank={rank} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-[13px] font-semibold truncate ${isTop ? "text-foreground" : ""}`}>
                                {p.displayName}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] text-muted-foreground/60">@{p.username}</span>
                                <span className={`text-[9px] font-semibold ${isIG ? "text-violet-400" : "text-cyan-400"}`}>
                                  {isIG ? "IG" : "TT"}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0 space-y-0.5">
                              <p className={`text-sm font-bold tabular-nums ${isTop ? "text-emerald-400" : "text-foreground"}`}>
                                {sortKey === "weeklyGrowth"
                                  ? fmtGrowth(p.latest?.weeklyGrowth ?? null)
                                  : fmtGrowth(p.latest?.monthlyGrowth ?? null)}
                              </p>
                              <p className="text-[10px] text-muted-foreground tabular-nums">
                                {fmt(p.latest?.followers)} seg.
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
