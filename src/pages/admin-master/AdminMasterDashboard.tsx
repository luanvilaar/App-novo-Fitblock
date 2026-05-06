import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, BarChart3 } from "lucide-react";

const AdminMasterDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin) {
      navigate("/redirect", { replace: true });
    }
  }, [isAdmin, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-secondary/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-light tracking-tight">Admin Master</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">FitBlock Training</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stats Card */}
          <div className="card-premium p-6 space-y-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-semibold">Dashboard</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Bem-vindo ao painel de administração master. Aqui você pode gerenciar todos os aspectos da plataforma.
            </p>
            <p className="text-xs text-muted-foreground">
              Usuário: {user?.email}
            </p>
          </div>

          {/* Settings Card */}
          <div className="card-premium p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-semibold">Configurações</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Mais funcionalidades de administração serão adicionadas em breve.
            </p>
            <Button variant="outline" size="sm" disabled>
              Em desenvolvimento
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminMasterDashboard;
