import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <header className="relative min-h-screen w-full flex items-end overflow-hidden bg-background">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt=""
          className="w-full h-full object-cover grayscale brightness-[0.45] contrast-125 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,transparent_50%,hsl(var(--background)))]" />
      </div>

      {/* Hero Content */}
      <div className="w-full max-w-7xl mx-auto z-10 px-4 sm:px-6 pb-20 sm:pb-24 md:pb-32 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-end">
          <div className="md:col-span-8">
            {/* Logo Animation Block */}
            <div className="mb-6 sm:mb-8 flex flex-col gap-1 sm:gap-2 md:flex-row md:items-center md:gap-6">
              <motion.div
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.8 }}
              >
                <h1
                  className="leading-none font-extrabold text-primary tracking-tighter"
                  style={{
                    fontSize: "clamp(3rem, 12vw, 9rem)",
                    filter: "drop-shadow(0 0 30px hsl(265 60% 50% / 0.4))",
                  }}
                >
                  FITBLOCK
                </h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -40, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="py-1 sm:py-2 pl-1"
              >
                <h2
                  className="text-foreground/80 tracking-tight leading-[0.95] uppercase font-semibold"
                  style={{ fontSize: "clamp(1.5rem, 5vw, 3rem)" }}
                >
                  Training
                  <br />
                  <span className="text-muted-foreground">System</span>
                </h2>
              </motion.div>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-xs sm:text-sm md:text-lg text-muted-foreground max-w-lg leading-relaxed border-l-2 border-primary pl-4 sm:pl-6"
            >
              Funcional Fitness, musculação e condicionamento em uma plataforma única.
              Prescrição inteligente e evolução contínua.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="md:col-span-4 flex flex-col gap-4 sm:gap-6 justify-end"
          >
            {/* Capacity indicator */}
            <div className="flex gap-4 text-xs text-primary font-mono items-center">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              PLATAFORMA: ATIVA
            </div>

            {/* Category grid */}
            <div className="grid grid-cols-2 gap-px bg-foreground/5 border border-foreground/5">
              <Link
                to="/auth"
                className="bg-background/80 p-4 sm:p-5 hover:bg-primary/10 transition-colors cursor-pointer group border-r border-foreground/5"
              >
                <span className="block text-xl sm:text-2xl text-foreground font-medium mb-1">01</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                  Funcional
                </span>
              </Link>
              <Link
                to="/auth"
                className="bg-background/80 p-4 sm:p-5 hover:bg-primary/10 transition-colors cursor-pointer group"
              >
                <span className="block text-xl sm:text-2xl text-foreground font-medium mb-1">02</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                  Musculação
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="w-px h-16 bg-gradient-to-b from-transparent via-primary to-transparent animate-pulse" />
      </div>
    </header>
  );
};

export default HeroSection;
