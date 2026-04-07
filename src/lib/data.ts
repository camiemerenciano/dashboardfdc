/**
 * Data access layer.
 *
 * All functions return the same shape a REST API would.
 * To switch to real API calls, replace the body of each function —
 * no callers need to change.
 *
 * Convention: functions are async so they're API-ready from day one.
 */

import {
  MOCK_PAGES,
  MOCK_POSTS,
  MOCK_DAILY_FOLLOWERS,
} from "./mock-data";

import type { Page, Post, DailyFollowers, ContentType } from "./types";

// ─── Pages ────────────────────────────────────────────────────────────────────

export async function getPages(): Promise<Page[]> {
  return MOCK_PAGES;
}

export async function getPageById(id: string): Promise<Page | undefined> {
  return MOCK_PAGES.find((p) => p.id === id);
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export async function getPosts(): Promise<Post[]> {
  return MOCK_POSTS;
}

export async function getPostsByPage(pageId: string): Promise<Post[]> {
  return MOCK_POSTS.filter((p) => p.page_id === pageId);
}

export async function getPostsByContentType(type: ContentType): Promise<Post[]> {
  return MOCK_POSTS.filter((p) => p.content_type === type);
}

export async function getPostsByDateRange(
  from: string,
  to: string
): Promise<Post[]> {
  return MOCK_POSTS.filter(
    (p) => p.published_at >= from && p.published_at <= to
  );
}

// ─── Followers ────────────────────────────────────────────────────────────────

export async function getDailyFollowers(): Promise<DailyFollowers[]> {
  return MOCK_DAILY_FOLLOWERS;
}

export async function getDailyFollowersByPage(
  pageId: string
): Promise<DailyFollowers[]> {
  return MOCK_DAILY_FOLLOWERS.filter((f) => f.page_id === pageId);
}

export async function getDailyFollowersByDateRange(
  pageId: string,
  from: string,
  to: string
): Promise<DailyFollowers[]> {
  return MOCK_DAILY_FOLLOWERS.filter(
    (f) => f.page_id === pageId && f.date >= from && f.date <= to
  );
}

/** Returns the latest snapshot for every page — useful for summary KPIs. */
export async function getLatestFollowerCounts(): Promise<
  { page_id: string; followers_count: number; date: string }[]
> {
  const latest = new Map<
    string,
    { page_id: string; followers_count: number; date: string }
  >();

  for (const entry of MOCK_DAILY_FOLLOWERS) {
    const current = latest.get(entry.page_id);
    if (!current || entry.date > current.date) {
      latest.set(entry.page_id, {
        page_id: entry.page_id,
        followers_count: entry.followers_count,
        date: entry.date,
      });
    }
  }

  return Array.from(latest.values());
}
