import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BookMarked,
  Dumbbell,
  Layers,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import fitLogo from "@/assets/logo_fit.png";
import NotificationBell from "@/components/NotificationBell";

const sideItems = [
  { to: "/trainer", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/trainer/atletas", icon: Users, label: "Atletas" },
  { to: "/trainer/grupos", icon: Layers, label: "Grupos" },
  { to: "/trainer/treinos", icon: Dumbbell, label: "Treinos" },
  { to: "/trainer/biblioteca", icon: BookMarked, label: "Biblioteca" },
];

const TrainerLayout = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const currentItem =
    sideItems.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
    ) ?? sideItems[0];

  return (
    <div className="relative flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden bg-background font-body text-foreground selection:bg-primary selection:text-primary-foreground md:flex-row">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute right-[-20%] top-[-8%] h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-18%] left-[-10%] h-80 w-80 rounded-full bg-white/5 blur-[140px]" />
      </div>

      <aside className="relative z-20 hidden w-[292px] shrink-0 flex-col border-r border-border/70 bg-[rgba(16,16,16,0.94)] backdrop-blur-xl md:flex">
        <div className="space-y-5 p-8 pb-6">
          <div className="flex items-center justify-between gap-4">
            <img src={fitLogo} alt="FitBlock Training" className="h-12 w-auto object-contain object-left" />
            <NotificationBell />
          </div>
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
              coach workspace
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Controle atletas, grupos, treinos e biblioteca num fluxo único e mobile-first.
            </p>
          </div>
        </div>

        <div className="mx-8 h-px bg-border/80" />

        <nav className="flex-1 space-y-2 px-4 py-6">
          {sideItems.map((item) => {
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={cn(
                  "group relative flex items-center gap-3 rounded-full border px-4 py-3 font-body text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary/20 bg-primary/10 text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform",
                    isActive ? "scale-110 text-primary" : "group-hover:text-primary",
                  )}
                />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="space-y-4 border-t border-border/80 p-6 pt-4">
          <button
            type="button"
            onClick={signOut}
            className="group flex w-full items-center gap-3 rounded-full border border-border bg-secondary px-4 py-3 font-body text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/35 hover:text-destructive"
          >
            <LogOut className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
            Sair
          </button>
          <p className="px-1 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
            FitBlock Training
          </p>
        </div>
      </aside>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-transparent">
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 px-safe pt-safe backdrop-blur-xl md:hidden">
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">coach</p>
              <p className="truncate text-sm font-medium text-foreground">{currentItem.label}</p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <button
                type="button"
                onClick={signOut}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground transition-colors hover:border-destructive/35 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="custom-scrollbar relative z-10 min-h-0 min-w-0 w-full max-w-full flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-0">
          <div className="relative mx-auto w-full min-w-0 max-w-[1700px] px-safe pt-6 sm:px-6 md:px-10 md:pt-10 lg:px-12 xl:px-16">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border/70 bg-background/92 px-2 pb-safe backdrop-blur-xl md:hidden">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-around gap-0.5 px-1">
          {sideItems.map((item) => {
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={cn(
                  "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
                  isActive ? "text-primary" : "text-foreground/45",
                )}
              >
                {isActive && (
                  <div className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 bg-primary" />
                )}
                <item.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                <span
                  className={cn(
                    "max-w-full truncate font-body text-[9px] font-medium uppercase tracking-widest",
                    isActive ? "text-primary" : "text-foreground/45",
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}

          <button
            type="button"
            onClick={signOut}
            className="group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-foreground/40 transition-colors hover:text-destructive"
          >
            <LogOut className="h-5 w-5 transition-transform group-hover:scale-110 group-hover:-translate-x-0.5" />
            <span className="font-body text-[9px] font-medium uppercase tracking-widest">Sair</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default TrainerLayout;
