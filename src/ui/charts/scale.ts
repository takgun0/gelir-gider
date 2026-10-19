// Grafik ekseni yardımcıları (kuruş cinsinden).

/** En büyük değeri kapsayan "yuvarlak" üst sınır: 1, 2, 2,5, 4, 5, 8, 10 × 10^n TL. */
export function niceMax(maxKurus: number): number {
  const lira = Math.max(maxKurus / 100, 1);
  const magnitude = 10 ** Math.floor(Math.log10(lira));
  const steps = [1, 2, 2.5, 4, 5, 8, 10];
  const step = steps.find((s) => s * magnitude >= lira) ?? 10;
  return Math.round(step * magnitude * 100);
}

/** Üç eksen çizgisi: 0, yarı, üst sınır. */
export function axisTicks(maxKurus: number): number[] {
  const top = niceMax(maxKurus);
  return [0, top / 2, top];
}
