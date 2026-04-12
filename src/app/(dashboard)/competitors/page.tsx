"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Users, Plus, TrendingUp, TrendingDown, Minus,
  ExternalLink, ChevronUp, ChevronDown, ChevronsUpDown,
  X, Search, Globe, Film, ImageIcon, Newspaper,
  MessageCircle, Heart, Share2, Clock, Zap, BarChart2,
  UserPlus, LayoutGrid, CircleDot, Trophy, Target, RefreshCw,
} from "lucide-react";
import {
  LineChart, Line, Tooltip, ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { SBProfilesSection } from "@/components/sb-profiles-section";

// ─── Types ────────────────────────────────────────────────────────────────────

type SocialPlatform = "Instagram" | "YouTube" | "TikTok" | "Twitter/X" | "LinkedIn";
type SortKey = "name" | "followers" | "engagement" | "postsPerWeek" | "growth";
type SortDir = "asc" | "desc";

interface RecentPost {
  id: string;
  caption: string;
  type: string;
  likes: number;
  comments: number;
  shares: number;
  date: string;
  engRate: number;
}

interface Competitor {
  id: string;
  name: string;
  handle: string;
  platform: SocialPlatform;
  category: string;
  initials: string;
  color: string;
  followers: number;
  growth: number;        // MoM % follower growth
  engagement: number;   // % engagement rate
  postsPerWeek: number;
  lastPost: string;
  weeklyData: number[]; // 8-week follower delta sparkline
  recentPosts: RecentPost[];
  _fromDb?: boolean;    // true = fetched from Social Blade + saved to SQLite
}

// ─── Platform config ──────────────────────────────────────────────────────────

const SOCIAL: Record<SocialPlatform, { icon: React.ElementType; color: string; bg: string }> = {
  Instagram:  { icon: CircleDot,  color: "text-violet-400",  bg: "bg-violet-500/15 border-violet-500/30" },
  YouTube:    { icon: Film,       color: "text-red-400",     bg: "bg-red-500/15 border-red-500/30"       },
  TikTok:     { icon: Zap,        color: "text-cyan-400",    bg: "bg-cyan-500/15 border-cyan-500/30"     },
  "Twitter/X":{ icon: Globe,      color: "text-sky-400",     bg: "bg-sky-500/15 border-sky-500/30"       },
  LinkedIn:   { icon: Newspaper,  color: "text-blue-400",    bg: "bg-blue-500/15 border-blue-500/30"     },
};

const POST_TYPE_ICON: Record<string, React.ElementType> = {
  Feed: ImageIcon, Reels: Film, Stories: CircleDot,
  Carrossel: LayoutGrid, Vídeo: Film, Short: Zap, Artigo: Newspaper,
};

const PLATFORMS = Object.keys(SOCIAL) as SocialPlatform[];
const CATEGORIES = ["Marketing Digital", "Design", "Tecnologia", "Educação", "Branding", "Entretenimento", "Negócios"];

// ─── Mock data ────────────────────────────────────────────────────────────────

const INIT_COMPETITORS: Competitor[] = [
  {
    id: "1", name: "Agência Nova Era", handle: "@agencia.novaera",
    platform: "Instagram", category: "Marketing Digital",
    initials: "NE", color: "bg-violet-500",
    followers: 84200, growth: 3.8, engagement: 5.2, postsPerWeek: 7,
    lastPost: "há 1h", weeklyData: [820,940,880,1050,1120,970,1280,1340],
    recentPosts: [
      { id:"1", caption:"5 estratégias de social media para 2026 🚀", type:"Carrossel", likes:1820, comments:143, shares:97, date:"hoje 09:00", engRate:7.4 },
      { id:"2", caption:"Bastidores da nossa campanha mais viral", type:"Reels",     likes:2340, comments:211, shares:182, date:"ontem 18:30", engRate:9.1 },
      { id:"3", caption:"Dica de design para Stories que converte",  type:"Stories",  likes:610,  comments:48,  shares:31,  date:"3 dias atrás", engRate:4.2 },
    ],
  },
  {
    id: "2", name: "Studio Pixel", handle: "@studiopixel",
    platform: "Instagram", category: "Design",
    initials: "SP", color: "bg-pink-500",
    followers: 52800, growth: 1.4, engagement: 6.7, postsPerWeek: 5,
    lastPost: "há 3h", weeklyData: [310,290,340,320,380,360,410,430],
    recentPosts: [
      { id:"1", caption:"Identidade visual que conta uma história 🎨", type:"Carrossel", likes:1430, comments:92,  shares:78,  date:"hoje 11:00", engRate:8.3 },
      { id:"2", caption:"Processo de criação de um logo do zero",      type:"Reels",     likes:3200, comments:310, shares:240, date:"há 2 dias",  engRate:12.1},
      { id:"3", caption:"Paleta de cores: como escolher para marcas",  type:"Feed",      likes:890,  comments:67,  shares:44,  date:"há 4 dias",  engRate:5.8 },
    ],
  },
  {
    id: "3", name: "TechTalk BR", handle: "@techstalkbr",
    platform: "YouTube", category: "Tecnologia",
    initials: "TT", color: "bg-red-500",
    followers: 128400, growth: 5.1, engagement: 4.3, postsPerWeek: 3,
    lastPost: "há 2 dias", weeklyData: [2100,2400,1900,2700,3100,2800,3400,3800],
    recentPosts: [
      { id:"1", caption:"Eu testei a IA que vai substituir programadores", type:"Vídeo", likes:8200, comments:643, shares:410, date:"há 2 dias", engRate:6.9 },
      { id:"2", caption:"Setup gamer de R$3.000 — vale a pena?",          type:"Vídeo", likes:6100, comments:512, shares:290, date:"há 5 dias", engRate:5.2 },
      { id:"3", caption:"Shorts: dica de terminal em 60 segundos",        type:"Short", likes:1200, comments:88,  shares:64,  date:"há 1 sem",  engRate:3.1 },
    ],
  },
  {
    id: "4", name: "Conteúdo com Propósito", handle: "@conteudocomprop",
    platform: "TikTok", category: "Educação",
    initials: "CP", color: "bg-cyan-500",
    followers: 213000, growth: 12.4, engagement: 8.9, postsPerWeek: 14,
    lastPost: "há 30min", weeklyData: [4200,5100,4800,6300,7100,6800,8400,9200],
    recentPosts: [
      { id:"1", caption:"POV: você aprende inglês em 1 minuto 🇺🇸",     type:"Short", likes:18400, comments:1240, shares:3200, date:"hoje 10:00", engRate:15.2},
      { id:"2", caption:"3 erros que todo estudante comete (e como evitar)", type:"Short", likes:12100, comments:890, shares:1800, date:"hoje 07:00", engRate:11.4},
      { id:"3", caption:"Dueto: aprenda com a minha rotina de estudos",   type:"Short", likes:7800,  comments:540, shares:920,  date:"ontem 21:00", engRate:8.1 },
    ],
  },
  {
    id: "5", name: "Growth Hacker MKT", handle: "@growthhackermkt",
    platform: "Twitter/X", category: "Marketing Digital",
    initials: "GH", color: "bg-sky-500",
    followers: 41700, growth: -0.8, engagement: 2.1, postsPerWeek: 21,
    lastPost: "há 15min", weeklyData: [120,80,140,90,110,70,95,88],
    recentPosts: [
      { id:"1", caption:"Thread: Como aumentei o CTR em 300% mudando apenas o headline", type:"Artigo", likes:890, comments:124, shares:310, date:"hoje 08:15", engRate:3.1 },
      { id:"2", caption:"Hot take: e-mail marketing ainda bate qualquer rede social em ROI", type:"Artigo", likes:1240, comments:218, shares:430, date:"ontem 19:00", engRate:4.8 },
      { id:"3", caption:"Ferramenta gratuita que ninguém usa e que dobra conversões", type:"Artigo", likes:670, comments:88, shares:190, date:"há 2 dias", engRate:2.8 },
    ],
  },
  {
    id: "6", name: "B2B Content Lab", handle: "@b2bcontentlab",
    platform: "LinkedIn", category: "Negócios",
    initials: "BL", color: "bg-blue-500",
    followers: 29300, growth: 2.2, engagement: 3.6, postsPerWeek: 4,
    lastPost: "há 6h", weeklyData: [180,210,190,240,260,230,270,295],
    recentPosts: [
      { id:"1", caption:"Como estruturamos nosso processo de content marketing com IA", type:"Artigo", likes:420, comments:87, shares:134, date:"hoje 07:30", engRate:4.1 },
      { id:"2", caption:"5 lições aprendidas em 3 anos de B2B content",               type:"Artigo", likes:580, comments:104, shares:210, date:"há 3 dias", engRate:5.3 },
      { id:"3", caption:"O erro de conteúdo que 90% das empresas cometem",             type:"Artigo", likes:1100, comments:198, shares:380, date:"há 1 sem",  engRate:9.2 },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n/1_000).toFixed(1)}k`;
  return String(n);
}

function engColor(e: number) {
  if (e >= 8)  return "text-emerald-400";
  if (e >= 5)  return "text-amber-400";
  if (e >= 2)  return "text-foreground";
  return "text-red-400";
}

function growthColor(g: number) {
  if (g > 3)   return "text-emerald-400";
  if (g > 0)   return "text-blue-400";
  if (g === 0) return "text-muted-foreground";
  return "text-red-400";
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const pts = data.map((v, i) => ({ v }));
  return (
    <ResponsiveContainer width={80} height={32}>
      <LineChart data={pts} margin={{ top: 4, right: 2, left: 2, bottom: 4 }}>
        <Line
          type="monotone" dataKey="v" dot={false} strokeWidth={1.5}
          stroke={positive ? "#34d399" : "#f87171"}
          isAnimationActive={false}
        />
        <Tooltip
          content={({ active, payload }) =>
            active && payload?.length
              ? <div className="rounded bg-card border border-border px-2 py-1 text-[10px] text-foreground">+{payload[0].value ?? ""}</div>
              : null
          }
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Sort header cell ─────────────────────────────────────────────────────────

function SortTh({
  label, sortKey, current, dir, onSort,
}: { label: string; sortKey: SortKey; current: SortKey; dir: SortDir; onSort: (k: SortKey) => void }) {
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

// ─── Recent posts panel ───────────────────────────────────────────────────────

function RecentPostsPanel({ competitor, onClose }: { competitor: Competitor; onClose: () => void }) {
  const cfg = SOCIAL[competitor.platform];
  const PIcon = cfg.icon;

  return (
    <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-full ${competitor.color} flex items-center justify-center text-xs font-bold text-white`}>
            {competitor.initials}
          </div>
          <div>
            <p className="text-sm font-semibold">{competitor.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <PIcon className={`h-3 w-3 ${cfg.color}`} />
              <span className="text-[11px] text-muted-foreground">{competitor.handle}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-border/30 border-b border-border/30">
        {[
          { label: "Seguidores",  value: fmt(competitor.followers) },
          { label: "Engajamento", value: `${competitor.engagement}%` },
          { label: "Posts/sem",   value: String(competitor.postsPerWeek) },
        ].map(s => (
          <div key={s.label} className="py-3.5 text-center">
            <p className="text-base font-bold tabular-nums">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Posts */}
      <div className="p-5 space-y-3 max-h-96 overflow-y-auto">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Posts Recentes</p>
        {competitor.recentPosts.map(post => {
          const TIcon = POST_TYPE_ICON[post.type] ?? ImageIcon;
          return (
            <div key={post.id} className="rounded-xl border border-border/40 bg-background/30 p-3.5 space-y-2">
              <div className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-md bg-muted/40 flex items-center justify-center shrink-0">
                  <TIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
                </div>
                <p className="text-xs leading-snug font-medium line-clamp-2 flex-1">{post.caption}</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{fmt(post.likes)}</span>
                <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{fmt(post.comments)}</span>
                <span className="flex items-center gap-1"><Share2 className="h-3 w-3" />{fmt(post.shares)}</span>
                <span className={`ml-auto font-semibold ${engColor(post.engRate)}`}>{post.engRate}%</span>
                <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{post.date}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Add competitor dialog ────────────────────────────────────────────────────

const SB_PLATFORMS = ["Instagram", "TikTok"] as const;
type SBAddPlatform = typeof SB_PLATFORMS[number];

const INIT_ADD_FORM = { username: "", platform: "" as SBAddPlatform | "" };

function AddDialog({ open, onOpenChange, onAdd }: {
  open: boolean; onOpenChange:(v:boolean)=>void; onAdd:(c:Competitor)=>void;
}) {
  const [form,    setForm]    = useState(INIT_ADD_FORM);
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    const username = form.username.trim().replace(/^@/, "");
    if (!username)      return setErr("Username é obrigatório.");
    if (!form.platform) return setErr("Selecione a rede social.");

    setLoading(true);
    setErr("");
    try {
      const res  = await fetch("/api/competitors", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username, platform: form.platform.toLowerCase() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao buscar dados");
      onAdd(json.competitor as Competitor);
      setForm(INIT_ADD_FORM);
      onOpenChange(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao buscar dados do Social Blade");
    } finally {
      setLoading(false);
    }
  }

  function close() {
    if (loading) return;
    setForm(INIT_ADD_FORM); setErr(""); onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md bg-card border-border/60 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-[15px] font-semibold">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
              <UserPlus className="h-3.5 w-3.5 text-white" />
            </div>
            Adicionar Concorrente
          </DialogTitle>
        </DialogHeader>
        <Separator className="my-1 opacity-50" />
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Username</Label>
            <Input
              placeholder="@usuario"
              className="bg-background/60 border-border/60 text-sm rounded-xl"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              onKeyDown={e => e.key === "Enter" && save()}
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Rede social</Label>
            <Select
              value={form.platform}
              onValueChange={v => v && setForm({ ...form, platform: v as SBAddPlatform })}
              disabled={loading}
            >
              <SelectTrigger className="bg-background/60 border-border/60 text-sm rounded-xl">
                <SelectValue placeholder="Plataforma..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/60 rounded-xl">
                {SB_PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {err && <p className="text-xs text-destructive font-medium">{err}</p>}
          {loading && <p className="text-xs text-muted-foreground">Buscando dados no Social Blade…</p>}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={close} disabled={loading}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={save}
            disabled={loading}
            className="gap-1.5 rounded-lg bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 transition-opacity border-0"
          >
            <Plus className="h-3.5 w-3.5" />{loading ? "Buscando…" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [sortKey,  setSortKey]  = useState<SortKey>("followers");
  const [sortDir,  setSortDir]  = useState<SortDir>("desc");
  const [search,   setSearch]   = useState("");
  const [platform, setPlatform] = useState<SocialPlatform | "">("");
  const [selected, setSelected] = useState<Competitor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Load competitors from SQLite on mount
  useEffect(() => {
    fetch("/api/competitors")
      .then(r => r.json())
      .then(json => setCompetitors(json.competitors ?? []))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, []);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function remove(id: string) {
    fetch(`/api/competitors?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    setCompetitors(prev => prev.filter(x => x.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  const filtered = useMemo(() => {
    let list = [...competitors];
    if (search)   list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.handle.toLowerCase().includes(search.toLowerCase()));
    if (platform) list = list.filter(c => c.platform === platform);
    list.sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "name")         return mul * a.name.localeCompare(b.name);
      if (sortKey === "followers")    return mul * (a.followers   - b.followers);
      if (sortKey === "engagement")   return mul * (a.engagement  - b.engagement);
      if (sortKey === "postsPerWeek") return mul * (a.postsPerWeek - b.postsPerWeek);
      if (sortKey === "growth")       return mul * (a.growth       - b.growth);
      return 0;
    });
    return list;
  }, [competitors, search, platform, sortKey, sortDir]);

  // Summary KPIs
  const avgEng = competitors.length
    ? (competitors.reduce((s,c) => s + c.engagement, 0) / competitors.length).toFixed(1)
    : "—";
  const topGrowth = competitors.reduce((best, c) => c.growth > (best?.growth ?? -Infinity) ? c : best, competitors[0]);

  return (
    <div className="space-y-8">

      {/* Social Blade profiles monitoring */}
      <SBProfilesSection />

      <Separator className="opacity-20" />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg shadow-rose-500/20">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Rastreador de Concorrentes</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Monitore posts, engajamento e crescimento em múltiplas redes.</p>
            </div>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)}
          className="gap-2 shrink-0 self-start rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:opacity-90 transition-opacity border-0 shadow-lg shadow-rose-500/20 px-5">
          <UserPlus className="h-4 w-4" />Adicionar Concorrente
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {[
          { label:"Monitorados",   value: String(competitors.length), icon: Users,   bg:"bg-rose-500/10",   border:"border-rose-500/20",   ic:"text-rose-400"    },
          { label:"Eng. médio",    value: `${avgEng}%`,               icon: Heart,   bg:"bg-pink-500/10",   border:"border-pink-500/20",   ic:"text-pink-400"    },
          { label:"Maior crescimento", value: topGrowth ? `+${topGrowth.growth}%` : "—", icon: Trophy, bg:"bg-amber-500/10", border:"border-amber-500/20", ic:"text-amber-400" },
          { label:"Redes ativas",  value: String(new Set(competitors.map(c=>c.platform)).size), icon: Globe, bg:"bg-blue-500/10", border:"border-blue-500/20", ic:"text-blue-400" },
        ].map(k => (
          <div key={k.label} className={`card-lift relative rounded-2xl border bg-card overflow-hidden border-border/40`}>
            <div className="p-5 flex items-center gap-3">
              <div className={`${k.bg} rounded-xl p-2.5 shrink-0 border ${k.border}`}>
                <k.icon className={`h-4 w-4 ${k.ic}`} />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none tracking-tight">{k.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1 font-medium">{k.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar concorrente..."
            className="pl-9 h-8 bg-card border-border/60 text-sm"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setPlatform("")}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
              platform === "" ? "bg-primary/20 border-primary/40 text-primary" : "border-border/40 text-muted-foreground hover:text-foreground"}`}
          >
            Todas
          </button>
          {PLATFORMS.map(p => {
            const c = SOCIAL[p]; const PIcon = c.icon;
            return (
              <button key={p} onClick={() => setPlatform(platform === p ? "" : p)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                  platform === p ? `${c.bg} ${c.color}` : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border"}`}>
                <PIcon className="h-3 w-3" />{p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table + detail panel */}
      <div className="flex gap-4 items-start">

        {/* Table */}
        <div className="flex-1 min-w-0">
          <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border/30 bg-muted/5">
                  <tr>
                    <SortTh label="Concorrente"   sortKey="name"         current={sortKey} dir={sortDir} onSort={handleSort} />
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Rede</th>
                    <SortTh label="Seguidores"    sortKey="followers"    current={sortKey} dir={sortDir} onSort={handleSort} />
                    <SortTh label="Engajamento"   sortKey="engagement"   current={sortKey} dir={sortDir} onSort={handleSort} />
                    <SortTh label="Posts/sem"     sortKey="postsPerWeek" current={sortKey} dir={sortDir} onSort={handleSort} />
                    <SortTh label="Crescimento"   sortKey="growth"       current={sortKey} dir={sortDir} onSort={handleSort} />
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tendência 8s</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Último post</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {loadingList && (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-sm text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />Carregando…
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loadingList && filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <p className="text-sm font-medium text-muted-foreground">Nenhum concorrente adicionado</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Clique em <span className="font-medium text-foreground/60">Adicionar Concorrente</span> para começar.</p>
                      </td>
                    </tr>
                  )}
                  {filtered.map(c => {
                    const cfg     = SOCIAL[c.platform];
                    const PIcon   = cfg.icon;
                    const isActive = selected?.id === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelected(isActive ? null : c)}
                        className={`cursor-pointer transition-colors ${isActive ? "bg-primary/8" : "hover:bg-muted/15"}`}
                      >
                        {/* Name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`h-9 w-9 rounded-full ${c.color} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>
                              {c.initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold truncate">{c.name}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{c.handle}</p>
                            </div>
                          </div>
                        </td>
                        {/* Platform */}
                        <td className="px-5 py-4">
                          <div className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cfg.bg} ${cfg.color}`}>
                            <PIcon className="h-3 w-3" />
                            <span className="hidden sm:inline">{c.platform}</span>
                          </div>
                        </td>
                        {/* Followers */}
                        <td className="px-5 py-4">
                          <span className="text-sm font-semibold tabular-nums">{fmt(c.followers)}</span>
                        </td>
                        {/* Engagement */}
                        <td className="px-5 py-4">
                          <span className={`text-sm font-bold tabular-nums ${engColor(c.engagement)}`}>{c.engagement}%</span>
                        </td>
                        {/* Posts/week */}
                        <td className="px-5 py-4">
                          <span className="text-sm tabular-nums">{c.postsPerWeek}×</span>
                        </td>
                        {/* Growth */}
                        <td className="px-5 py-4">
                          <div className={`flex items-center gap-1 text-sm font-bold tabular-nums ${growthColor(c.growth)}`}>
                            {c.growth > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : c.growth < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                            {c.growth > 0 ? "+" : ""}{c.growth}%
                          </div>
                        </td>
                        {/* Sparkline */}
                        <td className="px-5 py-4">
                          <Sparkline data={c.weeklyData} positive={c.growth >= 0} />
                        </td>
                        {/* Last post */}
                        <td className="px-5 py-4">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                            <Clock className="h-3 w-3 shrink-0" />{c.lastPost}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="px-2 py-4">
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={e => { e.stopPropagation(); window.open(`https://www.${c.platform === "Twitter/X" ? "x" : c.platform.toLowerCase()}.com/${c.handle.replace("@","")}`, "_blank"); }}
                              className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                              title="Abrir perfil"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); remove(c.id); }}
                              className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                              title="Remover"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Table footer */}
            <div className="border-t border-border/30 px-5 py-3 bg-muted/5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{filtered.length} concorrente{filtered.length !== 1 ? "s" : ""}</span>
              <span className="text-xs text-muted-foreground">Clique em uma linha para ver posts recentes</span>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 shrink-0">
            <RecentPostsPanel competitor={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>

      {/* Insights */}
      {competitors.length > 0 && (() => {
        // ── Insight 1: top engager ─────────────────────────────────────────────
        const topEng   = [...competitors].sort((a,b) => b.engagement - a.engagement)[0];
        const avgEngNum = competitors.reduce((s,c) => s + c.engagement, 0) / competitors.length;
        const engMulti = (topEng.engagement / (avgEngNum || 1)).toFixed(1);

        // ── Insight 2: fastest growing ─────────────────────────────────────────
        const topGrow   = [...competitors].sort((a,b) => b.growth - a.growth)[0];
        const negGrowth = competitors.filter(c => c.growth < 0).length;

        // ── Insight 3: posting frequency ──────────────────────────────────────
        const maxPosts  = [...competitors].sort((a,b) => b.postsPerWeek - a.postsPerWeek)[0];
        const minPosts  = [...competitors].sort((a,b) => a.postsPerWeek - b.postsPerWeek)[0];
        const avgPosts  = (competitors.reduce((s,c) => s + c.postsPerWeek, 0) / competitors.length).toFixed(1);

        const insights = [
          {
            icon: BarChart2,
            label: "Maior engajamento",
            color: "text-emerald-400",
            bg:    "bg-emerald-500/10",
            desc: topEng.engagement >= avgEngNum * 1.1
              ? `${topEng.name} lidera com ${topEng.engagement}% de engajamento — ${engMulti}× acima da média da lista (${avgEngNum.toFixed(1)}%).`
              : `Engajamento nivelado: ${topEng.name} tem ${topEng.engagement}% e a média da lista é ${avgEngNum.toFixed(1)}%.`,
          },
          {
            icon: TrendingUp,
            label: "Crescimento",
            color: topGrow.growth > 0 ? "text-blue-400" : "text-red-400",
            bg:    topGrow.growth > 0 ? "bg-blue-500/10"   : "bg-red-500/10",
            desc: topGrow.growth > 0
              ? `${topGrow.name} cresce ${topGrow.growth > 0 ? "+" : ""}${topGrow.growth}% MoM — o maior da lista.${negGrowth > 0 ? ` ${negGrowth} concorrente${negGrowth > 1 ? "s" : ""} em queda.` : " Todos crescendo."}`
              : `Nenhum concorrente com crescimento positivo — lista toda em queda ou estagnada. Menor perda: ${topGrow.name} (${topGrow.growth}%).`,
          },
          {
            icon: Zap,
            label: "Frequência de posts",
            color: "text-amber-400",
            bg:    "bg-amber-500/10",
            desc: `Média de ${avgPosts} posts/semana. ${maxPosts.name} é o mais ativo (${maxPosts.postsPerWeek}×/sem)${minPosts.id !== maxPosts.id ? `, enquanto ${minPosts.name} publica menos (${minPosts.postsPerWeek}×/sem)` : ""}.`,
          },
        ] as const;

        return (
          <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border/30">
              <h3 className="text-sm font-semibold">Insights Competitivos</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Baseado nos {competitors.length} concorrentes monitorados
              </p>
            </div>
            <div className="p-4 grid gap-3 sm:grid-cols-3">
              {insights.map(ins => (
                <div key={ins.label} className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/10 p-4">
                  <div className={`${ins.bg} rounded-xl p-2 shrink-0`}>
                    <ins.icon className={`h-4 w-4 ${ins.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-1">{ins.label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{ins.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <AddDialog open={dialogOpen} onOpenChange={setDialogOpen} onAdd={c => {
        setCompetitors(prev => {
          const idx = prev.findIndex(x => x.id === c.id);
          if (idx >= 0) { const next = [...prev]; next[idx] = c; return next; }
          return [c, ...prev];
        });
      }} />
    </div>
  );
}
