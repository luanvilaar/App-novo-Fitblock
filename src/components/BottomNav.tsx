import { Home, Dumbbell, User, UserSearch, LogOut } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import NotificationBell from "@/components/NotificationBell";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
    <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t border-black/5 bg-white/90 px-6 pb-safe pt-2 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-between gap-2">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.to ||
            (item.to !== "/dashboard" && location.pathname.startsWith(item.to));

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "relative flex h-14 flex-1 flex-col items-center justify-center gap-1 transition-all",
                isActive ? "text-black" : "text-black/30 hover:text-black/50"
              )}
            >
              <item.icon className={cn("h-6 w-6 transition-all", isActive ? "scale-110 stroke-[2.5px]" : "stroke-[2px]")} />
              <span className="font-sans text-[9px] font-black uppercase tracking-[0.8px]">
                {item.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="activeNav"
                  className="absolute -bottom-1 h-1 w-1 rounded-full bg-black"
                />
              )}
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={handleLogout}
          className="flex h-14 flex-1 flex-col items-center justify-center gap-1 text-black/30 transition-all hover:text-black/50"
        >
          <LogOut className="h-6 w-6 stroke-[2px]" />
          <span className="font-sans text-[9px] font-black uppercase tracking-[0.8px]">Sair</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
