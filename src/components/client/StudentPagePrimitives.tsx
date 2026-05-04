import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export const StudentPageSection = ({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) => <div className={cn("space-y-6 pb-10 text-black", className)}>{children}</div>;

export const StudentSurfaceCard = ({
  className,
  children,
  tone = "default",
}: {
  className?: string;
  children?: ReactNode;
  tone?: "default" | "strong" | "soft";
}) => {
  const toneClass =
    tone === "strong"
      ? "border-black/6 bg-white"
      : tone === "soft"
        ? "border-black/6 bg-[#f8f8f8]"
        : "border-black/6 bg-white";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[2rem] border shadow-[0_4px_16px_rgba(0,0,0,0.12)]",
        toneClass,
        className,
      )}
    >
      {children}
    </div>
  );
};

export const StudentPill = ({
  className,
  children,
  accent = false,
}: {
  className?: string;
  children: ReactNode;
  accent?: boolean;
}) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em]",
      accent
        ? "border-black bg-black text-white"
        : "border-black/8 bg-[#efefef] text-black/58",
      className,
    )}
  >
    {children}
  </span>
);

export const StudentSectionHeading = ({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/42">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl text-black">{title}</h2>
      {description ? <div className="mt-3 max-w-2xl text-sm leading-relaxed text-black/58">{description}</div> : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

export const StudentStatCard = ({
  eyebrow,
  value,
  label,
  icon: Icon,
  accent = false,
  className,
}: {
  eyebrow: string;
  value: ReactNode;
  label: ReactNode;
  icon: LucideIcon;
  accent?: boolean;
  className?: string;
}) => (
  <StudentSurfaceCard className={cn("p-5", className)} tone="soft">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/42">{eyebrow}</p>
        <div className={cn("mt-3 font-display text-3xl text-black", accent && "text-black")}>{value}</div>
        <p className="mt-2 text-sm text-black/54">{label}</p>
      </div>
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-2xl border border-black/6 bg-white text-black/64",
          accent && "border-black bg-black text-white",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </StudentSurfaceCard>
);

export const StudentEmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  action?: ReactNode;
}) => (
  <StudentSurfaceCard className="p-10 text-center sm:p-12">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] border border-black/6 bg-[#f3f3f3] text-black/28">
      <Icon className="h-8 w-8" />
    </div>
    <p className="mt-6 font-display text-2xl text-black">{title}</p>
    <div className="mt-2 text-sm leading-relaxed text-black/54">{description}</div>
    {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
  </StudentSurfaceCard>
);
