import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "admin" | "trainer" | "cliente";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  isTrainer: boolean;
  isAdmin: boolean;
  isCliente: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  roles: [],
  isTrainer: false,
  isAdmin: false,
  isCliente: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);

  const fetchRoles = useCallback(async (userId: string): Promise<AppRole[]> => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (error) {
      console.warn("Auth: falha ao carregar user_roles (mantendo sessão e roles anteriores)", error);
      return [];
    }
    const fetched = data ? data.map((r) => r.role as AppRole) : [];
    setRoles(fetched);
    return fetched;
  }, []);

  useEffect(() => {
    let mounted = true;
    let initialSessionHandled = false;

    // Set up listener FIRST (Supabase SDK requirement)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        // Skip if initial session handler will cover this
        if (!initialSessionHandled) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          void fetchRoles(session.user.id).finally(() => {
            if (mounted) setLoading(false);
          });
        } else {
          setRoles([]);
          setLoading(false);
        }
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      initialSessionHandled = true;
      setSession(session);
      setUser(session?.user ?? null);
      try {
        if (session?.user) {
          await fetchRoles(session.user.id);
        }
      } catch (e) {
        console.warn("Auth: erro ao resolver roles na sessão inicial", e);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchRoles]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        roles,
        isTrainer: roles.includes("trainer"),
        isAdmin: roles.includes("admin"),
        isCliente: roles.includes("cliente"),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
