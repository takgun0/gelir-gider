import { describe, expect, it } from 'vitest';
import { categoryNameKey, compareTr, includesTr, matchesConfirmWord, trLower } from './text';

describe('Türkçe karşılaştırma', () => {
  it('"ılık" araması "ILIK"ı bulur', () => {
    expect(includesTr('ILIK SÜT', 'ılık')).toBe(true);
    expect(includesTr('Ilık süt', 'ILIK')).toBe(true);
  });

  it('"sil" yazımı "SİL"i karşılar', () => {
    expect(matchesConfirmWord('sil', 'SİL')).toBe(true);
    expect(matchesConfirmWord(' Sil ', 'SİL')).toBe(true);
    expect(matchesConfirmWord('Sİ', 'SİL')).toBe(false);
    expect(matchesConfirmWord('SIL', 'SİL')).toBe(false);
  });

  it('İ ve I dönüşümleri', () => {
    expect(trLower('İSTANBUL')).toBe('istanbul');
    expect(trLower('ISPARTA')).toBe('ısparta');
  });

  it('boş arama her şeyi bulur', () => {
    expect(includesTr('Market', '  ')).toBe(true);
  });

  it('kategori adı anahtarı kırpılır ve küçültülür', () => {
    expect(categoryNameKey('  EĞİTİM ')).toBe(categoryNameKey('eğitim'));
    expect(categoryNameKey('Diğer')).not.toBe(categoryNameKey('Diger'));
  });
});

describe('Türkçe sıralama', () => {
  it('Ç, Ğ, İ, Ö, Ş, Ü alfabede doğru yerde', () => {
    const words = ['Zeytin', 'Ün', 'Un', 'Şu', 'Su', 'Öz', 'Oda', 'İz', 'Ilık', 'Ğ', 'Gül', 'Dağ', 'Çay', 'Cam'];
    expect([...words].sort(compareTr)).toEqual([
      'Cam', 'Çay', 'Dağ', 'Gül', 'Ğ', 'Ilık', 'İz', 'Oda', 'Öz', 'Su', 'Şu', 'Un', 'Ün', 'Zeytin',
    ]);
  });

  it('varsayılan gider kategorileri', () => {
    const names = ['Market', 'Kira', 'Faturalar', 'Ulaşım', 'Yemek', 'Eğlence', 'Sağlık', 'Abonelikler', 'Eğitim'];
    expect([...names].sort(compareTr)).toEqual([
      'Abonelikler', 'Eğitim', 'Eğlence', 'Faturalar', 'Kira', 'Market', 'Sağlık', 'Ulaşım', 'Yemek',
    ]);
  });
});
