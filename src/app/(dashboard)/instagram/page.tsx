"use client";

import { useState } from "react";
import {
  Camera, Plus, CalendarClock, FileEdit,
  CheckCircle2, Lightbulb, Trash2, ImageIcon,
  Film, LayoutGrid, CircleDot, MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type PostType = "Feed" | "Reels" | "Stories" | "Carrossel";
type PostStatus = "agendado" | "rascunho" | "publicado" | "ideia";

interface Post {
  id: string;
  caption: string;
  type: PostType;
  status: PostStatus;
  scheduledAt?: string;
  createdAt: string;
}

const initialPosts: Post[] = [
  { id:"1", caption:"Tutorial: Como usar nossa plataforma em 5 passos 🚀", type:"Carrossel", status:"agendado",  scheduledAt:"2026-04-08T09:00", createdAt:"2026-04-05" },
  { id:"2", caption:"Bastidores do nosso processo criativo — um dia na empresa 🎬", type:"Reels", status:"agendado", scheduledAt:"2026-04-10T18:00", createdAt:"2026-04-04" },
  { id:"3", caption:"Enquete: qual conteúdo você quer ver mais por aqui?", type:"Stories", status:"agendado", scheduledAt:"2026-04-11T12:00", createdAt:"2026-04-04" },
  { id:"4", caption:"Dicas de produtividade para o dia a dia ✨", type:"Feed", status:"rascunho", createdAt:"2026-04-03" },
  { id:"5", caption:"Novidades que chegam em breve... fique de olho 👀", type:"Feed", status:"rascunho", createdAt:"2026-04-02" },
  { id:"6", caption:"Lançamento do novo recurso de analytics em tempo real", type:"Carrossel", status:"publicado", scheduledAt:"2026-04-01T10:00", createdAt:"2026-03-28" },
  { id:"7", caption:"Conheça o time por trás do ContentHub 💜", type:"Reels", status:"publicado", scheduledAt:"2026-03-28T14:00", createdAt:"2026-03-25" },
  { id:"8", caption:"5 tendências de conteúdo para 2026", type:"Carrossel", status:"publicado", scheduledAt:"2026-03-20T09:00", createdAt:"2026-03-17" },
  { id:"9",  caption:"Ideia: série semanal de 'mitos e verdades' do marketing digital", type:"Feed",     status:"ideia",     createdAt:"2026-04-05" },
  { id:"10", caption:"Mini-doc do processo de criação de conteúdo do zero",                type:"Reels",    status:"ideia",     createdAt:"2026-04-04" },
  { id:"11", caption:"Collab com criadores parceiros — gravar um dia de trabalho juntos",  type:"Stories",  status:"ideia",     createdAt:"2026-04-03" },

  // Agendados adicionais
  { id:"12", caption:"Como o algoritmo decide quem vê seu conteúdo — guia completo 2026 📊", type:"Carrossel", status:"agendado", scheduledAt:"2026-04-13T11:00", createdAt:"2026-04-05" },
  { id:"13", caption:"Reels da semana: tendências visuais que estão bombando no Insta 🔥",  type:"Reels",     status:"agendado", scheduledAt:"2026-04-15T18:00", createdAt:"2026-04-05" },
  { id:"14", caption:"3 erros de copywriting que destroem o engajamento (e como corrigir)", type:"Carrossel", status:"agendado", scheduledAt:"2026-04-18T10:00", createdAt:"2026-04-06" },

  // Rascunhos adicionais
  { id:"15", caption:"Bastidores: como planejamos um mês de conteúdo em apenas 2 horas ⏱️",   type:"Reels",    status:"rascunho", createdAt:"2026-04-05" },
  { id:"16", caption:"10 ferramentas que uso todo dia para criar conteúdo de qualidade 🛠️",   type:"Carrossel", status:"rascunho", createdAt:"2026-04-04" },
  { id:"17", caption:"O que aprendi depois de publicar 100 posts — honestidade total 🫶",      type:"Feed",     status:"rascunho", createdAt:"2026-04-03" },

  // Publicados adicionais
  { id:"18", caption:"Review: as melhores ferramentas de IA para criadores de conteúdo 🤖",  type:"Carrossel", status:"publicado", scheduledAt:"2026-03-15T10:00", createdAt:"2026-03-12" },
  { id:"19", caption:"Desafio 30 dias de conteúdo consistente — o resultado final 🎯",        type:"Reels",     status:"publicado", scheduledAt:"2026-03-10T18:00", createdAt:"2026-03-07" },
  { id:"20", caption:"Como dobrei meu engajamento em 60 dias sem investir em anúncios",       type:"Feed",      status:"publicado", scheduledAt:"2026-03-05T09:00", createdAt:"2026-03-02" },
  { id:"21", caption:"Por dentro do nosso calendário editorial — template gratuito 📅",       type:"Carrossel", status:"publicado", scheduledAt:"2026-02-28T11:00", createdAt:"2026-02-25" },

  // Backlog adicional
  { id:"22", caption:"Série: 'Um dia na vida de um criador de conteúdo' — stories diários 🎥", type:"Stories",  status:"ideia", createdAt:"2026-04-06" },
  { id:"23", caption:"Podcast visual em Reels: conversa com fundadores de startups digitais",  type:"Reels",    status:"ideia", createdAt:"2026-04-05" },
  { id:"24", caption:"Análise: o que os Reels virais dos últimos 6 meses têm em comum 📈",    type:"Carrossel", status:"ideia", createdAt:"2026-04-04" },
];

const typeConfig: Record<PostType, { icon: React.ElementType; label: string; color: string; dot: string }> = {
  Feed:      { icon: ImageIcon,  label:"Feed",      color:"text-blue-400",    dot:"bg-blue-400"    },
  Reels:     { icon: Film,       label:"Reels",     color:"text-violet-400",  dot:"bg-violet-400"  },
  Stories:   { icon: CircleDot,  label:"Stories",   color:"text-amber-400",   dot:"bg-amber-400"   },
  Carrossel: { icon: LayoutGrid, label:"Carrossel", color:"text-emerald-400", dot:"bg-emerald-400" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });
}

function PostCard({ post, onDelete }: { post: Post; onDelete: (id: string) => void }) {
  const { icon: TypeIcon, color, dot } = typeConfig[post.type];
  return (
    <Card className="card-lift flex flex-col gap-0 bg-card border-border/40 hover:border-border/80 transition-all duration-200 rounded-xl overflow-hidden group">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${dot} shrink-0`} />
            <TypeIcon className={`h-3.5 w-3.5 ${color}`} />
            <span className={`text-[11px] font-semibold tracking-wide ${color}`}>{post.type.toUpperCase()}</span>
          </div>
          <button
            onClick={() => onDelete(post.id)}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-destructive transition-all p-0.5 rounded"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 flex-1">
        <p className="text-[13px] leading-relaxed text-foreground/90 line-clamp-3 font-medium">
          {post.caption}
        </p>
      </CardContent>
      {post.scheduledAt && (
        <CardFooter className="px-4 pb-4 pt-0 border-t border-border/30 mt-2">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-3">
            <CalendarClock className="h-3 w-3" />
            <span>{formatDate(post.scheduledAt)}</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="h-12 w-12 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
        <MoreHorizontal className="h-5 w-5 text-muted-foreground/40" />
      </div>
      <p className="text-sm font-medium text-muted-foreground/60">Nenhum {label}</p>
    </div>
  );
}

const defaultForm = { caption:"", type:"" as PostType|"", status:"" as PostStatus|"", scheduledAt:"" };

function NewPostDialog({ open, onOpenChange, onSave }: {
  open: boolean; onOpenChange: (v:boolean)=>void; onSave:(p:Post)=>void;
}) {
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");

  function handleSave() {
    if (!form.caption.trim()) return setError("A legenda é obrigatória.");
    if (!form.type)           return setError("Selecione o tipo de post.");
    if (!form.status)         return setError("Selecione o status.");
    if (form.status === "agendado" && !form.scheduledAt) return setError("Informe a data de agendamento.");
    onSave({ id:crypto.randomUUID(), caption:form.caption.trim(), type:form.type as PostType,
      status:form.status as PostStatus, scheduledAt:form.scheduledAt||undefined, createdAt:new Date().toISOString().slice(0,10) });
    setForm(defaultForm); setError(""); onOpenChange(false);
  }
  function handleClose() { setForm(defaultForm); setError(""); onOpenChange(false); }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border/60 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-[15px] font-semibold">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Plus className="h-3.5 w-3.5 text-white" />
            </div>
            Nova ideia de post
          </DialogTitle>
        </DialogHeader>
        <Separator className="opacity-50" />
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Legenda</Label>
            <Textarea placeholder="Escreva a legenda ou ideia do post..."
              className="min-h-[96px] resize-none bg-background/60 border-border/60 text-sm rounded-xl"
              value={form.caption} onChange={e => setForm({...form, caption:e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Tipo</Label>
              <Select value={form.type} onValueChange={v => v != null && setForm({...form, type:v as PostType})}>
                <SelectTrigger className="bg-background/60 border-border/60 text-sm rounded-xl">
                  <SelectValue placeholder="Tipo..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/60 rounded-xl">
                  {(["Feed","Reels","Stories","Carrossel"] as PostType[]).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</Label>
              <Select value={form.status} onValueChange={v => v != null && setForm({...form, status:v as PostStatus})}>
                <SelectTrigger className="bg-background/60 border-border/60 text-sm rounded-xl">
                  <SelectValue placeholder="Status..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/60 rounded-xl">
                  {([["ideia","Ideia"],["rascunho","Rascunho"],["agendado","Agendado"],["publicado","Publicado"]] as [PostStatus,string][]).map(([v,l]) =>
                    <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.status === "agendado" && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Data de agendamento</Label>
              <Input type="datetime-local" className="bg-background/60 border-border/60 text-sm rounded-xl"
                value={form.scheduledAt} onChange={e => setForm({...form, scheduledAt:e.target.value})} />
            </div>
          )}
          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleClose}>Cancelar</Button>
          <Button size="sm" onClick={handleSave} className="gap-1.5 rounded-lg bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 transition-opacity border-0">
            <Plus className="h-3.5 w-3.5" />Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function InstagramPage() {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [dialogOpen, setDialogOpen] = useState(false);

  const agendados  = posts.filter(p => p.status === "agendado");
  const rascunhos  = posts.filter(p => p.status === "rascunho");
  const publicados = posts.filter(p => p.status === "publicado");
  const ideias     = posts.filter(p => p.status === "ideia");

  const stats = [
    { label:"Agendados",  count:agendados.length,  icon:CalendarClock, color:"text-blue-400",    bg:"bg-blue-500/10",    border:"border-blue-500/20"    },
    { label:"Rascunhos",  count:rascunhos.length,  icon:FileEdit,      color:"text-amber-400",   bg:"bg-amber-500/10",   border:"border-amber-500/20"   },
    { label:"Publicados", count:publicados.length, icon:CheckCircle2,  color:"text-emerald-400", bg:"bg-emerald-500/10", border:"border-emerald-500/20" },
    { label:"Backlog",    count:ideias.length,     icon:Lightbulb,     color:"text-violet-400",  bg:"bg-violet-500/10",  border:"border-violet-500/20"  },
  ];

  const tabs = [
    { value:"agendados",  label:"Agendados",  icon:CalendarClock, posts:agendados,  emptyLabel:"post agendado"  },
    { value:"rascunhos",  label:"Rascunhos",  icon:FileEdit,      posts:rascunhos,  emptyLabel:"rascunho"       },
    { value:"publicados", label:"Publicados", icon:CheckCircle2,  posts:publicados, emptyLabel:"post publicado" },
    { value:"backlog",    label:"Backlog",    icon:Lightbulb,     posts:ideias,     emptyLabel:"ideia no backlog"},
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-pink-500 to-amber-400 shadow-lg shadow-pink-500/20">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gestor de Instagram</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Gerencie posts, rascunhos, agendamentos e backlog de ideias.</p>
            </div>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)}
          className="gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 transition-opacity border-0 shadow-lg shadow-primary/20 px-5">
          <Plus className="h-4 w-4" />Nova ideia
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className={`card-lift relative rounded-2xl border bg-card p-4 overflow-hidden ${s.border}`}>
            <div className={`absolute inset-0 opacity-[0.04] ${s.bg}`} />
            <div className="relative flex items-center gap-3">
              <div className={`${s.bg} rounded-xl p-2.5 shrink-0 border ${s.border}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none tracking-tight">{s.count}</p>
                <p className="text-[11px] text-muted-foreground mt-1 font-medium">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="agendados" className="space-y-5">
        <TabsList className="bg-card border border-border/50 h-10 p-1 rounded-xl gap-0.5">
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}
              className="text-xs gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-3">
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              <span className="ml-0.5 rounded-full bg-muted/60 px-1.5 py-0 text-[10px] text-muted-foreground font-medium tabular-nums">
                {tab.posts.length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tab.posts.length === 0
                ? <EmptyState label={tab.emptyLabel} />
                : tab.posts.map(post => (
                    <PostCard key={post.id} post={post} onDelete={id => setPosts(prev => prev.filter(p => p.id !== id))} />
                  ))
              }
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <NewPostDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={post => setPosts(prev => [post, ...prev])} />
    </div>
  );
}
