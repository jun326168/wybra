export const colors = {
  background: '#121418',
  primary: '#8A7EFF',
  text: '#F0F2F5',
  textSecondary: '#A2AFBA',
  border: '#242930',
  card: '#1c1f24',
  warning: '#FFA500',
  error: '#d15e7f',
  generation: {
    gen_alpha: '#e3349b',
    gen_z: '#06B6E4',
    gen_y: '#10BA81',
    gen_x: '#F59E0B',
    time_traveler: '#64748B',
  }
};

export function brightenHexColor(hex: string, amount: number): string {
  const normalized = hex.replace('#', '');
  const size = normalized.length === 3 ? 1 : 2;
  const expand = (val: string) => (size === 1 ? val.repeat(2) : val);
  const r = parseInt(expand(normalized.substring(0, size)), 16);
  const g = parseInt(expand(normalized.substring(size, size * 2)), 16);
  const b = parseInt(expand(normalized.substring(size * 2)), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  // Brighten by moving towards 255 (white)
  const nr = clamp(Math.round(r + (255 - r) * amount));
  const ng = clamp(Math.round(g + (255 - g) * amount));
  const nb = clamp(Math.round(b + (255 - b) * amount));
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
}

export function darkenHexColor(hex: string, amount: number): string {
  const normalized = hex.replace('#', '');
  const size = normalized.length === 3 ? 1 : 2;
  const expand = (val: string) => (size === 1 ? val.repeat(2) : val);
  const r = parseInt(expand(normalized.substring(0, size)), 16);
  const g = parseInt(expand(normalized.substring(size, size * 2)), 16);
  const b = parseInt(expand(normalized.substring(size * 2)), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  // Darken by moving towards 0 (black)
  const nr = clamp(Math.round(r * (1 - amount)));
  const ng = clamp(Math.round(g * (1 - amount)));
  const nb = clamp(Math.round(b * (1 - amount)));
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
}