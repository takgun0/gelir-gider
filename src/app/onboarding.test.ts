import { afterEach, describe, expect, it, vi } from 'vitest';
import { copy } from '../ui/copy';
import { TOUR_SEEN_KEY, readTourSeen, writeTourSeen } from './onboarding';

function stubStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => data.set(k, v),
    removeItem: (k: string) => data.delete(k),
  });
  return data;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('tanıtım', () => {
  it('ilk girişte gösterilir, görüldükten sonra gösterilmez', () => {
    const data = stubStorage();
    expect(readTourSeen()).toBe(false);
    writeTourSeen();
    expect(data.get(TOUR_SEEN_KEY)).toBe('true');
    expect(readTourSeen()).toBe(true);
  });

  it('depolama kapalıysa çökmez', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('kapalı');
      },
      setItem: () => {
        throw new Error('kapalı');
      },
    });
    expect(readTourSeen()).toBe(false);
    expect(() => writeTourSeen()).not.toThrow();
  });

  it('istenen konular adımlarda var: işlem, not, kategori, yedek', () => {
    const text = copy.tour.steps.map((s) => `${s.title} ${s.body}`).join(' ');
    for (const word of ['Kaydet', 'Not ekle', 'Kategoriler', 'yedek', 'Gelir', 'gider']) expect(text).toContain(word);
    expect(copy.tour.steps.length).toBeGreaterThanOrEqual(4);
  });
});
