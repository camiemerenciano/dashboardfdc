"use client";

import {
  createContext, useContext, useState, useCallback,
  type ReactNode,
} from "react";
import type { ContentType } from "./types";

// ─── State shape ──────────────────────────────────────────────────────────────

export interface FilterState {
  pageIds:      Set<string>;
  adminNames:   Set<string>;
  contentTypes: Set<ContentType>;
}

interface FilterActions {
  togglePageId:      (id: string)          => void;
  toggleAdminName:   (name: string)        => void;
  toggleContentType: (type: ContentType)   => void;
  clearAll:          ()                    => void;
  isActive:          boolean;
}

type FilterContextValue = FilterState & FilterActions;

// ─── Context ──────────────────────────────────────────────────────────────────

const FilterContext = createContext<FilterContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function FilterProvider({ children }: { children: ReactNode }) {
  const [pageIds,      setPageIds]      = useState<Set<string>>     (new Set());
  const [adminNames,   setAdminNames]   = useState<Set<string>>     (new Set());
  const [contentTypes, setContentTypes] = useState<Set<ContentType>>(new Set());

  const toggle = <T,>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, value: T) => {
    setter(prev => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  };

  const togglePageId      = useCallback((id: string)        => toggle(setPageIds,      id),   []);
  const toggleAdminName   = useCallback((name: string)      => toggle(setAdminNames,   name), []);
  const toggleContentType = useCallback((type: ContentType) => toggle(setContentTypes, type), []);

  const clearAll = useCallback(() => {
    setPageIds(new Set());
    setAdminNames(new Set());
    setContentTypes(new Set());
  }, []);

  const isActive = pageIds.size > 0 || adminNames.size > 0 || contentTypes.size > 0;

  return (
    <FilterContext.Provider value={{
      pageIds, adminNames, contentTypes,
      togglePageId, toggleAdminName, toggleContentType,
      clearAll, isActive,
    }}>
      {children}
    </FilterContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used inside <FilterProvider>");
  return ctx;
}

// ─── Utility: apply filters to a list of page IDs ────────────────────────────
// Returns the effective page IDs after applying pageId + adminName filters.
// Pass MOCK_PAGES so the function stays pure.

import type { Page } from "./types";

export function resolvePageIds(
  filters: FilterState,
  allPages: Page[]
): string[] {
  let pages = allPages;

  if (filters.pageIds.size > 0)
    pages = pages.filter((p) => filters.pageIds.has(p.id));

  if (filters.adminNames.size > 0)
    pages = pages.filter((p) => filters.adminNames.has(p.admin_name));

  return pages.map((p) => p.id);
}
