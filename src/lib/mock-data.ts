import type { Page, Post, DailyFollowers } from "./types";

// ─── Pages ────────────────────────────────────────────────────────────────────

export const MOCK_PAGES: Page[] = [
  {
    id: "page-01",
    name: "ContentHub Oficial",
    sector: "Marketing Digital",
    admin_name: "Camila Emerenciano",
  },
  {
    id: "page-02",
    name: "TechTalk Brasil",
    sector: "Tecnologia",
    admin_name: "Rafael Souza",
  },
  {
    id: "page-03",
    name: "Moda & Estilo BR",
    sector: "Moda",
    admin_name: "Ana Lima",
  },
  {
    id: "page-04",
    name: "Receitas do Dia",
    sector: "Gastronomia",
    admin_name: "Lucas Ferreira",
  },
];

// ─── Posts ────────────────────────────────────────────────────────────────────

export const MOCK_POSTS: Post[] = [
  // ContentHub Oficial
  { id: "post-001", page_id: "page-01", admin_name: "Camila Emerenciano", content_type: "curiosidade", published_at: "2026-04-06T09:00:00Z" },
  { id: "post-002", page_id: "page-01", admin_name: "Camila Emerenciano", content_type: "motivação",   published_at: "2026-04-05T11:00:00Z" },
  { id: "post-003", page_id: "page-01", admin_name: "Camila Emerenciano", content_type: "meme",        published_at: "2026-04-04T14:00:00Z" },
  { id: "post-004", page_id: "page-01", admin_name: "Camila Emerenciano", content_type: "curiosidade", published_at: "2026-04-02T10:00:00Z" },
  { id: "post-005", page_id: "page-01", admin_name: "Camila Emerenciano", content_type: "motivação",   published_at: "2026-04-01T09:30:00Z" },
  { id: "post-006", page_id: "page-01", admin_name: "Camila Emerenciano", content_type: "meme",        published_at: "2026-03-28T18:00:00Z" },
  { id: "post-007", page_id: "page-01", admin_name: "Camila Emerenciano", content_type: "curiosidade", published_at: "2026-03-25T10:00:00Z" },
  { id: "post-008", page_id: "page-01", admin_name: "Camila Emerenciano", content_type: "motivação",   published_at: "2026-03-21T09:00:00Z" },
  { id: "post-009", page_id: "page-01", admin_name: "Camila Emerenciano", content_type: "curiosidade", published_at: "2026-03-15T10:00:00Z" },
  { id: "post-010", page_id: "page-01", admin_name: "Camila Emerenciano", content_type: "meme",        published_at: "2026-03-10T16:00:00Z" },

  // TechTalk Brasil
  { id: "post-011", page_id: "page-02", admin_name: "Rafael Souza", content_type: "curiosidade", published_at: "2026-04-06T10:00:00Z" },
  { id: "post-012", page_id: "page-02", admin_name: "Rafael Souza", content_type: "curiosidade", published_at: "2026-04-04T08:00:00Z" },
  { id: "post-013", page_id: "page-02", admin_name: "Rafael Souza", content_type: "meme",        published_at: "2026-04-02T15:00:00Z" },
  { id: "post-014", page_id: "page-02", admin_name: "Rafael Souza", content_type: "motivação",   published_at: "2026-03-30T10:00:00Z" },
  { id: "post-015", page_id: "page-02", admin_name: "Rafael Souza", content_type: "curiosidade", published_at: "2026-03-27T11:00:00Z" },
  { id: "post-016", page_id: "page-02", admin_name: "Rafael Souza", content_type: "meme",        published_at: "2026-03-22T17:00:00Z" },
  { id: "post-017", page_id: "page-02", admin_name: "Rafael Souza", content_type: "curiosidade", published_at: "2026-03-18T09:30:00Z" },
  { id: "post-018", page_id: "page-02", admin_name: "Rafael Souza", content_type: "motivação",   published_at: "2026-03-12T08:00:00Z" },

  // Moda & Estilo BR
  { id: "post-019", page_id: "page-03", admin_name: "Ana Lima", content_type: "motivação",   published_at: "2026-04-06T12:00:00Z" },
  { id: "post-020", page_id: "page-03", admin_name: "Ana Lima", content_type: "meme",        published_at: "2026-04-05T14:00:00Z" },
  { id: "post-021", page_id: "page-03", admin_name: "Ana Lima", content_type: "curiosidade", published_at: "2026-04-03T11:00:00Z" },
  { id: "post-022", page_id: "page-03", admin_name: "Ana Lima", content_type: "motivação",   published_at: "2026-04-01T08:30:00Z" },
  { id: "post-023", page_id: "page-03", admin_name: "Ana Lima", content_type: "meme",        published_at: "2026-03-29T13:00:00Z" },
  { id: "post-024", page_id: "page-03", admin_name: "Ana Lima", content_type: "curiosidade", published_at: "2026-03-26T10:00:00Z" },
  { id: "post-025", page_id: "page-03", admin_name: "Ana Lima", content_type: "motivação",   published_at: "2026-03-20T09:00:00Z" },
  { id: "post-026", page_id: "page-03", admin_name: "Ana Lima", content_type: "meme",        published_at: "2026-03-14T16:00:00Z" },
  { id: "post-027", page_id: "page-03", admin_name: "Ana Lima", content_type: "curiosidade", published_at: "2026-03-08T11:00:00Z" },

  // Receitas do Dia
  { id: "post-028", page_id: "page-04", admin_name: "Lucas Ferreira", content_type: "curiosidade", published_at: "2026-04-06T07:00:00Z" },
  { id: "post-029", page_id: "page-04", admin_name: "Lucas Ferreira", content_type: "meme",        published_at: "2026-04-05T12:00:00Z" },
  { id: "post-030", page_id: "page-04", admin_name: "Lucas Ferreira", content_type: "motivação",   published_at: "2026-04-04T07:30:00Z" },
  { id: "post-031", page_id: "page-04", admin_name: "Lucas Ferreira", content_type: "curiosidade", published_at: "2026-04-03T07:00:00Z" },
  { id: "post-032", page_id: "page-04", admin_name: "Lucas Ferreira", content_type: "meme",        published_at: "2026-04-01T11:00:00Z" },
  { id: "post-033", page_id: "page-04", admin_name: "Lucas Ferreira", content_type: "curiosidade", published_at: "2026-03-31T07:00:00Z" },
  { id: "post-034", page_id: "page-04", admin_name: "Lucas Ferreira", content_type: "motivação",   published_at: "2026-03-28T08:00:00Z" },
  { id: "post-035", page_id: "page-04", admin_name: "Lucas Ferreira", content_type: "meme",        published_at: "2026-03-24T12:00:00Z" },
  { id: "post-036", page_id: "page-04", admin_name: "Lucas Ferreira", content_type: "curiosidade", published_at: "2026-03-19T07:30:00Z" },
  { id: "post-037", page_id: "page-04", admin_name: "Lucas Ferreira", content_type: "motivação",   published_at: "2026-03-13T08:00:00Z" },
  { id: "post-038", page_id: "page-04", admin_name: "Lucas Ferreira", content_type: "meme",        published_at: "2026-03-07T12:00:00Z" },
];

// ─── Followers per day ────────────────────────────────────────────────────────
// 90 days of daily snapshots per page (2026-01-07 → 2026-04-06).
// Growth curves are realistic: steady base + occasional spikes on post days.

function buildFollowerSeries(
  pageId: string,
  startFollowers: number,
  dailyGrowthBase: number,
  spikeMap: Record<string, number>, // "YYYY-MM-DD" → bonus followers
  startDate: Date
): DailyFollowers[] {
  const entries: DailyFollowers[] = [];
  let count = startFollowers;
  const days = 91;

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);

    // Natural daily fluctuation ±30%
    const fluctuation = 1 + (Math.sin(i * 2.1) * 0.15) + (Math.cos(i * 0.7) * 0.12);
    const base = Math.round(dailyGrowthBase * fluctuation);
    const spike = spikeMap[dateStr] ?? 0;
    count += base + spike;

    entries.push({
      id: `flw-${pageId}-${dateStr}`,
      page_id: pageId,
      date: dateStr,
      followers_count: count,
    });
  }
  return entries;
}

const START = new Date("2026-01-07");

const PAGE01_FOLLOWERS = buildFollowerSeries("page-01", 18_400, 44, {
  "2026-03-10": 320, "2026-03-25": 480, "2026-04-01": 390, "2026-04-06": 510,
}, START);

const PAGE02_FOLLOWERS = buildFollowerSeries("page-02", 41_200, 120, {
  "2026-01-20": 880, "2026-02-14": 1240, "2026-03-01": 760,
  "2026-03-18": 1100, "2026-04-04": 940,
}, START);

const PAGE03_FOLLOWERS = buildFollowerSeries("page-03", 31_800, 68, {
  "2026-01-25": 540, "2026-02-20": 610, "2026-03-08": 380,
  "2026-03-26": 720, "2026-04-05": 460,
}, START);

const PAGE04_FOLLOWERS = buildFollowerSeries("page-04", 87_500, 210, {
  "2026-01-15": 1800, "2026-02-07": 2400, "2026-02-28": 1600,
  "2026-03-19": 3100, "2026-04-03": 2200, "2026-04-06": 2800,
}, START);

export const MOCK_DAILY_FOLLOWERS: DailyFollowers[] = [
  ...PAGE01_FOLLOWERS,
  ...PAGE02_FOLLOWERS,
  ...PAGE03_FOLLOWERS,
  ...PAGE04_FOLLOWERS,
];
