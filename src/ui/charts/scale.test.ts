import { describe, expect, it } from 'vitest';
import { axisTicks, niceMax } from './scale';

describe('eksen ölçeği', () => {
  it('yuvarlak üst sınır', () => {
    expect(niceMax(768000)).toBe(800000); // ₺7.680 → ₺8 B
    expect(niceMax(2100000)).toBe(2500000);
    expect(niceMax(1800000)).toBe(2000000);
    expect(niceMax(100000)).toBe(100000);
    expect(niceMax(0)).toBe(100);
    expect(niceMax(4100)).toBe(5000);
  });

  it('üç çizgi', () => {
    expect(axisTicks(768000)).toEqual([0, 400000, 800000]);
  });
});
