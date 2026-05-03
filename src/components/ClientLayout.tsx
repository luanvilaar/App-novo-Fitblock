import { Outlet, useLocation } from "react-router-dom";

import BottomNav from "@/components/BottomNav";
import logo from "@/assets/logo_fit.png";

const routeLabels: Record<string, { eyebrow: string; title: string }> = {
  "/dashboard": { eyebrow: "athlete", title: "Início" },
  "/dashboard/treino": { eyebrow: "athlete", title: "Treino" },
  "/dashboard/historico": { eyebrow: "athlete", title: "Histórico" },
  "/dashboard/treinadores": { eyebrow: "athlete", title: "Treinadores" },
  "/dashboard/perfil": { eyebrow: "athlete", title: "Perfil" },
};

const ClientLayout = () => {
  const location = useLocation();
  const current =
    Object.entries(routeLabels).find(([path]) =>
      path === "/dashboard"
        ? location.pathname === path
        : location.pathname === path || location.pathname.startsWith(`${path}/`),
    )?.[1] ?? routeLabels["/dashboard"];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] font-body text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-15%] top-[8%] h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/88 px-safe pt-safe backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between gap-3 md:max-w-4xl">
          <div className="flex min-w-0 items-center gap-3">
            <img src={logo} alt="FitBlock Training" className="h-11 w-auto object-contain" />
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">{current.eyebrow}</p>
              <p className="truncate text-sm font-medium text-foreground">{current.title}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto min-w-0 max-w-lg px-safe pt-5 md:max-w-4xl md:px-[max(2.5rem,env(safe-area-inset-left,0px))] md:pr-[max(2.5rem,env(safe-area-inset-right,0px))] md:pt-8">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
};

export default ClientLayout;
