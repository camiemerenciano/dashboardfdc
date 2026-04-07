# ContentHub — Content Management Dashboard

## Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui (with sidebar, card, badge, button, separator, avatar, tooltip)
- **Icons:** lucide-react (bundled with shadcn/ui)

## Folder Structure

```
src/
├── app/
│   ├── (dashboard)/              # Route group for all dashboard pages
│   │   ├── layout.tsx            # Shared dashboard layout (sidebar + header)
│   │   ├── instagram/page.tsx    # Gestor de Instagram
│   │   ├── analytics/page.tsx    # Analytics
│   │   ├── calendar/page.tsx     # Calendário de Conteúdo
│   │   ├── competitors/page.tsx  # Rastreador de Concorrentes
│   │   └── news/page.tsx         # Consolidador de Notícias
│   ├── globals.css               # Global styles + CSS variable theme tokens
│   ├── layout.tsx                # Root layout (html, body, TooltipProvider)
│   └── page.tsx                  # Redirects / -> /instagram
├── components/
│   ├── app-sidebar.tsx           # Custom sidebar with nav links + active state
│   └── ui/                       # shadcn/ui generated components
├── hooks/
│   └── use-mobile.ts             # shadcn/ui mobile hook
└── lib/
    └── utils.ts                  # shadcn/ui cn() utility
```

## Component Patterns

### Sidebar Navigation
- `AppSidebar` is a client component (`"use client"`) that uses `usePathname()` from Next.js for active state detection.
- Active state is passed via `isActive` prop on `SidebarMenuButton`.
- Navigation links are defined as a static array (`navItems`) with title, href, icon, and optional badge.

### Page Layout
- All section pages are wrapped in the `(dashboard)/layout.tsx` route group.
- Layout uses shadcn/ui `SidebarProvider` + `SidebarTrigger` for collapsible sidebar behavior.
- Each page uses `space-y-6` for consistent vertical rhythm.

### Page Structure Pattern
Each section page follows this structure:
1. **Page header** — icon + title (h1) + subtitle (muted text) + optional CTA button
2. **Stats/summary cards** — responsive grid of metric `<Card>` components
3. **Detail cards** — 1–2 column grid with content lists and further information

### Dark Theme
- Dark theme is applied globally by default. The `<html>` element has `class="dark"` in `layout.tsx`.
- CSS variables in `globals.css` define both `:root` and `.dark` with identical dark values, ensuring the dark palette is always active regardless of system preference.
- The color palette uses a deep blue-grey background (`oklch(0.13 0.015 260)`) with an indigo/blue primary accent (`oklch(0.6 0.22 264)`).

## Key Decisions

1. **Dark-first theme:** Both `:root` and `.dark` CSS variables are set to the same dark palette. This avoids any flash of light theme on load while still supporting the shadcn/ui `dark` class convention.

2. **Route group `(dashboard)`:** Using a route group keeps the `/` root page separate from the dashboard layout, allowing the root to simply redirect to `/instagram` without inheriting the sidebar.

3. **Static placeholder data:** All data in section pages is hardcoded as TypeScript constants. This keeps pages self-contained and easy to swap for real API calls later.

4. **Portuguese (Brazil) language:** All visible text, labels, and UI copy are in pt-BR as required.

5. **shadcn/ui Sidebar component:** Uses the official shadcn/ui `<Sidebar>` primitives rather than a custom implementation, ensuring accessibility and consistent animation behavior out of the box.
