// ─── Domain types ─────────────────────────────────────────────────────────────
// Structured to mirror a future REST/GraphQL API response shape.
// All IDs are strings (UUID-compatible) for easy API swap.

// ─── Page ─────────────────────────────────────────────────────────────────────

export type Sector =
  | "Marketing Digital"
  | "Tecnologia"
  | "Moda"
  | "Gastronomia"
  | "Educação"
  | "Saúde & Bem-estar"
  | "Negócios"
  | "Entretenimento";

export interface Page {
  id: string;
  name: string;
  sector: Sector;
  admin_name: string;
}

// ─── Post ─────────────────────────────────────────────────────────────────────

export type ContentType = "curiosidade" | "motivação" | "meme";

export interface Post {
  id: string;
  page_id: string;         // FK → Page.id
  admin_name: string;
  content_type: ContentType;
  published_at: string;    // ISO 8601 e.g. "2026-03-15T10:00:00Z"
}

// ─── Followers per day ────────────────────────────────────────────────────────

export interface DailyFollowers {
  id: string;
  page_id: string;         // FK → Page.id
  date: string;            // "YYYY-MM-DD"
  followers_count: number;
}
