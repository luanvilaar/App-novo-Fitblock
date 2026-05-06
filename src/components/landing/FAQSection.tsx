import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "O que é a metodologia FitBlock Training?",
    answer:
      "FitBlock Training é uma metodologia de periodização que organiza seus treinos em blocos progressivos. Cada bloco tem um objetivo específico — força, hipertrofia, condicionamento — garantindo evolução contínua e mensurável.",
  },
  {
    question: "Preciso ter experiência em Funcional Fitness ou musculação?",
    answer:
      "Não! A plataforma é para todos os níveis. Seu treinador adapta os exercícios, cargas e volume de acordo com sua experiência e objetivos pessoais.",
  },
  {
    question: "Como funciona o acompanhamento do treinador?",
    answer:
      "Seu treinador prescreve treinos diretamente no app, acompanha suas cargas e evolução em tempo real, e recebe notificações do seu progresso. É como ter um personal 24/7.",
  },
  {
    question: "Posso treinar em qualquer academia?",
    answer:
      "Sim! O FitBlock é uma plataforma de prescrição de treinos. Você acessa seus treinos pelo celular e pode executá-los em qualquer lugar — academia, box, ou em casa.",
  },
  {
    question: "Sou treinador, como cadastro meus alunos?",
    answer:
      "Basta criar sua conta, acessar o painel de treinador e adicionar seus alunos pelo e-mail. Você pode organizar turmas, prescrever treinos individuais ou em grupo e acompanhar a evolução de cada atleta.",
  },
  {
    question: "A plataforma é gratuita?",
    answer:
      "Sim, o FitBlock Training está disponível gratuitamente durante o período de lançamento. Aproveite para experimentar todas as funcionalidades sem custo.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-16 sm:py-24 md:py-32 bg-background relative">
      <div className="absolute inset-0 laser-grid opacity-5 pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 text-primary text-xs font-bold tracking-[0.2em] mb-6 uppercase">
            <span className="w-4 h-px bg-primary" />
            Suporte
          </span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold text-foreground tracking-tight uppercase">
            Perguntas <span className="text-muted-foreground/30">frequentes</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="bg-foreground/5 border border-foreground/5 px-6 hover:border-primary/20 transition-colors"
              >
                <AccordionTrigger className="text-left text-sm font-semibold uppercase tracking-wide hover:no-underline hover:text-primary transition-colors py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
