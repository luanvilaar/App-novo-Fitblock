import { motion } from "framer-motion";
import { Target, TrendingUp, Users } from "lucide-react";
import ft1Img from "@/assets/ft1.png";

const features = [
  {
    icon: Target,
    title: "Prescrição Inteligente",
    description: "Treinos individuais ou em grupo, personalizados com séries, cargas e progressão automatizada.",
  },
  {
    icon: TrendingUp,
    title: "Evolução Visível",
    description: "Gráficos de progressão de carga, volume semanal e frequência. Seus dados, seu progresso.",
  },
  {
    icon: Users,
    title: "Gestão Completa",
    description: "Gerencie atletas, grupos e turmas. Aplique treinos em massa com um clique.",
  },
];

const MethodologySection = () => {
  return (
    <section id="metodologia" className="relative py-16 sm:py-24 md:py-32 bg-background overflow-hidden border-t border-border">
      <div className="absolute inset-0 laser-grid opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          {/* Typography Block */}
          <div className="md:col-span-7">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 text-primary text-xs font-bold tracking-[0.2em] mb-6 uppercase"
            >
              <span className="w-4 h-px bg-primary" />
              Metodologia
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-4xl md:text-6xl font-semibold text-foreground tracking-tight leading-tight mb-8"
            >
              NÃO VENDEMOS
              <span className="text-muted-foreground/30"> FITNESS.</span>
              <br />
              FORJAMOS
              <span className="text-primary"> PERFORMANCE.</span>
            </motion.h2>

            <div className="space-y-6 text-muted-foreground text-sm md:text-lg font-light leading-relaxed max-w-2xl">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center border border-primary/20 bg-primary/5">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold text-base mb-1">{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>

          {/* Visual Block */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="md:col-span-5 relative h-full min-h-[500px]"
          >
            <div className="absolute inset-0 bg-card border border-border p-1 group">
              <img
                src={ft1Img}
                alt="Treinamento FitBlock"
                className="h-full w-full object-cover grayscale contrast-125 brightness-75 opacity-60 group-hover:opacity-80 transition-opacity duration-700"
              />
              <div className="absolute bottom-6 left-6 right-6 border-t border-primary pt-4 bg-gradient-to-t from-background/90 to-transparent p-4">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="block text-foreground text-lg font-semibold tracking-tight">
                      NOSSA METODOLOGIA
                    </span>
                    <span className="text-[10px] font-mono text-primary">
                      BLOCO_01 // FUNCIONAL
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MethodologySection;
