// Shared between server and client.
// Canonical laptop catalogue. Lessons are shared and matched only between devices
// with the same canonical model, so "Thinkpad t-480" and "ThinkPad T480" are one model.

export const LAPTOP_MODELS: Record<string, string[]> = {
  Lenovo: ["ThinkPad T480", "ThinkPad T490", "ThinkPad T14 Gen 2", "ThinkPad X1 Carbon Gen 9", "ThinkPad X1 Carbon Gen 11", "ThinkPad E14 Gen 4", "IdeaPad 5 14", "Legion 5"],
  Apple: ["MacBook Air M1 (2020)", "MacBook Air M2 (2022)", "MacBook Pro 13 (2020)", "MacBook Pro 14 (2021)", "MacBook Pro 16 (2019)"],
  Dell: ["Latitude 5490", "Latitude 7420", "XPS 13 9310", "XPS 15 9500", "Inspiron 15 3511"],
  HP: ["EliteBook 840 G5", "EliteBook 840 G8", "ProBook 450 G8", "Pavilion 15", "Spectre x360 14"],
  ASUS: ["ZenBook 14 UX425", "VivoBook 15 X515", "ROG Zephyrus G14"],
  Acer: ["Aspire 5 A515", "Swift 3 SF314", "Nitro 5 AN515"],
  Microsoft: ["Surface Laptop 4", "Surface Laptop 5", "Surface Pro 7"],
};

/** Comparison key: case, spacing and punctuation insensitive. */
export const modelKey = (make: string, model: string) =>
  `${make}|${model}`.normalize("NFKC").toLowerCase().replace(/[^a-z0-9|]/g, "");

const known = new Map(Object.entries(LAPTOP_MODELS).flatMap(([make, models]) => models.map((m) => [modelKey(make, m), { make, model: m }])));

/** Canonical spelling for a known model, or null if it is not in the catalogue. */
export function canonicalModel(make: string, model: string): { make: string; model: string } | null {
  return known.get(modelKey(make, model)) ?? null;
}
