import { afterEach, describe, expect, it, vi } from 'vitest';
import { copy } from '../ui/copy';
import { detectPlatform, tourSteps } from '../ui/tour/steps';
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

  it('ana ekrana ekleme adımı platforma göre, kuruluysa gösterilmez', () => {
    const ios = tourSteps({ standalone: false, platform: 'ios' });
    expect(ios.map((s) => s.key)).toEqual(['welcome', 'install', 'add', 'note', 'categories', 'backup']);
    expect(ios[1]?.list?.join(' ')).toContain('Ana Ekrana Ekle');
    expect(ios[1]?.note).toBeDefined();
    expect(tourSteps({ standalone: false, platform: 'android' })[1]?.list?.join(' ')).toContain('Uygulamayı yükle');
    expect(tourSteps({ standalone: false, platform: 'desktop' })[1]?.list).toHaveLength(2);
    expect(tourSteps({ standalone: true, platform: 'ios' }).map((s) => s.key)).not.toContain('install');
  });

  it('platform algılama', () => {
    expect(detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 'iPhone', 5)).toBe('ios');
    expect(detectPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 5)).toBe('ios');
    expect(detectPlatform('Mozilla/5.0 (Linux; Android 15; Pixel 9)', 'Linux armv8l', 5)).toBe('android');
    expect(detectPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Win32', 0)).toBe('desktop');
  });
});
