"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw, AlertTriangle, CircleDot, Zap, TrendingUp, TrendingDown,
  Minus, Clock, Users, BarChart2, Calendar, CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useSocialBlade, type SBProfileData } from "@/hooks/use-socialblade";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("pt-BR");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "Nunca";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtEngRate(er: number | null): string {
  if (er == null) return "—";
  return `${(er * 100).toFixed(2)}%`;
}

function growthColor(g: number | null) {
  if (g == null) return "text-muted-foreground";
  if (g > 0)     return "text-emerald-400";
  if (g < 0)     return "text-red-400";
  return "text-muted-foreground";
}

function GrowthIcon({ g }: { g: number | null }) {
  if (g == null) return <Minus className="h-3 w-3 text-muted-foreground" />;
  if (g > 0)     return <TrendingUp   className="h-3 w-3 text-emerald-400" />;
  if (g < 0)     return <TrendingDown className="h-3 w-3 text-red-400" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

// ─── Profile card ─────────────────────────────────────────────────────────────

function ProfileCard({
  profile, isUpdating, onUpdate,
}: {
  profile: SBProfileData;
  isUpdating: boolean;
  onUpdate: (id: string) => void;
}) {
  const snap = profile.latest;
  const isIG = profile.platform === "instagram";
  const PIcon = isIG ? CircleDot : Zap;
  const platformColor = isIG ? "text-violet-400" : "text-cyan-400";
  const platformBg    = isIG ? "bg-violet-500/15 border-violet-500/30" : "bg-cyan-500/15 border-cyan-500/30";

  const er = fmtEngRate(snap?.engagementRate ?? null);

  return (
    <div className="card-lift rounded-2xl border border-border/40 bg-card p-4 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Badge className={`shrink-0 flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold border ${platformBg} ${platformColor}`}>
            <PIcon className="h-2.5 w-2.5" />
            {isIG ? "Instagram" : "TikTok"}
          </Badge>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{profile.displayName}</p>
            <p className="text-[11px] text-muted-foreground">@{profile.username}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">Admin: {profile.adminName}</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 shrink-0 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary"
          onClick={() => onUpdate(profile.id)}
          disabled={isUpdating}
          title="Atualizar dados"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isUpdating ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-background/40 px-2.5 py-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Users className="h-3 w-3 text-muted-foreground" />
          </div>
          <p className="text-sm font-bold tabular-nums">{fmt(snap?.followers)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Seguidores</p>
        </div>
        <div className="rounded-xl bg-background/40 px-2.5 py-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <GrowthIcon g={snap?.weeklyGrowth ?? null} />
          </div>
          <p className={`text-sm font-bold tabular-nums ${growthColor(snap?.weeklyGrowth ?? null)}`}>
            {snap?.weeklyGrowth != null
              ? `${snap.weeklyGrowth > 0 ? "+" : ""}${fmt(snap.weeklyGrowth)}`
              : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Últ. 7 dias</p>
        </div>
        <div className="rounded-xl bg-background/40 px-2.5 py-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <BarChart2 className="h-3 w-3 text-muted-foreground" />
          </div>
          <p className="text-sm font-bold tabular-nums">{er}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Engajamento</p>
        </div>
      </div>

      {/* Last updated */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Clock className="h-3 w-3 shrink-0" />
        <span>Atualizado: {fmtDate(profile.lastUpdated)}</span>
      </div>
    </div>
  );
}

// ─── Confirm all dialog ───────────────────────────────────────────────────────

function ConfirmAllDialog({
  open, count, onConfirm, onCancel,
}: {
  open: boolean;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onCancel()}>
      <DialogContent className="sm:max-w-sm bg-card border-border/60 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-[15px] font-semibold">
            <div className="h-6 w-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            </div>
            Confirmar atualização em massa
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Isso irá consultar a API do Social Blade para todos os
            <span className="font-semibold text-foreground"> {count} perfis</span>,
            consumindo <span className="font-semibold text-amber-400">{count} créditos</span>.
          </p>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-3 text-xs text-amber-300/80 leading-relaxed">
            <AlertTriangle className="h-3 w-3 inline mr-1.5 mb-0.5" />
            Cada perfil consome 1 crédito da API. Use com moderação.
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            className="gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-semibold border-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Confirmar ({count} créditos)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Schedule dialog ──────────────────────────────────────────────────────────

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface Schedule {
  enabled:    boolean;
  timeHHMM:   string;
  daysOfWeek: number[];
  lastRunDate: string | null;
}

function ScheduleDialog({ onClose }: { onClose: () => void }) {
  const [schedule, setSchedule] = useState<Schedule>({
    enabled: false, timeHHMM: "08:00", daysOfWeek: [1,2,3,4,5], lastRunDate: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    fetch("/api/schedule")
      .then(r => r.json())
      .then((s: Schedule) => { setSchedule(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function toggleDay(d: number) {
    setSchedule(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(d)
        ? prev.daysOfWeek.filter(x => x !== d)
        : [...prev.daysOfWeek, d].sort(),
    }));
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/schedule", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        enabled:    schedule.enabled,
        timeHHMM:   schedule.timeHHMM,
        daysOfWeek: schedule.daysOfWeek,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  }

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-sm bg-card border-border/60 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-[15px] font-semibold">
            <div className="h-6 w-6 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <CalendarClock className="h-3.5 w-3.5 text-primary" />
            </div>
            Agendar atualização automática
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-6 flex justify-center">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5 py-1">
            {/* Enable toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Ativar agendamento</p>
                <p className="text-xs text-muted-foreground mt-0.5">Todos os perfis serão atualizados automaticamente</p>
              </div>
              <button
                onClick={() => setSchedule(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors border ${
                  schedule.enabled ? "bg-primary border-primary/60" : "bg-muted/40 border-border/60"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  schedule.enabled ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>

            <Separator className="opacity-40" />

            {/* Time picker */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Horário
              </label>
              <input
                type="time"
                value={schedule.timeHHMM}
                onChange={e => setSchedule(prev => ({ ...prev, timeHHMM: e.target.value }))}
                disabled={!schedule.enabled}
                className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-40"
              />
            </div>

            {/* Days of week */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Dias da semana
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {DAY_LABELS.map((label, i) => (
                  <button
                    key={i}
                    disabled={!schedule.enabled}
                    onClick={() => toggleDay(i)}
                    className={`h-8 w-10 rounded-lg text-[11px] font-semibold transition-colors border disabled:opacity-40 ${
                      schedule.daysOfWeek.includes(i)
                        ? "bg-primary/20 border-primary/50 text-primary"
                        : "bg-background/40 border-border/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Last run info */}
            {schedule.lastRunDate && (
              <div className="rounded-xl border border-border/30 bg-muted/10 px-3 py-2.5 text-[11px] text-muted-foreground flex items-center gap-2">
                <Clock className="h-3 w-3 shrink-0" />
                Última execução: <span className="font-medium text-foreground">{schedule.lastRunDate}</span>
              </div>
            )}

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-300/80 leading-relaxed">
              <AlertTriangle className="h-3 w-3 inline mr-1.5 mb-0.5" />
              Cada execução consome créditos por perfil da API. Use com moderação.
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || loading}
            className="gap-1.5 rounded-lg"
          >
            {saved ? "Salvo ✓" : saving ? "Salvando…" : "Salvar agendamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function SBProfilesSection() {
  const { profiles, loading, updating, updateProfile, updateAll } = useSocialBlade();
  const [confirmAll,   setConfirmAll]   = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [adminFilter,  setAdminFilter]  = useState<string | null>(null);

  const allIds = profiles.map(p => p.id);

  async function handleUpdateAll() {
    setConfirmAll(false);
    await updateAll(allIds);
  }

  const admins = Array.from(new Set(profiles.map(p => p.adminName))).sort();
  const filtered = adminFilter ? profiles.filter(p => p.adminName === adminFilter) : profiles;

  const igProfiles  = filtered.filter(p => p.platform === "instagram");
  const ttProfiles  = filtered.filter(p => p.platform === "tiktok");

  // Summary stats
  const withData   = profiles.filter(p => p.latest != null);
  const totalFollowers = withData.reduce((s, p) => s + (p.latest?.followers ?? 0), 0);
  const totalWeekly    = withData.reduce((s, p) => s + (p.latest?.weeklyGrowth ?? 0), 0);
  const anyUpdating    = updating.size > 0;

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/20">
              <Users className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">Monitoramento de Perfis</h2>
            <Badge className="rounded-lg px-2 py-0.5 text-[10px] font-semibold bg-primary/15 text-primary border-primary/30">
              Social Blade
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground ml-10">
            {allIds.length} perfis monitorados · dados atualizados manualmente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-2 rounded-xl border-border/60 text-sm font-medium"
            onClick={() => setShowSchedule(true)}
          >
            <CalendarClock className="h-3.5 w-3.5" />
            Agendar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 rounded-xl border-border/60 text-sm font-medium"
            onClick={() => setConfirmAll(true)}
            disabled={anyUpdating}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${anyUpdating ? "animate-spin" : ""}`} />
            Atualizar todos
          </Button>
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

      {/* Summary KPIs (only when there's data) */}
      {withData.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total de Seguidores", value: fmt(totalFollowers), sub: `${withData.length} perfis com dados`, icon: Users, color: "from-violet-500 to-indigo-500" },
            { label: "Crescimento Semanal", value: totalWeekly > 0 ? `+${fmt(totalWeekly)}` : fmt(totalWeekly), sub: "soma dos últimos 7 dias", icon: TrendingUp, color: "from-emerald-500 to-teal-500" },
            { label: "Perfis Atualizados",  value: `${withData.length} / ${allIds.length}`, sub: "com dados do Social Blade", icon: Calendar, color: "from-sky-500 to-blue-500" },
          ].map(k => (
            <Card key={k.label} className="card-lift rounded-2xl border-border/40">
              <CardContent className="px-5 py-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${k.color} shadow-lg opacity-90`}>
                    <k.icon className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none tracking-tight tabular-nums">{k.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{k.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="rounded-2xl border border-border/40 bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          Carregando perfis...
        </div>
      )}

      {/* Instagram profiles */}
      {!loading && igProfiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Instagram ({igProfiles.length})
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {igProfiles.map(p => (
              <ProfileCard
                key={p.id}
                profile={p}
                isUpdating={updating.has(p.id)}
                onUpdate={updateProfile}
              />
            ))}
          </div>
        </div>
      )}

      {/* TikTok profiles */}
      {!loading && ttProfiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              TikTok ({ttProfiles.length})
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ttProfiles.map(p => (
              <ProfileCard
                key={p.id}
                profile={p}
                isUpdating={updating.has(p.id)}
                onUpdate={updateProfile}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no data yet */}
      {!loading && withData.length === 0 && (
        <div className="rounded-2xl border border-border/40 bg-card px-5 py-10 text-center space-y-2">
          <RefreshCw className="h-8 w-8 text-muted-foreground/30 mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum dado ainda</p>
          <p className="text-xs text-muted-foreground/60">
            Clique em <span className="font-medium text-foreground/60">Atualizar todos</span> para buscar os dados pela primeira vez.
          </p>
        </div>
      )}

      <ConfirmAllDialog
        open={confirmAll}
        count={allIds.length}
        onConfirm={handleUpdateAll}
        onCancel={() => setConfirmAll(false)}
      />

      {showSchedule && <ScheduleDialog onClose={() => setShowSchedule(false)} />}
    </div>
  );
}
