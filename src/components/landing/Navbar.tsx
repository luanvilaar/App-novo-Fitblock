import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import logo from "@/assets/logo_fit.png";

const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-40 mix-blend-difference px-4 sm:px-6 py-4 sm:py-6 border-b border-foreground/5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-lg tracking-tighter text-foreground uppercase flex items-center gap-3 font-semibold">
          <span className="text-primary text-2xl font-extrabold tracking-tighter">
            FITBLOCK
          </span>
          <span className="text-muted-foreground text-xs tracking-widest border-l border-border pl-3">
            Training
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 text-xs font-medium tracking-widest uppercase text-muted-foreground">
          <a href="#metodologia" className="hover:text-primary transition-colors">
            Metodologia
          </a>
          <a href="#programas" className="hover:text-primary transition-colors">
            Programas
          </a>
        </div>

        {/* CTA */}
        <Link
          to="/auth"
          className="hidden md:flex group items-center gap-2 text-xs font-semibold tracking-widest uppercase border border-primary/30 text-foreground/80 px-6 py-3 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-500"
        >
          Entrar
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Mobile */}
        <Link
          to="/auth"
          className="md:hidden text-xs font-bold tracking-widest uppercase border border-primary/30 text-foreground/80 px-4 py-2 hover:bg-primary hover:text-primary-foreground transition-all"
        >
          Entrar
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
