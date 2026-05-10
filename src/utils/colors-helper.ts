/* eslint-disable max-lines */

const hslToHex = (hsl: string): string => {
  if (!hsl || hsl.trim() === "") return "";

  const parts = hsl.trim().split(/\s+/);
  if (parts.length !== 3) return hsl;

  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToHsl = (hex: string): string => {
  if (!hex || hex.trim() === "") return "";

  hex = hex.replace(/^#/, "");

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / delta + 2) / 6;
        break;
      case b:
        h = ((r - g) / delta + 4) / 6;
        break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
};

function hslStringToRgba(hslString: string, alpha: number) {
  const result = /hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/.exec(hslString);
  if (!result) return "";
  const [, hStr, sStr, lStr] = result;

  const h = parseFloat(hStr);
  const s = parseFloat(sStr);
  const l = parseFloat(lStr);

  return hslToRgba(h, s, l, alpha);
}

function hslToRgba(h: number, s: number, l: number, alpha: number) {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  const to255 = (n: number) => Math.round((n + m) * 255);

  return `rgba(${to255(r)}, ${to255(g)}, ${to255(b)}, ${alpha})`;
}

const linearRgbToOklab = (
  r: number,
  g: number,
  b: number
): [number, number, number] => {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
};

const oklabToOklch = (
  l: number,
  a: number,
  b: number
): [number, number, number] => {
  const c = Math.sqrt(a * a + b * b);
  let h = Math.atan2(b, a) * (180 / Math.PI);
  if (h < 0) h += 360;
  return [l, c, h];
};

const rgbToLinear = (c: number): number => {
  if (c <= 0.04045) return c / 12.92;
  return Math.pow((c + 0.055) / 1.055, 2.4);
};

const oklchToOklab = (
  l: number,
  c: number,
  h: number
): [number, number, number] => {
  const hRad = (h * Math.PI) / 180;
  return [l, c * Math.cos(hRad), c * Math.sin(hRad)];
};

const oklabToLinearRgb = (
  l: number,
  a: number,
  b: number
): [number, number, number] => {
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const lCubed = l_ * l_ * l_;
  const mCubed = m_ * m_ * m_;
  const sCubed = s_ * s_ * s_;

  return [
    +4.0767416621 * lCubed - 3.3077115913 * mCubed + 0.2309699292 * sCubed,
    -1.2684380046 * lCubed + 2.6097574011 * mCubed - 0.3413193965 * sCubed,
    -0.0041960863 * lCubed - 0.7034186147 * mCubed + 1.707614701 * sCubed,
  ];
};

const linearRgbToRgb = (c: number): number => {
  if (c <= 0.0031308) return 12.92 * c;
  return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
};

const oklchToHex = (oklch: string): string => {
  if (!oklch || oklch.trim() === "") return "";

  // Parse oklch(L C H) format
  const match = oklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
  if (!match) return oklch;

  const l = parseFloat(match[1]);
  const c = parseFloat(match[2]);
  const h = parseFloat(match[3]);

  const [labL, labA, labB] = oklchToOklab(l, c, h);
  const [linearR, linearG, linearB] = oklabToLinearRgb(labL, labA, labB);

  const r = Math.max(0, Math.min(1, linearRgbToRgb(linearR)));
  const g = Math.max(0, Math.min(1, linearRgbToRgb(linearG)));
  const b = Math.max(0, Math.min(1, linearRgbToRgb(linearB)));

  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToOklch = (hex: string): string => {
  if (!hex || hex.trim() === "") return "";

  hex = hex.replace(/^#/, "");

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const linearR = rgbToLinear(r);
  const linearG = rgbToLinear(g);
  const linearB = rgbToLinear(b);

  const [labL, labA, labB] = linearRgbToOklab(linearR, linearG, linearB);
  const [l, c, h] = oklabToOklch(labL, labA, labB);

  return `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(4)})`;
};


export { hexToHsl, hslStringToRgba, hslToHex, hslToRgba, linearRgbToOklab, oklabToOklch, oklchToOklab, oklabToLinearRgb, linearRgbToRgb, hexToOklch, oklchToHex };
