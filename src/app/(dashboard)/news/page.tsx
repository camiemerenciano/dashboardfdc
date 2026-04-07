"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Newspaper, ExternalLink, Bookmark, Rss,
  Clock, RefreshCw, Plus, Search, X,
  Wifi, WifiOff, AlertCircle, CheckCircle2,
  Sparkles, BarChart2, FileText, Briefcase,
  Wrench, FlaskConical, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { Article, Topic } from "@/app/api/news/route";

// ─── Topic config ─────────────────────────────────────────────────────────────

type TopicFilter = "Todos" | Topic;

const TOPIC_CFG: Record<Topic, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  "IA":           { color:"text-violet-300",  bg:"bg-violet-500/15",  border:"border-violet-500/30",  icon: Sparkles    },
  "Social Media": { color:"text-pink-300",    bg:"bg-pink-500/15",    border:"border-pink-500/30",    icon: Globe       },
  "Ferramentas":  { color:"text-cyan-300",    bg:"bg-cyan-500/15",    border:"border-cyan-500/30",    icon: Wrench      },
  "Pesquisa":     { color:"text-blue-300",    bg:"bg-blue-500/15",    border:"border-blue-500/30",    icon: FlaskConical},
  "Negócios":     { color:"text-amber-300",   bg:"bg-amber-500/15",   border:"border-amber-500/30",   icon: Briefcase   },
  "SEO":          { color:"text-emerald-300", bg:"bg-emerald-500/15", border:"border-emerald-500/30", icon: BarChart2   },
  "Conteúdo":     { color:"text-orange-300",  bg:"bg-orange-500/15",  border:"border-orange-500/30",  icon: FileText    },
};

const ALL_TOPICS: Topic[] = ["IA", "Social Media", "Ferramentas", "Pesquisa", "Negócios", "SEO", "Conteúdo"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return "agora mesmo";
  if (m < 60)  return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `há ${d} dia${d > 1 ? "s" : ""}`;
  return new Date(iso).toLocaleDateString("pt-BR", { day:"2-digit", month:"short" });
}

function TopicChip({ topic }: { topic: Topic }) {
  const c = TOPIC_CFG[topic];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${c.color} ${c.bg} ${c.border}`}>
      <Icon className="h-2.5 w-2.5" />{topic}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-3 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted/40 rounded w-3/4" />
          <div className="h-3 bg-muted/30 rounded w-1/2" />
        </div>
        <div className="h-5 w-16 bg-muted/30 rounded-full shrink-0" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 bg-muted/25 rounded w-full" />
        <div className="h-3 bg-muted/25 rounded w-5/6" />
        <div className="h-3 bg-muted/20 rounded w-2/3" />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <div className="h-3 w-24 bg-muted/30 rounded" />
        <div className="h-3 w-16 bg-muted/30 rounded" />
      </div>
    </div>
  );
}

// ─── News Card ────────────────────────────────────────────────────────────────

function ArticleCard({
  article, saved, onToggleSave,
}: {
  article: Article;
  saved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <div className="group relative card-lift rounded-2xl border border-border/40 bg-card hover:border-border/70 transition-all duration-200">
      <div className="p-5 space-y-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-md bg-muted/40 flex items-center justify-center shrink-0">
              <Rss className="h-3 w-3 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-muted-foreground truncate">{article.source}</span>
          </div>
          <TopicChip topic={article.topic} />
        </div>

        {/* Headline */}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-[13px] font-semibold leading-snug hover:text-primary transition-colors line-clamp-2"
        >
          {article.title}
        </a>

        {/* Summary */}
        {article.summary && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {article.summary}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{relativeTime(article.publishedAt)}</span>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onToggleSave}
              title={saved ? "Remover dos salvos" : "Salvar para depois"}
              className={`p-1.5 rounded transition-colors ${saved ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} />
            </button>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface SourceStatus { source: string; ok: boolean; count: number }

export default function NewsPage() {
  const [articles,   setArticles]   = useState<Article[]>([]);
  const [sources,    setSources]    = useState<SourceStatus[]>([]);
  const [fetchedAt,  setFetchedAt]  = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [topic,      setTopic]      = useState<TopicFilter>("Todos");
  const [search,     setSearch]     = useState("");
  const [saved,      setSaved]      = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setArticles(data.articles ?? []);
      setSources(data.sources ?? []);
      setFetchedAt(data.fetchedAt ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar notícias.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleSave(id: string) {
    setSaved(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const filtered = useMemo(() => {
    let list = articles;
    if (topic !== "Todos") list = list.filter(a => a.topic === topic);
    if (search.trim())     list = list.filter(a =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.source.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [articles, topic, search]);

  const savedArticles = articles.filter(a => saved.has(a.id));

  // Topic counts
  const topicCounts = useMemo(() => {
    const map: Partial<Record<Topic, number>> = {};
    articles.forEach(a => { map[a.topic] = (map[a.topic] ?? 0) + 1; });
    return map;
  }, [articles]);

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
              <Newspaper className="h-5 w-5 text-white" />
            </div>
            <div>
            <h1 className="text-2xl font-bold tracking-tight">Consolidador de Notícias</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Últimas notícias de <span className="text-foreground font-medium">Marketing Digital &amp; IA</span> em tempo real.
            </p>
            </div>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs px-2 self-start mt-0.5">
              RSS
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            className="gap-2 h-9 rounded-xl border-border/60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Atualizando..." : "Atualizar"}
          </Button>
          <Button size="sm" className="gap-2 h-9 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 transition-opacity border-0 shadow-lg shadow-emerald-500/20">
            <Plus className="h-3.5 w-3.5" />Adicionar fonte
          </Button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-destructive hover:text-destructive/70">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Artigos",    value: loading ? "—" : String(articles.length),           icon: FileText,  bg: "bg-emerald-500/10", border: "border-emerald-500/20", ic: "text-emerald-400"      },
          { label: "Fontes ativas", value: loading ? "—" : String(sources.filter(s=>s.ok).length), icon: Rss, bg: "bg-blue-500/10",    border: "border-blue-500/20",   ic: "text-blue-400"         },
          { label: "Salvos",     value: String(saved.size),                                 icon: Bookmark,  bg: "bg-amber-500/10",  border: "border-amber-500/20",  ic: "text-amber-400"        },
          { label: "Atualizado", value: fetchedAt ? relativeTime(fetchedAt) : "—",          icon: RefreshCw, bg: "bg-muted/40",      border: "border-border/40",     ic: "text-muted-foreground" },
        ].map(k => (
          <div key={k.label} className="card-lift flex items-center gap-3 rounded-2xl border border-border/40 bg-card p-4">
            <div className={`${k.bg} rounded-xl p-2.5 shrink-0 border ${k.border}`}>
              <k.icon className={`h-4 w-4 ${k.ic}`} />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none tracking-tight">{k.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Topic pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setTopic("Todos")}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
              topic === "Todos"
                ? "bg-primary/20 border-primary/40 text-primary"
                : "border-border/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos
            {articles.length > 0 && (
              <span className="ml-1.5 text-[10px] opacity-60">{articles.length}</span>
            )}
          </button>
          {ALL_TOPICS.map(t => {
            const c = TOPIC_CFG[t];
            const TIcon = c.icon;
            const count = topicCounts[t] ?? 0;
            const active = topic === t;
            return (
              <button
                key={t}
                onClick={() => setTopic(active ? "Todos" : t)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                  active
                    ? `${c.bg} ${c.border} ${c.color}`
                    : "border-border/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <TIcon className="h-3 w-3" />{t}
                {count > 0 && <span className={`text-[10px] opacity-60`}>{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar notícias..."
            className="pl-9 h-8 bg-card border-border/60 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="flex gap-5 items-start">

        {/* ── Articles feed ── */}
        <div className="flex-1 min-w-0 space-y-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-border/30">
              <Newspaper className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Nenhum artigo encontrado</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Tente mudar o filtro ou o termo de busca.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {filtered.length} artigo{filtered.length !== 1 ? "s" : ""}
                {topic !== "Todos" && ` em "${topic}"`}
                {search && ` • "${search}"`}
              </p>
              {filtered.map(a => (
                <ArticleCard
                  key={a.id}
                  article={a}
                  saved={saved.has(a.id)}
                  onToggleSave={() => toggleSave(a.id)}
                />
              ))}
            </>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="w-64 shrink-0 space-y-4">

          {/* Saved */}
          <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Bookmark className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-sm font-semibold">Salvos</span>
              </div>
              <span className="text-xs text-muted-foreground">{savedArticles.length}</span>
            </div>
            {savedArticles.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6 px-4">
                Salve artigos com o ícone de favorito.
              </p>
            ) : (
              <div className="divide-y divide-border/30">
                {savedArticles.map(a => (
                  <div key={a.id} className="px-5 py-3 space-y-1">
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium leading-snug line-clamp-2 hover:text-primary transition-colors block"
                    >
                      {a.title}
                    </a>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">{a.source}</span>
                      <button
                        onClick={() => toggleSave(a.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RSS Sources */}
          <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/40">
              <Rss className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-semibold">Fontes RSS</span>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 bg-muted/20 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {sources.map(s => (
                  <div key={s.source} className="flex items-center gap-2.5 px-5 py-2.5">
                    {s.ok
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      : <WifiOff      className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{s.source}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {s.ok ? `${s.count} artigos` : "indisponível"}
                      </p>
                    </div>
                    <Wifi className={`h-3 w-3 shrink-0 ${s.ok ? "text-emerald-400/50" : "text-red-400/50"}`} />
                  </div>
                ))}
              </div>
            )}
            <Separator />
            <div className="px-5 py-4">
              {fetchedAt && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <RefreshCw className="h-2.5 w-2.5" />
                  Atualizado {relativeTime(fetchedAt)}
                </p>
              )}
            </div>
          </div>

          {/* Topic breakdown */}
          {!loading && articles.length > 0 && (
            <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/40">
                <BarChart2 className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-semibold">Por Tópico</span>
              </div>
              <div className="p-5 space-y-2">
                {ALL_TOPICS.filter(t => (topicCounts[t] ?? 0) > 0).map(t => {
                  const c = TOPIC_CFG[t];
                  const count = topicCounts[t] ?? 0;
                  const pct = Math.round((count / articles.length) * 100);
                  return (
                    <div key={t}>
                      <div className="flex items-center justify-between mb-0.5">
                        <button
                          onClick={() => setTopic(topic === t ? "Todos" : t)}
                          className={`text-xs font-medium hover:underline ${c.color}`}
                        >
                          {t}
                        </button>
                        <span className="text-[11px] text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-muted/30">
                        <div
                          className={`h-1 rounded-full ${c.bg} border ${c.border}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
