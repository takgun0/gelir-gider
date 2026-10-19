// Tutar alanının yazma ve yapıştırma mantığı (Gereksinimler §5.1, Tasarım §6.3). Saf fonksiyonlar;
// bileşen yalnızca beforeinput/paste olaylarını bu fonksiyonlara bağlar.
import { digitsToKurus, splitKurus } from './money';

export interface AmountInputState {
  /** Ekranda görünen metin: binlik nokta, ondalık virgül (ör. "12.450,5"). */
  display: string;
  /** İmlecin display içindeki konumu. */
  cursor: number;
  /** Kuruş karşılığı; alan boşsa null. */
  kurus: number | null;
}

/**
 * Tam kısmın en fazla basamağı. ₺999.999.999,99'u aşan değer yazılabilsin ki
 * Kaydet'te üst sınır hatası gösterilebilsin; ama sınırsız büyümesin.
 */
export const MAX_INT_DIGITS = 12;

interface Token {
  char: string;
  beforeCursor: boolean;
}

function groupThousands(digits: string): string {
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += '.';
    out += digits[i];
  }
  return out;
}

/**
 * Herhangi bir ham metni kurallı görünüme çevirir. Metindeki noktalar binlik ayırıcı
 * sayılır ve atılır; ilk virgül ondalık ayırıcıdır. İmleç aynı rakamın yanında kalır.
 * Yazılan "." karakterinin "," olarak işlenmesi insertText'te yapılır.
 */
export function normalizeAmountInput(text: string, cursor: number): AmountInputState {
  const intTokens: Token[] = [];
  const fracTokens: Token[] = [];
  let comma: Token | null = null;

  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    const beforeCursor = i < cursor;
    if (char >= '0' && char <= '9') {
      if (comma === null) {
        if (intTokens.length < MAX_INT_DIGITS) intTokens.push({ char, beforeCursor });
      } else if (fracTokens.length < 2) {
        fracTokens.push({ char, beforeCursor });
      }
    } else if (char === ',' && comma === null) {
      comma = { char, beforeCursor };
    }
    // Nokta (binlik ayırıcı), ikinci virgül, eksi, harf ve diğer her şey atılır.
  }

  // Baştaki sıfırlar atılır; tek "0" kalabilir ("0,5" yazılabilsin).
  while (intTokens.length > 1 && intTokens[0]?.char === '0') intTokens.shift();
  if (comma !== null && intTokens.length === 0) {
    intTokens.push({ char: '0', beforeCursor: comma.beforeCursor });
  }

  const tokens = [...intTokens, ...(comma ? [comma] : []), ...fracTokens];
  const keptBefore = tokens.filter((t) => t.beforeCursor).length;

  const intDigits = intTokens.map((t) => t.char).join('');
  const fracDigits = fracTokens.map((t) => t.char).join('');
  const display = groupThousands(intDigits) + (comma ? ',' + fracDigits : '');

  let pos = 0;
  let seen = 0;
  while (seen < keptBefore && pos < display.length) {
    if (display[pos] !== '.') seen++;
    pos++;
  }

  return { display, cursor: pos, kurus: digitsToKurus(intDigits, fracDigits) };
}

/**
 * beforeinput'ın saf karşılığı: seçimi metinle değiştirir. Kullanıcının yazdığı "."
 * ondalık ayırıcıdır ve "," olarak işlenir; ekrandaki noktalar her zaman binliktir.
 */
export function insertText(display: string, selStart: number, selEnd: number, text: string): AmountInputState {
  const inserted = text.replace(/\./g, ',');
  const next = display.slice(0, selStart) + inserted + display.slice(selEnd);
  return normalizeAmountInput(next, selStart + inserted.length);
}

/** Geri silme. İmleç binlik noktanın hemen sağındaysa noktanın solundaki rakam silinir. */
export function deleteBackward(display: string, selStart: number, selEnd: number): AmountInputState {
  if (selStart !== selEnd) return normalizeAmountInput(display.slice(0, selStart) + display.slice(selEnd), selStart);
  if (selStart === 0) return normalizeAmountInput(display, 0);
  let from = selStart - 1;
  if (display[from] === '.' && from > 0) from--;
  return normalizeAmountInput(display.slice(0, from) + display.slice(selStart), from);
}

/** İleri silme. İmlecin sağı binlik noktaysa noktanın sağındaki rakam silinir. */
export function deleteForward(display: string, selStart: number, selEnd: number): AmountInputState {
  if (selStart !== selEnd) return normalizeAmountInput(display.slice(0, selStart) + display.slice(selEnd), selStart);
  if (selStart >= display.length) return normalizeAmountInput(display, selStart);
  let to = selStart + 1;
  if (display[selStart] === '.' && to < display.length) to++;
  return normalizeAmountInput(display.slice(0, selStart) + display.slice(to), selStart);
}

/** Kayıtlı tutarı düzenleme alanına yükler: 125050 → "1.250,50", 125000 → "1.250". */
export function kurusToInput(kurus: number): AmountInputState {
  const { lira, kurus: k } = splitKurus(kurus);
  const text = k === '00' ? lira : `${lira},${k}`;
  return normalizeAmountInput(text, text.length);
}

function isValidGrouping(intPart: string, sep: '.' | ','): boolean {
  const groups = intPart.split(sep);
  const [first, ...rest] = groups;
  if (first === undefined || !/^[1-9]\d{0,2}$/.test(first)) return false;
  return rest.length > 0 && rest.every((g) => /^\d{3}$/.test(g));
}

function countOf(text: string, char: string): number {
  return text.split(char).length - 1;
}

/**
 * Yapıştırılan metni kuruşa çevirir; geçersizse null döner ve yapıştırma yok sayılır.
 * Kurallar Gereksinimler §5.1 "Yapıştırma kuralları"ndadır.
 */
export function parsePastedAmount(raw: string): number | null {
  const text = raw
    .replace(/\s/g, ' ')
    .trim()
    .replace(/₺/g, '')
    .replace(/TL/gi, '')
    .trim();
  if (!/^[\d.,]+$/.test(text)) return null;

  const dots = countOf(text, '.');
  const commas = countOf(text, ',');
  let intPart: string;
  let fracPart = '';

  if (dots > 0 && commas > 0) {
    const decimal = text.lastIndexOf('.') > text.lastIndexOf(',') ? '.' : ',';
    const thousands = decimal === '.' ? ',' : '.';
    if (countOf(text, decimal) !== 1) return null;
    [intPart = '', fracPart = ''] = text.split(decimal);
    if (!/^\d{1,2}$/.test(fracPart) || !isValidGrouping(intPart, thousands)) return null;
    intPart = intPart.split(thousands).join('');
  } else if (dots > 0 || commas > 0) {
    const sep = dots > 0 ? '.' : ',';
    const count = dots + commas;
    const [head = '', tail = ''] = text.split(sep);
    if (count === 1 && /^\d{1,2}$/.test(tail) && /^\d+$/.test(head)) {
      intPart = head;
      fracPart = tail;
    } else if (count === 1 && !/^\d{3}$/.test(tail)) {
      return null;
    } else {
      if (!isValidGrouping(text, sep)) return null;
      intPart = text.split(sep).join('');
    }
  } else {
    intPart = text;
  }

  if (intPart.length > MAX_INT_DIGITS) return null;
  return digitsToKurus(intPart, fracPart);
}

/** Yapıştırmayı seçimin yerine uygular; geçersiz metinde null (yapıştırma yok sayılır). */
export function pasteAmount(display: string, selStart: number, selEnd: number, raw: string): AmountInputState | null {
  const kurus = parsePastedAmount(raw);
  if (kurus === null) return null;
  const { lira, kurus: k } = splitKurus(kurus);
  const canonical = k === '00' ? lira : `${lira},${k}`;
  const next = display.slice(0, selStart) + canonical + display.slice(selEnd);
  return normalizeAmountInput(next, selStart + canonical.length);
}

/**
 * beforeinput güvenilmez olduğunda (bazı Android klavyeleri) yedek yol: önceki ve yeni
 * değeri karşılaştırıp eklenen ya da silinen parçayı bulur ve aynı kurallarla uygular.
 */
export function applyRawChange(prev: string, next: string): AmountInputState {
  let start = 0;
  const maxPrefix = Math.min(prev.length, next.length);
  while (start < maxPrefix && prev[start] === next[start]) start++;
  let endPrev = prev.length;
  let endNext = next.length;
  while (endPrev > start && endNext > start && prev[endPrev - 1] === next[endNext - 1]) {
    endPrev--;
    endNext--;
  }
  const removed = prev.slice(start, endPrev);
  const inserted = next.slice(start, endNext);
  if (inserted === '') {
    // Yalnızca binlik nokta silindiyse kullanıcı soldaki rakamı silmek istemiştir.
    if (removed === '.') return deleteBackward(prev, start + 1, start + 1);
    return normalizeAmountInput(next, start);
  }
  return insertText(prev, start, endPrev, inserted);
}
