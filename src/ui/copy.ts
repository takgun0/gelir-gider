// Tüm arayüz metinleri burada toplanır ve DESIGN.md ile birebir aynıdır (SPEC §6).
// DESIGN'da olmayan metinler aynı tonda yazılır ve DECISIONS.md'ye eklenir.

export const copy = {
  appName: 'Gelir Gider',
  nav: {
    summary: 'Özet',
    transactions: 'İşlemler',
    categories: 'Kategoriler',
    settings: 'Ayarlar',
    add: 'İşlem ekle',
    main: 'Ana menü',
  },
  month: {
    prev: 'Önceki ay',
    next: 'Sonraki ay',
    thisMonth: 'Bu ay',
    /** DESIGN'da yok: ay-yıl seçicinin başlığı */
    pickerTitle: 'Ay seç',
    /** DESIGN'da yok: ay-yıl seçicide yıl düğmeleri */
    prevYear: 'Önceki yıl',
    nextYear: 'Sonraki yıl',
  },
  amount: {
    hide: 'Tutarları gizle',
    show: 'Tutarları göster',
    /** DESIGN'da yok: gizli tutarın ekran okuyucu karşılığı */
    hiddenSr: 'Tutar gizli',
  },
  sheet: {
    cancel: 'Vazgeç',
    save: 'Kaydet',
    newTransaction: 'Yeni işlem',
    editTransaction: 'İşlemi düzenle',
  },
  transactions: {
    tabRecords: 'Kayıtlar',
    tabRecurring: 'Sabit',
  },
  toast: {
    undo: 'Geri al',
    generated: (n: number) => `${n} sabit işlem eklendi`,
  },
} as const;
