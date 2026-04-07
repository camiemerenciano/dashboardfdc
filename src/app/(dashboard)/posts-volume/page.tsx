"use client";

import { useMemo, useState } from "react";
import {
  FileText, ChevronUp, ChevronDown, ChevronsUpDown,
  Sparkles, Smile, Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MOCK_PAGES, MOCK_POSTS } from "@/lib/mock-data";
import type { ContentType } from "@/lib/types";
import { useFilters, resolvePageIds } from "@/lib/filter-context";
import { FiltersBar } from "@/components/filters-bar";

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY      = "2026-04-07";
const DAYS       = 30;
const CUTOFF     = new Date(TODAY);
CUTOFF.setDate(CUTOFF.getDate() - DAYS);
const CUTOFF_ISO = CUTOFF.toISOString(); // filter against published_at

// ─── Content-type config ──────────────────────────────────────────────────────

const CONTENT_CFG: Record<ContentType, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  curiosidade: { label: "Curiosidade", color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20",   icon: Sparkles },
  motivação:   { label: "Motivação",   color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20",  icon: Zap      },
  meme:        { label: "Meme",        color: "text-pink-400",   bg: "bg-pink-500/10",   border: "border-pink-500/20",   icon: Smile    },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = "name" | "total" | "curiosidade" | "motivação" | "meme";
type SortDir = "asc" | "desc";

const WEEKS = DAYS / 7;

interface RowData {
  page_id: string;
  name: string;
  sector: string;
  admin_name: string;
  total: number;
  curiosidade: number;
  motivação: number;
  meme: number;
  perWeek: number;
}

// ─── Sort header ──────────────────────────────────────────────────────────────

function SortTh({
  label, sortKey, current, dir, onSort,
}: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap"
    >
      <div className="flex items-center gap-1">
        {label}
        {active
          ? dir === "asc"
            ? <ChevronUp   className="h-3 w-3 text-primary" />
            : <ChevronDown className="h-3 w-3 text-primary" />
          : <ChevronsUpDown className="h-3 w-3 opacity-30" />}
      </div>
    </th>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PostsVolumePage() {
  const filters = useFilters();
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  // Resolve filter-allowed page IDs
  const allowedPageIds = useMemo(() => resolvePageIds(filters, MOCK_PAGES), [filters]);

  // Filter posts: window + global filters (page, admin, content type)
  const windowPosts = useMemo(() => {
    return MOCK_POSTS.filter((p) => {
      if (p.published_at < CUTOFF_ISO) return false;
      if (!allowedPageIds.includes(p.page_id)) return false;
      if (filters.contentTypes.size > 0 && !filters.contentTypes.has(p.content_type)) return false;
      return true;
    });
  }, [allowedPageIds, filters.contentTypes]);

  // Aggregate by page — only pages passing filters
  const rows: RowData[] = useMemo(() => {
    return MOCK_PAGES
      .filter((page) => allowedPageIds.includes(page.id))
      .map((page) => {
        const posts = windowPosts.filter((p) => p.page_id === page.id);
        return {
          page_id:    page.id,
          name:       page.name,
          sector:     page.sector,
          admin_name: page.admin_name,
          total:      posts.length,
          curiosidade: posts.filter((p) => p.content_type === "curiosidade").length,
          motivação:   posts.filter((p) => p.content_type === "motivação").length,
          meme:        posts.filter((p) => p.content_type === "meme").length,
          perWeek:     Math.round((posts.length / WEEKS) * 10) / 10,
        };
      });
  }, [windowPosts, allowedPageIds]);

  const sorted = useMemo(() => {
    const mul = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sortKey === "name") return mul * a.name.localeCompare(b.name);
      return mul * (a[sortKey] - b[sortKey]);
    });
  }, [rows, sortKey, sortDir]);

  const maxTotal = Math.max(...rows.map((r) => r.total), 1);
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);

  // Summary KPIs
  const topPage = rows.reduce((best, r) => (r.total > best.total ? r : best), rows[0]);
  const avgPerPage = rows.length ? Math.round(grandTotal / rows.length) : 0;

  // Dominant content type across all rows
  const totalCurio = rows.reduce((s, r) => s + r.curiosidade, 0);
  const totalMotiv = rows.reduce((s, r) => s + r.motivação, 0);
  const totalMeme  = rows.reduce((s, r) => s + r.meme, 0);
  const dominantType: { label: string; count: number; pct: number; cfg: typeof CONTENT_CFG[keyof typeof CONTENT_CFG] } = (() => {
    const candidates = [
      { label: "Curiosidade", count: totalCurio, cfg: CONTENT_CFG.curiosidade },
      { label: "Motivação",   count: totalMotiv, cfg: CONTENT_CFG.motivação   },
      { label: "Meme",        count: totalMeme,  cfg: CONTENT_CFG.meme        },
    ];
    const best = candidates.reduce((b, c) => (c.count > b.count ? c : b), candidates[0]);
    return { ...best, pct: grandTotal ? Math.round((best.count / grandTotal) * 100) : 0 };
  })();

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/25">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Volume de Publicações</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Posts por página nos últimos 30 dias</p>
          </div>
        </div>
        <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs px-2 self-start mt-1">
          30d
        </Badge>
      </div>

      {/* Filters */}
      <FiltersBar />

      {/* KPI strip */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        <div className="card-lift relative rounded-2xl border border-sky-500/20 bg-card overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] bg-sky-500" />
          <div className="relative flex items-center gap-3 p-5">
            <div className="bg-sky-500/10 rounded-xl p-2.5 shrink-0 border border-sky-500/20">
              <FileText className="h-4 w-4 text-sky-400" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none tracking-tight tabular-nums">{grandTotal}</p>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium">Total de posts</p>
            </div>
          </div>
        </div>

        <div className="card-lift relative rounded-2xl border border-violet-500/20 bg-card overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] bg-violet-500" />
          <div className="relative flex items-center gap-3 p-5">
            <div className="bg-violet-500/10 rounded-xl p-2.5 shrink-0 border border-violet-500/20">
              <ChevronUp className="h-4 w-4 text-violet-400" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none tracking-tight tabular-nums">{topPage?.total ?? 0}</p>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium truncate">Mais ativa: {topPage?.name}</p>
            </div>
          </div>
        </div>

        <div className="card-lift relative rounded-2xl border border-border/40 bg-card overflow-hidden col-span-2 sm:col-span-1">
          <div className="relative flex items-center gap-3 p-5">
            <div className="bg-muted/40 rounded-xl p-2.5 shrink-0 border border-border/40">
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none tracking-tight tabular-nums">{avgPerPage}</p>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium">Média por página</p>
            </div>
          </div>
        </div>
      </div>

      {/* Insight: dominant content type + mix bar */}
      {grandTotal > 0 && (
        <div className="card-lift rounded-2xl border border-border/40 bg-card p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`${dominantType.cfg.bg} rounded-xl p-2.5 shrink-0 border ${dominantType.cfg.border}`}>
                <dominantType.cfg.icon className={`h-4 w-4 ${dominantType.cfg.color}`} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Tipo dominante</p>
                <p className="text-sm font-bold">
                  <span className={dominantType.cfg.color}>{dominantType.label}</span>
                  {" "}<span className="text-muted-foreground font-normal">representa</span>{" "}
                  <span className="tabular-nums">{dominantType.pct}%</span>
                  {" "}<span className="text-muted-foreground font-normal">dos posts publicados no período</span>
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Mix geral</p>
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {totalCurio} curio · {totalMotiv} motiv · {totalMeme} meme
              </p>
            </div>
          </div>
          {/* Stacked mix bar */}
          <div className="flex h-2 rounded-full overflow-hidden gap-px">
            {grandTotal > 0 && (
              <>
                <div className="bg-blue-500/60  transition-all duration-500" style={{ width: `${(totalCurio/grandTotal)*100}%` }} title={`Curiosidade: ${totalCurio}`} />
                <div className="bg-amber-500/60 transition-all duration-500" style={{ width: `${(totalMotiv/grandTotal)*100}%` }} title={`Motivação: ${totalMotiv}`} />
                <div className="bg-pink-500/60  transition-all duration-500" style={{ width: `${(totalMeme/grandTotal)*100}%`  }} title={`Meme: ${totalMeme}`} />
              </>
            )}
          </div>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500/60" />Curiosidade {Math.round((totalCurio/grandTotal)*100)}%</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500/60" />Motivação {Math.round((totalMotiv/grandTotal)*100)}%</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-pink-500/60" />Meme {Math.round((totalMeme/grandTotal)*100)}%</span>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold">Posts por página</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {CUTOFF.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – {new Date(TODAY).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {MOCK_PAGES.length} páginas
            </p>
          </div>
        </div>
        <Separator className="opacity-40" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border/30 bg-muted/5">
              <tr>
                <SortTh label="Página"        sortKey="name"        current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Admin</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Setor</th>
                <SortTh label="Curiosidade"   sortKey="curiosidade" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Motivação"     sortKey="motivação"   current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Meme"          sortKey="meme"        current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Total (30d)"   sortKey="total"       current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Posts/sem</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider min-w-[120px]">Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {sorted.map((row, i) => {
                const barWidth = Math.round((row.total / maxTotal) * 100);
                const rank = i + 1;
                return (
                  <tr key={row.page_id} className="hover:bg-muted/15 transition-colors">
                    {/* Page name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-bold text-muted-foreground/40 tabular-nums w-4 shrink-0">{rank}</span>
                        <p className="text-[13px] font-semibold">{row.name}</p>
                      </div>
                    </td>
                    {/* Admin */}
                    <td className="px-5 py-4">
                      <p className="text-[13px] text-muted-foreground">{row.admin_name}</p>
                    </td>
                    {/* Sector */}
                    <td className="px-5 py-4">
                      <span className="text-[11px] font-medium text-muted-foreground border border-border/40 rounded-full px-2 py-0.5">
                        {row.sector}
                      </span>
                    </td>
                    {/* Per-type counts */}
                    {(["curiosidade", "motivação", "meme"] as ContentType[]).map((ct) => {
                      const cfg = CONTENT_CFG[ct];
                      const Icon = cfg.icon;
                      return (
                        <td key={ct} className="px-5 py-4">
                          <div className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                            <Icon className="h-2.5 w-2.5" />
                            {row[ct]}
                          </div>
                        </td>
                      );
                    })}
                    {/* Total */}
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold tabular-nums">{row.total}</span>
                    </td>
                    {/* Posts/week */}
                    <td className="px-5 py-4">
                      <span className={`text-sm font-semibold tabular-nums ${
                        row.perWeek >= 3 ? "text-emerald-400" : row.perWeek >= 1.5 ? "text-amber-400" : "text-muted-foreground"
                      }`}>{row.perWeek.toFixed(1)}×</span>
                    </td>
                    {/* Bar */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted/30 min-w-[80px]">
                          <div
                            className="h-1.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground tabular-nums w-6 text-right">{barWidth}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border/30 bg-muted/5">
                <td className="px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide" colSpan={3}>
                  Total
                </td>
                {(["curiosidade", "motivação", "meme"] as ContentType[]).map((ct) => (
                  <td key={ct} className="px-5 py-3 text-sm font-bold tabular-nums">
                    {rows.reduce((s, r) => s + r[ct], 0)}
                  </td>
                ))}
                <td className="px-5 py-3 text-sm font-bold tabular-nums">{grandTotal}</td>
                <td className="px-5 py-3 text-sm text-muted-foreground tabular-nums">
                  {(grandTotal / WEEKS / (rows.length || 1)).toFixed(1)}×
                </td>
                <td className="px-5 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
