import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BookMarked, LayoutDashboard, Users, Layers, Dumbbell, LogOut } from "lucide-react";
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

  return (
    <div className="relative flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden bg-background font-body font-normal text-foreground selection:bg-primary selection:text-primary-foreground md:flex-row">
      <aside className="relative z-20 hidden w-72 shrink-0 flex-col border-r border-border bg-[#f3f2eb] md:flex">
        <div className="p-8 pb-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <img
              src={fitLogo}
              alt="FitBlock Training"
              className="h-14 w-auto object-contain object-left"
            />
            <NotificationBell />
          </div>
          <p className="text-xs text-muted-foreground font-normal leading-snug">Conta treinador</p>
        </div>

        <div className="mx-8 h-px bg-border" />

        <nav className="flex-1 px-4 py-6 space-y-1">
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
                  "group relative flex items-center gap-3 rounded-lg px-4 py-3 font-body text-sm font-medium transition-colors border border-transparent",
                  isActive
                    ? "border-border bg-card text-foreground"
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-transform",
                    isActive ? "text-primary scale-110" : "group-hover:text-primary"
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
            className="group flex w-full items-center gap-3 rounded-lg px-4 py-3 font-body text-sm font-medium text-muted-foreground transition-colors hover:bg-card hover:text-destructive"
          >
            <LogOut className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
            Sair
          </button>
          <p className="px-1 text-center text-[11px] text-muted-foreground/80">FitBlock Training</p>
        </div>
      </aside>

      {/* ── Main workspace ── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background relative">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/95 px-6 backdrop-blur-xl md:hidden">
          <img
            src={fitLogo}
            alt="FitBlock Training"
            className="h-12 w-auto object-contain object-left"
          />
          <NotificationBell />
        </header>

        <main className="relative z-10 min-h-0 min-w-0 w-full max-w-full flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-0 custom-scrollbar">
          <div className="pointer-events-none fixed right-0 top-0 -z-10 h-[min(420px,100vw)] w-[min(420px,100vw)] max-w-full rounded-full bg-primary/8 blur-[120px]" />

          <div className="relative mx-auto w-full min-w-0 max-w-[1700px] px-4 pt-6 sm:px-6 md:px-10 md:pt-10 lg:px-12 lg:pt-16 xl:px-16">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-background/95 px-2 pb-safe backdrop-blur-xl md:hidden">
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
                  isActive ? "text-primary" : "text-foreground/45"
                )}
              >
                {isActive && (
                  <div className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 bg-primary" />
                )}
                <item.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                <span
                  className={cn(
                    "max-w-full truncate font-body text-[9px] font-medium uppercase tracking-widest",
                    isActive ? "text-primary" : "text-foreground/45"
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
