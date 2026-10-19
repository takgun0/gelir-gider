// Türkçe metin karşılaştırma ve sıralama (Gereksinimler §5.2, Tasarım §9).

const collator = new Intl.Collator('tr');

/** tr-TR kurallarıyla küçük harf: "SİL" → "sil", "ILIK" → "ılık". */
export function trLower(s: string): string {
  return s.toLocaleLowerCase('tr-TR');
}

/** Arama terimini karşılaştırmaya hazırlar. */
export function searchKey(s: string): string {
  return trLower(s.trim());
}

/** haystack içinde needle geçiyor mu (tr-TR, büyük-küçük harf duyarsız). Boş needle her şeyi bulur. */
export function includesTr(haystack: string, needle: string): boolean {
  return trLower(haystack).includes(searchKey(needle));
}

/** Türkçe alfabe sıralaması. */
export function compareTr(a: string, b: string): number {
  return collator.compare(a, b);
}

/** Kategori adı tekilliği için anahtar: kırpılmış, tr-TR küçük harf. */
export function categoryNameKey(name: string): string {
  return trLower(name.trim());
}

/** "Onaylamak için SİL yaz" alanı: "sil", "Sil", " SİL " kabul edilir. */
export function matchesConfirmWord(input: string, word: string): boolean {
  return searchKey(input) === searchKey(word);
}
