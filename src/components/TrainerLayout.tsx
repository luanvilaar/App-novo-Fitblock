import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Dumbbell,
  CalendarDays,
  LogOut,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/NotificationBell";

const sideItems = [
  { to: "/trainer", icon: CalendarDays, label: "Agenda", end: true },
  { to: "/trainer/atletas", icon: Users, label: "Atletas" },
  { to: "/trainer/treinos", icon: Dumbbell, label: "Treinos" },
];

const TrainerLayout = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const currentItem =
    sideItems.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
    ) ?? sideItems[0];

  return (
    <div className="relative flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden bg-[#f8f8f8] font-sans text-black selection:bg-black selection:text-white md:flex-row p-4 md:p-6 lg:p-8">
      
      {/* Desktop Sidebar */}
      <aside className="relative z-20 hidden w-[240px] shrink-0 flex-col md:flex">
        <div className="space-y-12 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black shadow-lg">
              <span className="font-sans text-2xl font-black text-white tracking-tighter">FB</span>
            </div>
          </div>
          
          <nav className="space-y-2">
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
                    "group flex items-center gap-4 rounded-full px-5 py-3 font-sans text-sm font-bold transition-all",
                    isActive
                      ? "bg-black text-white"
                      : "text-black/40 hover:text-black hover:bg-black/5",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-all",
                      isActive ? "scale-110" : "",
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="uppercase tracking-[0.1em] text-[9px] font-black">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-6">
          <button
            type="button"
            onClick={signOut}
            className="group flex w-full items-center gap-4 rounded-full bg-white px-6 py-4 font-sans text-[9px] font-black uppercase tracking-widest text-black/30 transition-all hover:bg-black hover:text-white shadow-sm border border-black/5"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
          <p className="text-center font-mono text-[8px] font-black uppercase tracking-[0.2em] text-black/10">
            FitBlock v2.0
          </p>
        </div>
      </aside>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[3rem] bg-white shadow-zen border border-black/5">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 px-8 pt-safe backdrop-blur-xl md:hidden">
          <div className="flex h-20 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[9px] font-black uppercase tracking-widest text-black/30">Coach</p>
              <p className="truncate font-sans text-xl font-black tracking-tight text-black">{currentItem.label}</p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </div>
        </header>

        <main className="custom-scrollbar relative z-10 min-h-0 min-w-0 w-full max-w-full flex-1 overflow-y-auto overflow-x-hidden pb-40 md:pb-0">
          <div className="relative mx-auto w-full min-w-0 max-w-[1400px] p-8 md:p-12 lg:p-16">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav - Refined Zen Style */}
      <nav className="fixed bottom-6 left-6 right-6 z-[100] md:hidden">
        <div className="mx-auto flex h-18 max-w-lg items-center justify-between rounded-full bg-white/90 p-2 shadow-zen border border-black/5 backdrop-blur-2xl">
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
                  "relative flex flex-1 h-14 items-center justify-center rounded-full transition-all duration-300",
                  isActive ? "bg-black text-white shadow-lg" : "text-black/30"
                )}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <item.icon className={cn("h-5 w-5", isActive ? "scale-110" : "")} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {isActive && (
                  <motion.div 
                    layoutId="activeNavTrainer"
                    className="absolute inset-0 z-[-1] rounded-full bg-black shadow-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default TrainerLayout;
