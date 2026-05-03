import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-xs font-semibold uppercase tracking-[0.18em] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-medium hover:brightness-110 tracking-[1.4px]",
        destructive: "bg-destructive text-destructive-foreground shadow-medium hover:brightness-110 tracking-[1.4px]",
        outline: "border border-border bg-transparent text-foreground hover:border-primary/35 hover:bg-primary/8 hover:text-primary tracking-[1.4px]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent tracking-[1.4px]",
        ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground tracking-[1.4px]",
        link: "text-primary underline-offset-4 hover:underline tracking-normal lowercase",
        hero: "bg-primary text-primary-foreground shadow-medium hover:brightness-110 relative overflow-hidden btn-striped tracking-[2px]",
        heroOutline: "border border-border bg-card text-foreground hover:border-primary/35 hover:bg-primary/8 hover:text-primary tracking-[1.4px]",
        terminal: "border border-primary/45 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-mono tracking-[1.4px]",
        "primary-pill": "bg-primary text-primary-foreground shadow-medium hover:brightness-110 tracking-[1.4px]",
        "secondary-pill": "border border-border bg-secondary text-foreground hover:border-primary/35 hover:text-primary tracking-[1.4px]",
        "ghost-pill": "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground tracking-[1.4px]",
        "icon-circle": "h-11 w-11 rounded-full border border-border bg-secondary text-foreground hover:border-primary/35 hover:text-primary",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-3.5 text-[10px]",
        lg: "h-12 px-7",
        xl: "h-14 px-9",
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
