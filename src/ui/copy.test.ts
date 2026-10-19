import { describe, expect, it } from 'vitest';
import { copy } from './copy';

describe('kategori silme metinleri (DESIGN §6.4, §8)', () => {
  it('kullanım özeti', () => {
    expect(copy.categories.usage(14, 1)).toBe('14 işlem ve 1 sabit işlem');
    expect(copy.categories.usage(14, 0)).toBe('14 işlem');
    expect(copy.categories.usage(0, 2)).toBe('2 sabit işlem');
  });

  it('onay ve bildirim', () => {
    expect(copy.categories.deleteBody('Eğlence', copy.categories.usage(14, 1), 'Diğer')).toBe(
      "'Eğlence' kategorisinde 14 işlem ve 1 sabit işlem var. Bunlar 'Diğer' kategorisine taşınacak.",
    );
    expect(copy.categories.deletedMoved(copy.categories.usage(14, 0), 'Diğer')).toBe(
      'Kategori silindi, 14 işlem Diğer kategorisine taşındı',
    );
    expect(copy.categories.deleteTitle('Market')).toBe("'Market' silinsin mi?");
  });
});
