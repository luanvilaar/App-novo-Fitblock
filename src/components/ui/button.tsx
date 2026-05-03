import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.1em] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background hover:bg-primary hover:text-primary-foreground clip-cut-corner-sm",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80 clip-cut-corner-sm",
        outline: "border border-border bg-transparent hover:border-foreground/50 hover:bg-foreground/5 clip-cut-corner-sm",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 clip-cut-corner-sm",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline tracking-normal lowercase",
        hero: "bg-foreground text-background hover:bg-primary relative overflow-hidden btn-striped clip-cut-corner-sm",
        heroOutline: "border border-border text-foreground hover:bg-foreground hover:text-background clip-cut-corner-sm",
        terminal: "border border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground font-mono clip-cut-corner-sm",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-[10px]",
        lg: "h-12 px-8",
        xl: "h-14 px-10",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
