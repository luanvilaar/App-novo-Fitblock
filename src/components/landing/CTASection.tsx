import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-16 sm:py-24 md:py-32 bg-card/30 relative">
      <div className="absolute inset-0 opacity-5 laser-grid pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-2xl sm:text-4xl md:text-6xl font-semibold text-foreground tracking-tight uppercase mb-6">
            Pronto para <span className="text-primary glow-text">evoluir?</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base tracking-wide uppercase max-w-xl mx-auto mb-12">
            Comece agora a prescrever e acompanhar treinos com a plataforma mais completa do mercado.
          </p>
          <Link
            to="/auth"
            className="inline-flex group items-center gap-3 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-[0.2em] px-6 py-4 sm:px-10 sm:py-5 hover:bg-primary/90 transition-all duration-500 shadow-[0_0_30px_hsl(265_60%_50%/0.3)]"
          >
            Criar conta gratuita
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
