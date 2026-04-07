"use client";

import { useState, useMemo } from "react";
import {
  BarChart2, TrendingUp, TrendingDown, Eye, Heart,
  Users, Star, Camera, CalendarIcon, ExternalLink,
  ImageIcon, Film, LayoutGrid, CircleDot, Lightbulb,
  Flame, Zap, Award,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Range = "7d" | "30d" | "90d";
type PostType = "Feed" | "Reels" | "Stories" | "Carrossel";

interface TopPost {
  id: string; caption: string; type: PostType;
  impressions: number; engagement: number; likes: number; publishedAt: string;
}
interface DailyMetric { date: string; impressoes: number; engajamentos: number; seguidores: number; }
interface BarMetric   { type: PostType; impressoes: number; engajamentos: number; }

const BASE_DAILY: DailyMetric[] = [
  { date:"07/03", impressoes:4200,  engajamentos:310,  seguidores:12 },
  { date:"08/03", impressoes:3800,  engajamentos:280,  seguidores:8  },
  { date:"09/03", impressoes:5100,  engajamentos:420,  seguidores:15 },
  { date:"10/03", impressoes:4700,  engajamentos:390,  seguidores:10 },
  { date:"11/03", impressoes:6300,  engajamentos:510,  seguidores:18 },
  { date:"12/03", impressoes:5900,  engajamentos:480,  seguidores:14 },
  { date:"13/03", impressoes:7200,  engajamentos:590,  seguidores:22 },
  { date:"14/03", impressoes:6100,  engajamentos:520,  seguidores:16 },
  { date:"15/03", impressoes:5800,  engajamentos:490,  seguidores:12 },
  { date:"16/03", impressoes:6900,  engajamentos:570,  seguidores:19 },
  { date:"17/03", impressoes:7400,  engajamentos:600,  seguidores:21 },
  { date:"18/03", impressoes:8200,  engajamentos:680,  seguidores:25 },
  { date:"19/03", impressoes:7800,  engajamentos:640,  seguidores:23 },
  { date:"20/03", impressoes:9100,  engajamentos:740,  seguidores:28 },
  { date:"21/03", impressoes:8500,  engajamentos:700,  seguidores:24 },
  { date:"22/03", impressoes:9300,  engajamentos:760,  seguidores:30 },
  { date:"23/03", impressoes:8700,  engajamentos:720,  seguidores:27 },
  { date:"24/03", impressoes:10200, engajamentos:840,  seguidores:33 },
  { date:"25/03", impressoes:9800,  engajamentos:800,  seguidores:29 },
  { date:"26/03", impressoes:11400, engajamentos:920,  seguidores:36 },
  { date:"27/03", impressoes:10600, engajamentos:880,  seguidores:32 },
  { date:"28/03", impressoes:12100, engajamentos:980,  seguidores:38 },
  { date:"29/03", impressoes:11500, engajamentos:940,  seguidores:35 },
  { date:"30/03", impressoes:13200, engajamentos:1060, seguidores:41 },
  { date:"31/03", impressoes:12400, engajamentos:1010, seguidores:37 },
  { date:"01/04", impressoes:14100, engajamentos:1140, seguidores:44 },
  { date:"02/04", impressoes:13600, engajamentos:1100, seguidores:40 },
  { date:"03/04", impressoes:15200, engajamentos:1220, seguidores:47 },
  { date:"04/04", impressoes:14500, engajamentos:1180, seguidores:43 },
  { date:"05/04", impressoes:16300, engajamentos:1320, seguidores:51 },
];

const barData: BarMetric[] = [
  { type:"Feed",      impressoes:38400, engajamentos:2940 },
  { type:"Reels",     impressoes:87200, engajamentos:7810 },
  { type:"Stories",   impressoes:21300, engajamentos:1420 },
  { type:"Carrossel", impressoes:54100, engajamentos:4980 },
];

const topPosts: TopPost[] = [
  { id:"1", caption:"Tutorial: Como usar nossa plataforma em 5 passos 🚀",        type:"Carrossel", impressions:24300, engagement:8.4, likes:1820, publishedAt:"01/04" },
  { id:"2", caption:"Bastidores do nosso processo criativo — um dia na empresa 🎬", type:"Reels",     impressions:19700, engagement:7.1, likes:1540, publishedAt:"28/03" },
  { id:"3", caption:"5 tendências de conteúdo para 2026",                          type:"Carrossel", impressions:14900, engagement:6.3, likes:1210, publishedAt:"20/03" },
  { id:"4", caption:"Conheça o time por trás do ContentHub 💜",                    type:"Reels",     impressions:12800, engagement:5.8, likes:1050, publishedAt:"28/03" },
  { id:"5", caption:"Dicas de produtividade para o dia a dia ✨",                  type:"Feed",      impressions:9400,  engagement:4.2, likes:780,  publishedAt:"15/03" },
  { id:"6", caption:"Review: melhores ferramentas de IA para criadores 🤖",        type:"Carrossel", impressions:8100,  engagement:3.9, likes:720,  publishedAt:"15/03" },
  { id:"7", caption:"Desafio 30 dias de conteúdo consistente — resultado final 🎯",type:"Reels",     impressions:7600,  engagement:5.1, likes:890,  publishedAt:"10/03" },
  { id:"8", caption:"Como planejar um mês de conteúdo em apenas 2 horas ⏱️",      type:"Carrossel", impressions:5300,  engagement:4.7, likes:610,  publishedAt:"05/03" },
];

const typeConfig: Record<PostType, { icon: React.ElementType; color: string; badge: string }> = {
  Feed:      { icon:ImageIcon,  color:"text-blue-400",    badge:"border-blue-500/25 bg-blue-500/10 text-blue-400"       },
  Reels:     { icon:Film,       color:"text-violet-400",  badge:"border-violet-500/25 bg-violet-500/10 text-violet-400" },
  Stories:   { icon:CircleDot,  color:"text-amber-400",   badge:"border-amber-500/25 bg-amber-500/10 text-amber-400"   },
  Carrossel: { icon:LayoutGrid, color:"text-emerald-400", badge:"border-emerald-500/25 bg-emerald-500/10 text-emerald-400" },
};

function fmt(n: number) { return n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n); }
function pct(a: number, b: number) {
  if (b === 0) return "—";
  const diff = ((a - b) / b) * 100;
  return `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
}
function sum(data: DailyMetric[], key: keyof Omit<DailyMetric,"date">) {
  return data.reduce((a, d) => a + d[key], 0);
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: {color:string;name:string;value:number}[]; label?: string;
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

function KpiCard({ label, value, change, up, icon: Icon, accentColor, glowColor, context }: {
  label: string; value: string; change: string; up: boolean;
  icon: React.ElementType; accentColor: string; glowColor: string;
  context?: string;
}) {
  return (
    <div className="card-lift relative rounded-2xl border bg-card overflow-hidden border-border/40">
      <div className={`absolute top-0 inset-x-0 h-px ${accentColor} opacity-60`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${glowColor} shrink-0`}>
            <Icon className={`h-3.5 w-3.5 ${accentColor}`} />
          </div>
        </div>
        <p className="text-2xl font-bold leading-none tracking-tight">{value}</p>
        <div className="flex items-center gap-1.5 mt-2">
          {up
            ? <TrendingUp  className="h-3 w-3 text-emerald-400" />
            : <TrendingDown className="h-3 w-3 text-red-400" />}
          <span className={`text-xs font-semibold ${up ? "text-emerald-400" : "text-red-400"}`}>{change}</span>
          <span className="text-xs text-muted-foreground">vs. quinzena ant.</span>
        </div>
        {context && (
          <p className="text-[10px] text-muted-foreground/60 mt-1.5 leading-snug">{context}</p>
        )}
      </CardContent>
    </div>
  );
}

// ─── Insight strip ────────────────────────────────────────────────────────────

interface Insight {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  sub: string;
}

function InsightStrip({ insights }: { insights: Insight[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {insights.map((ins) => (
        <div key={ins.label} className="card-lift rounded-2xl border border-border/40 bg-card flex items-start gap-3 p-4">
          <div className={`${ins.iconBg} rounded-xl p-2 shrink-0 mt-0.5`}>
            <ins.icon className={`h-4 w-4 ${ins.iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{ins.label}</p>
            <p className="text-sm font-bold leading-snug">{ins.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{ins.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RangeSelector({ value, onChange }: { value: Range; onChange: (r:Range)=>void }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-card p-1">
      <CalendarIcon className="ml-1.5 h-3.5 w-3.5 text-muted-foreground shrink-0" />
      {([["7d","7d"],["30d","30d"],["90d","90d"]] as [Range,string][]).map(([v,l]) => (
        <button key={v} onClick={() => onChange(v)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            value === v
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
              : "text-muted-foreground hover:text-foreground"
          }`}>
          {l}
        </button>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>("30d");
  const days  = range === "7d" ? 7 : 30;
  const daily = useMemo(() => BASE_DAILY.slice(-days), [days]);

  // Period comparison: first half vs second half
  const mid        = Math.floor(daily.length / 2);
  const firstHalf  = daily.slice(0, mid);
  const secondHalf = daily.slice(mid);

  const totalImpressions  = sum(daily, "impressoes");
  const totalEngagements  = sum(daily, "engajamentos");
  const totalFollowers    = sum(daily, "seguidores");
  const engRate           = ((totalEngagements / totalImpressions) * 100).toFixed(2);
  const tickInterval      = daily.length <= 7 ? 0 : 4;

  const imp1 = sum(firstHalf, "impressoes");   const imp2 = sum(secondHalf, "impressoes");
  const eng1 = sum(firstHalf, "engajamentos"); const eng2 = sum(secondHalf, "engajamentos");
  const flw1 = sum(firstHalf, "seguidores");   const flw2 = sum(secondHalf, "seguidores");
  const er1  = imp1 > 0 ? (eng1 / imp1) * 100 : 0;
  const er2  = imp2 > 0 ? (eng2 / imp2) * 100 : 0;

  const bestDay  = daily.reduce((b, d) => d.impressoes > b.impressoes ? d : b, daily[0]);
  const avgEngPosts = topPosts.reduce((s, p) => s + p.engagement, 0) / topPosts.length;

  // Engagement rate per format (engajamentos per impression)
  const engRateByType = barData.map(b => ({
    ...b,
    rate: (b.engajamentos / b.impressoes) * 100,
  }));
  const bestFormat = engRateByType.reduce((b, d) => d.rate > b.rate ? d : b, engRateByType[0]);
  const reels      = engRateByType.find(d => d.type === "Reels")!;
  const carrossel  = engRateByType.find(d => d.type === "Carrossel")!;
  const reelsVsCarrossel = ((reels.impressoes / carrossel.impressoes)).toFixed(1);

  const insights: Insight[] = [
    {
      icon: Flame, iconColor: "text-orange-400", iconBg: "bg-orange-500/10",
      label: "Aceleração do período",
      value: `+${Math.round(((imp2 - imp1) / imp1) * 100)}% nas impressões`,
      sub: `A segunda quinzena superou a primeira em todas as métricas — tendência de alta consistente.`,
    },
    {
      icon: Award, iconColor: "text-emerald-400", iconBg: "bg-emerald-500/10",
      label: "Formato mais eficiente",
      value: `${bestFormat.type} — ${bestFormat.rate.toFixed(1)}% engaj./alcance`,
      sub: `Reels gera ${reelsVsCarrossel}× mais alcance que Carrossel, mas Carrossel converte melhor por impressão.`,
    },
    {
      icon: Zap, iconColor: "text-amber-400", iconBg: "bg-amber-500/10",
      label: "Pico do período",
      value: `${bestDay.date} com ${fmt(bestDay.impressoes)} impressões`,
      sub: `${bestDay.engajamentos.toLocaleString("pt-BR")} engajamentos e ${bestDay.seguidores} novos seguidores neste dia.`,
    },
  ];

  const axisStyle = { fontSize:10, fill:"oklch(0.56 0.010 265)" };
  const gridStyle = { stroke:"oklch(1 0 0 / 5%)", strokeDasharray:"4 4" };

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
              <BarChart2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm text-muted-foreground">Performance do conteúdo</p>
                <Badge variant="outline" className="gap-1.5 border-sky-500/30 bg-sky-500/10 text-sky-400 text-[10px] px-2 py-0 h-4">
                  <Camera className="h-2.5 w-2.5" />Metricool
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total de Impressões" value={fmt(totalImpressions)}
          change={pct(imp2, imp1)} up={imp2 >= imp1}
          icon={Eye} accentColor="text-blue-400" glowColor="bg-blue-500/10"
          context={`Média diária: ${fmt(Math.round(totalImpressions/daily.length))}`} />
        <KpiCard label="Taxa de Engajamento" value={`${engRate}%`}
          change={`${er2 >= er1 ? "+" : ""}${(er2 - er1).toFixed(2)}pp`} up={er2 >= er1}
          icon={Heart} accentColor="text-pink-400" glowColor="bg-pink-500/10"
          context={`${er2.toFixed(2)}% na 2ª quinzena`} />
        <KpiCard label="Novos Seguidores" value={`+${fmt(totalFollowers)}`}
          change={pct(flw2, flw1)} up={flw2 >= flw1}
          icon={Users} accentColor="text-emerald-400" glowColor="bg-emerald-500/10"
          context={`+${fmt(Math.round(totalFollowers/daily.length))}/dia em média`} />
        <KpiCard label="Melhor Engajamento" value="8,4%"
          change="+1,2pp" up
          icon={Star} accentColor="text-amber-400" glowColor="bg-amber-500/10"
          context="Tutorial em 5 passos — 01/04" />
      </div>

      {/* Insights */}
      <InsightStrip insights={insights} />

      {/* Area chart */}
      <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
        <div className="flex items-start justify-between gap-2 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold">Impressões &amp; Engajamentos</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Evolução diária — linha de referência = média do período</p>
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 border-border/40 text-muted-foreground h-5">via Metricool</Badge>
        </div>
        <Separator className="opacity-40" />
        <div className="px-2 pb-4 pt-4">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={daily} margin={{ top:4, right:12, left:-8, bottom:0 }}>
              <defs>
                <linearGradient id="gImp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gEng" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#34d399" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} {...gridStyle} />
              <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} interval={tickInterval} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={fmt} width={38} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke:"oklch(1 0 0 / 8%)", strokeWidth:1 }} />
              <ReferenceLine y={Math.round(totalImpressions / daily.length)}
                stroke="#818cf8" strokeDasharray="4 3" strokeOpacity={0.35}
                label={{ value:`média`, position:"insideTopRight", fontSize:9, fill:"oklch(0.56 0.010 265)", dy:-4 }} />
              <Legend wrapperStyle={{ fontSize:11, paddingTop:16 }}
                formatter={v => <span style={{ color:"oklch(0.70 0.005 265)" }}>{v}</span>} />
              <Area type="monotone" dataKey="impressoes"   name="Impressões"   stroke="#818cf8" strokeWidth={2}
                fill="url(#gImp)" dot={false} activeDot={{ r:4, strokeWidth:0, fill:"#818cf8" }} />
              <Area type="monotone" dataKey="engajamentos" name="Engajamentos" stroke="#34d399" strokeWidth={2}
                fill="url(#gEng)" dot={false} activeDot={{ r:4, strokeWidth:0, fill:"#34d399" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
          <div className="px-5 py-4">
            <h3 className="text-sm font-semibold">Desempenho por Tipo de Post</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Reels lidera em alcance · Carrossel lidera em eficiência ({bestFormat.rate.toFixed(1)}% engaj./alcance)
            </p>
          </div>
          <Separator className="opacity-40" />
          <div className="px-2 pb-4 pt-4">
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={barData} margin={{ top:4, right:12, left:-8, bottom:0 }} barCategoryGap="32%">
                <CartesianGrid vertical={false} {...gridStyle} />
                <XAxis dataKey="type" tick={axisStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={fmt} width={38} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill:"oklch(1 0 0 / 3%)" }} />
                <Legend wrapperStyle={{ fontSize:11, paddingTop:16 }}
                  formatter={v => <span style={{ color:"oklch(0.70 0.005 265)" }}>{v}</span>} />
                <Bar dataKey="impressoes"   name="Impressões"   fill="#818cf8" radius={[5,5,0,0]} maxBarSize={36} />
                <Bar dataKey="engajamentos" name="Engajamentos" fill="#34d399" radius={[5,5,0,0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
          <div className="px-5 py-4">
            <h3 className="text-sm font-semibold">Crescimento de Seguidores</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pico: <span className="font-medium text-foreground">{bestDay.date}</span> com {bestDay.seguidores} novos seguidores
            </p>
          </div>
          <Separator className="opacity-40" />
          <div className="px-2 pb-4 pt-4">
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={daily} margin={{ top:4, right:12, left:-8, bottom:0 }} barCategoryGap="22%">
                <CartesianGrid vertical={false} {...gridStyle} />
                <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} interval={tickInterval} />
                <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill:"oklch(1 0 0 / 3%)" }} />
                <ReferenceLine y={Math.round(totalFollowers / daily.length)}
                  stroke="#f472b6" strokeDasharray="4 3" strokeOpacity={0.35}
                  label={{ value:`média`, position:"insideTopRight", fontSize:9, fill:"oklch(0.56 0.010 265)", dy:-4 }} />
                <Bar dataKey="seguidores" name="Novos seguidores" fill="#f472b6" radius={[4,4,0,0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top posts table */}
      <div className="card-lift rounded-2xl border border-border/40 bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold">Posts com Melhor Desempenho</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Média de engajamento: <span className="font-medium text-foreground">{avgEngPosts.toFixed(1)}%</span> — posts acima destacados
            </p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground h-7 px-3 rounded-lg">
            Ver no Metricool<ExternalLink className="h-3 w-3" />
          </Button>
        </div>
        <Separator className="opacity-40" />
        {topPosts.map((post, i) => {
          const { icon:TIcon, color, badge } = typeConfig[post.type];
          const aboveAvg = post.engagement > avgEngPosts;
          return (
            <div key={post.id}
              className="flex items-center gap-4 px-5 py-4 border-b border-border/25 last:border-0 hover:bg-white/[0.02] transition-colors">
              <span className="w-5 shrink-0 text-[11px] font-bold text-muted-foreground/40 text-center tabular-nums">{i+1}</span>
              <div className="h-8 w-8 rounded-xl bg-muted/30 flex items-center justify-center shrink-0">
                <TIcon className={`h-3.5 w-3.5 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate">{post.caption}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${badge}`}>{post.type}</span>
                  <span className="text-[11px] text-muted-foreground">{post.publishedAt}</span>
                  {aboveAvg && (
                    <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-0.5">
                      <Lightbulb className="h-2.5 w-2.5" />acima da média
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-5 text-right">
                <div className="hidden sm:block">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Impressões</p>
                  <p className="text-sm font-semibold tabular-nums">{fmt(post.impressions)}</p>
                </div>
                <div className="hidden md:block">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Curtidas</p>
                  <p className="text-sm font-semibold tabular-nums">{fmt(post.likes)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">Engaj.</p>
                  <p className={`text-sm font-bold tabular-nums ${
                    post.engagement >= 7 ? "text-emerald-400" : post.engagement >= 5 ? "text-amber-400" : "text-muted-foreground"
                  }`}>{post.engagement}%</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
