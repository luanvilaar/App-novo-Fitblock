import { Home, Dumbbell, User, UserSearch, LogOut } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

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
    <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border/70 bg-background/92 px-2 pb-safe pt-1 backdrop-blur-xl sm:px-4">
      <div className="mx-auto flex h-16 max-w-2xl items-stretch justify-between gap-0.5 sm:gap-1">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.to ||
            (item.to !== "/dashboard" && location.pathname.startsWith(item.to));

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "relative flex min-h-[3.5rem] min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-0.5 px-0.5 transition-all",
                isActive ? "text-primary" : "text-foreground/45",
              )}
            >
              {isActive && (
                <div className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 bg-primary" />
              )}
              <item.icon className={cn("h-5 w-5 shrink-0 transition-transform", isActive && "scale-110")} />
              <span
                className={cn(
                  "w-full truncate text-center font-mono text-[7px] uppercase leading-tight tracking-[0.12em] sm:text-[9px] sm:tracking-[0.16em]",
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
          onClick={handleLogout}
          className="group relative flex min-h-[3.5rem] min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-0.5 px-0.5 text-foreground/45 transition-all hover:text-destructive"
        >
          <LogOut className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110 group-hover:-translate-x-0.5" />
          <span className="w-full truncate text-center font-mono text-[7px] uppercase leading-tight tracking-[0.12em] sm:text-[9px] sm:tracking-[0.16em]">
            Sair
          </span>
        </button>

        <div className="group relative flex min-h-[3.5rem] min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-0.5 px-0.5">
          <NotificationBell
            triggerClassName="h-auto w-auto border-0 bg-transparent p-0 hover:bg-transparent"
            iconClassName="text-foreground/45 transition-colors group-hover:text-primary"
          />
          <span className="w-full truncate text-center font-mono text-[7px] uppercase leading-tight tracking-[0.12em] text-foreground/45 transition-colors group-hover:text-primary sm:text-[9px] sm:tracking-[0.16em]">
            Alertas
          </span>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
