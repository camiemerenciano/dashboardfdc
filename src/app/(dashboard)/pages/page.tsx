"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen, Plus, Pencil, Trash2, RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ─── Types ─────────────────────────────────────────────────────────────────────

type PageType = "curiosidade" | "meme" | "motivação";
type Platform  = "instagram" | "tiktok";

interface DBPage {
  id:          string;
  username:    string;
  platform:    Platform;
  displayName: string | null;
  adminName:   string | null;
  pageType:    PageType;
  createdAt:   string;
}

const PAGE_TYPES: PageType[] = ["curiosidade", "meme", "motivação"];
const PLATFORMS: Platform[]  = ["instagram", "tiktok"];

const PAGE_TYPE_COLORS: Record<PageType, string> = {
  curiosidade: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  meme:        "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  motivação:   "border-green-500/30 bg-green-500/10 text-green-400",
};

// ─── Dialog ────────────────────────────────────────────────────────────────────

interface DialogProps {
  initial?: DBPage | null;
  onSave: (p: Omit<DBPage, "createdAt">) => Promise<void>;
  onClose: () => void;
}

function PageDialog({ initial, onSave, onClose }: DialogProps) {
  const [id,          setId]          = useState(initial?.id          ?? "");
  const [username,    setUsername]    = useState(initial?.username    ?? "");
  const [platform,    setPlatform]    = useState<Platform>(initial?.platform  ?? "instagram");
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [adminName,   setAdminName]   = useState(initial?.adminName   ?? "");
  const [pageType,    setPageType]    = useState<PageType>(initial?.pageType ?? "motivação");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // auto-fill id from username when creating
  const isEdit = !!initial;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) { setError("Username é obrigatório"); return; }
    const effectiveId = isEdit ? id : (id.trim() || username.trim().replace(/^@/, ""));
    setSaving(true);
    setError(null);
    try {
      await onSave({
        id:          effectiveId,
        username:    username.trim().replace(/^@/, ""),
        platform,
        displayName: displayName.trim() || null,
        adminName:   adminName.trim()   || null,
        pageType,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card shadow-2xl">
        <div className="px-5 py-4 border-b border-border/40">
          <h2 className="text-sm font-semibold">{isEdit ? "Editar Página" : "Nova Página"}</h2>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3.5">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Username *
            </label>
            <div className="flex items-center gap-0">
              <span className="px-3 py-2 rounded-l-lg border border-r-0 border-border/60 bg-muted/30 text-sm text-muted-foreground select-none">@</span>
              <input
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  if (!isEdit && !id) setId(e.target.value.replace(/^@/, "").trim());
                }}
                placeholder="nomeusuario"
                className="flex-1 rounded-r-lg border border-border/60 bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Display name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Nome de exibição
            </label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Ex: Mente Inspirável"
              className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {/* Admin */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Admin / Responsável
            </label>
            <input
              value={adminName}
              onChange={e => setAdminName(e.target.value)}
              placeholder="Ex: Lucas"
              className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {/* Platform + Type row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Plataforma
              </label>
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value as Platform)}
                className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {PLATFORMS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Tipo *
              </label>
              <select
                value={pageType}
                onChange={e => setPageType(e.target.value as PageType)}
                className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {PAGE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border/60 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete confirmation ────────────────────────────────────────────────────────

function DeleteConfirm({ page, onConfirm, onClose }: { page: DBPage; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card shadow-2xl px-5 py-5 space-y-4">
        <h2 className="text-sm font-semibold">Excluir página</h2>
        <p className="text-sm text-muted-foreground">
          Tem certeza que deseja excluir <span className="font-medium text-foreground">@{page.username}</span>? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border/60 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PagesPage() {
  const [pages,       setPages]       = useState<DBPage[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [dialogOpen,  setDialogOpen]  = useState(false);
  const [editTarget,  setEditTarget]  = useState<DBPage | null>(null);
  const [deleteTarget,setDeleteTarget]= useState<DBPage | null>(null);
  const [typeFilter,  setTypeFilter]  = useState<PageType | null>(null);
  const [adminFilter, setAdminFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pages");
      if (res.ok) setPages(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(p: Omit<DBPage, "createdAt">) {
    const res = await fetch("/api/pages", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(p),
    });
    if (!res.ok) throw new Error("Falha ao salvar");
    await load();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/pages?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setDeleteTarget(null);
    await load();
  }

  // Derived filters
  const admins = Array.from(new Set(pages.map(p => p.adminName).filter(Boolean) as string[])).sort();
  const filtered = pages.filter(p => {
    if (typeFilter  && p.pageType  !== typeFilter)  return false;
    if (adminFilter && p.adminName !== adminFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Páginas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gerencie as páginas monitoradas — admin, tipo e plataforma
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditTarget(null); setDialogOpen(true); }}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nova página
        </button>
      </div>

      {/* Filter bar */}
      <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
        <div className="px-5 py-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Type filters */}
            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mr-1">Tipo</span>
            <button
              onClick={() => setTypeFilter(null)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors border ${
                typeFilter === null
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-background/40 border-border/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos
            </button>
            {PAGE_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(prev => prev === t ? null : t)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors border ${
                  typeFilter === t
                    ? "bg-primary/20 border-primary/40 text-primary"
                    : "bg-background/40 border-border/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}

            {admins.length > 0 && (
              <>
                <Separator orientation="vertical" className="h-4 mx-1 opacity-40" />
                <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mr-1">Admin</span>
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
                  <button
                    key={a}
                    onClick={() => setAdminFilter(prev => prev === a ? null : a)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors border ${
                      adminFilter === a
                        ? "bg-primary/20 border-primary/40 text-primary"
                        : "bg-background/40 border-border/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </>
            )}

            <button
              onClick={load}
              title="Recarregar"
              className="ml-auto rounded-lg border border-border/40 bg-background/40 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <Separator className="opacity-40" />

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-xs text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />Carregando…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              Nenhuma página encontrada.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  <th className="px-5 py-3 text-left">Perfil</th>
                  <th className="px-4 py-3 text-left">Plataforma</th>
                  <th className="px-4 py-3 text-left">Admin</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((page, i) => (
                  <tr
                    key={page.id}
                    className={`border-b border-border/20 transition-colors hover:bg-white/2 ${i % 2 === 0 ? "" : "bg-white/[0.015]"}`}
                  >
                    <td className="px-5 py-3">
                      <div>
                        <span className="font-medium text-foreground">
                          {page.displayName || `@${page.username}`}
                        </span>
                        {page.displayName && (
                          <span className="ml-2 text-xs text-muted-foreground">@{page.username}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground capitalize">
                        {page.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {page.adminName ?? <span className="italic opacity-40">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0 h-5 ${PAGE_TYPE_COLORS[page.pageType]}`}
                      >
                        {page.pageType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditTarget(page); setDialogOpen(true); }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(page)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/5 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-border/20 text-[11px] text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "página" : "páginas"}
            {(typeFilter || adminFilter) && ` (filtrado de ${pages.length} total)`}
          </div>
        )}
      </div>

      {/* Add/Edit dialog */}
      {dialogOpen && (
        <PageDialog
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setDialogOpen(false); setEditTarget(null); }}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteConfirm
          page={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
