import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Topic =
  | "IA"
  | "Social Media"
  | "Ferramentas"
  | "Pesquisa"
  | "Negócios"
  | "SEO"
  | "Conteúdo";

export interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  summary: string;
  publishedAt: string; // ISO string
  topic: Topic;
}

// ─── Feed sources (Marketing Digital & IA niche) ──────────────────────────────

const FEEDS: { url: string; source: string }[] = [
  { url: "https://www.socialmediaexaminer.com/feed/",         source: "Social Media Examiner" },
  { url: "https://www.searchenginejournal.com/feed/",         source: "Search Engine Journal" },
  { url: "https://moz.com/blog/feed",                          source: "Moz Blog" },
  { url: "https://feeds.feedburner.com/fastcompany/headlines", source: "Fast Company" },
  { url: "https://techcrunch.com/feed/",                       source: "TechCrunch" },
  { url: "https://feeds.arstechnica.com/arstechnica/index",    source: "Ars Technica" },
];

// ─── XML helpers ──────────────────────────────────────────────────────────────

function getTag(xml: string, tag: string): string {
  // Support plain content, CDATA and self-closing tags
  const re = new RegExp(
    `<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*<\\/${tag}>`,
    "i"
  );
  const m = xml.match(re);
  if (!m) return "";
  return stripHtml(m[1].trim());
}

function getAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["']`, "i");
  const m = xml.match(re);
  return m ? m[1] : "";
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseItems(xml: string): string[] {
  const items: string[] = [];
  const re = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) items.push(m[1]);
  // Atom <entry>
  const re2 = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
  while ((m = re2.exec(xml)) !== null) items.push(m[1]);
  return items;
}

function parseDate(raw: string): string {
  if (!raw) return new Date().toISOString();
  try {
    return new Date(raw).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function extractLink(item: string): string {
  // <link>url</link>  OR  <link href="url"/>  OR  <guid>url</guid>
  const plain = getTag(item, "link");
  if (plain.startsWith("http")) return plain;
  const href = getAttr(item, "link", "href");
  if (href) return href;
  const guid = getTag(item, "guid");
  if (guid.startsWith("http")) return guid;
  return "#";
}

// ─── Topic detection ──────────────────────────────────────────────────────────

const TOPIC_RULES: { topic: Topic; patterns: RegExp }[] = [
  {
    topic: "IA",
    patterns: /\b(ai|artificial intelligence|chatgpt|gpt-?4?o?|llm|machine learning|generative|openai|claude|gemini|copilot|midjourney|stable diffusion)\b/i,
  },
  {
    topic: "Ferramentas",
    patterns: /\b(tool|plugin|software|platform|extension|saas|dashboard|app|integration|automation|workflow|buffer|hootsuite|canva|notion|semrush|ahrefs)\b/i,
  },
  {
    topic: "Pesquisa",
    patterns: /\b(research|study|survey|report|data|statistic|stat|finding|analysis|benchmark|trend|insight)\b/i,
  },
  {
    topic: "Negócios",
    patterns: /\b(business|revenue|profit|startup|brand|company|enterprise|b2b|roi|funding|acquire|partnership|market share|economy)\b/i,
  },
  {
    topic: "SEO",
    patterns: /\b(seo|search engine|google|keyword|ranking|serp|backlink|index|crawl|core web vitals|page speed)\b/i,
  },
  {
    topic: "Social Media",
    patterns: /\b(instagram|tiktok|facebook|twitter|linkedin|youtube|social media|reel|story|shorts|algorithm|influencer|creator)\b/i,
  },
];

function detectTopic(title: string, summary: string): Topic {
  const text = title + " " + summary;
  for (const { topic, patterns } of TOPIC_RULES) {
    if (patterns.test(text)) return topic;
  }
  return "Conteúdo";
}

// ─── Fetch + parse one feed ───────────────────────────────────────────────────

async function fetchFeed(
  feedUrl: string,
  source: string
): Promise<Article[]> {
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "ContentHub RSS Reader/1.0" },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 1800 }, // 30-min cache per feed
  });

  if (!res.ok) throw new Error(`${res.status} from ${feedUrl}`);
  const xml = await res.text();

  return parseItems(xml)
    .slice(0, 8) // max 8 items per source
    .map((item): Article => {
      const title   = getTag(item, "title") || "(sem título)";
      const url     = extractLink(item);
      const rawDate = getTag(item, "pubDate") || getTag(item, "published") || getTag(item, "updated");
      const desc    = getTag(item, "description") || getTag(item, "summary") || getTag(item, "content");
      const summary = desc.slice(0, 200) + (desc.length > 200 ? "…" : "");

      return {
        id:          `${source}-${url}`,
        title,
        url,
        source,
        summary,
        publishedAt: parseDate(rawDate),
        topic:       detectTopic(title, summary),
      };
    })
    .filter((a) => a.title !== "(sem título)" && a.url !== "#");
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET() {
  const results = await Promise.allSettled(
    FEEDS.map((f) => fetchFeed(f.url, f.source))
  );

  const articles: Article[] = [];
  const sourceStatus: { source: string; ok: boolean; count: number }[] = [];

  results.forEach((r, i) => {
    const source = FEEDS[i].source;
    if (r.status === "fulfilled") {
      articles.push(...r.value);
      sourceStatus.push({ source, ok: true, count: r.value.length });
    } else {
      console.warn(`[news] ${source} failed:`, r.reason);
      sourceStatus.push({ source, ok: false, count: 0 });
    }
  });

  // Sort newest first
  articles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return NextResponse.json({
    articles,
    sources: sourceStatus,
    fetchedAt: new Date().toISOString(),
  });
}
