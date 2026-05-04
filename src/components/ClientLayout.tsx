import { Outlet, useLocation } from "react-router-dom";
import { Dumbbell } from "lucide-react";

import BottomNav from "@/components/BottomNav";
import { StudentPill } from "@/components/client/StudentPagePrimitives";

const routeLabels: Record<string, { eyebrow: string; title: string }> = {
  "/dashboard": { eyebrow: "athlete hub", title: "Início" },
  "/dashboard/sessao": { eyebrow: "session", title: "Sessão" },
  "/dashboard/evolucao": { eyebrow: "progress", title: "Evolução" },
  "/dashboard/historico": { eyebrow: "history", title: "Histórico" },
  "/dashboard/treinadores": { eyebrow: "community", title: "Treinadores" },
  "/dashboard/perfil": { eyebrow: "identity", title: "Perfil" },
};

const ClientLayout = () => {
  const location = useLocation();
  const isImmersiveRoute =
    /^\/dashboard\/treino\/[^/]+/.test(location.pathname) ||
    /^\/dashboard\/revisao\/[^/]+/.test(location.pathname);
  const current =
    Object.entries(routeLabels).find(([path]) =>
      path === "/dashboard"
        ? location.pathname === path
        : location.pathname === path || location.pathname.startsWith(`${path}/`),
    )?.[1] ?? routeLabels["/dashboard"];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f6f5f1] text-black selection:bg-black selection:text-white">
      {!isImmersiveRoute ? (
        <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 px-safe pt-safe backdrop-blur-xl">
          <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black text-white shadow-[0_14px_30px_-18px_rgba(0,0,0,0.55)]">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-black/38">{current.eyebrow}</p>
                <h2 className="truncate font-display text-2xl text-black">{current.title}</h2>
              </div>
            </div>
            <div className="hidden sm:block">
              <StudentPill>fitblock athlete</StudentPill>
            </div>
          </div>
        </header>
      ) : null}

      <main
        className={
          isImmersiveRoute
            ? "relative min-h-screen w-full"
            : "relative mx-auto min-h-screen w-full max-w-6xl px-4 pb-36 pt-5 sm:px-6 sm:pt-6"
        }
      >
        <Outlet />
      </main>

      {!isImmersiveRoute ? <BottomNav /> : null}
    </div>
  );
};

export default ClientLayout;
