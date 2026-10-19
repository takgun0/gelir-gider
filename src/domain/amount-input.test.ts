import { describe, expect, it } from 'vitest';
import {
  applyRawChange,
  deleteBackward,
  deleteForward,
  insertText,
  kurusToInput,
  normalizeAmountInput,
  parsePastedAmount,
  pasteAmount,
  type AmountInputState,
} from './amount-input';

const empty: AmountInputState = { display: '', cursor: 0, kurus: null };

/** Tuşları boş alana imleç konumunda sırayla yazar. */
function type(keys: string, from: AmountInputState = empty): AmountInputState {
  let state = from;
  for (const key of keys) state = insertText(state.display, state.cursor, state.cursor, key);
  return state;
}

describe('yazarken (Gereksinimler §9 tablosu)', () => {
  it.each([
    ['12450', '12.450', 1245000],
    ['1250,5', '1.250,5', 125050],
    ['1250.5', '1.250,5', 125050],
    ['12,345', '12,34', 1234],
    ['1,2,3', '1,23', 123],
    ['-5', '5', 500],
    ['abc', '', null],
  ] as const)('%s → %s', (keys, display, kurus) => {
    const state = type(keys);
    expect(state.display).toBe(display);
    expect(state.kurus).toBe(kurus);
    expect(state.cursor).toBe(display.length);
  });

  it('binlik ayırıcıyı her rakamda yeniden yerleştirir', () => {
    expect(type('1234567').display).toBe('1.234.567');
    expect(type('1234567,89').kurus).toBe(123456789);
  });

  it('baştaki sıfırları atar, "0," ve ",5" yazımına izin verir', () => {
    expect(type('007').display).toBe('7');
    expect(type('0').display).toBe('0');
    expect(type('0').kurus).toBe(0);
    expect(type(',5').display).toBe('0,5');
    expect(type(',5').kurus).toBe(50);
    expect(type('0,05').kurus).toBe(5);
  });

  it('ondalık ayırıcı tek başına kalabilir', () => {
    const state = type('12,');
    expect(state.display).toBe('12,');
    expect(state.kurus).toBe(1200);
  });

  it('üst sınırı aşan değer yazılabilir ama sınırsız büyümez', () => {
    expect(type('1000000000').kurus).toBe(100_000_000_000);
    expect(type('9999999999999').display).toBe('999.999.999.999');
  });

  it('ortaya yazınca imleç aynı rakamın yanında kalır', () => {
    // "1.250" içinde "1" ile "." arasına 9 yazılır → "19.250", imleç 9'dan sonra.
    const state = insertText('1.250', 1, 1, '9');
    expect(state.display).toBe('19.250');
    expect(state.cursor).toBe(2);
  });

  it('seçimi yazılan karakterle değiştirir', () => {
    const state = insertText('12.450', 0, 6, '7');
    expect(state).toEqual({ display: '7', cursor: 1, kurus: 700 });
  });
});

describe('silme', () => {
  it('sondaki rakam silinince imleç sonda kalır', () => {
    const state = deleteBackward('12.450', 6, 6);
    expect(state).toEqual({ display: '1.245', cursor: 5, kurus: 124500 });
  });

  it('kuruştaki son rakam silinir', () => {
    expect(deleteBackward('1.250,5', 7, 7)).toEqual({ display: '1.250,', cursor: 6, kurus: 125000 });
    expect(deleteBackward('1.250,', 6, 6)).toEqual({ display: '1.250', cursor: 5, kurus: 125000 });
  });

  it('binlik noktanın sağından geri silme soldaki rakamı siler', () => {
    const state = deleteBackward('12.450', 3, 3);
    expect(state.display).toBe('1.450');
    expect(state.cursor).toBe(1);
  });

  it('binlik noktanın solundan ileri silme sağdaki rakamı siler', () => {
    const state = deleteForward('12.450', 2, 2);
    expect(state.display).toBe('1.250');
    expect(state.cursor).toBe(3); // "1.2|50": imleç yine 12'nin sağında;
  });

  it('baştan geri silme bir şey değiştirmez, seçili alan silinir', () => {
    expect(deleteBackward('12', 0, 0)).toEqual({ display: '12', cursor: 0, kurus: 1200 });
    expect(deleteBackward('12.450', 0, 6)).toEqual({ display: '', cursor: 0, kurus: null });
    expect(deleteForward('12', 2, 2).display).toBe('12');
  });

  it('ilk rakam silinince oluşan baştaki sıfır atılır', () => {
    const state = deleteBackward('1.050', 1, 1);
    expect(state.display).toBe('50');
    expect(state.cursor).toBe(0);
  });
});

describe('normalizeAmountInput', () => {
  it('ham metindeki noktaları binlik sayar', () => {
    expect(normalizeAmountInput('1.2.3.4', 7)).toEqual({ display: '1.234', cursor: 5, kurus: 123400 });
  });
});

describe('kurusToInput', () => {
  it('kayıtlı tutarı alan metnine çevirir', () => {
    expect(kurusToInput(125050).display).toBe('1.250,50');
    expect(kurusToInput(125000).display).toBe('1.250');
    expect(kurusToInput(5).display).toBe('0,05');
  });
});

describe('parsePastedAmount', () => {
  it.each([
    ['1.250,50', 125050],
    ['1,250.50', 125050],
    ['1.250', 125000],
    ['1.234.567,89', 123456789],
    ['₺ 1.250,50', 125050],
    ['1250,5', 125050],
    ['1250.50', 125050],
    ['1,5', 150],
    ['1.234.567', 123456700],
    ['1,234,567.8', 123456780],
    ['  340 TL ', 34000],
    [`₺${String.fromCharCode(0xa0)}1.250,50`, 125050],
    ['340', 34000],
    ['0', 0],
  ] as const)('%s → %d', (text, kurus) => {
    expect(parsePastedAmount(text)).toBe(kurus);
  });

  it.each(['1,2345', '1.25.0', '', '₺', 'abc', '-5', '1 250', '1.250,505', '0.250', '1.250.50,1,2', '12,34.56,78', ',5', '1.'])(
    '%j reddedilir',
    (text) => {
      expect(parsePastedAmount(text)).toBeNull();
    },
  );
});

describe('pasteAmount', () => {
  it('geçerli yapıştırmayı biçimler', () => {
    expect(pasteAmount('', 0, 0, '1,250.50')).toEqual({ display: '1.250,50', cursor: 8, kurus: 125050 });
  });

  it('geçersiz yapıştırmayı yok sayar', () => {
    expect(pasteAmount('12', 2, 2, '1,2345')).toBeNull();
  });
});

describe('applyRawChange (beforeinput yedeği)', () => {
  it('eklenen karakteri bulur, noktayı virgül sayar', () => {
    expect(applyRawChange('1.250', '1.2505')).toEqual({ display: '12.505', cursor: 6, kurus: 1250500 });
    expect(applyRawChange('1.250', '1.250.')).toEqual({ display: '1.250,', cursor: 6, kurus: 125000 });
    expect(applyRawChange('12', '12a')).toEqual({ display: '12', cursor: 2, kurus: 1200 });
  });

  it('ortadaki eklemede imleci korur', () => {
    expect(applyRawChange('1.250', '19.250')).toEqual({ display: '19.250', cursor: 2, kurus: 1925000 });
  });

  it('silmeyi uygular; tek başına silinen binlik nokta soldaki rakamı götürür', () => {
    expect(applyRawChange('12.450', '12.45')).toEqual({ display: '1.245', cursor: 5, kurus: 124500 });
    expect(applyRawChange('12.450', '12450')).toEqual({ display: '1.450', cursor: 1, kurus: 145000 });
    expect(applyRawChange('12.450', '')).toEqual({ display: '', cursor: 0, kurus: null });
  });
});
