// Açık modal katmanları; Esc ve Tab yalnızca en üsttekine gider.
export const modalStack: HTMLElement[] = [];

/** Herhangi bir modal katman açık mı (masaüstü kısayolları kapatmak için). */
export function isModalOpen(): boolean {
  return modalStack.length > 0;
}
