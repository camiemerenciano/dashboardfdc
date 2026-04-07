"use client";

import { useMemo, useState, useEffect } from "react";
import { Users, TrendingUp, CalendarDays, ChevronDown, Zap, ArrowUp, ArrowDown, Minus } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MOCK_PAGES, MOCK_DAILY_FOLLOWERS } from "@/lib/mock-data";
import { useFilters, resolvePageIds } from "@/lib/filter-context";
import { FiltersBar } from "@/components/filters-bar";

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY = "2026-04-06";
const DAYS   = 30;

function subtractDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const WINDOW_START = subtractDays(TODAY, DAYS - 1);

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  const delta = payload[0].value;
  return (
    <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur px-3.5 py-2.5 text-xs shadow-2xl">
      <p className="mb-1.5 font-semibold text-muted-foreground text-[11px] uppercase tracking-wide">{label}</p>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full shrink-0 bg-[#818cf8]" />
        <span className="text-muted-foreground">Novos seguidores</span>
        <span className={`ml-auto font-bold tabular-nums ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {delta >= 0 ? "+" : ""}{delta.toLocaleString("pt-BR")}
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FollowersPage() {
  const filters = useFilters();

  const allowedPageIds = useMemo(() => resolvePageIds(filters, MOCK_PAGES), [filters]);
  const [pageId, setPageId] = useState<string>(allowedPageIds[0] ?? MOCK_PAGES[0].id);

  useEffect(() => {
    if (!allowedPageIds.includes(pageId)) {
      setPageId(allowedPageIds[0] ?? MOCK_PAGES[0].id);
    }
  }, [allowedPageIds, pageId]);

  const visiblePages = MOCK_PAGES.filter((p) => allowedPageIds.includes(p.id));

  const windowEntries = useMemo(() => {
    return MOCK_DAILY_FOLLOWERS
      .filter((f) => f.page_id === pageId && f.date >= WINDOW_START && f.date <= TODAY)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [pageId]);

  const entryBeforeWindow = useMemo(() => {
    return MOCK_DAILY_FOLLOWERS
      .filter((f) => f.page_id === pageId && f.date < WINDOW_START)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [pageId]);

  const chartData = useMemo(() => {
    return windowEntries.map((entry, i) => {
      const prev  = i === 0 ? entryBeforeWindow : windowEntries[i - 1];
      const delta = prev ? entry.followers_count - prev.followers_count : 0;
      const [, m, d] = entry.date.split("-");
      return { date: `${d}/${m}`, delta, total: entry.followers_count };
    });
  }, [windowEntries, entryBeforeWindow]);

  // Core KPIs
  const totalGain = useMemo(() => {
    if (windowEntries.length === 0) return 0;
    const first = entryBeforeWindow?.followers_count ?? windowEntries[0].followers_count;
    const last  = windowEntries[windowEntries.length - 1].followers_count;
    return last - first;
  }, [windowEntries, entryBeforeWindow]);

  const avgPerDay = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.round(chartData.reduce((s, d) => s + d.delta, 0) / chartData.length);
  }, [chartData]);

  const peakDay = useMemo(
    () => chartData.reduce((best, d) => (d.delta > best.delta ? d : best), chartData[0]),
    [chartData]
  );

  // Trend: first half avg vs second half avg
  const { trendLabel, trendIcon: TrendIcon, trendColor, trendSub } = useMemo(() => {
    if (chartData.length < 4) return { trendLabel: "—", trendIcon: Minus, trendColor: "text-muted-foreground", trendSub: "" };
    const mid   = Math.floor(chartData.length / 2);
    const avg1  = chartData.slice(0, mid).reduce((s, d) => s + d.delta, 0) / mid;
    const avg2  = chartData.slice(mid).reduce((s, d) => s + d.delta, 0) / (chartData.length - mid);
    const ratio = avg2 / (avg1 || 1);
    if (ratio > 1.15)  return { trendLabel: "Acelerando",    trendIcon: ArrowUp,   trendColor: "text-emerald-400", trendSub: `+${Math.round((ratio-1)*100)}% vs 1ª quinzena` };
    if (ratio < 0.85)  return { trendLabel: "Desacelerando", trendIcon: ArrowDown, trendColor: "text-red-400",     trendSub: `${Math.round((ratio-1)*100)}% vs 1ª quinzena` };
    return { trendLabel: "Estável",         trendIcon: Minus,     trendColor: "text-amber-400",  trendSub: "Crescimento constante no período" };
  }, [chartData]);

  // Best week (7-day rolling)
  const bestWeek = useMemo(() => {
    if (chartData.length < 7) return null;
    let best = { start: "", end: "", total: 0 };
    for (let i = 0; i <= chartData.length - 7; i++) {
      const week  = chartData.slice(i, i + 7);
      const total = week.reduce((s, d) => s + d.delta, 0);
      if (total > best.total) best = { start: week[0].date, end: week[6].date, total };
    }
    return best;
  }, [chartData]);

  const avgLine = avgPerDay;

  const selectedPage = MOCK_PAGES.find((p) => p.id === pageId)!;
  const axisStyle = { fontSize: 10, fill: "oklch(0.56 0.010 265)" };
  const gridStyle = { stroke: "oklch(1 0 0 / 5%)", strokeDasharray: "4 4" };

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
              <p className="text-sm text-muted-foreground">Evolução diária nos últimos 30 dias</p>
              <Badge variant="outline" className="gap-1.5 border-violet-500/30 bg-violet-500/10 text-violet-400 text-[10px] px-2 py-0 h-4">
                <CalendarDays className="h-2.5 w-2.5" />30d
              </Badge>
            </div>
          </div>
        </div>
        <div className="relative self-start">
          <select
            value={pageId}
            onChange={(e) => setPageId(e.target.value)}
            className="appearance-none h-9 rounded-xl border border-border/60 bg-card pl-3 pr-8 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            {visiblePages.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* Filters */}
      <FiltersBar />

      {/* KPI cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {/* Total gain */}
        <div className="card-lift relative rounded-2xl border border-violet-500/20 bg-card overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] bg-violet-500" />
          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-violet-500/10 rounded-xl p-2 shrink-0 border border-violet-500/20">
                <TrendingUp className="h-4 w-4 text-violet-400" />
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Ganho total</p>
            </div>
            <p className="text-2xl font-bold leading-none tracking-tight tabular-nums">
              {totalGain >= 0 ? "+" : ""}{totalGain.toLocaleString("pt-BR")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5">nos últimos 30 dias</p>
          </div>
        </div>

        {/* Avg/day */}
        <div className="card-lift relative rounded-2xl border border-indigo-500/20 bg-card overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] bg-indigo-500" />
          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-indigo-500/10 rounded-xl p-2 shrink-0 border border-indigo-500/20">
                <CalendarDays className="h-4 w-4 text-indigo-400" />
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Média/dia</p>
            </div>
            <p className="text-2xl font-bold leading-none tracking-tight tabular-nums">
              +{avgPerDay.toLocaleString("pt-BR")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5">seguidores por dia</p>
          </div>
        </div>

        {/* Trend */}
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

        {/* Total today */}
        <div className="card-lift relative rounded-2xl border border-border/40 bg-card overflow-hidden">
          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-muted/40 rounded-xl p-2 shrink-0 border border-border/40">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Total hoje</p>
            </div>
            <p className="text-2xl font-bold leading-none tracking-tight tabular-nums">
              {windowEntries.length > 0
                ? windowEntries[windowEntries.length - 1].followers_count.toLocaleString("pt-BR")
                : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5 truncate">{selectedPage.sector}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold">Novos seguidores por dia</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {WINDOW_START.split("-").reverse().join("/")} – {TODAY.split("-").reverse().join("/")} · linha tracejada = média diária ({avgLine}+/dia)
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0 text-right">
            {peakDay && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Pico</p>
                <p className="text-xs font-bold text-emerald-400 tabular-nums mt-0.5">
                  +{peakDay.delta.toLocaleString("pt-BR")} em {peakDay.date}
                </p>
              </div>
            )}
            {bestWeek && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Melhor semana</p>
                <p className="text-xs font-bold text-violet-400 tabular-nums mt-0.5">
                  +{bestWeek.total.toLocaleString("pt-BR")} ({bestWeek.start}–{bestWeek.end})
                </p>
              </div>
            )}
          </div>
        </div>
        <Separator className="opacity-40" />
        <div className="px-2 pb-4 pt-4">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="gFollowers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} {...gridStyle} />
              <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={42}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "oklch(1 0 0 / 8%)", strokeWidth: 1 }} />
              <ReferenceLine y={avgLine}
                stroke="#818cf8" strokeDasharray="4 3" strokeOpacity={0.4}
                label={{ value: `média`, position: "insideTopRight", fontSize: 9, fill: "oklch(0.56 0.010 265)", dy: -4 }} />
              <Area type="monotone" dataKey="delta" name="Novos seguidores"
                stroke="#818cf8" strokeWidth={2} fill="url(#gFollowers)"
                dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: "#818cf8" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground/50 text-center">
        Dados de <span className="font-medium text-muted-foreground/70">{selectedPage.name}</span> · administrado por {selectedPage.admin_name}
      </p>
    </div>
  );
}
