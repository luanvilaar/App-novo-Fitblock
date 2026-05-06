import { CalendarDays, LogOut, User } from "lucide-react";
import { motion } from "framer-motion";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: CalendarDays, label: "Treinos" },
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
      <div className="mx-auto flex max-w-3xl items-end gap-2 sm:gap-3">
        <div className="flex h-[74px] flex-1 items-center justify-between gap-1.5 rounded-full bg-black px-2.5 shadow-[0_18px_42px_-24px_rgba(0,0,0,0.72)] sm:gap-2 sm:px-3">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.to ||
              (item.to !== "/dashboard" && location.pathname.startsWith(item.to));

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-full px-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                  isActive ? "text-black" : "text-white/45 hover:bg-white/[0.05] hover:text-white",
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="client-nav-active"
                    className="absolute inset-0 rounded-full bg-white"
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
          className="flex h-[74px] w-[74px] shrink-0 flex-col items-center justify-center gap-1 rounded-full bg-white text-black/58 shadow-[0_18px_42px_-28px_rgba(0,0,0,0.68)] transition-all hover:bg-[#efefef] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f5f1]"
        >
          <LogOut className="h-5 w-5 stroke-[2px]" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.18em]">Sair</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
