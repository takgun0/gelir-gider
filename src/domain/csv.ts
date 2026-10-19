// CSV dışa aktarma (Gereksinimler §5.5): Excel'in Türkçe ayarlarında doğrudan açılır.
// UTF-8 BOM, ";" ayırıcı, CRLF satır sonu. Geri yüklenemez, yalnızca okumak için.
import { splitKurus } from './money';
import type { Category, DateStr, Transaction } from './types';

const BOM = String.fromCharCode(0xfeff);
const SEP = ';';
const EOL = '\r\n';

export const CSV_HEADER = ['Tarih', 'Tür', 'Kategori', 'Açıklama', 'Not', 'Tutar'] as const;

export function csvFileName(today: DateStr): string {
  return `para-yonetimi-islemler-${today}.csv`;
}

/** Formül enjeksiyonuna karşı: = + - @ sekme ya da satır başıyla başlayan metne ' eklenir. */
function neutralizeFormula(text: string): string {
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

/** ; " ya da satır sonu içeren alan çift tırnağa alınır, içteki " ikilenir. */
function quote(field: string): string {
  return /[;"\r\n]/.test(field) ? `"${field.replace(/"/g, '""')}"` : field;
}

/** Kullanıcı girdisi olabilecek metin hücresi. */
function textCell(value: string): string {
  return quote(neutralizeFormula(value));
}

/** Binlik ayırıcısız, ondalık virgüllü; gider negatif ve ASCII eksiyle: -1250,50. */
export function csvAmount(amount: number, type: Transaction['type']): string {
  const { lira, kurus } = splitKurus(amount);
  return `${type === 'expense' ? '-' : ''}${lira},${kurus}`;
}

/** Tüm işlemler, tarihe göre eskiden yeniye. */
export function buildCsv(
  transactions: readonly Transaction[],
  categories: ReadonlyMap<string, Pick<Category, 'name'>>,
): string {
  const rows = [...transactions].sort(
    (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.createdAt - b.createdAt),
  );
  const lines = [CSV_HEADER.join(SEP)];
  for (const t of rows) {
    lines.push(
      [
        t.date,
        t.type === 'income' ? 'Gelir' : 'Gider',
        textCell(categories.get(t.categoryId)?.name ?? ''),
        textCell(t.description),
        textCell(t.note),
        csvAmount(t.amount, t.type),
      ].join(SEP),
    );
  }
  return BOM + lines.join(EOL) + EOL;
}

