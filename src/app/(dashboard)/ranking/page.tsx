"use client";

import { useMemo, useState } from "react";
import { Trophy, TrendingUp, TrendingDown, CalendarDays, Users, FileText, ChevronDown, ChevronUp, Medal, Flame, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MOCK_PAGES, MOCK_DAILY_FOLLOWERS, MOCK_POSTS } from "@/lib/mock-data";
import { useFilters, resolvePageIds } from "@/lib/filter-context";
import { FiltersBar } from "@/components/filters-bar";

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY      = "2026-04-07";
const DAYS       = 30;

const WINDOW_END   = TODAY;
const WINDOW_START = (() => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - DAYS + 1);
  return d.toISOString().slice(0, 10);
})();
const CUTOFF_ISO   = (() => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - DAYS);
  return d.toISOString();
})();

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = "growth" | "avgPerDay";

interface RankRow {
  page_id:    string;
  name:       string;
  sector:     string;
  admin_name: string;
  growth:     number;   // total follower gain in window
  avgPerDay:  number;   // growth / DAYS
  posts:      number;   // posts published in window
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGrowth(pageId: string): number {
  const entries = MOCK_DAILY_FOLLOWERS
    .filter((f) => f.page_id === pageId)
    .sort((a, b) => a.date.localeCompare(b.date));

  const first = entries.filter((f) => f.date < WINDOW_START).at(-1)
             ?? entries.find((f) => f.date >= WINDOW_START);
  const last  = entries.filter((f) => f.date <= WINDOW_END).at(-1);

  if (!first || !last) return 0;
  return last.followers_count - first.followers_count;
}

function buildRows(): RankRow[] {
  return MOCK_PAGES.map((page) => {
    const growth    = getGrowth(page.id);
    const posts     = MOCK_POSTS.filter(
      (p) => p.page_id === page.id && p.published_at >= CUTOFF_ISO
    ).length;
    return {
      page_id:    page.id,
      name:       page.name,
      sector:     page.sector,
      admin_name: page.admin_name,
      growth,
      avgPerDay:  Math.round(growth / DAYS),
      posts,
    };
  });
}

// ─── Medal badge ──────────────────────────────────────────────────────────────

const MEDAL_CFG = [
  { bg: "bg-amber-400/15",  border: "border-amber-400/40",  text: "text-amber-300",  ring: "ring-1 ring-amber-400/30"  }, // 1st
  { bg: "bg-slate-400/10",  border: "border-slate-400/30",  text: "text-slate-300",  ring: "ring-1 ring-slate-400/20"  }, // 2nd
  { bg: "bg-orange-700/15", border: "border-orange-700/30", text: "text-orange-400", ring: "ring-1 ring-orange-700/20" }, // 3rd
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

// ─── Intensity badge ─────────────────────────────────────────────────────────

function IntensityBadge({ avgPerDay }: { avgPerDay: number }) {
  if (avgPerDay >= 200) return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-orange-500/15 border-orange-500/30 text-orange-400">
      <Flame className="h-2.5 w-2.5" />Em chamas
    </span>
  );
  if (avgPerDay >= 80) return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-emerald-500/15 border-emerald-500/30 text-emerald-400">
      <TrendingUp className="h-2.5 w-2.5" />Crescendo
    </span>
  );
  if (avgPerDay >= 30) return (
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

function RankingTable({
  rows,
  sortKey,
  onToggleSort,
}: {
  rows: RankRow[];
  sortKey: SortKey;
  onToggleSort: () => void;
}) {
  const sorted = useMemo(
    () => [...rows].sort((a, b) => b[sortKey] - a[sortKey]),
    [rows, sortKey]
  );

  const leader = sorted[0];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-border/30 bg-muted/5">
          <tr>
            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-12">#</th>
            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Página</th>
            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Admin</th>
            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Intensidade</th>
            <th
              onClick={onToggleSort}
              className={`px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider cursor-pointer select-none transition-colors whitespace-nowrap
                ${sortKey === "growth" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <div className="flex items-center gap-1">
                Crescimento total
                {sortKey === "growth"
                  ? <ChevronDown className="h-3 w-3 text-primary" />
                  : <ChevronUp   className="h-3 w-3 opacity-30" />}
              </div>
            </th>
            <th
              onClick={onToggleSort}
              className={`px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider cursor-pointer select-none transition-colors whitespace-nowrap
                ${sortKey === "avgPerDay" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <div className="flex items-center gap-1">
                Média / dia
                {sortKey === "avgPerDay"
                  ? <ChevronDown className="h-3 w-3 text-primary" />
                  : <ChevronUp   className="h-3 w-3 opacity-30" />}
              </div>
            </th>
            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Proj. 30d</th>
            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Posts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/20">
          {sorted.map((row, i) => {
            const rank    = i + 1;
            const isTop3  = rank <= 3;
            const gap     = leader && rank > 1 ? leader.growth - row.growth : 0;
            const proj30d = row.avgPerDay * 30;
            return (
              <tr
                key={row.page_id}
                className={`transition-colors ${isTop3 ? "hover:bg-primary/[0.03]" : "hover:bg-muted/15"}`}
              >
                {/* Rank */}
                <td className="px-5 py-4">
                  <RankBadge rank={rank} />
                </td>
                {/* Page */}
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-[13px] font-semibold ${isTop3 ? "text-foreground" : ""}`}>
                      {row.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground/60">{row.sector}</span>
                  </div>
                </td>
                {/* Admin */}
                <td className="px-5 py-4">
                  <span className="text-[13px] text-muted-foreground">{row.admin_name}</span>
                </td>
                {/* Intensity */}
                <td className="px-5 py-4">
                  <IntensityBadge avgPerDay={row.avgPerDay} />
                </td>
                {/* Growth */}
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className={`text-sm font-bold tabular-nums ${isTop3 ? "text-emerald-400" : "text-foreground"}`}>
                        +{row.growth.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    {rank > 1 && (
                      <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                        −{gap.toLocaleString("pt-BR")} vs líder
                      </span>
                    )}
                  </div>
                </td>
                {/* Avg/day */}
                <td className="px-5 py-4">
                  <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                    +{row.avgPerDay.toLocaleString("pt-BR")}/dia
                  </span>
                </td>
                {/* Projection */}
                <td className="px-5 py-4">
                  <span className="text-sm font-semibold tabular-nums text-indigo-400">
                    +{proj30d.toLocaleString("pt-BR")}
                  </span>
                </td>
                {/* Posts */}
                <td className="px-5 py-4">
                  <div className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums bg-sky-500/10 border-sky-500/20 text-sky-400">
                    <FileText className="h-2.5 w-2.5" />
                    {row.posts}
                  </div>
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
  const filters = useFilters();
  const [sortKey, setSortKey] = useState<SortKey>("growth");

  function toggleSort() {
    setSortKey((k) => (k === "growth" ? "avgPerDay" : "growth"));
  }

  // Apply page + admin filters; content type affects post count only
  const allowedPageIds = useMemo(() => resolvePageIds(filters, MOCK_PAGES), [filters]);

  const allRows = useMemo(() => {
    return buildRows().filter((r) => allowedPageIds.includes(r.page_id)).map((r) => {
      // Re-count posts respecting content-type filter
      if (filters.contentTypes.size === 0) return r;
      const posts = MOCK_POSTS.filter(
        (p) => p.page_id === r.page_id &&
               p.published_at >= CUTOFF_ISO &&
               filters.contentTypes.has(p.content_type)
      ).length;
      return { ...r, posts };
    });
  }, [allowedPageIds, filters.contentTypes]);

  // Group by sector
  const bySector = useMemo(() => {
    const map = new Map<string, RankRow[]>();
    for (const row of allRows) {
      const list = map.get(row.sector) ?? [];
      list.push(row);
      map.set(row.sector, list);
    }
    return Array.from(map.entries()).sort((a, b) => {
      const aMax = Math.max(...a[1].map((r) => r.growth));
      const bMax = Math.max(...b[1].map((r) => r.growth));
      return bMax - aMax;
    });
  }, [allRows]);

  // Summary KPIs
  const topRow      = [...allRows].sort((a, b) => b.growth - a.growth)[0];
  const totalGrowth = allRows.reduce((s, r) => s + r.growth, 0);
  const totalPosts  = allRows.reduce((s, r) => s + r.posts, 0);

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
              Melhores páginas por ganho de seguidores nos últimos 30 dias
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs px-2 self-start mt-1">
          30d
        </Badge>
      </div>

      {/* Filters */}
      <FiltersBar />

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
                +{topRow?.growth.toLocaleString("pt-BR") ?? "—"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium truncate">
                Líder: {topRow?.name}
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
              <p className="text-2xl font-bold leading-none tracking-tight tabular-nums">
                +{totalGrowth.toLocaleString("pt-BR")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium">Crescimento total</p>
            </div>
          </div>
        </div>

        <div className="card-lift relative rounded-2xl border border-sky-500/20 bg-card overflow-hidden col-span-2 sm:col-span-1">
          <div className="absolute inset-0 opacity-[0.03] bg-sky-500" />
          <div className="relative flex items-center gap-3 p-5">
            <div className="bg-sky-500/10 rounded-xl p-2.5 shrink-0 border border-sky-500/20">
              <FileText className="h-4 w-4 text-sky-400" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none tracking-tight tabular-nums">{totalPosts}</p>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium">Posts publicados</p>
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
              Todas as páginas · ordenar por{" "}
              <button onClick={toggleSort} className="text-primary underline underline-offset-2 font-medium">
                {sortKey === "growth" ? "crescimento total" : "média/dia"}
              </button>
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-muted/10 p-1">
            <button
              onClick={() => setSortKey("growth")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                sortKey === "growth"
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Total
            </button>
            <button
              onClick={() => setSortKey("avgPerDay")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                sortKey === "avgPerDay"
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Média/dia
            </button>
          </div>
        </div>
        <Separator className="opacity-40" />
        <RankingTable rows={allRows} sortKey={sortKey} onToggleSort={toggleSort} />
      </div>

      {/* ── Ranking por setor ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Ranking por Setor</h2>
          <span className="text-[11px] text-muted-foreground/50">— ordenado pelo maior crescimento do setor</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {bySector.map(([sector, rows]) => {
            const sectorRows = [...rows].sort((a, b) => b[sortKey] - a[sortKey]);
            return (
              <div key={sector} className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/30">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{sector}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
                    {rows.length} página{rows.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="divide-y divide-border/20">
                  {sectorRows.map((row, i) => {
                    const rank   = i + 1;
                    const isTop  = rank === 1;
                    return (
                      <div key={row.page_id} className={`flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/10`}>
                        <RankBadge rank={rank} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-semibold truncate ${isTop ? "text-foreground" : ""}`}>{row.name}</p>
                          <p className="text-[11px] text-muted-foreground/60 truncate">{row.admin_name}</p>
                        </div>
                        <div className="text-right shrink-0 space-y-0.5">
                          <p className={`text-sm font-bold tabular-nums ${isTop ? "text-emerald-400" : "text-foreground"}`}>
                            +{sortKey === "growth"
                              ? row.growth.toLocaleString("pt-BR")
                              : `${row.avgPerDay.toLocaleString("pt-BR")}/dia`}
                          </p>
                          <p className="text-[10px] text-muted-foreground tabular-nums">{row.posts} posts</p>
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
    </div>
  );
}
