import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, UserPlus, Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface UserRow {
  user_id: string;
  name: string;
  email: string;
  roles: string[];
}

const AdminPanel = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, email")
      .order("name");

    if (profiles) {
      const { data: allRoles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const roleMap: Record<string, string[]> = {};
      allRoles?.forEach((r) => {
        if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
        roleMap[r.user_id].push(r.role);
      });

      setUsers(
        profiles.map((p) => ({
          user_id: p.user_id,
          name: p.name,
          email: p.email,
          roles: roleMap[p.user_id] || [],
        }))
      );
    }
    setLoading(false);
  };

  const promoteToTrainer = async (userId: string) => {
    setPromoting(userId);
    try {
      // Check if already trainer
      const user = users.find((u) => u.user_id === userId);
      if (user?.roles.includes("trainer")) {
        toast.info("Usuário já é treinador");
        return;
      }

      // Insert trainer role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "trainer" as any });
      if (roleError) throw roleError;

      // Create trainer record
      const { error: trainerError } = await supabase
        .from("trainers")
        .insert({ user_id: userId });
      if (trainerError && !trainerError.message.includes("duplicate")) throw trainerError;

      toast.success("Usuário promovido a treinador!");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setPromoting(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Acesso negado</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto pt-10">
      <h1 className="text-2xl font-light tracking-tight mb-2 flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary" />
        Painel Admin
      </h1>
      <p className="text-muted-foreground mb-8">Gerencie usuários e promova treinadores</p>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 pl-10 rounded-xl bg-secondary border-border"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((user, i) => (
            <motion.div
              key={user.user_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card-premium p-5 flex items-center justify-between"
            >
              <div>
                <p className="font-bold">{user.name || "Sem nome"}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex gap-1 mt-1">
                  {user.roles.map((r) => (
                    <span
                      key={r}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        r === "trainer"
                          ? "bg-primary/20 text-primary"
                          : r === "admin"
                          ? "bg-destructive/20 text-destructive"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
              {!user.roles.includes("trainer") && (
                <Button
                  size="sm"
                  onClick={() => promoteToTrainer(user.user_id)}
                  disabled={promoting === user.user_id}
                >
                  {promoting === user.user_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  Treinador
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
