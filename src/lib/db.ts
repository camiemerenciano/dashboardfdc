// ─── SQLite database layer ────────────────────────────────────────────────────
// Server-side only. Never import in client components or pages.
// Used exclusively by API routes in /api/socialblade/.

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH  = path.join(DATA_DIR, "socialblade.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  // Reset cached connection if the DB file was deleted (e.g. during dev)
  if (_db && !fs.existsSync(DB_PATH)) {
    try { _db.close(); } catch { /* ignore */ }
    _db = null;
  }

  if (_db) return _db;

  // Ensure data/ directory exists
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  migrate(_db);
  return _db;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id           TEXT PRIMARY KEY,
      username     TEXT NOT NULL,
      platform     TEXT NOT NULL,
      display_name TEXT,
      last_updated TEXT
    );

    CREATE TABLE IF NOT EXISTS snapshots (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id       TEXT    NOT NULL,
      fetched_at       TEXT    NOT NULL,
      followers        INTEGER,
      following        INTEGER,
      media_count      INTEGER,
      avg_likes        REAL,
      avg_comments     REAL,
      engagement_rate  REAL,
      weekly_growth    INTEGER,
      monthly_growth   INTEGER,
      raw_json         TEXT,
      FOREIGN KEY (profile_id) REFERENCES profiles(id)
    );

    CREATE INDEX IF NOT EXISTS idx_snapshots_profile
      ON snapshots (profile_id, fetched_at DESC);

    CREATE TABLE IF NOT EXISTS analytics_import (
      id          INTEGER PRIMARY KEY,
      imported_at TEXT    NOT NULL,
      filename    TEXT,
      data_json   TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS competitors (
      id              TEXT PRIMARY KEY,
      username        TEXT NOT NULL,
      platform        TEXT NOT NULL,
      display_name    TEXT,
      followers       INTEGER,
      engagement_rate REAL,
      weekly_growth   INTEGER,
      monthly_growth  INTEGER,
      avg_likes       REAL,
      avg_comments    REAL,
      last_updated    TEXT,
      raw_json        TEXT
    );

    CREATE TABLE IF NOT EXISTS sheets_posts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      row_date   TEXT    NOT NULL,
      pagina     TEXT    NOT NULL,
      admin      TEXT    NOT NULL,
      tipo_post  TEXT    NOT NULL,
      quantidade INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sheets_meta (
      id           INTEGER PRIMARY KEY CHECK (id = 1),
      last_fetched TEXT    NOT NULL,
      row_count    INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sb_daily_posts (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id   TEXT    NOT NULL,
      post_date    TEXT    NOT NULL,
      posts_count  INTEGER NOT NULL DEFAULT 0,
      UNIQUE (profile_id, post_date)
    );
  `);

  // Additive migrations — safe to run on existing databases
  for (const sql of [
    `ALTER TABLE snapshots ADD COLUMN engagement_rate REAL`,
    `ALTER TABLE sheets_posts ADD COLUMN source TEXT NOT NULL DEFAULT 'sheets'`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_sheets_posts_upsert ON sheets_posts (row_date, pagina, tipo_post)`,
    `ALTER TABLE sheets_meta ADD COLUMN last_n8n TEXT`,
    `ALTER TABLE sheets_meta ADD COLUMN refresh_token TEXT`,
  ]) {
    try { db.exec(sql); } catch { /* already exists */ }
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DBProfile {
  id:          string;
  username:    string;
  platform:    "instagram" | "tiktok";
  displayName: string | null;
  lastUpdated: string | null;
}

export interface DBSnapshot {
  id:             number;
  profileId:      string;
  fetchedAt:      string;
  followers:      number | null;
  following:      number | null;
  mediaCount:     number | null;
  avgLikes:       number | null;
  avgComments:    number | null;
  engagementRate: number | null;  // decimal, e.g. 0.05 = 5%
  weeklyGrowth:   number | null;
  monthlyGrowth:  number | null;
}

export interface ProfileWithLatest extends DBProfile {
  latest: DBSnapshot | null;
}

// ─── Profile queries ──────────────────────────────────────────────────────────

export function upsertProfile(p: { id: string; username: string; platform: string; displayName: string }) {
  const db = getDb();
  db.prepare(`
    INSERT INTO profiles (id, username, platform, display_name)
    VALUES (@id, @username, @platform, @displayName)
    ON CONFLICT(id) DO UPDATE SET
      username     = excluded.username,
      platform     = excluded.platform,
      display_name = excluded.display_name
  `).run(p);
}

export function markProfileUpdated(id: string, ts: string) {
  getDb().prepare(`UPDATE profiles SET last_updated = ? WHERE id = ?`).run(ts, id);
}

export function getAllProfiles(): DBProfile[] {
  return (getDb().prepare(`SELECT id, username, platform, display_name, last_updated FROM profiles ORDER BY platform, id`) as Database.Statement)
    .all()
    .map(r => rowToProfile(r as Record<string, unknown>));
}

function rowToProfile(r: Record<string, unknown>): DBProfile {
  return {
    id:          r.id          as string,
    username:    r.username    as string,
    platform:    r.platform    as "instagram" | "tiktok",
    displayName: (r.display_name ?? null) as string | null,
    lastUpdated: (r.last_updated ?? null) as string | null,
  };
}

// ─── Snapshot queries ──────────────────────────────────────────────────────────

export function insertSnapshot(s: {
  profileId:      string;
  fetchedAt:      string;
  followers:      number | null;
  following:      number | null;
  mediaCount:     number | null;
  avgLikes:       number | null;
  avgComments:    number | null;
  engagementRate: number | null;
  weeklyGrowth:   number | null;
  monthlyGrowth:  number | null;
  rawJson:        string;
}) {
  getDb().prepare(`
    INSERT INTO snapshots
      (profile_id, fetched_at, followers, following, media_count,
       avg_likes, avg_comments, engagement_rate, weekly_growth, monthly_growth, raw_json)
    VALUES
      (@profileId, @fetchedAt, @followers, @following, @mediaCount,
       @avgLikes, @avgComments, @engagementRate, @weeklyGrowth, @monthlyGrowth, @rawJson)
  `).run(s);
}

export function getLatestSnapshot(profileId: string): DBSnapshot | null {
  const row = (getDb().prepare(`
    SELECT id, profile_id, fetched_at, followers, following, media_count,
           avg_likes, avg_comments, engagement_rate, weekly_growth, monthly_growth
    FROM snapshots
    WHERE profile_id = ?
    ORDER BY fetched_at DESC
    LIMIT 1
  `) as Database.Statement).get(profileId) as Record<string, unknown> | undefined;
  return row ? rowToSnapshot(row) : null;
}

export function getSnapshotHistory(profileId: string, limit = 30): DBSnapshot[] {
  return (getDb().prepare(`
    SELECT id, profile_id, fetched_at, followers, following, media_count,
           avg_likes, avg_comments, engagement_rate, weekly_growth, monthly_growth
    FROM snapshots
    WHERE profile_id = ?
    ORDER BY fetched_at DESC
    LIMIT ?
  `) as Database.Statement)
    .all(profileId, limit)
    .map(r => rowToSnapshot(r as Record<string, unknown>));
}

export function getAllLatestSnapshots(): Array<{ profileId: string } & DBSnapshot> {
  // One snapshot per profile — the most recent
  return (getDb().prepare(`
    SELECT s.id, s.profile_id, s.fetched_at, s.followers, s.following,
           s.media_count, s.avg_likes, s.avg_comments, s.engagement_rate, s.weekly_growth, s.monthly_growth
    FROM snapshots s
    INNER JOIN (
      SELECT profile_id, MAX(fetched_at) AS max_fa
      FROM snapshots
      GROUP BY profile_id
    ) latest ON s.profile_id = latest.profile_id AND s.fetched_at = latest.max_fa
    ORDER BY s.followers DESC NULLS LAST
  `) as Database.Statement)
    .all()
    .map(r => rowToSnapshot(r as Record<string, unknown>));
}

function rowToSnapshot(r: Record<string, unknown>): DBSnapshot {
  return {
    id:             r.id            as number,
    profileId:      (r.profile_id  ?? r.profileId) as string,
    fetchedAt:      r.fetched_at    as string,
    followers:      (r.followers        ?? null) as number | null,
    following:      (r.following        ?? null) as number | null,
    mediaCount:     (r.media_count      ?? null) as number | null,
    avgLikes:       (r.avg_likes        ?? null) as number | null,
    avgComments:    (r.avg_comments     ?? null) as number | null,
    engagementRate: (r.engagement_rate  ?? null) as number | null,
    weeklyGrowth:   (r.weekly_growth    ?? null) as number | null,
    monthlyGrowth:  (r.monthly_growth   ?? null) as number | null,
  };
}

// ─── Combined query ────────────────────────────────────────────────────────────

export function getAllProfilesWithLatest(): ProfileWithLatest[] {
  const profiles  = getAllProfiles();
  const snapshots = getAllLatestSnapshots();
  const snapMap   = new Map(snapshots.map(s => [s.profileId, s]));
  return profiles.map(p => ({ ...p, latest: snapMap.get(p.id) ?? null }));
}

// ─── Competitors ───────────────────────────────────────────────────────────────

export interface DBCompetitor {
  id:             string;
  username:       string;
  platform:       "instagram" | "tiktok";
  displayName:    string | null;
  followers:      number | null;
  engagementRate: number | null;
  weeklyGrowth:   number | null;
  monthlyGrowth:  number | null;
  avgLikes:       number | null;
  avgComments:    number | null;
  lastUpdated:    string | null;
  rawJson:        string | null;
}

export function upsertCompetitor(c: DBCompetitor) {
  getDb().prepare(`
    INSERT INTO competitors
      (id, username, platform, display_name, followers, engagement_rate,
       weekly_growth, monthly_growth, avg_likes, avg_comments, last_updated, raw_json)
    VALUES
      (@id, @username, @platform, @displayName, @followers, @engagementRate,
       @weeklyGrowth, @monthlyGrowth, @avgLikes, @avgComments, @lastUpdated, @rawJson)
    ON CONFLICT(id) DO UPDATE SET
      username        = excluded.username,
      platform        = excluded.platform,
      display_name    = excluded.display_name,
      followers       = excluded.followers,
      engagement_rate = excluded.engagement_rate,
      weekly_growth   = excluded.weekly_growth,
      monthly_growth  = excluded.monthly_growth,
      avg_likes       = excluded.avg_likes,
      avg_comments    = excluded.avg_comments,
      last_updated    = excluded.last_updated,
      raw_json        = excluded.raw_json
  `).run(c);
}

export function getAllCompetitors(): DBCompetitor[] {
  return (getDb().prepare(`
    SELECT id, username, platform, display_name, followers, engagement_rate,
           weekly_growth, monthly_growth, avg_likes, avg_comments, last_updated, raw_json
    FROM competitors
    ORDER BY followers DESC NULLS LAST
  `) as Database.Statement)
    .all()
    .map(r => {
      const row = r as Record<string, unknown>;
      return {
        id:             row.id             as string,
        username:       row.username       as string,
        platform:       row.platform       as "instagram" | "tiktok",
        displayName:    (row.display_name  ?? null) as string | null,
        followers:      (row.followers     ?? null) as number | null,
        engagementRate: (row.engagement_rate ?? null) as number | null,
        weeklyGrowth:   (row.weekly_growth ?? null) as number | null,
        monthlyGrowth:  (row.monthly_growth ?? null) as number | null,
        avgLikes:       (row.avg_likes     ?? null) as number | null,
        avgComments:    (row.avg_comments  ?? null) as number | null,
        lastUpdated:    (row.last_updated  ?? null) as string | null,
        rawJson:        (row.raw_json      ?? null) as string | null,
      };
    });
}

export function deleteCompetitor(id: string) {
  getDb().prepare(`DELETE FROM competitors WHERE id = ?`).run(id);
}

// ─── Analytics import ──────────────────────────────────────────────────────────

export interface AnalyticsImportRow {
  importedAt: string;
  filename:   string | null;
  data:       AnalyticsData;
}

export interface DailyMetric {
  date: string;
  impressoes: number;
  engajamentos: number;
  seguidores: number;
}

export interface BarMetric {
  type: string;
  impressoes: number;
  engajamentos: number;
}

export interface TopPost {
  id: string;
  caption: string;
  type: string;
  impressions: number;
  engagement: number;
  likes: number;
  publishedAt: string;
}

export interface AnalyticsData {
  daily:    DailyMetric[];
  barData:  BarMetric[];
  topPosts: TopPost[];
}

export function saveAnalyticsImport(filename: string | null, data: AnalyticsData): string {
  const db  = getDb();
  const now = new Date().toISOString();
  db.exec(`DELETE FROM analytics_import`);
  db.prepare(`INSERT INTO analytics_import (imported_at, filename, data_json) VALUES (?, ?, ?)`).run(
    now, filename, JSON.stringify(data),
  );
  return now;
}

export function getLatestAnalyticsImport(): AnalyticsImportRow | null {
  const row = (getDb().prepare(
    `SELECT imported_at, filename, data_json FROM analytics_import ORDER BY id DESC LIMIT 1`,
  ) as Database.Statement).get() as Record<string, unknown> | undefined;

  if (!row) return null;
  return {
    importedAt: row.imported_at as string,
    filename:   (row.filename ?? null) as string | null,
    data:       JSON.parse(row.data_json as string) as AnalyticsData,
  };
}

// ─── Google Sheets posts cache ────────────────────────────────────────────────

export interface SheetsPostRow {
  row_date:   string;
  pagina:     string;
  admin:      string;
  tipo_post:  string;
  quantidade: number;
}

export interface SheetsMeta {
  last_fetched: string;
  last_n8n:     string | null;
  row_count:    number;
}

export function saveSheetsRows(rows: SheetsPostRow[]): void {
  const db  = getDb();
  const now = new Date().toISOString();
  const ins = db.transaction(() => {
    db.exec(`DELETE FROM sheets_posts WHERE source = 'sheets'`);
    const stmt = db.prepare(
      `INSERT INTO sheets_posts (row_date, pagina, admin, tipo_post, quantidade, source)
       VALUES (@row_date, @pagina, @admin, @tipo_post, @quantidade, 'sheets')
       ON CONFLICT (row_date, pagina, tipo_post)
       DO UPDATE SET quantidade = excluded.quantidade, admin = excluded.admin, source = 'sheets'`,
    );
    for (const r of rows) stmt.run(r);
    db.prepare(
      `INSERT INTO sheets_meta (id, last_fetched, row_count)
       VALUES (1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET last_fetched = excluded.last_fetched, row_count = excluded.row_count`,
    ).run(now, rows.length);
  });
  ins();
}

// Upsert a single row from n8n (additive — does not wipe other rows)
export function upsertSheetsRow(row: SheetsPostRow): void {
  const db  = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO sheets_posts (row_date, pagina, admin, tipo_post, quantidade, source)
     VALUES (@row_date, @pagina, @admin, @tipo_post, @quantidade, 'n8n')
     ON CONFLICT (row_date, pagina, tipo_post)
     DO UPDATE SET quantidade = excluded.quantidade, admin = excluded.admin, source = 'n8n'`,
  ).run(row);
  const count = (db.prepare(`SELECT COUNT(*) AS n FROM sheets_posts`) as Database.Statement)
    .get() as { n: number };
  db.prepare(
    `INSERT INTO sheets_meta (id, last_fetched, last_n8n, row_count)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET last_n8n = excluded.last_n8n, row_count = excluded.row_count`,
  ).run(now, now, count.n);
}

export function getSheetsRows(): SheetsPostRow[] {
  return (getDb().prepare(
    `SELECT row_date, pagina, admin, tipo_post, quantidade FROM sheets_posts ORDER BY row_date`,
  ) as Database.Statement).all() as SheetsPostRow[];
}

export function getSheetsMeta(): SheetsMeta | null {
  const row = (getDb().prepare(
    `SELECT last_fetched, last_n8n, row_count FROM sheets_meta WHERE id = 1`,
  ) as Database.Statement).get() as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    last_fetched: row.last_fetched as string,
    last_n8n:     (row.last_n8n ?? null) as string | null,
    row_count:    row.row_count    as number,
  };
}

export function getSheetsRefreshToken(): string | null {
  const row = (getDb().prepare(
    `SELECT refresh_token FROM sheets_meta WHERE id = 1`,
  ) as Database.Statement).get() as Record<string, unknown> | undefined;
  return (row?.refresh_token ?? null) as string | null;
}

export function saveSheetsRefreshToken(token: string): void {
  getDb().prepare(
    `INSERT INTO sheets_meta (id, last_fetched, row_count, refresh_token)
     VALUES (1, '', 0, ?)
     ON CONFLICT(id) DO UPDATE SET refresh_token = excluded.refresh_token`,
  ).run(token);
}

// ─── Social Blade daily posts ─────────────────────────────────────────────────

export interface SBDailyPostRow {
  profile_id:  string;
  post_date:   string;
  posts_count: number;
}

export function upsertSBDailyPosts(rows: SBDailyPostRow[]): void {
  const db   = getDb();
  const stmt = db.prepare(
    `INSERT INTO sb_daily_posts (profile_id, post_date, posts_count)
     VALUES (@profile_id, @post_date, @posts_count)
     ON CONFLICT (profile_id, post_date)
     DO UPDATE SET posts_count = excluded.posts_count`,
  );
  const run = db.transaction(() => { for (const r of rows) stmt.run(r); });
  run();
}

export interface SBDailyPostAgg {
  profile_id:   string;
  pagina:       string;   // username with @
  admin:        string;
  last_updated: string | null;
  total_posts:  number;
  days_with_data: number;
  avg_per_day:  number;
}

export function getSBDailyPostsAgg(): SBDailyPostAgg[] {
  // Join sb_daily_posts with profiles registry (we store adminName separately via SOCIALBLADE_PROFILES)
  // We return raw aggregation; the page will join with SOCIALBLADE_PROFILES client-side for adminName.
  return (getDb().prepare(`
    SELECT
      d.profile_id,
      p.username,
      p.last_updated,
      SUM(d.posts_count)                                    AS total_posts,
      COUNT(d.post_date)                                    AS days_with_data,
      ROUND(CAST(SUM(d.posts_count) AS REAL) / MAX(COUNT(d.post_date), 1), 2) AS avg_per_day
    FROM sb_daily_posts d
    LEFT JOIN profiles p ON p.id = d.profile_id
    GROUP BY d.profile_id
    ORDER BY total_posts DESC
  `) as Database.Statement)
    .all()
    .map(r => {
      const row = r as Record<string, unknown>;
      return {
        profile_id:     row.profile_id   as string,
        pagina:         `@${row.username ?? row.profile_id}`,
        admin:          "",              // filled in API route from SOCIALBLADE_PROFILES
        last_updated:   (row.last_updated ?? null) as string | null,
        total_posts:    (row.total_posts  ?? 0)    as number,
        days_with_data: (row.days_with_data ?? 0)  as number,
        avg_per_day:    (row.avg_per_day  ?? 0)    as number,
      };
    });
}

export function getSBDailyPostsHistory(profileId: string): SBDailyPostRow[] {
  return (getDb().prepare(
    `SELECT profile_id, post_date, posts_count
     FROM sb_daily_posts
     WHERE profile_id = ?
     ORDER BY post_date DESC
     LIMIT 90`,
  ) as Database.Statement).all(profileId) as SBDailyPostRow[];
}

export function getAllSBDailyPosts(): SBDailyPostRow[] {
  return (getDb().prepare(
    `SELECT profile_id, post_date, posts_count
     FROM sb_daily_posts
     ORDER BY post_date DESC, profile_id`,
  ) as Database.Statement).all() as SBDailyPostRow[];
}

/**
 * Backfill sb_daily_posts from raw_json already stored in snapshots.
 * Uses the most recent snapshot per profile (to avoid redundant processing).
 * Returns how many rows were upserted.
 */
export function backfillSBDailyPostsFromSnapshots(): number {
  const db = getDb();

  // Get latest snapshot per profile that has raw_json
  const snaps = (db.prepare(`
    SELECT s.profile_id, s.raw_json
    FROM snapshots s
    INNER JOIN (
      SELECT profile_id, MAX(fetched_at) AS max_fa
      FROM snapshots
      WHERE raw_json IS NOT NULL AND raw_json != ''
      GROUP BY profile_id
    ) latest ON s.profile_id = latest.profile_id AND s.fetched_at = latest.max_fa
  `) as Database.Statement).all() as { profile_id: string; raw_json: string }[];

  const stmt = db.prepare(
    `INSERT INTO sb_daily_posts (profile_id, post_date, posts_count)
     VALUES (@profile_id, @post_date, @posts_count)
     ON CONFLICT (profile_id, post_date)
     DO UPDATE SET posts_count = excluded.posts_count`,
  );

  let total = 0;

  const run = db.transaction(() => {
    for (const snap of snaps) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw   = JSON.parse(snap.raw_json) as any;
        const daily = Array.isArray(raw?.data?.daily) ? raw.data.daily : [];

        for (let i = 0; i < daily.length - 1; i++) {
          const curr = daily[i];
          const prev = daily[i + 1];
          const currMedia = curr?.media_count ?? curr?.media ?? null;
          const prevMedia = prev?.media_count ?? prev?.media ?? null;
          const dateRaw   = curr?.date ?? curr?.day ?? null;
          if (currMedia == null || prevMedia == null || !dateRaw) continue;
          const diff = Number(currMedia) - Number(prevMedia);
          if (diff < 0) continue;

          // normalise date
          let dateStr = String(dateRaw);
          if (/^\d{8}$/.test(dateStr)) dateStr = `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`;
          else if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) dateStr = d.toISOString().slice(0, 10);
          }

          stmt.run({ profile_id: snap.profile_id, post_date: dateStr, posts_count: diff });
          total++;
        }
      } catch { /* skip malformed raw_json */ }
    }
  });

  run();
  return total;
}

// ─── Follower history by date ─────────────────────────────────────────────────

export interface FollowerDateRow {
  profile_id: string;
  snap_date:  string;   // YYYY-MM-DD (truncated from fetched_at)
  followers:  number;
}

/** One row per (profile, day) — latest snapshot for that day. */
export function getAllFollowersByDate(): FollowerDateRow[] {
  return (getDb().prepare(`
    SELECT s.profile_id,
           substr(s.fetched_at, 1, 10) AS snap_date,
           s.followers
    FROM snapshots s
    INNER JOIN (
      SELECT profile_id,
             substr(fetched_at, 1, 10) AS snap_date,
             MAX(fetched_at)           AS max_fa
      FROM snapshots
      WHERE followers IS NOT NULL
      GROUP BY profile_id, substr(fetched_at, 1, 10)
    ) latest
      ON s.profile_id = latest.profile_id
     AND s.fetched_at = latest.max_fa
    ORDER BY snap_date DESC, s.profile_id
  `) as Database.Statement).all() as FollowerDateRow[];
}
