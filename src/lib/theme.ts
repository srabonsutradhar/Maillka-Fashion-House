import type { CSSProperties } from 'react';
import type { StoreDesignSettings } from '../types/store';

function parseHex(hex: string): { r: number; g: number; b: number } {
  const clean = /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex.slice(1) : 'F3ECE1';
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  const toLinear = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function isDarkColor(hex: string): boolean {
  return getRelativeLuminance(hex) < 0.36;
}

export function getThemeStyleVars(design: StoreDesignSettings): CSSProperties {
  const darkCanvas = isDarkColor(design.canvasColor);
  const darkAccent = isDarkColor(design.accentColor);

  const cardBg = darkCanvas
    ? '#1E1A16'
    : `color-mix(in srgb, ${design.canvasColor} 45%, #FAF6EE)`;
  const cardAlt = darkCanvas
    ? '#26211C'
    : `color-mix(in srgb, ${design.surfaceColor} 60%, ${design.canvasColor})`;
  const heroBg = darkCanvas
    ? `linear-gradient(135deg, ${design.surfaceColor} 0%, ${design.canvasColor} 100%)`
    : `linear-gradient(135deg, color-mix(in srgb, ${design.canvasColor} 70%, #FAF6EE) 0%, ${design.surfaceColor} 100%)`;

  const ink = darkCanvas ? '#F5EFE6' : '#1C1917';
  const muted = darkCanvas ? '#BEB4A5' : '#57534E';
  const border = darkCanvas ? '#362F28' : '#D9CDB8';
  const gold = darkCanvas ? '#D4AF37' : '#A67C33';
  const accentInk = darkAccent ? '#FFFFFF' : '#141210';

  return {
    '--brand-accent': design.accentColor,
    '--brand-accent-ink': accentInk,
    '--brand-canvas': design.canvasColor,
    '--brand-surface': design.surfaceColor,
    '--brand-card': cardBg,
    '--brand-card-alt': cardAlt,
    '--brand-hero-bg': heroBg,
    '--brand-ink': ink,
    '--brand-muted': muted,
    '--brand-border': border,
    '--brand-gold': gold,
    backgroundColor: design.canvasColor,
    color: ink,
  } as CSSProperties;
}
