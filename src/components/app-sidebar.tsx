"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  Users,
  LayoutDashboard,
  TrendingUp,
  FileText,
  Trophy,
  BookOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const navItems = [
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart2,
    badge: null,
  },
  {
    title: "Rastreador de Concorrentes",
    href: "/competitors",
    icon: Users,
    badge: null,
  },
  {
    title: "Crescimento de Seguidores",
    href: "/followers",
    icon: TrendingUp,
    badge: null,
  },
  {
    title: "Volume de Publicações",
    href: "/posts-volume",
    icon: FileText,
    badge: null,
  },
  {
    title: "Ranking de Crescimento",
    href: "/ranking",
    icon: Trophy,
    badge: "Novo",
  },
  {
    title: "Páginas",
    href: "/pages",
    icon: BookOpen,
    badge: null,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      {/* Logo */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-[14px]">
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/25">
            <LayoutDashboard className="h-[15px] w-[15px] text-white" />
            {/* subtle ring */}
            <span className="absolute inset-0 rounded-xl ring-1 ring-white/10" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-bold tracking-tight text-sidebar-foreground leading-none">
              Dashboard FDC
            </span>
            <span className="text-[10px] font-medium text-muted-foreground/70 tracking-wide uppercase leading-none">
              Dashboard
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold tracking-widest text-muted-foreground/50 uppercase px-2 mb-1">
            Módulos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                            isActive
                              ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                              : "text-muted-foreground hover:text-sidebar-foreground"
                          }`}
                        >
                          <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                          <span className="flex-1 truncate">{item.title}</span>
                          {item.badge && (
                            <Badge
                              variant="secondary"
                              className="ml-auto text-[10px] px-1.5 py-0 h-4 font-medium bg-primary/15 text-primary border-0"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 ring-2 ring-border/50">
            <AvatarFallback className="bg-gradient-to-br from-primary/80 to-violet-600 text-white text-[11px] font-bold">
              CH
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 gap-0.5">
            <span className="text-[13px] font-semibold text-sidebar-foreground truncate leading-none">
              Conta Principal
            </span>
            <span className="text-[11px] text-muted-foreground/70 truncate leading-none">
              admin@contenthub.io
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
