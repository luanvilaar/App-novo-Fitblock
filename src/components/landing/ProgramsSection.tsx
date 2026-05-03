import { motion } from "framer-motion";
import p1Img from "@/assets/p1.png";
import p2Img from "@/assets/p2.png";

const programs = [
  {
    title: "Funcional Fitness",
    description: "WODs intensos, ginástica e levantamento olímpico para performance máxima.",
    image: p1Img,
    tag: "Alta intensidade",
    code: "SETOR_01",
  },
  {
    title: "Musculação",
    description: "Hipertrofia e força com periodização progressiva e controle de carga.",
    image: p2Img,
    tag: "Força & Volume",
    code: "SETOR_02",
  },
];

const ProgramsSection = () => {
  return (
    <section id="programas" className="bg-background pt-16 sm:pt-24 md:pt-32 pb-16 sm:pb-24 md:pb-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-foreground/10 pb-6"
        >
          <div>
            <h2 className="text-3xl font-semibold text-foreground tracking-tight uppercase">
              Nossos Programas
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              Escolha o programa ideal para seus objetivos.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {programs.map((program, i) => (
            <motion.div
              key={program.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative group overflow-hidden bg-card h-[280px] sm:h-[350px] md:h-[400px]"
            >
              <img
                src={program.image}
                alt={program.title}
                className="w-full h-full object-cover grayscale brightness-90 transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0 group-hover:brightness-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90" />
              <div className="absolute bottom-6 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8 border-l-2 border-primary pl-4">
                <span className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1 block">
                  {program.tag}
                </span>
                <h3 className="text-2xl text-foreground font-semibold uppercase tracking-tight">
                  {program.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
                  {program.code}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;
