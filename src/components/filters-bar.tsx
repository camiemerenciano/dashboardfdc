"use client";

import { X, SlidersHorizontal, Sparkles, Zap, Smile } from "lucide-react";
import { useFilters } from "@/lib/filter-context";
import { MOCK_PAGES } from "@/lib/mock-data";
import type { ContentType } from "@/lib/types";

// ─── Config ───────────────────────────────────────────────────────────────────

const CONTENT_TYPES: { value: ContentType; label: string; icon: React.ElementType; color: string; activeBg: string; activeBorder: string }[] = [
  { value: "curiosidade", label: "Curiosidade", icon: Sparkles, color: "text-blue-400",  activeBg: "bg-blue-500/15",  activeBorder: "border-blue-500/40"  },
  { value: "motivação",   label: "Motivação",   icon: Zap,      color: "text-amber-400", activeBg: "bg-amber-500/15", activeBorder: "border-amber-500/40" },
  { value: "meme",        label: "Meme",        icon: Smile,    color: "text-pink-400",  activeBg: "bg-pink-500/15",  activeBorder: "border-pink-500/40"  },
];

const admins = Array.from(new Set(MOCK_PAGES.map((p) => p.admin_name)));

// ─── Pill helper ──────────────────────────────────────────────────────────────

function Pill({
  label, active, onClick, icon: Icon, activeColor, activeBg, activeBorder,
}: {
  label: string; active: boolean; onClick: () => void;
  icon?: React.ElementType;
  activeColor?: string; activeBg?: string; activeBorder?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
        active
          ? `${activeBg ?? "bg-primary/15"} ${activeBorder ?? "border-primary/40"} ${activeColor ?? "text-primary"}`
          : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border/70"
      }`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </button>
  );
}

// ─── FiltersBar ───────────────────────────────────────────────────────────────

export function FiltersBar() {
  const {
    pageIds, adminNames, contentTypes,
    togglePageId, toggleAdminName, toggleContentType,
    clearAll, isActive,
  } = useFilters();

  return (
    <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border/30">
        <SlidersHorizontal className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Filtros</span>
        {isActive && (
          <button
            onClick={clearAll}
            className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />Limpar
          </button>
        )}
      </div>

      <div className="px-5 py-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start">

        {/* Pages */}
        <div className="space-y-2 min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Página</p>
          <div className="flex flex-wrap gap-1.5">
            {MOCK_PAGES.map((p) => (
              <Pill
                key={p.id}
                label={p.name}
                active={pageIds.has(p.id)}
                onClick={() => togglePageId(p.id)}
              />
            ))}
          </div>
        </div>

        <div className="hidden sm:block w-px self-stretch bg-border/30 mx-1" />

        {/* Admins */}
        <div className="space-y-2 min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Admin</p>
          <div className="flex flex-wrap gap-1.5">
            {admins.map((name) => (
              <Pill
                key={name}
                label={name}
                active={adminNames.has(name)}
                onClick={() => toggleAdminName(name)}
              />
            ))}
          </div>
        </div>

        <div className="hidden sm:block w-px self-stretch bg-border/30 mx-1" />

        {/* Content types */}
        <div className="space-y-2 min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Tipo de conteúdo</p>
          <div className="flex flex-wrap gap-1.5">
            {CONTENT_TYPES.map((ct) => (
              <Pill
                key={ct.value}
                label={ct.label}
                active={contentTypes.has(ct.value)}
                onClick={() => toggleContentType(ct.value)}
                icon={ct.icon}
                activeColor={ct.color}
                activeBg={ct.activeBg}
                activeBorder={ct.activeBorder}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Active summary */}
      {isActive && (
        <div className="px-5 pb-3.5 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Ativos:</span>
          {Array.from(pageIds).map((id) => {
            const p = MOCK_PAGES.find((x) => x.id === id);
            return p ? (
              <span key={id} className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 text-primary px-2 py-0.5 text-[10px] font-medium">
                {p.name}
                <button onClick={() => togglePageId(id)}><X className="h-2.5 w-2.5" /></button>
              </span>
            ) : null;
          })}
          {Array.from(adminNames).map((name) => (
            <span key={name} className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 text-primary px-2 py-0.5 text-[10px] font-medium">
              {name}
              <button onClick={() => toggleAdminName(name)}><X className="h-2.5 w-2.5" /></button>
            </span>
          ))}
          {Array.from(contentTypes).map((ct) => {
            const cfg = CONTENT_TYPES.find((x) => x.value === ct)!;
            return (
              <span key={ct} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${cfg.activeBg} ${cfg.activeBorder} ${cfg.color}`}>
                {cfg.label}
                <button onClick={() => toggleContentType(ct)}><X className="h-2.5 w-2.5" /></button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
