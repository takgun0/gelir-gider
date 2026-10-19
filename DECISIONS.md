# Kararlar

Küçük uygulama kararları, her biri tek satır (SPEC §2.4). En yenisi en altta.

## Faz 0
- DESIGN.md kullanıcının verdiği metinden oluşturuldu; yapıştırmada kaybolan "+ butonu" ve "2. adım" madde başları onarıldı.
- TypeScript `~6.0`: typescript-eslint 8.x en fazla TS 6.0'ı destekliyor (TS 7 çıkmış olsa da).
- Inter `@fontsource-variable/inter` ile paketlenir; `src/ui/fonts.css` yalnızca latin ve latin-ext yüzlerini tanımlar.
- `react-is`, Recharts'ın eş bağımlılığı olduğu için doğrudan eklendi.
- vite-plugin-pwa Faz 10'da eklenecek; PNG ikon üretimi için ek araç gerekirse o zaman sorulacak.
- Kırılımlar DESIGN §5'e göre: <640 alt çubuk, 640–1023 72 px ikon şeridi, ≥1024 200 px kenar çubuğu.
- Gider tutarı rengi varsayılan kırmızı (teslim kartları); `--amount-expense` token'ı tek satırla nötre çevrilir.
- "Tüm verileri sil": bütün tablolar (settings dahil, yani `lastBackupAt` da) tek transaction'da temizlenir, varsayılan kategoriler yeniden yüklenir; localStorage tercihleri (tema, gizleme) korunur.
- "Ayın kaçında" varsayılanı işlem tarihinin günü; ilk tekrar her zaman sonraki ayda.
- Sabit işlem formunda bitiş yoksa özet yalnızca "İlk tekrar: 16 Kasım" olarak yazılır.
- Kategori silme bildirimi taşınanlara göre kurulur: hiçbir şey taşınmadıysa "Kategori silindi"; sabit işlem de varsa "Kategori silindi, 14 işlem ve 1 sabit işlem Diğer kategorisine taşındı".
- Sabit işlem silme onayının başlığı "'İnternet' silinsin mi?"; korunacak kayıt yoksa ikinci cümle yazılmaz.
- Ay sonu tahmini standart biçimde; negatifse U+2212 eksi ve expense rengiyle (Özet kartı "eksi" durumu).
- Not sayacı DESIGN §6.3'e göre 400 karakterden sonra görünür (kart her zaman gösteriyor; metin esas).
- Kartlarda çizilmeyen ekranlar (sabit işlem formu, yeni kategori, takvim, ay-yıl seçici, kategori filtresi, "⋯" menüsü, 640–1023 yerleşimi) mevcut bileşenlerden türetilir.

## Faz 1
- Yayın yolu `vite.config.ts` içinde tek yerden: `BASE_PATH` ortam değişkeni, yoksa `/gelir-gider/`.
- `npm test`, `scripts/test.mjs` ile Vitest'i iki kez başlatır; `src/test/timezone.test.ts` TZ'nin uygulandığını doğrular.
- Tema, ilk render öncesi `public/theme-init.js` (inline olmayan, modül olmayan script) ile uygulanır; Vite'ın "can't be bundled" uyarısı beklenen bir durum.
- Tema "Sistem" iken localStorage'a değer yazılmaz (anahtar silinir).
- Tailwind'in hazır renk ve font paleti `--color-*: initial` ile kapatıldı; yalnızca DESIGN token'ları sınıf olarak kullanılabilir.
- Bileşen kartlarındaki ek token'lar (switch-off, toast, on-toast, toast-accent, scrim, shadow, on-expense) `tokens.css`'e eklendi.
- ESLint, SPEC §5.2/§5.7 yasaklarını kural olarak uygular (innerHTML, dangerouslySetInnerHTML, eval, Date.parse, toISOString, `new Date('...')`).
- Domain testleri varsayılan olarak `node` ortamında; DOM gereken testler dosya başında `@vitest-environment jsdom` ile işaretlenir.
- Rotalar: `/`, `/islemler`, `/islemler/sabit`, `/kategoriler`, `/ayarlar`; bilinmeyen rota Özet'e döner.
- CI Node sürümü `.nvmrc` (24) üzerinden; PR'larda CI çalışır, deploy yalnızca `main`'de.

## Faz 2
- Ortak tipler (`TxType`, `PaletteKey`, `DateStr`, `Period`) `src/domain/types.ts`'te.
- `formatTRY` negatif değeri gerçek eksiyle yazar (ay sonu tahmini için); Intl'e float değil kesin ondalık string verilir (`'1250.50'`).
- `formatSigned` sayının işaretini kullanır; türden işaret `signedAmount(amount, type)` ile gelir (gider negatif).
- `formatShort` tek ondalığa aşağı yuvarlar (₺12.450 → ₺12,4 B; Intl compact "12 B" verdiği için elle yazıldı); ondalık sıfırsa yazılmaz (₺8 B); bin altı tam TL; milyar için "Mr"; birimden önce bölünmeyen boşluk (U+00A0).
- `formatWhole` yarımı yukarı yuvarlar; `formatPercent` oran (0–1) alır.
- Kahraman tutar parçaları `heroParts` ile `formatToParts`'tan üretilir.
- Tutar alanında tam kısım en fazla 12 basamak: üst sınır hatası gösterilebilsin diye ₺999.999.999,99'dan fazlası yazılabilir ama alan sınırsız büyümez.
- Tutar alanında baştaki sıfırlar atılır; önce "," yazılırsa "0," olur.
- Binlik noktanın hemen sağında geri silme (ya da solunda ileri silme) noktayı değil yanındaki rakamı siler (`deleteBackward`/`deleteForward`).
- Yapıştırma seçimin yerine kurallı metni ("1250,50") koyar; sonuç yine `normalizeAmountInput`'tan geçer. "₺" ve büyük-küçük harf duyarsız "TL" atılır; içte boşluk varsa reddedilir.
- Yapıştırmada ondalık kısmı 3+ basamak olan ya da ayraçla başlayan/biten metin (",5", "1.") reddedilir.
- Tarih ve ay adları ile "Bugün"/"Dün" etiketleri domain katmanında (`date.ts`) durur; domain UI'ya bağımlı olmasın diye `copy.ts`'e taşınmadı.
- Gün farkı `Date.UTC` ile hesaplanır, yaz saati geçişlerinden etkilenmez.

## Faz 3
- Veri modeli arayüzleri (`Category`, `Transaction`, `Recurring`, `Settings`) `src/domain/types.ts`'te; `exactOptionalPropertyTypes` açık olduğu için `recurringId`/`period` alanına `undefined` yazılamaz.
- İkon anahtarları (48 Lucide adı) `types.ts`'teki `ICON_KEYS` listesinde; yedek doğrulaması React'e bağlanmasın diye. Gruplar: Alışveriş 6, Ev 5, Ulaşım 6, Yemek 5, Sağlık 4, Eğlence 6, Finans 8, Eğitim 4, Diğer 4. Bileşen, grup ve anahtar kelimeler Faz 8'de `src/ui/icons.ts`'e.
- `generateDue` id ve zaman damgası olmayan taslaklar döndürür; DB katmanı ekler.
- Sabit işlem düzenlenmeden, durdurulmadan ya da bitişi değiştirilmeden önce DB katmanı aynı transaction'da eski değerlerle üretimi çalıştırır; böylece bitiş uzatılınca aradaki aylar doldurulmaz.
- Yeniden aktife almada `lastGeneratedPeriod` geri gitmez; bugünkü oluşma tarihi "önce" sayılmaz, üretilir.
- "Sonraki" tarihi `lastGeneratedPeriod`'dan sonraki dönemin oluşma tarihidir; pasif, bitmiş ya da bitişi geçecek kayıtta yoktur.
- Planlanan örnekler tarih sırasıyla döner; Yaklaşan listesindeki 5 satır sınırı arayüzde uygulanır.
- Günlük ortalama kuruşa yuvarlanır; baloncuktaki "n işlem" yalnızca o günün gider işlemlerini sayar.
- Kategori dağılımında eşit tutarlar Türkçe alfabeye göre sıralanır; 6'dan fazla kategori varsa geri kalanların hepsi (tek bile olsa) "Diğerleri (n)" dilimine girer.
- Yedekte kimlikler UUID olmalı; `exportedAt` ISO-8601 zaman damgası (`toISOString` yalnızca burada, gerekçesiyle izinli).
- Yedek bütünlüğüne SPEC listesine ek olarak "aynı türde aynı adlı iki kategori olamaz" kontrolü eklendi (uygulamanın kendi kuralı).
- 10 MB sınırı hem dosya boyutunda (`isFileTooLarge`) hem okunan metnin uzunluğunda uygulanır.
- `migrate()` şimdilik kimlik fonksiyonu; yeni biçim sürümü gelince adım eklenecek.
- CSV satırları tarihe göre eskiden yeniye; aynı gün içinde `createdAt` sırası. Tür ve tarih hücreleri kaçışa girmez, kategori, açıklama ve not girer.

## Faz 4
- Varsayılan kategoriler, ızgara sıralaması, varsayılan renk ve ad doğrulaması `src/domain/categories.ts`'te (saf, test edilebilir).
- DB işlemleri `db` örneğini ve `OpContext` (`now`, `today`, `newId`) parametre olarak alır; testler sabit gün ve ayrı fake-indexeddb veritabanı kullanır.
- Üretim her sabit kayıt için ayrı bir rw transaction'da: önce `[recurringId+period]` ile varlık kontrolü, sonra ekleme; yine de gelen `ConstraintError` yakalanır ve dönem üretilmiş sayılır. Yakalanan hatanın transaction'ı iptal etmediği testle doğrulandı.
- Üretim bookkeeping'i (`lastGeneratedPeriod`) `updatedAt`'i değiştirmez; `updatedAt` yalnızca kullanıcı düzenlemesinde güncellenir.
- `navigator.locks` yoksa kilit atlanır; eşzamanlı iki çalıştırmanın mükerrer üretmediği testle doğrulandı.
- Açıklama ve not kaydedilirken kırpılır; açıklamada satır sonu reddedilir.
- Sabit işlem düzenlenirken tür de değişebilir (kategori yeni türe uygun olmalı); `startDate` değişmez.
- Durdurma ve "Bitti" kayıtlar için anahtar işlemi yok sayılır (`setRecurringActive` 0 döner).
- Üretilmiş bir kaydın "Geri al"ı sırasında sabit işlem silinmişse ya da dönem doluysa kayıt bağsız geri yazılır.
- Geri yükleme ayarları (`lastBackupAt`) korur; "Tüm verileri sil" ayarları da siler.
- ESLint: `_` önekli yıkım değişkenleri (alan atmak için) kullanılmamış sayılmaz.
