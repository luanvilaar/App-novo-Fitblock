import logo from "@/assets/logo_fit.png";

const Footer = () => {
  return (
    <footer className="bg-background pt-16 sm:pt-24 pb-12 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="text-2xl font-bold tracking-tighter text-foreground uppercase mb-6 flex items-center gap-2">
              <span className="text-primary font-extrabold tracking-tighter">
                FITBLOCK
              </span>
              TRAINING
            </div>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              Uma plataforma de performance para treinadores e atletas que recusam a mediocridade.
              Prescrição inteligente, evolução contínua.
            </p>
          </div>

          <div>
            <h4 className="text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
              Plataforma
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground font-medium">
              <li>
                <a href="#metodologia" className="hover:text-foreground transition-colors">
                  Metodologia
                </a>
              </li>
              <li>
                <a href="#programas" className="hover:text-foreground transition-colors">
                  Programas
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
              Legal
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground font-medium">
              <li>
                <a href="/politicas#termos" className="hover:text-foreground transition-colors">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="/politicas#privacidade" className="hover:text-foreground transition-colors">
                  Privacidade
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground/50 text-[10px] uppercase tracking-widest">
            © {new Date().getFullYear()} FitBlock Training. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_hsl(265_60%_50%)]" />
            <span className="text-muted-foreground text-[10px] font-mono tracking-widest">
              SYSTEM STATUS: ONLINE
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
