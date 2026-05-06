import { motion } from "framer-motion";
import { Star } from "lucide-react";
import wendellImg from "@/assets/wendell.png";
import dalilaImg from "@/assets/dalila.png";
import pulsefitImg from "@/assets/pulsefit.png";

const testimonials = [
  {
    name: "Wendel",
    role: "Atleta Intermediário",
    text: "Sou atleta de nível intermediário e sempre tive dificuldade em evoluir para o RX. Depois que comecei a seguir o programa da FitBlock, minha evolução se tornou constante e estruturada.",
    avatar: wendellImg,
  },
  {
    name: "Dalila",
    role: "Médica",
    text: "Tenho uma rotina intensa entre trabalho e estudos, e mesmo treinando apenas uma sessão por dia, estou tendo resultados incríveis. Me sinto mais forte e com muito mais energia.",
    avatar: dalilaImg,
  },
  {
    name: "PulseFit",
    role: "Centro de Treinamento",
    text: "Escolhemos a metodologia da FitBlock porque precisávamos de um programa estruturado, que realmente entregasse resultados. Nossos alunos evoluem com consistência e segurança.",
    avatar: pulsefitImg,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-16 sm:py-24 md:py-32 bg-card/50 border-y border-border relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 text-primary text-xs font-bold tracking-[0.2em] mb-6 uppercase">
            <span className="w-4 h-px bg-primary" />
            Depoimentos
            <span className="w-4 h-px bg-primary" />
          </span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold text-foreground tracking-tight uppercase">
            Quem treina <span className="text-muted-foreground/30">aprova</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-foreground/5 border border-foreground/5 p-5 sm:p-8 hover:border-primary/20 transition-all duration-300 group"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground/80 text-sm leading-relaxed mb-8">"{t.text}"</p>
              <div className="flex items-center gap-3 border-t border-border pt-6">
                <div className="w-10 h-10 overflow-hidden bg-secondary">
                  {t.avatar && <img src={t.avatar} alt={t.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />}
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground uppercase tracking-wider">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
