import type { HTMLAttributes, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrainerPanelCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Título em destaque (estilo “PRO PLAN”) */
  title?: string;
  /** Subtítulo em cinza médio */
  subtitle?: string;
  /** Linha de eyebrow / meta acima do título */
  eyebrow?: string;
  /** Conteúdo principal (coluna esquerda ou corpo único) */
  children: ReactNode;
  /** Coluna direita: imagem, ilustração (layout referência) */
  aside?: ReactNode;
  /** Lista com ícone de check laranja (`energy`) */
  features?: string[];
  /** Borda/acento roxo (primary) */
  accent?: boolean;
  /** Padding interno mais compacto (stats) */
  compact?: boolean;
  /** Sem padding interno (ex.: full-bleed link) */
  flush?: boolean;
  /** Ocultar borda lateral entre conteúdo e aside em desktop */
  asideReverse?: boolean;
}

export function TrainerPanelCard({
  className,
  title,
  subtitle,
  eyebrow,
  children,
  aside,
  features,
  accent = false,
  compact = false,
  flush = false,
  asideReverse = false,
  ...rest
}: TrainerPanelCardProps) {
  const pad = flush ? "p-0" : compact ? "p-6 md:p-7" : "p-6 md:p-8 lg:p-10";

  return (
    <div
      className={cn(
        "relative w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-card transition-colors duration-300",
        accent && "border-primary/25",
        aside
          ? "flex h-full min-h-0 flex-col items-stretch lg:flex-row lg:items-stretch lg:gap-0"
          : "",
        className
      )}
      {...rest}
    >
      <div
        className={cn(
          pad,
          "flex min-h-0 min-w-0 flex-1 flex-col",
          aside && "lg:max-w-[62%] lg:overflow-hidden",
          asideReverse && aside && "order-2 lg:order-2"
        )}
      >
        {(eyebrow || title || subtitle) && (
          <header className={cn("mb-6 space-y-1.5", compact && "mb-5")}>
            {eyebrow && (
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
            )}
            {title && (
              <h3 className="break-words font-display text-[1.5rem] font-normal tracking-[-0.04em] text-foreground sm:text-[1.7rem] md:text-[1.9rem]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="break-words font-body text-sm font-normal leading-relaxed text-muted-foreground">
                {subtitle}
              </p>
            )}
          </header>
        )}

        <div className="flex min-h-0 flex-1 flex-col">{children}</div>

        {features && features.length > 0 && (
          <ul className={cn("mt-6 space-y-2.5", compact && "mt-5")}>
            {features.map((line) => (
              <li key={line} className="flex items-start gap-3 font-body text-sm text-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {aside && (
        <div
          className={cn(
            "relative flex min-h-[200px] flex-1 overflow-hidden border-t border-border/80 lg:min-h-0 lg:max-w-[38%] lg:w-[38%] lg:flex-shrink-0 lg:shrink-0 lg:self-stretch lg:border-l lg:border-t-0 lg:border-border/80",
            asideReverse && "order-1 lg:order-1 lg:border-l-0 lg:border-r lg:border-border/80"
          )}
        >
          {aside}
        </div>
      )}
    </div>
  );
}

/** Bloco de mídia padrão: imagem escala de cinza e cantos arredondados (referência). */
export function TrainerPanelCardMedia({
  src,
  alt = "",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("relative h-full min-h-[200px] w-full bg-[#f1efe7] lg:min-h-0", className)}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover saturate-[0.88]"
        loading="lazy"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#f7f7f4]/92 via-[#f7f7f4]/12 to-transparent lg:bg-gradient-to-l" />
    </div>
  );
}
