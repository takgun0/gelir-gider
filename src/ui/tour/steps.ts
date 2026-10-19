// Tanıtım adımları. Ana ekrana ekleme adımı platforma göre yazılır; uygulama zaten
// kuruluysa (standalone) gösterilmez.
import { copy } from '../copy';

export type Platform = 'ios' | 'android' | 'desktop';

export interface TourStep {
  key: 'welcome' | 'install' | 'add' | 'note' | 'categories' | 'backup';
  title: string;
  body: string;
  /** Numaralı adımlar (ör. ana ekrana ekleme) */
  list?: readonly string[];
  note?: string;
}

export function detectPlatform(userAgent: string, platform: string, maxTouchPoints: number): Platform {
  if (/iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(userAgent)) return 'android';
  return 'desktop';
}

export function tourSteps(options: { standalone: boolean; platform: Platform }): TourStep[] {
  const [welcome, add, note, categories, backup] = copy.tour.steps;
  const steps: TourStep[] = [];
  if (welcome) steps.push({ key: 'welcome', ...welcome });
  if (!options.standalone) {
    const i = copy.tour.install;
    steps.push({
      key: 'install',
      title: i.title,
      body: i.body,
      list: options.platform === 'ios' ? i.ios : options.platform === 'android' ? i.android : i.desktop,
      ...(options.platform === 'ios' ? { note: i.iosNote } : {}),
    });
  }
  if (add) steps.push({ key: 'add', ...add });
  if (note) steps.push({ key: 'note', ...note });
  if (categories) steps.push({ key: 'categories', ...categories });
  if (backup) steps.push({ key: 'backup', ...backup });
  return steps;
}
