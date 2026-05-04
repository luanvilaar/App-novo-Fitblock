import { Dumbbell, Home, LogOut, User, UserSearch } from "lucide-react";
import { motion } from "framer-motion";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Início" },
  { to: "/dashboard/treino", icon: Dumbbell, label: "Treino" },
  { to: "/dashboard/treinadores", icon: UserSearch, label: "Coach" },
  { to: "/dashboard/perfil", icon: User, label: "Perfil" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Sessão encerrada",
        description: "Você saiu do sistema com sucesso.",
      });
      navigate("/");
    } catch {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: "Não foi possível encerrar sua sessão.",
      });
    }
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[100] px-safe pb-safe pt-3">
      <div className="mx-auto flex max-w-3xl items-end gap-3">
        <div className="flex h-[74px] flex-1 items-center justify-between gap-2 rounded-[2rem] border border-white/10 bg-[#0b0d0d]/92 px-3 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.to ||
              (item.to !== "/dashboard" && location.pathname.startsWith(item.to));

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-[1.2rem] px-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d0d]",
                  isActive ? "text-black" : "text-white/42 hover:bg-white/[0.05] hover:text-white/72",
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="client-nav-active"
                    className="absolute inset-0 rounded-[1.2rem] border border-primary/20 bg-primary shadow-[0_16px_30px_rgba(30,215,96,0.22)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                ) : null}
                <item.icon className={cn("relative z-10 h-5 w-5", isActive ? "stroke-[2.4px]" : "stroke-[2px]")} />
                <span className="relative z-10 truncate text-[10px] font-semibold uppercase tracking-[0.18em]">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Encerrar sessão"
          className="flex h-[74px] w-[74px] shrink-0 flex-col items-center justify-center gap-1 rounded-[1.65rem] border border-white/10 bg-[#0b0d0d]/92 text-white/58 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-all hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d0d]"
        >
          <LogOut className="h-5 w-5 stroke-[2px]" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.18em]">Sair</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
