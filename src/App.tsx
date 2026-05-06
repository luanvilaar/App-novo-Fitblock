import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { supabaseConfigError } from "@/integrations/supabase/client";
import ProtectedRoute from "@/components/ProtectedRoute";
import ClientLayout from "@/components/ClientLayout";
import TrainerLayout from "@/components/TrainerLayout";

import Index from "./pages/Index";
import TrainerRegister from "./pages/TrainerRegister";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import PublicRanking from "./pages/PublicRanking";
import Politicas from "./pages/Politicas";
// Client pages
import ClientTrainingCalendar from "./pages/client/ClientTrainingCalendar";
import WorkoutExecution from "./pages/client/WorkoutExecution";
import ClientProfile from "./pages/client/ClientProfile";

// Trainer pages
import TrainerScheduleHub from "./pages/trainer/TrainerScheduleHub";
import TrainerAthletes from "./pages/trainer/TrainerAthletes";
import TrainerGroups from "./pages/trainer/TrainerGroups";
import TrainerWorkouts from "./pages/trainer/TrainerWorkouts";
import TrainerScopedWorkouts from "./pages/trainer/TrainerScopedWorkouts";
import TrainerCreateWorkoutPage from "./pages/trainer/TrainerCreateWorkoutPage";
import TrainerExerciseLibrary from "./pages/trainer/TrainerExerciseLibrary";
import WorkoutDetail from "./pages/trainer/WorkoutDetail";

// Admin pages
import AdminPanel from "./pages/admin/AdminPanel";

const queryClient = new QueryClient();

const DashboardRedirect = () => {
  const { isTrainer, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (isAdmin) return <Navigate to="/admin" replace />;
  return isTrainer ? <Navigate to="/trainer" replace /> : <Navigate to="/dashboard" replace />;
};

const MissingSupabaseConfig = () => (
  <div className="min-h-screen bg-background px-6 py-10 text-foreground">
    <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col justify-center gap-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Configuracao pendente
        </p>
        <h1 className="text-3xl font-semibold">O projeto abriu, mas o Supabase nao foi configurado.</h1>
        <p className="text-base text-muted-foreground">
          {supabaseConfigError}
        </p>
      </div>

      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Crie um arquivo `.env` na raiz com estes valores:</p>
        <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-sm text-foreground">
{`VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<public-anon-key>`}
        </pre>
        <p>
          Alternativa: use `SUPABASE_ANON_KEY` como fallback da chave publica. Depois reinicie `npm run dev`.
        </p>
      </div>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {supabaseConfigError ? (
        <MissingSupabaseConfig />
      ) : (
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/ranking/:boxSlug" element={<PublicRanking />} />
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Navigate to="/" replace />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/registro-treinador" element={<TrainerRegister />} />
              <Route path="/politicas" element={<Politicas />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/redirect" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
              {/* Client Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><ClientLayout /></ProtectedRoute>}>
                <Route index element={<ClientTrainingCalendar />} />
                <Route path="treino/:id" element={<WorkoutExecution />} />
                <Route path="revisao/:id" element={<WorkoutExecution />} />
                <Route path="sessao" element={<Navigate to="/dashboard" replace />} />
                <Route path="evolucao" element={<Navigate to="/dashboard" replace />} />
                <Route path="treino" element={<Navigate to="/dashboard" replace />} />
                <Route path="historico" element={<Navigate to="/dashboard" replace />} />
                <Route path="treinadores" element={<Navigate to="/dashboard" replace />} />
                <Route path="perfil" element={<ClientProfile />} />
              </Route>

              {/* Trainer Routes */}
              <Route path="/trainer" element={<ProtectedRoute requiredRole="trainer"><TrainerLayout /></ProtectedRoute>}>
                <Route index element={<TrainerScheduleHub />} />
                <Route path="atletas" element={<TrainerAthletes />} />
                <Route path="atletas/:studentId/treinos/criar" element={<TrainerCreateWorkoutPage mode="student" />} />
                <Route path="atletas/:studentId/treinos" element={<TrainerScopedWorkouts mode="student" />} />
                <Route path="grupos" element={<TrainerGroups />} />
                <Route path="grupos/:groupId/treinos/criar" element={<TrainerCreateWorkoutPage mode="group" />} />
                <Route path="grupos/:groupId/treinos" element={<TrainerScopedWorkouts mode="group" />} />
                <Route path="treinos" element={<TrainerWorkouts />} />
                <Route path="biblioteca" element={<TrainerExerciseLibrary />} />
                <Route path="treinos/:id" element={<WorkoutDetail />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      )}
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
