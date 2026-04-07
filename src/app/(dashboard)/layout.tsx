import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { FilterProvider } from "@/lib/filter-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FilterProvider>
    <SidebarProvider>
      <div className="flex min-h-screen w-full ambient-glow">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0 relative z-10">
          <header className="flex h-[52px] items-center border-b border-border/50 bg-background/80 backdrop-blur-md px-5 gap-3 shrink-0 sticky top-0 z-20">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            <div className="h-4 w-px bg-border/60" />
            <span className="text-[11px] font-semibold text-muted-foreground/60 tracking-widest uppercase">ContentHub</span>
          </header>
          <main className="flex-1 overflow-auto p-7">{children}</main>
        </div>
      </div>
    </SidebarProvider>
    </FilterProvider>
  );
}
