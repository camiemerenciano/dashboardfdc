"use client";

import { useMemo, useState, useEffect } from "react";
import {
  FileText, ChevronUp, ChevronDown, ChevronsUpDown,
  Sparkles, Smile, Zap, RefreshCw, Clock, Webhook, LogIn,
  CircleDot, BarChart2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useSheetsPosts } from "@/hooks/use-sheets-posts";
import { useSBPostsVolume, type SBPostsVolumeRow, type SBDailyRow } from "@/hooks/use-sb-posts-volume";

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTENT_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  curiosidade: { label: "Curiosidade", color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20",   icon: Sparkles },
  motivação:   { label: "Motivação",   color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20",  icon: Zap      },
  meme:        { label: "Meme",        color: "text-pink-400",   bg: "bg-pink-500/10",   border: "border-pink-500/20",   icon: Smile    },
};

function cfgFor(tipo: string) {
  const key = tipo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return CONTENT_CFG[key] ?? CONTENT_CFG[Object.keys(CONTENT_CFG).find(k => k.startsWith(key.slice(0, 4))) ?? ""] ?? {
    label: tipo, color: "text-muted-foreground", bg: "bg-muted/10", border: "border-border/30", icon: FileText,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = "pagina" | "total" | string;
type SortDir = "asc" | "desc";

const WEEKS = 30 / 7;

interface RowData {
  pagina:     string;
  admin:      string;
  total:      number;
  perWeek:    number;
  byType:     Record<string, number>;
  types:      string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Sort header ──────────────────────────────────────────────────────────────

function SortTh({ label, sortKey, current, dir, onSort }: {
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
  return (
    <div className="space-y-8">
      <SBPostsVolumeSection />
    </div>
  );
}

function _UnusedPostsVolumePage() {
  const { rows, meta, loading, refreshing, error, needsAuth, refresh } = useSheetsPosts();
  const [adminFilter, setAdminFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  // Unique admins and all tipo_post values
  const admins    = useMemo(() => Array.from(new Set(rows.map(r => r.admin))).sort(), [rows]);
  const allTypes  = useMemo(() => Array.from(new Set(rows.map(r => r.tipo_post))).sort(), [rows]);

  // Filter by admin
  const filtered = useMemo(
    () => adminFilter ? rows.filter(r => r.admin === adminFilter) : rows,
    [rows, adminFilter],
  );

  // Aggregate by pagina
  const tableRows: RowData[] = useMemo(() => {
    const map = new Map<string, RowData>();
    for (const r of filtered) {
      const key = r.pagina;
      if (!map.has(key)) {
        map.set(key, { pagina: r.pagina, admin: r.admin, total: 0, perWeek: 0, byType: {}, types: [] });
      }
      const row = map.get(key)!;
      row.total += r.quantidade;
      row.byType[r.tipo_post] = (row.byType[r.tipo_post] ?? 0) + r.quantidade;
    }
    for (const row of map.values()) {
      row.perWeek = Math.round((row.total / WEEKS) * 10) / 10;
      row.types   = Object.keys(row.byType).sort();
    }
    return Array.from(map.values());
  }, [filtered]);

  // Total by tipo across all filtered rows
  const totalByType = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of filtered) {
      map[r.tipo_post] = (map[r.tipo_post] ?? 0) + r.quantidade;
    }
    return map;
  }, [filtered]);

  const grandTotal = Object.values(totalByType).reduce((s, n) => s + n, 0);
  const maxTotal   = Math.max(...tableRows.map(r => r.total), 1);

  const dominantType = useMemo(() => {
    let best: { tipo: string; count: number } | null = null;
    for (const [tipo, count] of Object.entries(totalByType)) {
      if (!best || count > best.count) best = { tipo, count };
    }
    return best;
  }, [totalByType]);

  const topPage = tableRows.reduce(
    (best, r) => (r.total > (best?.total ?? -1) ? r : best),
    null as RowData | null,
  );
  const avgPerPage = tableRows.length ? Math.round(grandTotal / tableRows.length) : 0;

  // Sort
  const sorted = useMemo(() => {
    const mul = sortDir === "asc" ? 1 : -1;
    return [...tableRows].sort((a, b) => {
      if (sortKey === "pagina") return mul * a.pagina.localeCompare(b.pagina);
      if (sortKey === "total")  return mul * (a.total - b.total);
      // sort by a specific tipo_post
      return mul * ((a.byType[sortKey] ?? 0) - (b.byType[sortKey] ?? 0));
    });
  }, [tableRows, sortKey, sortDir]);

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
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <p className="text-sm text-muted-foreground">Posts por página · n8n + Google Sheets</p>
              {meta?.last_n8n && (
                <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0 h-4">
                  <Webhook className="h-2.5 w-2.5" />n8n: {fmtDate(meta.last_n8n)}
                </Badge>
              )}
              {meta?.last_fetched && (
                <Badge variant="outline" className="gap-1 border-sky-500/30 bg-sky-500/10 text-sky-400 text-[10px] px-2 py-0 h-4">
                  <Clock className="h-2.5 w-2.5" />Sheets: {fmtDate(meta.last_fetched)}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start mt-1">
          <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs px-2">
            Google Sheets
          </Badge>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-xl border-border/60 text-xs font-medium h-8"
            onClick={refresh}
            disabled={refreshing || loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Atualizando…" : "Atualizar agora"}
          </Button>
        </div>
      </div>

      {/* Not yet authorized — show connect button */}
      {needsAuth && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-300">Google Sheets não conectado</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Autorize o acesso uma única vez para sincronizar a planilha.
            </p>
          </div>
          <a
            href="/api/sheets/auth"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold px-4 py-2 transition-colors shrink-0"
          >
            <LogIn className="h-3.5 w-3.5" />
            Conectar Google Sheets
          </a>
        </div>
      )}

      {/* Error */}
      {error && !needsAuth && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          {error}
        </div>
      )}

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

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-border/40 bg-card px-5 py-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />Carregando dados…
        </div>
      )}

      {/* Empty */}
      {!loading && grandTotal === 0 && !error && (
        <div className="rounded-2xl border border-border/40 bg-card px-5 py-10 text-center space-y-2">
          <RefreshCw className="h-8 w-8 text-muted-foreground/30 mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum dado ainda</p>
          <p className="text-xs text-muted-foreground/60">
            Verifique se a planilha está compartilhada publicamente e clique em{" "}
            <button onClick={refresh} className="font-medium text-primary hover:underline">Atualizar agora</button>.
          </p>
        </div>
      )}

      {!loading && grandTotal > 0 && (
        <>
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
                  <p className="text-[11px] text-muted-foreground mt-1 font-medium truncate">
                    Mais ativa: {topPage?.pagina}
                  </p>
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

          {/* Insight: dominant type + mix bar */}
          {dominantType && grandTotal > 0 && (
            <div className="card-lift rounded-2xl border border-border/40 bg-card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {(() => {
                    const cfg = cfgFor(dominantType.tipo);
                    const Icon = cfg.icon;
                    return (
                      <>
                        <div className={`${cfg.bg} rounded-xl p-2.5 shrink-0 border ${cfg.border}`}>
                          <Icon className={`h-4 w-4 ${cfg.color}`} />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Tipo dominante</p>
                          <p className="text-sm font-bold">
                            <span className={cfg.color}>{dominantType.tipo}</span>
                            {" "}<span className="text-muted-foreground font-normal">representa</span>{" "}
                            <span className="tabular-nums">{Math.round((dominantType.count / grandTotal) * 100)}%</span>
                            {" "}<span className="text-muted-foreground font-normal">dos posts publicados</span>
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Mix geral</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {Object.entries(totalByType).map(([t, n]) => `${n} ${t}`).join(" · ")}
                  </p>
                </div>
              </div>
              {/* Stacked mix bar */}
              <div className="flex h-2 rounded-full overflow-hidden gap-px">
                {allTypes.map((tipo, i) => {
                  const count = totalByType[tipo] ?? 0;
                  const pct   = grandTotal > 0 ? (count / grandTotal) * 100 : 0;
                  const colors = ["bg-blue-500/60", "bg-amber-500/60", "bg-pink-500/60", "bg-emerald-500/60", "bg-violet-500/60"];
                  return (
                    <div
                      key={tipo}
                      className={`${colors[i % colors.length]} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                      title={`${tipo}: ${count}`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-4 flex-wrap text-[10px] text-muted-foreground">
                {allTypes.map((tipo, i) => {
                  const count = totalByType[tipo] ?? 0;
                  const pct   = grandTotal > 0 ? Math.round((count / grandTotal) * 100) : 0;
                  const colors = ["bg-blue-500/60", "bg-amber-500/60", "bg-pink-500/60", "bg-emerald-500/60", "bg-violet-500/60"];
                  return (
                    <span key={tipo} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${colors[i % colors.length]}`} />
                      {tipo} {pct}%
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Table */}
          <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold">Posts por página</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tableRows.length} página{tableRows.length !== 1 ? "s" : ""} · {meta ? `${meta.row_count} linhas na planilha` : "Google Sheets"}
                </p>
              </div>
            </div>
            <Separator className="opacity-40" />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border/30 bg-muted/5">
                  <tr>
                    <SortTh label="Página"      sortKey="pagina" current={sortKey} dir={sortDir} onSort={handleSort} />
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Admin</th>
                    {allTypes.map(tipo => (
                      <SortTh key={tipo} label={tipo} sortKey={tipo} current={sortKey} dir={sortDir} onSort={handleSort} />
                    ))}
                    <SortTh label="Total"       sortKey="total"  current={sortKey} dir={sortDir} onSort={handleSort} />
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Posts/sem</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider min-w-[120px]">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {sorted.map((row, i) => {
                    const barWidth = Math.round((row.total / maxTotal) * 100);
                    return (
                      <tr key={row.pagina} className="hover:bg-muted/15 transition-colors">
                        {/* Page name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[11px] font-bold text-muted-foreground/40 tabular-nums w-4 shrink-0">{i+1}</span>
                            <p className="text-[13px] font-semibold">{row.pagina}</p>
                          </div>
                        </td>
                        {/* Admin */}
                        <td className="px-5 py-4">
                          <p className="text-[13px] text-muted-foreground">{row.admin}</p>
                        </td>
                        {/* Per-type counts */}
                        {allTypes.map(tipo => {
                          const cfg  = cfgFor(tipo);
                          const Icon = cfg.icon;
                          const n    = row.byType[tipo] ?? 0;
                          return (
                            <td key={tipo} className="px-5 py-4">
                              <div className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                                <Icon className="h-2.5 w-2.5" />
                                {n}
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
                    <td className="px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide" colSpan={2}>
                      Total
                    </td>
                    {allTypes.map(tipo => (
                      <td key={tipo} className="px-5 py-3 text-sm font-bold tabular-nums">
                        {totalByType[tipo] ?? 0}
                      </td>
                    ))}
                    <td className="px-5 py-3 text-sm font-bold tabular-nums">{grandTotal}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground tabular-nums">
                      {tableRows.length ? (grandTotal / WEEKS / tableRows.length).toFixed(1) : "—"}×
                    </td>
                    <td className="px-5 py-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Social Blade section ── */}
      <SBPostsVolumeSection />
    </div>
  );
}

// ─── Social Blade posts-volume section ───────────────────────────────────────

type SBSortKey = "displayName" | "total_posts" | "avg_per_day";
type SBSortDir = "asc" | "desc";

function SBSortTh({ label, sortKey, current, dir, onSort }: {
  label: string; sortKey: SBSortKey; current: SBSortKey; dir: SBSortDir;
  onSort: (k: SBSortKey) => void;
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

function fmtUpdated(iso: string | null): string {
  if (!iso) return "Nunca";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDay(iso: string): string {
  // iso is YYYY-MM-DD — parse as UTC to avoid timezone shift
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// ─── By-date view ─────────────────────────────────────────────────────────────

function SBByDateView({ dailyRows, adminFilter }: { dailyRows: SBDailyRow[]; adminFilter: string | null }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Set of ISO date strings that have data
  const datesWithData = useMemo(
    () => new Set(dailyRows.map(r => r.post_date)),
    [dailyRows],
  );

  // Set default to most recent date once data loads
  useEffect(() => {
    if (datesWithData.size > 0 && !selectedDate) {
      const latest = Array.from(datesWithData).sort().at(-1)!;
      const [y, m, d] = latest.split("-").map(Number);
      setSelectedDate(new Date(y, m - 1, d));
    }
  }, [datesWithData, selectedDate]);

  // Convert selected Date to ISO string (YYYY-MM-DD, local)
  const selectedIso = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    : null;

  const filtered = useMemo(() => {
    if (!selectedIso) return [];
    return dailyRows
      .filter(r => r.post_date === selectedIso && (!adminFilter || r.admin === adminFilter))
      .sort((a, b) => b.posts_count - a.posts_count);
  }, [dailyRows, selectedIso, adminFilter]);

  const totalOnDate = filtered.reduce((s, r) => s + r.posts_count, 0);

  if (datesWithData.size === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-card px-5 py-8 text-center text-sm text-muted-foreground">
        Nenhum dado por data disponível ainda.
      </div>
    );
  }

  // Dates with data as Date objects for the calendar modifiers
  const markedDates = Array.from(datesWithData).map(iso => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  });

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      {/* Calendar */}
      <div className="card-lift rounded-2xl border border-border/40 bg-card shrink-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          defaultMonth={selectedDate}
          modifiers={{ hasData: markedDates }}
          modifiersClassNames={{
            hasData: "after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary relative",
          }}
          disabled={(date) => {
            const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            return !datesWithData.has(iso);
          }}
        />
      </div>

      {/* Table for selected date */}
      <div className="flex-1 min-w-0">
        {selectedIso ? (
          <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold">Posts em {fmtDay(selectedIso)}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filtered.length} perfil{filtered.length !== 1 ? "s" : ""} · {totalOnDate} posts no total
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
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Posts</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider min-w-[120px]">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filtered.map((row, i) => {
                    const maxCount = filtered[0]?.posts_count ?? 1;
                    const barWidth = Math.round((row.posts_count / maxCount) * 100);
                    return (
                      <tr key={row.profile_id} className="hover:bg-muted/15 transition-colors">
                        <td className="px-5 py-3 text-[11px] text-muted-foreground/40 tabular-nums">{i + 1}</td>
                        <td className="px-5 py-3">
                          <p className="text-[13px] font-semibold">{row.displayName}</p>
                          <p className="text-[11px] text-muted-foreground">@{row.profile_id}</p>
                        </td>
                        <td className="px-5 py-3 text-[13px] text-muted-foreground">{row.admin || "—"}</td>
                        <td className="px-5 py-3">
                          <span className={`text-sm font-bold tabular-nums ${
                            row.posts_count >= 3 ? "text-emerald-400"
                            : row.posts_count >= 1 ? "text-foreground"
                            : "text-muted-foreground"
                          }`}>{row.posts_count}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-muted/30 min-w-[80px]">
                              <div
                                className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-500"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground tabular-nums w-6 text-right">{barWidth}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-sm text-muted-foreground">
                        Nenhum post nesta data{adminFilter ? ` para ${adminFilter}` : ""}.
                      </td>
                    </tr>
                  )}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-border/30 bg-muted/5">
                      <td colSpan={3} className="px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Total</td>
                      <td className="px-5 py-3 text-sm font-bold tabular-nums">{totalOnDate}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border/40 bg-card px-5 py-8 text-center text-sm text-muted-foreground">
            Selecione uma data no calendário.
          </div>
        )}
      </div>
    </div>
  );
}

function SBPostsVolumeSection() {
  const { rows, dailyRows, loading, refresh } = useSBPostsVolume();
  const [adminFilter,   setAdminFilter]   = useState<string | null>(null);
  const [view,          setView]          = useState<"total" | "pordata">("total");
  const [sortKey,       setSortKey]       = useState<SBSortKey>("total_posts");
  const [sortDir,       setSortDir]       = useState<SBSortDir>("desc");
  const [backfilling,   setBackfilling]   = useState(false);

  async function handleBackfill() {
    setBackfilling(true);
    try {
      await fetch("/api/sb-posts-volume/backfill", { method: "POST" });
      await refresh();
    } finally {
      setBackfilling(false);
    }
  }

  function handleSort(k: SBSortKey) {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  }

  const admins = useMemo(() => Array.from(new Set(rows.map(r => r.admin))).filter(Boolean).sort(), [rows]);

  const filtered = useMemo(
    () => adminFilter ? rows.filter(r => r.admin === adminFilter) : rows,
    [rows, adminFilter],
  );

  const sorted = useMemo(() => {
    const mul = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "displayName") return mul * a.displayName.localeCompare(b.displayName);
      return mul * (a[sortKey] - b[sortKey]);
    });
  }, [filtered, sortKey, sortDir]);

  const maxPosts = Math.max(...filtered.map(r => r.total_posts), 1);
  const grandTotal = filtered.reduce((s, r) => s + r.total_posts, 0);
  const topRow  = sorted[0];

  // Most recent last_updated across filtered rows
  const lastUpdated = filtered
    .map(r => r.last_updated)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;

  if (!loading && rows.length === 0) return null; // nothing yet — don't show section

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg">
            <BarChart2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight">Posts por Perfil · Social Blade</h2>
            <p className="text-[11px] text-muted-foreground">
              Derivado das consultas do Rastreador de Concorrentes
              {lastUpdated && ` · atualizado ${fmtUpdated(lastUpdated)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Backfill button — shown when fewer profiles than expected */}
          <button
            onClick={handleBackfill}
            disabled={backfilling}
            title="Reprocessar dados já salvos no banco, sem gastar créditos"
            className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-background/40 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${backfilling ? "animate-spin" : ""}`} />
            {backfilling ? "Reprocessando…" : "Reprocessar"}
          </button>
          {/* View toggle */}
          <div className="flex rounded-lg border border-border/40 overflow-hidden text-[11px] font-medium">
            <button
              onClick={() => setView("total")}
              className={`px-3 py-1.5 transition-colors ${view === "total" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Total
            </button>
            <button
              onClick={() => setView("pordata")}
              className={`px-3 py-1.5 transition-colors border-l border-border/40 ${view === "pordata" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Por data
            </button>
          </div>
          <Badge className="rounded-lg px-2 py-0.5 text-[10px] font-semibold bg-primary/15 text-primary border-primary/30">
            Social Blade
          </Badge>
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
            <button key={a} onClick={() => setAdminFilter(p => p === a ? null : a)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors border ${
                adminFilter === a
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-background/40 border-border/40 text-muted-foreground hover:text-foreground"
              }`}
            >{a}</button>
          ))}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-border/40 bg-card px-5 py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />Carregando dados do Social Blade…
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          {/* KPI strip */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            <div className="card-lift relative rounded-2xl border border-violet-500/20 bg-card overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] bg-violet-500" />
              <div className="relative flex items-center gap-3 p-5">
                <div className="bg-violet-500/10 rounded-xl p-2.5 shrink-0 border border-violet-500/20">
                  <FileText className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none tracking-tight tabular-nums">{grandTotal}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 font-medium">Posts registrados</p>
                </div>
              </div>
            </div>

            <div className="card-lift relative rounded-2xl border border-cyan-500/20 bg-card overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] bg-cyan-500" />
              <div className="relative flex items-center gap-3 p-5">
                <div className="bg-cyan-500/10 rounded-xl p-2.5 shrink-0 border border-cyan-500/20">
                  <ChevronUp className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold leading-none tracking-tight tabular-nums">{topRow?.total_posts ?? 0}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 font-medium truncate">
                    Mais ativo: {topRow?.displayName}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-lift relative rounded-2xl border border-border/40 bg-card overflow-hidden col-span-2 sm:col-span-1">
              <div className="relative flex items-center gap-3 p-5">
                <div className="bg-muted/40 rounded-xl p-2.5 shrink-0 border border-border/40">
                  <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none tracking-tight tabular-nums">{filtered.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 font-medium">Perfis com dados</p>
                </div>
              </div>
            </div>
          </div>

          {/* By-date view */}
          {view === "pordata" && (
            <SBByDateView dailyRows={dailyRows} adminFilter={adminFilter} />
          )}

          {/* Table (total view) */}
          {view === "total" && <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold">Posts por perfil</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Derivado de diferenças consecutivas no campo media do Social Blade
                </p>
              </div>
            </div>
            <Separator className="opacity-40" />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border/30 bg-muted/5">
                  <tr>
                    <SBSortTh label="Perfil"        sortKey="displayName" current={sortKey} dir={sortDir} onSort={handleSort} />
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Admin</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Plataforma</th>
                    <SBSortTh label="Total posts"   sortKey="total_posts" current={sortKey} dir={sortDir} onSort={handleSort} />
                    <SBSortTh label="Média/dia"      sortKey="avg_per_day" current={sortKey} dir={sortDir} onSort={handleSort} />
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Dias</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Última atualização</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider min-w-[120px]">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {sorted.map((row: SBPostsVolumeRow, i) => {
                    const isIG      = row.platform === "instagram";
                    const barWidth  = Math.round((row.total_posts / maxPosts) * 100);
                    const rateColor = row.avg_per_day >= 1 ? "text-emerald-400"
                                    : row.avg_per_day >= 0.3 ? "text-amber-400"
                                    : "text-muted-foreground";
                    return (
                      <tr key={row.profile_id} className="hover:bg-muted/15 transition-colors">
                        {/* Profile */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[11px] font-bold text-muted-foreground/40 tabular-nums w-4 shrink-0">{i+1}</span>
                            <div>
                              <p className="text-[13px] font-semibold">{row.displayName}</p>
                              <p className="text-[11px] text-muted-foreground">{row.pagina}</p>
                            </div>
                          </div>
                        </td>
                        {/* Admin */}
                        <td className="px-5 py-4">
                          <p className="text-[13px] text-muted-foreground">{row.admin || "—"}</p>
                        </td>
                        {/* Platform */}
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
                        {/* Total */}
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold tabular-nums">{row.total_posts}</span>
                        </td>
                        {/* Avg/day */}
                        <td className="px-5 py-4">
                          <span className={`text-sm font-semibold tabular-nums ${rateColor}`}>
                            {row.avg_per_day.toFixed(2)}/dia
                          </span>
                        </td>
                        {/* Days */}
                        <td className="px-5 py-4">
                          <span className="text-sm tabular-nums text-muted-foreground">{row.days_with_data}d</span>
                        </td>
                        {/* Last updated */}
                        <td className="px-5 py-4">
                          <span className="text-[11px] text-muted-foreground">{fmtUpdated(row.last_updated)}</span>
                        </td>
                        {/* Bar */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-muted/30 min-w-[80px]">
                              <div
                                className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-500"
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
              </table>
            </div>
          </div>}
        </>
      )}
    </div>
  );
}
