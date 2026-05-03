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
    <div className="relative min-h-screen bg-white text-black selection:bg-black selection:text-white">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 px-safe pt-safe backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-4xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black">
              <span className="font-sans text-xl font-bold text-white tracking-tighter">FB</span>
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[1.4px] text-black/40">{current.eyebrow}</p>
              <h2 className="truncate font-sans text-lg font-bold text-black">{current.title}</h2>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto min-h-screen max-w-4xl px-6 pb-32 pt-8">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
};

export default ClientLayout;
