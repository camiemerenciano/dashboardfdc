"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, Clock,
  CheckCircle2, CalendarClock, X, ImageIcon, Film,
  LayoutGrid, CircleDot, Newspaper, Video, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Platform = "Instagram" | "YouTube" | "TikTok" | "Blog" | "Newsletter";
type PostType  = "Feed" | "Reels" | "Stories" | "Carrossel" | "Vídeo" | "Short" | "Artigo";
type Status    = "agendado" | "publicado";
interface CalPost { id:string; title:string; platform:Platform; type:PostType; status:Status; date:string; time:string; }

const PLATFORM: Record<Platform,{color:string;dot:string;border:string;icon:React.ElementType;filterActive:string}> = {
  Instagram:  { color:"bg-violet-500/15 text-violet-300",  dot:"bg-violet-400",  border:"border-violet-500/30",  icon:CircleDot,  filterActive:"bg-violet-500/20 border-violet-400/50 text-violet-300"  },
  YouTube:    { color:"bg-red-500/15 text-red-300",        dot:"bg-red-400",     border:"border-red-500/30",     icon:Video,    filterActive:"bg-red-500/20 border-red-400/50 text-red-300"           },
  TikTok:     { color:"bg-cyan-500/15 text-cyan-300",      dot:"bg-cyan-400",    border:"border-cyan-500/30",    icon:Film,       filterActive:"bg-cyan-500/20 border-cyan-400/50 text-cyan-300"         },
  Blog:       { color:"bg-blue-500/15 text-blue-300",      dot:"bg-blue-400",    border:"border-blue-500/30",    icon:Newspaper,  filterActive:"bg-blue-500/20 border-blue-400/50 text-blue-300"         },
  Newsletter: { color:"bg-amber-500/15 text-amber-300",    dot:"bg-amber-400",   border:"border-amber-500/30",   icon:Mail,       filterActive:"bg-amber-500/20 border-amber-400/50 text-amber-300"      },
};
const TYPE_ICON: Record<PostType,React.ElementType> = { Feed:ImageIcon, Reels:Film, Stories:CircleDot, Carrossel:LayoutGrid, Vídeo:Video, Short:Film, Artigo:Newspaper };
const PLATFORMS = Object.keys(PLATFORM) as Platform[];
const WEEK_DAYS  = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const TODAY = new Date(2026, 3, 6);

const POSTS: CalPost[] = [
  {id:"1",  title:"Tutorial em 5 passos 🚀",            platform:"Instagram",  type:"Carrossel", status:"publicado", date:"2026-04-01", time:"09:00"},
  {id:"2",  title:"Tendências de conteúdo 2026",         platform:"Blog",       type:"Artigo",    status:"publicado", date:"2026-04-01", time:"11:00"},
  {id:"3",  title:"Enquete: qual formato preferem?",     platform:"Instagram",  type:"Stories",   status:"publicado", date:"2026-04-02", time:"14:00"},
  {id:"4",  title:"Short: produtividade em 60s",         platform:"YouTube",    type:"Short",     status:"publicado", date:"2026-04-03", time:"18:00"},
  {id:"5",  title:"Dança de tendência #viral",           platform:"TikTok",     type:"Short",     status:"publicado", date:"2026-04-03", time:"20:00"},
  {id:"6",  title:"Conheça o time ContentHub 💜",        platform:"Instagram",  type:"Reels",     status:"publicado", date:"2026-04-04", time:"10:00"},
  {id:"7",  title:"Newsletter: abril em destaque",       platform:"Newsletter", type:"Artigo",    status:"publicado", date:"2026-04-05", time:"08:00"},
  {id:"8",  title:"Bastidores do processo criativo",     platform:"Instagram",  type:"Reels",     status:"publicado", date:"2026-04-05", time:"18:00"},
  {id:"9",  title:"Dica da semana ✨",                   platform:"Instagram",  type:"Feed",      status:"agendado",  date:"2026-04-07", time:"09:00"},
  {id:"10", title:"Review de ferramenta de design",      platform:"YouTube",    type:"Vídeo",     status:"agendado",  date:"2026-04-08", time:"15:00"},
  {id:"11", title:"Carrossel: erros comuns no Insta",    platform:"Instagram",  type:"Carrossel", status:"agendado",  date:"2026-04-08", time:"11:00"},
  {id:"12", title:"Tutorial de edição de Reels",         platform:"TikTok",     type:"Short",     status:"agendado",  date:"2026-04-09", time:"19:00"},
  {id:"13", title:"Artigo: algoritmo do Instagram",      platform:"Blog",       type:"Artigo",    status:"agendado",  date:"2026-04-10", time:"09:00"},
  {id:"14", title:"Mitos e verdades do marketing",       platform:"Instagram",  type:"Carrossel", status:"agendado",  date:"2026-04-10", time:"12:00"},
  {id:"15", title:"Stories: nos bastidores hoje",        platform:"Instagram",  type:"Stories",   status:"agendado",  date:"2026-04-11", time:"14:00"},
  {id:"16", title:"Short: 3 ferramentas gratuitas",      platform:"YouTube",    type:"Short",     status:"agendado",  date:"2026-04-12", time:"10:00"},
  {id:"17", title:"Post motivacional de segunda",        platform:"Instagram",  type:"Feed",      status:"agendado",  date:"2026-04-14", time:"08:00"},
  {id:"18", title:"Newsletter: tendências da semana",    platform:"Newsletter", type:"Artigo",    status:"agendado",  date:"2026-04-15", time:"08:00"},
  {id:"19", title:"Collab: dia de trabalho juntos",      platform:"Instagram",  type:"Reels",     status:"agendado",  date:"2026-04-16", time:"17:00"},
  {id:"20", title:"Vídeo: como montar calendário",       platform:"YouTube",    type:"Vídeo",     status:"agendado",  date:"2026-04-17", time:"14:00"},
  {id:"21", title:"Dança de tendência pt.2",             platform:"TikTok",     type:"Short",     status:"agendado",  date:"2026-04-18", time:"21:00"},
  {id:"22", title:"Carrossel: métricas que importam",    platform:"Instagram",  type:"Carrossel", status:"agendado",  date:"2026-04-21", time:"11:00"},
  {id:"23", title:"Artigo: SEO para redes sociais",      platform:"Blog",       type:"Artigo",    status:"agendado",  date:"2026-04-22", time:"09:00"},
  {id:"24", title:"Bastidores: gravação da semana",      platform:"Instagram",  type:"Stories",   status:"agendado",  date:"2026-04-23", time:"15:00"},
  {id:"25", title:"Review: app de agendamento",          platform:"YouTube",    type:"Vídeo",     status:"agendado",  date:"2026-04-24", time:"16:00"},
  {id:"26", title:"Newsletter: melhores posts de abril", platform:"Newsletter", type:"Artigo",    status:"agendado",  date:"2026-04-28", time:"08:00"},
  {id:"27", title:"Enquete: temas para maio",            platform:"Instagram",  type:"Stories",   status:"agendado",  date:"2026-04-29", time:"13:00"},
  {id:"28", title:"Reels: compilado do mês 🎉",          platform:"Instagram",  type:"Reels",     status:"agendado",  date:"2026-04-30", time:"18:00"},

  // Dias adicionais para visual mais completo
  {id:"29", title:"Short: 5 atalhos de edição rápida",  platform:"YouTube",    type:"Short",     status:"publicado", date:"2026-04-02", time:"16:00"},
  {id:"30", title:"Post LinkedIn: gestão de conteúdo",  platform:"Blog",       type:"Artigo",    status:"publicado", date:"2026-04-04", time:"10:00"},
  {id:"31", title:"Newsletter: semana de ferramentas",  platform:"Newsletter", type:"Artigo",    status:"publicado", date:"2026-04-05", time:"08:00"},
  {id:"32", title:"Short: tendências visuais em 60s",   platform:"TikTok",     type:"Short",     status:"publicado", date:"2026-04-03", time:"21:00"},
  {id:"33", title:"Carrossel: erros de copy no feed",   platform:"Instagram",  type:"Carrossel", status:"agendado",  date:"2026-04-08", time:"10:00"},
  {id:"34", title:"Newsletter: novidades de abril",     platform:"Newsletter", type:"Artigo",    status:"agendado",  date:"2026-04-08", time:"08:30"},
  {id:"35", title:"Artigo: ROI em redes sociais",       platform:"Blog",       type:"Artigo",    status:"agendado",  date:"2026-04-09", time:"09:00"},
  {id:"36", title:"Feed: citação motivacional",         platform:"Instagram",  type:"Feed",      status:"agendado",  date:"2026-04-11", time:"08:00"},
  {id:"37", title:"Short: comparativo de apps de edição", platform:"TikTok",   type:"Short",     status:"agendado",  date:"2026-04-12", time:"20:00"},
  {id:"38", title:"Vídeo: planejamento de conteúdo",    platform:"YouTube",    type:"Vídeo",     status:"agendado",  date:"2026-04-13", time:"15:00"},
  {id:"39", title:"Carrossel: IA no dia a dia criativo",platform:"Instagram",  type:"Carrossel", status:"agendado",  date:"2026-04-15", time:"11:00"},
  {id:"40", title:"Artigo: algoritmo do YouTube 2026",  platform:"Blog",       type:"Artigo",    status:"agendado",  date:"2026-04-16", time:"10:00"},
  {id:"41", title:"Short: hack de produtividade",       platform:"TikTok",     type:"Short",     status:"agendado",  date:"2026-04-17", time:"19:00"},
  {id:"42", title:"Newsletter: análise da semana",      platform:"Newsletter", type:"Artigo",    status:"agendado",  date:"2026-04-22", time:"08:00"},
  {id:"43", title:"Short: tendência visual do mês",     platform:"YouTube",    type:"Short",     status:"agendado",  date:"2026-04-23", time:"18:00"},
  {id:"44", title:"Feed: bastidores da gravação",       platform:"Instagram",  type:"Feed",      status:"agendado",  date:"2026-04-25", time:"13:00"},
  {id:"45", title:"Artigo: criação de conteúdo com IA", platform:"Blog",       type:"Artigo",    status:"agendado",  date:"2026-04-25", time:"09:00"},
  {id:"46", title:"Short: reação a trend viral",        platform:"TikTok",     type:"Short",     status:"agendado",  date:"2026-04-28", time:"21:00"},
  {id:"47", title:"Vídeo: review de ferramenta premium", platform:"YouTube",   type:"Vídeo",     status:"agendado",  date:"2026-04-29", time:"16:00"},
  {id:"48", title:"Carrossel: recap do mês de abril",   platform:"Instagram",  type:"Carrossel", status:"agendado",  date:"2026-04-30", time:"11:00"},
];

function getMonthGrid(year: number, month: number): (number|null)[] {
  const fd = new Date(year, month, 1).getDay();
  const offset = fd === 0 ? 6 : fd - 1;
  const dim = new Date(year, month + 1, 0).getDate();
  const cells: (number|null)[] = Array(offset).fill(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function Chip({ post, pick }: { post: CalPost; pick: () => void }) {
  const c = PLATFORM[post.platform];
  return (
    <button onClick={(e) => { e.stopPropagation(); pick(); }} title={post.title}
      className={`w-full text-left rounded-md px-2 py-0.5 text-[10px] font-medium border truncate leading-snug
        transition-opacity hover:opacity-75 ${c.color} ${c.border} ${post.status === "agendado" ? "opacity-75" : ""}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1 shrink-0 align-middle ${c.dot}`} />
      {post.title}
    </button>
  );
}

function DayDetail({ dateLabel, posts, onClose }: { dateLabel:string; posts:CalPost[]; onClose:()=>void }) {
  const agendados  = posts.filter(p => p.status === "agendado");
  const publicados = posts.filter(p => p.status === "publicado");
  function PostItem({ p }: { p: CalPost }) {
    const c = PLATFORM[p.platform];
    const TI = TYPE_ICON[p.type];
    return (
      <div className={`rounded-xl border p-3.5 space-y-2 ${c.color} ${c.border}`}>
        <p className="text-xs font-medium leading-snug">{p.title}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border font-medium ${c.border} ${c.color}`}>{p.platform}</Badge>
          <div className="flex items-center gap-1 text-[10px] opacity-70"><TI className="h-3 w-3" /><span>{p.type}</span></div>
          <span className="ml-auto text-[10px] opacity-70 flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{p.time}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden sticky top-0">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
        <div>
          <p className="text-sm font-semibold capitalize">{dateLabel}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{posts.length} publicação{posts.length !== 1 ? "ões" : ""}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors rounded p-1">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4 space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
        {posts.length === 0
          ? <p className="text-xs text-muted-foreground text-center py-6">Nenhum conteúdo neste dia.</p>
          : <>
              {agendados.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Agendados ({agendados.length})</span>
                  </div>
                  {agendados.map(p => <PostItem key={p.id} p={p} />)}
                </div>
              )}
              {agendados.length > 0 && publicados.length > 0 && <Separator />}
              {publicados.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Publicados ({publicados.length})</span>
                  </div>
                  {publicados.map(p => <PostItem key={p.id} p={p} />)}
                </div>
              )}
            </>
        }
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [current, setCurrent]          = useState(new Date(2026, 3, 1));
  const [activePlatforms, setActive]   = useState<Set<Platform>>(new Set());
  const [selectedDay, setSelectedDay]  = useState<number | null>(6);

  const year  = current.getFullYear();
  const month = current.getMonth();
  const grid  = useMemo(() => getMonthGrid(year, month), [year, month]);

  const visible = useMemo(
    () => POSTS.filter(p => activePlatforms.size === 0 || activePlatforms.has(p.platform)),
    [activePlatforms]
  );

  const byDay = useMemo(() => {
    const map: Record<number, CalPost[]> = {};
    visible.forEach(p => {
      const [y,m,d] = p.date.split("-").map(Number);
      if (y === year && m - 1 === month) { if (!map[d]) map[d] = []; map[d].push(p); }
    });
    return map;
  }, [visible, year, month]);

  const toggle = (p: Platform) => setActive(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });
  const isToday = (d: number) => d === TODAY.getDate() && month === TODAY.getMonth() && year === TODAY.getFullYear();

  const dateLabel = selectedDay
    ? new Date(year, month, selectedDay).toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long" })
    : null;

  const inMonth = (p: CalPost) => { const [y,m] = p.date.split("-").map(Number); return y === year && m - 1 === month; };
  const agCount  = visible.filter(p => p.status === "agendado"  && inMonth(p)).length;
  const pubCount = visible.filter(p => p.status === "publicado" && inMonth(p)).length;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/20">
            <CalendarDays className="h-5 w-5 text-white" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight">Calendário de Conteúdo</h1>
            <p className="text-sm text-muted-foreground">Visualize e planeje suas publicações em todas as plataformas.</p>
          </div>
        </div>
        <Button className="gap-2 shrink-0 self-start bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 transition-opacity border-0 shadow-lg shadow-primary/20 rounded-xl px-5"><Plus className="h-4 w-4" />Nova publicação</Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        {/* Month nav */}
        <div className="flex items-center gap-2 flex-wrap rounded-xl border border-border/50 bg-card px-4 py-2">
          <button onClick={() => { setCurrent(new Date(year, month-1, 1)); setSelectedDay(null); }}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold w-36 text-center select-none">{MONTH_NAMES[month]} {year}</span>
          <button onClick={() => { setCurrent(new Date(year, month+1, 1)); setSelectedDay(null); }}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="text-[11px] rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 px-2 py-0.5 select-none ml-1">
            {agCount} agendados
          </span>
          <span className="text-[11px] rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 px-2 py-0.5 select-none">
            {pubCount} publicados
          </span>
        </div>

        {/* Platform filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {PLATFORMS.map(p => {
            const c = PLATFORM[p]; const PIcon = c.icon; const active = activePlatforms.has(p);
            return (
              <button key={p} onClick={() => toggle(p)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                  active ? c.filterActive : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border"}`}>
                <PIcon className="h-3 w-3" />{p}
              </button>
            );
          })}
          {activePlatforms.size > 0 && (
            <button onClick={() => setActive(new Set())} className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 ml-0.5">
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Calendar + Detail */}
      <div className="flex gap-4 items-start">

        {/* Grid */}
        <div className="flex-1 min-w-0">
          <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-border/40">
              {WEEK_DAYS.map(d => (
                <div key={d} className="py-3 bg-muted/5 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-wide select-none">{d}</div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-border/25">
              {grid.map((day, i) => {
                if (day === null) return <div key={`e-${i}`} className="min-h-[108px] bg-muted/5" />;
                const dayPosts = byDay[day] ?? [];
                const shown    = dayPosts.slice(0, 3);
                const extra    = dayPosts.length - shown.length;
                const today    = isToday(day);
                const selected = selectedDay === day;
                return (
                  <div key={day} onClick={() => setSelectedDay(selected ? null : day)}
                    className={`min-h-[108px] p-2 flex flex-col gap-1 cursor-pointer transition-colors
                      ${selected ? "bg-primary/10 ring-1 ring-inset ring-primary/25" : "hover:bg-muted/15"}`}>
                    <div className="flex justify-end">
                      <span className={`h-5 w-5 flex items-center justify-center rounded-full text-xs font-medium select-none
                        ${today    ? "bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/40"
                        : selected ? "text-primary font-semibold"
                        :            "text-muted-foreground"}`}>
                        {day}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1">
                      {shown.map(p => <Chip key={p.id} post={p} pick={() => setSelectedDay(day)} />)}
                      {extra > 0 && <span className="text-[10px] text-muted-foreground pl-1.5 select-none">+{extra} mais</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-x-4 gap-y-1.5 mt-4 px-1 flex-wrap">
            {PLATFORMS.map(p => (
              <div key={p} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${PLATFORM[p].dot}`} />
                <span className="text-[11px] text-muted-foreground">{p}</span>
              </div>
            ))}
            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-5 rounded-sm bg-muted/50 border border-border/50 opacity-75" />
                <span className="text-[11px] text-muted-foreground">Agendado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-5 rounded-sm bg-violet-400/60 border border-violet-400/70" />
                <span className="text-[11px] text-muted-foreground">Publicado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selectedDay !== null && dateLabel && (
          <div className="w-72 shrink-0">
            <DayDetail dateLabel={dateLabel} posts={byDay[selectedDay] ?? []} onClose={() => setSelectedDay(null)} />
          </div>
        )}
      </div>
    </div>
  );
}
