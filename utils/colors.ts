/**
 * Converts a hex color string to an rgba() string.
 * Works on both Android and Web (no invalid shorthand hex appending).
 */
export function hexToRgba(hex: string, alpha: number): string {
  // If it's already an rgba/rgb string, just adjust the alpha
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
    return hex.replace(/[\d.]+\)$/g, `${alpha})`);
  }

  // Strip the leading #
  let cleanHex = hex.replace('#', '');

  // Handle shorthand hex (#abc -> #aabbcc)
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
