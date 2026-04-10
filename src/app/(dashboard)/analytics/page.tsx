"use client";

import { useState, useMemo } from "react";
import {
  BarChart2, RefreshCw,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SBAnalyticsSection } from "@/components/sb-analytics-section";
import { useSocialBlade } from "@/hooks/use-socialblade";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) { return n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n); }

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur px-3.5 py-2.5 text-xs shadow-2xl">
      <p className="mb-2 font-semibold text-muted-foreground text-[11px] uppercase tracking-wide">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2.5 py-0.5">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto font-semibold text-foreground tabular-nums">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Follower growth chart — Social Blade data ────────────────────────────────

function SBFollowerGrowthChart() {
  const { profiles, loading } = useSocialBlade();
  const [adminFilter, setAdminFilter] = useState<string | null>(null);

  const admins = useMemo(
    () => Array.from(new Set(profiles.map(p => p.adminName))).sort(),
    [profiles],
  );

  const filtered = adminFilter ? profiles.filter(p => p.adminName === adminFilter) : profiles;

  const data = useMemo(() =>
    filtered
      .filter(p => p.platform === "instagram" && p.latest?.weeklyGrowth != null)
      .sort((a, b) => (b.latest!.weeklyGrowth ?? 0) - (a.latest!.weeklyGrowth ?? 0))
      .map(p => ({
        name:        `@${p.username}`,
        crescimento: p.latest!.weeklyGrowth!,
        adminName:   p.adminName,
      })),
    [filtered],
  );

  const axisStyle = { fontSize: 10, fill: "oklch(0.56 0.010 265)" };
  const gridStyle = { stroke: "oklch(1 0 0 / 5%)", strokeDasharray: "4 4" };

  const totalWeekly = data.reduce((s, d) => s + d.crescimento, 0);
  const topProfile  = data[0];

  return (
    <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
      <div className="px-5 py-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Crescimento de Seguidores</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {topProfile
              ? <>Pico: <span className="font-medium text-foreground">{topProfile.name}</span> com +{topProfile.crescimento.toLocaleString("pt-BR")} esta semana</>
              : "Dados do Social Blade — últimos 7 dias por perfil"}
          </p>
        </div>
        {admins.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setAdminFilter(null)}
              className={`rounded-lg px-2 py-0.5 text-[10px] font-medium transition-colors border ${
                adminFilter === null
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-background/40 border-border/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos
            </button>
            {admins.map(a => (
              <button
                key={a}
                onClick={() => setAdminFilter(prev => prev === a ? null : a)}
                className={`rounded-lg px-2 py-0.5 text-[10px] font-medium transition-colors border ${
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
      </div>
      <Separator className="opacity-40" />
      <div className="px-2 pb-4 pt-4">
        {loading && (
          <div className="flex items-center justify-center h-[210px] gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />Carregando…
          </div>
        )}
        {!loading && data.length === 0 && (
          <div className="flex items-center justify-center h-[210px] text-xs text-muted-foreground text-center px-4">
            Sem dados de crescimento.<br />Atualize os perfis em Rastreador de Concorrentes.
          </div>
        )}
        {!loading && data.length > 0 && (
          <>
            <div className="px-3 pb-2 text-[11px] text-muted-foreground">
              Total semanal: <span className="font-semibold text-foreground">+{totalWeekly.toLocaleString("pt-BR")}</span> seguidores em {data.length} perfis
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={data} margin={{ top: 4, right: 12, left: -8, bottom: 32 }} barCategoryGap="22%">
                <CartesianGrid vertical={false} {...gridStyle} />
                <XAxis
                  dataKey="name" tick={{ ...axisStyle, fontSize: 9 }} tickLine={false} axisLine={false}
                  angle={-45} textAnchor="end" interval={0}
                />
                <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={n => n >= 1000 ? `${(n/1000).toFixed(0)}k` : String(n)} width={36} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "oklch(1 0 0 / 3%)" }} />
                <Bar dataKey="crescimento" name="Novos seguidores (7d)" radius={[4,4,0,0]} maxBarSize={22}>
                  {data.map(entry => (
                    <Cell key={entry.name} fill={entry.crescimento >= 0 ? "#f472b6" : "#f87171"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
          <BarChart2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-muted-foreground">Dados do Social Blade</p>
            <Badge variant="outline" className="gap-1.5 border-violet-500/30 bg-violet-500/10 text-violet-400 text-[10px] px-2 py-0 h-4">
              Social Blade
            </Badge>
          </div>
        </div>
      </div>

      {/* Follower growth bar chart */}
      <SBFollowerGrowthChart />

      {/* Social Blade detailed analytics */}
      <SBAnalyticsSection />

    </div>
  );
}
