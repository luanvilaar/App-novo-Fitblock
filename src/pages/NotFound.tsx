import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Radar } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-safe pt-safe pb-safe">
      <div className="card-premium w-full max-w-md rounded-[32px] p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
          <Radar className="h-7 w-7" />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">erro de navegação</p>
        <h1 className="mt-3 font-display text-5xl text-foreground">404</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          A rota <span className="text-foreground">{location.pathname}</span> não foi encontrada no app.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary transition-colors hover:brightness-110"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          voltar ao início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
