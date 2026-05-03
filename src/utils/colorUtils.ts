/**
 * Converts an HSL color string + opacity into a proper CSS color value.
 * Handles both `hsl(h, s%, l%)` and `hsl(var(--...))` formats.
 */
export function accentWithOpacity(hslColor: string, opacity: number): string {
  // If it's a CSS variable reference, use color-mix or fallback
  if (hslColor.includes("var(")) {
    // Can't decompose CSS vars, use color-mix for modern browsers
    const pct = Math.round(opacity * 100);
    return `color-mix(in srgb, ${hslColor} ${pct}%, transparent)`;
  }

  // Parse hsl(h, s%, l%) or hsl(h s% l%)
  const match = hslColor.match(/hsl\(\s*([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%\s*\)/);
  if (match) {
    const [, h, s, l] = match;
    return `hsla(${h}, ${s}%, ${l}%, ${opacity})`;
  }

  // Fallback: just return the color with opacity via color-mix
  const pct = Math.round(opacity * 100);
  return `color-mix(in srgb, ${hslColor} ${pct}%, transparent)`;
}
