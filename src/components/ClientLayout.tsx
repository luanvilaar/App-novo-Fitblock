import { Outlet, useLocation } from "react-router-dom";
import { Dumbbell } from "lucide-react";

import BottomNav from "@/components/BottomNav";

const routeLabels: Record<string, { eyebrow: string; title: string }> = {
  "/dashboard": { eyebrow: "athlete hub", title: "Início" },
  "/dashboard/treino": { eyebrow: "execution", title: "Treino" },
  "/dashboard/historico": { eyebrow: "history", title: "Histórico" },
  "/dashboard/treinadores": { eyebrow: "community", title: "Treinadores" },
  "/dashboard/perfil": { eyebrow: "identity", title: "Perfil" },
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
    <div className="app-shell relative min-h-screen overflow-x-hidden text-white selection:bg-primary selection:text-black">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(30,215,96,0.08),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_18%)]" />
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0b0d0d]/84 px-safe pt-safe backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/18 bg-primary/12 text-primary shadow-[0_12px_30px_rgba(30,215,96,0.12)]">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-white/38">{current.eyebrow}</p>
              <h2 className="truncate font-display text-2xl text-white">{current.title}</h2>
            </div>
          </div>
          <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-white/40 sm:block">
            FitBlock athlete app
          </div>
        </div>
      </header>

      <main className="relative mx-auto min-h-screen w-full max-w-6xl px-4 pb-36 pt-6 sm:px-6">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
};

export default ClientLayout;
