"use client";

import { useMemo, useState } from "react";
import {
  TrendingUp, Users, CircleDot, Zap, BarChart2, RefreshCw,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSocialBlade, type SBProfileData } from "@/hooks/use-socialblade";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("pt-BR");
}

function fmtShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string; payload?: { adminName?: string } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const adminName = payload[0]?.payload?.adminName;
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2.5 shadow-xl text-xs space-y-1 min-w-[120px]">
      <p className="font-semibold text-foreground mb-0.5 truncate max-w-[160px]">{label}</p>
      {adminName && (
        <p className="text-[10px] text-muted-foreground/70 mb-1">Admin: {adminName}</p>
      )}
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground truncate">{p.name}</span>
          <span className="font-bold tabular-nums" style={{ color: p.color }}>
            {fmtShort(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Platform breakdown card ──────────────────────────────────────────────────

function PlatformBreakdown({ profiles }: { profiles: SBProfileData[] }) {
  const withData = profiles.filter(p => p.latest != null);

  const ig = withData.filter(p => p.platform === "instagram");
  const tt = withData.filter(p => p.platform === "tiktok");

  const igFollowers = ig.reduce((s, p) => s + (p.latest?.followers ?? 0), 0);
  const ttFollowers = tt.reduce((s, p) => s + (p.latest?.followers ?? 0), 0);
  const total       = igFollowers + ttFollowers;

  const igWeekly = ig.reduce((s, p) => s + (p.latest?.weeklyGrowth ?? 0), 0);
  const ttWeekly = tt.reduce((s, p) => s + (p.latest?.weeklyGrowth ?? 0), 0);

  return (
    <Card className="card-lift rounded-2xl border-border/40">
      <CardHeader className="px-5 pt-5 pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-primary" />
          Por plataforma
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-4">
        {/* Instagram */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CircleDot className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-semibold">Instagram</span>
              <span className="text-[10px] text-muted-foreground">({ig.length} perfis)</span>
            </div>
            <span className="text-xs font-bold tabular-nums">{fmt(igFollowers)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
              style={{ width: total > 0 ? `${(igFollowers / total) * 100}%` : "0%" }}
            />
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className={igWeekly > 0 ? "text-emerald-400 font-semibold" : ""}>
              {igWeekly > 0 ? `+${fmt(igWeekly)}` : fmt(igWeekly)} esta semana
            </span>
          </div>
        </div>

        {/* TikTok */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs font-semibold">TikTok</span>
              <span className="text-[10px] text-muted-foreground">({tt.length} perfis)</span>
            </div>
            <span className="text-xs font-bold tabular-nums">{fmt(ttFollowers)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 transition-all"
              style={{ width: total > 0 ? `${(ttFollowers / total) * 100}%` : "0%" }}
            />
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className={ttWeekly > 0 ? "text-emerald-400 font-semibold" : ""}>
              {ttWeekly > 0 ? `+${fmt(ttWeekly)}` : fmt(ttWeekly)} esta semana
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Followers comparison bar chart ───────────────────────────────────────────

function FollowersChart({ profiles }: { profiles: SBProfileData[] }) {
  const data = useMemo(() =>
    profiles
      .filter(p => p.latest?.followers != null)
      .sort((a, b) => (b.latest!.followers ?? 0) - (a.latest!.followers ?? 0))
      .map(p => ({
        name:       `@${p.username}`,
        label:      p.displayName,
        seguidores: p.latest!.followers!,
        platform:   p.platform,
        adminName:  p.adminName,
      })),
    [profiles],
  );

  const colors = { instagram: "#8b5cf6", tiktok: "#06b6d4" };

  return (
    <Card className="card-lift rounded-2xl border-border/40">
      <CardHeader className="px-5 pt-5 pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Comparativo de seguidores
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">Todos os perfis · ordenado por total</p>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {data.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Sem dados ainda — atualize os perfis primeiro.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, data.length * 28)}>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickFormatter={fmtShort}
                axisLine={false} tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="seguidores" radius={[0, 4, 4, 0]} maxBarSize={18}>
                {data.map(entry => (
                  <Cell
                    key={entry.name}
                    fill={colors[entry.platform]}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Weekly growth chart ───────────────────────────────────────────────────────

function WeeklyGrowthChart({ profiles }: { profiles: SBProfileData[] }) {
  const data = useMemo(() =>
    profiles
      .filter(p => p.latest?.weeklyGrowth != null)
      .sort((a, b) => (b.latest!.weeklyGrowth ?? 0) - (a.latest!.weeklyGrowth ?? 0))
      .slice(0, 10)
      .map(p => ({
        name:        `@${p.username}`,
        crescimento: p.latest!.weeklyGrowth!,
        platform:    p.platform,
        adminName:   p.adminName,
      })),
    [profiles],
  );

  const colors = { instagram: "#34d399", tiktok: "#22d3ee" };

  return (
    <Card className="card-lift rounded-2xl border-border/40">
      <CardHeader className="px-5 pt-5 pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          Evolução semanal
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">Top 10 perfis por crescimento nos últimos 7 dias</p>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {data.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Sem dados ainda — atualize os perfis primeiro.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ left: 8, right: 12, top: 4, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                angle={-40} textAnchor="end" interval={0}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickFormatter={fmtShort}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="crescimento" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {data.map(entry => (
                  <Cell
                    key={entry.name}
                    fill={colors[entry.platform]}
                    fillOpacity={entry.crescimento > 0 ? 0.85 : 0.4}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {data.length > 0 && (
          <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-sm bg-emerald-400" />
              Instagram
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-sm bg-cyan-400" />
              TikTok
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function SBAnalyticsSection() {
  const { profiles, loading } = useSocialBlade();
  const [adminFilter, setAdminFilter] = useState<string | null>(null);

  const admins = useMemo(
    () => Array.from(new Set(profiles.map(p => p.adminName))).sort(),
    [profiles],
  );

  const filtered = adminFilter ? profiles.filter(p => p.adminName === adminFilter) : profiles;
  const withData = filtered.filter(p => p.latest != null);
  const totalFollowers = withData.reduce((s, p) => s + (p.latest?.followers ?? 0), 0);
  const totalWeekly    = withData.reduce((s, p) => s + (p.latest?.weeklyGrowth ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg">
            <Users className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight">Analytics Social Blade</h2>
            <p className="text-[11px] text-muted-foreground">
              {withData.length} de {profiles.length} perfis com dados
            </p>
          </div>
        </div>
        <Badge className="rounded-lg px-2 py-0.5 text-[10px] font-semibold bg-primary/15 text-primary border-primary/30">
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
                : "bg-background/40 border-border/40 text-muted-foreground hover:text-foreground hover:border-border/70"
            }`}
          >
            Todos
          </button>
          {admins.map(a => (
            <button
              key={a}
              onClick={() => setAdminFilter(prev => prev === a ? null : a)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors border ${
                adminFilter === a
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-background/40 border-border/40 text-muted-foreground hover:text-foreground hover:border-border/70"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-border/40 bg-card px-5 py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Carregando dados...
        </div>
      )}

      {!loading && withData.length === 0 && (
        <div className="rounded-2xl border border-border/40 bg-card px-5 py-8 text-center space-y-1.5">
          <RefreshCw className="h-6 w-6 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">Nenhum dado do Social Blade ainda</p>
          <p className="text-xs text-muted-foreground/60">
            Vá para <span className="font-medium text-foreground/60">Rastreador de Concorrentes</span> e atualize os perfis.
          </p>
        </div>
      )}

      {!loading && withData.length > 0 && (
        <>
          {/* Top KPIs */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="card-lift rounded-2xl border-border/40">
              <CardContent className="px-5 py-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shrink-0">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none tracking-tight tabular-nums">
                    {fmt(totalFollowers)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">Total de seguidores</p>
                </div>
              </CardContent>
            </Card>
            <Card className="card-lift rounded-2xl border-border/40">
              <CardContent className="px-5 py-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shrink-0">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className={`text-2xl font-bold leading-none tracking-tight tabular-nums ${totalWeekly > 0 ? "text-emerald-400" : ""}`}>
                    {totalWeekly > 0 ? `+${fmt(totalWeekly)}` : fmt(totalWeekly)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">Crescimento esta semana</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <PlatformBreakdown profiles={filtered} />
            </div>
            <div className="lg:col-span-2">
              <WeeklyGrowthChart profiles={filtered} />
            </div>
          </div>

          {/* Full followers comparison */}
          <FollowersChart profiles={filtered} />
        </>
      )}
    </div>
  );
}
