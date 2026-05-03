import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import fitblockLogo from "@/assets/logo_fit.png";
import pulsefitLogo from "@/assets/logo_pulse.png";

const LOCAL_LOGOS: Record<string, string> = {
  "fitblock-training": fitblockLogo,
  "pulsefit": pulsefitLogo,
};

export interface BoxBranding {
  name: string;
  slug: string;
  logo_url: string | null;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  gradientFrom: string;
  gradientTo: string;
}

const BOX_THEMES: Record<string, Omit<BoxBranding, "name" | "slug" | "logo_url">> = {
  "pulsefit": {
    accentColor: "hsl(24, 95%, 53%)",
    accentBg: "bg-[hsl(24,95%,53%)]/15",
    accentBorder: "border-[hsl(24,95%,53%)]/30",
    accentText: "text-[hsl(24,95%,53%)]",
    gradientFrom: "from-[hsl(24,95%,53%)]",
    gradientTo: "to-[hsl(15,80%,45%)]",
  },
  "fitblock-training": {
    accentColor: "hsl(245, 58%, 52%)",
    accentBg: "bg-primary/15",
    accentBorder: "border-primary/30",
    accentText: "text-primary",
    gradientFrom: "from-primary",
    gradientTo: "to-[hsl(290,60%,70%)]",
  },
};

const DEFAULT_THEME: Omit<BoxBranding, "name" | "slug" | "logo_url"> = BOX_THEMES["fitblock-training"];

export function useBoxBranding(boxSlug?: string): BoxBranding | null {
  const [branding, setBranding] = useState<BoxBranding | null>(null);

  useEffect(() => {
    if (!boxSlug) {
      setBranding(null);
      return;
    }

    const load = async () => {
      const { data } = await supabase
        .from("boxes")
        .select("name, slug, logo_url")
        .eq("slug", boxSlug)
        .maybeSingle();

      if (data) {
        const theme = BOX_THEMES[data.slug] || DEFAULT_THEME;
        const logo = data.logo_url || LOCAL_LOGOS[data.slug] || null;
        setBranding({ name: data.name, slug: data.slug, logo_url: logo, ...theme });
      }
    };
    load();
  }, [boxSlug]);

  return branding;
}
