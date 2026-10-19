# Gelir Gider — Geliştirme Spesifikasyonu

## 0. Belgeler ve öncelik sırası
Bu proje iki belgeyle yürür:
- **SPEC.md** (bu belge): veri modeli, iş kuralları, mimari, güvenlik, test ve yayın.
- **DESIGN.md** (tasarım belgesi): görsel dil, yerleşim, ekranlar, arayüz metinleri ve durumlar.

Hangi belgenin esas olduğu konuya göre değişir:
- Görünüm, etkileşim ve arayüz metinlerinde DESIGN.md esastır.
- Veri, iş kuralı, güvenlik ve testte SPEC.md esastır.
- İki belge arasındaki bilinen çelişkiler bu belgede çözülmüştür. Çözümler, DESIGN.md'nin ilgili bölümüne atıfla verilir (ör. "DESIGN §6.3"). Yeni bir çelişki bulursan bana sor.
- Arayüz metinlerini DESIGN.md'den birebir al. Yeni bir metin yazman gerekirse aynı tonda yaz ("sen" dili, samimi ama ölçülü) ve `DECISIONS.md`'ye ekle.

## 1. Amaç ve sınırlar
Tek kişinin aylık gelir ve giderini kaydettiği, hesap gerektirmeyen, tamamen çevrimdışı çalışan bir web uygulaması (DESIGN §2).
- Sunucu, giriş ve senkronizasyon yok; tüm veri tarayıcıda, IndexedDB'de tutulur.
- GitHub Pages'te statik olarak yayınlanır ve PWA olarak telefona kurulur.
- Arayüz Türkçe, para birimi yalnızca TL.
- Uygulama hiçbir koşulda ağa veri göndermez.
- Uygulamanın adı henüz belirlenmedi; şimdilik "Gelir Gider" kullanılır.

## 2. Çalışma şekli
1. Bu belgeyi `SPEC.md`, tasarım belgesini `DESIGN.md` adıyla repo köküne koy. Her fazda ikisine de geri dön.
2. Kod yazmadan önce şunları göster ve onayımı bekle:
   - klasör yapısı,
   - sürüm aralıklarıyla bağımlılık listesi,
   - faz planı,
   - iki belgede belirsiz ya da çelişkili bulduğun noktalar.
3. Fazları (Bölüm 10) sırayla uygula. Her faz sonunda:
   - `typecheck`, `lint`, `test` ve `build` temiz geçmeli;
   - ne yapıldığını, hangi kararların alındığını ve sıradaki fazı kısaca özetle;
   - devam etmeden önce dur ve onayımı bekle.
4. Spesifikasyonu ya da tasarımı değiştiren bir belirsizlikte bana sor. Küçük uygulama kararlarını kendin ver ve her birini `DECISIONS.md`'ye tek satırla yaz.
5. İki belgede olmayan özellik ekleme (Bölüm 11). Listede olmayan bir bağımlılık gerekiyorsa önce gerekçesini söyle.

## 3. Teknoloji
- Vite + React + TypeScript (`strict: true`) + ESLint
- Dexie.js + `dexie-react-hooks` (`useLiveQuery`)
- Recharts
- Tailwind CSS: renkler DESIGN §4 token'larından üretilen CSS değişkenleriyle tanımlanır; karanlık mod class tabanlıdır.
- lucide-react: yalnızca ikon kataloğundaki ikonlar, her biri ayrı import edilerek
- zod: içe aktarma doğrulaması için
- vite-plugin-pwa
- react-router `HashRouter`
- Inter yazı tipi: woff2 dosyaları uygulamayla birlikte paketlenir. Latin ve latin-ext alt kümeleri yüklenir (ğ, ş, ı, İ ve ₺ dahil).
- Vitest + jsdom + fake-indexeddb
- Şunlar kullanılmaz: tarih kütüphanesi, UI kit, CDN, analitik, hata izleme.
- Takvim, alt sayfa ve bildirim bileşenleri projede yazılır. Erişilebilir diyalog için hazır bir bileşen gerekirse önce gerekçesiyle öner.

## 4. Veri modeli
- ID'ler `crypto.randomUUID()` ile üretilir.
- Zaman damgaları (`createdAt`, `updatedAt`) epoch ms cinsindendir.
- Tutarlar kuruş cinsinden pozitif tamsayıdır. Gelir mi gider mi olduğu `type` alanından anlaşılır.

```ts
type TxType = 'income' | 'expense';

type PaletteKey =
  | 'gul' | 'fusya' | 'mor' | 'civit' | 'mavi' | 'gok' | 'camgobegi'
  | 'petrol' | 'zeytin' | 'hardal' | 'amber' | 'turuncu' | 'kahve' | 'arduvaz';

interface Category {
  id: string;
  name: string;            // 1–24 karakter; aynı türde tekil
  type: TxType;            // oluşturulduktan sonra değişmez
  color: PaletteKey;
  icon: IconKey;           // ikon kataloğundan
  isSystem: boolean;       // yalnızca iki "Diğer" kategorisi için true
  createdAt: number;
}

interface Transaction {
  id: string;
  type: TxType;            // kategorinin türüyle aynı olmalı
  amount: number;          // kuruş, 1 ≤ amount ≤ 99_999_999_999
  categoryId: string;
  date: string;            // YYYY-MM-DD, yerel saat, en fazla bugün
  description: string;     // 0–80 karakter, tek satır
  note: string;            // 0–500 karakter, çok satır
  recurringId?: string;    // yalnızca bir sabit işleme bağlıysa
  period?: string;         // YYYY-MM, yalnızca recurringId varsa
  createdAt: number;
  updatedAt: number;
}

interface Recurring {
  id: string;
  type: TxType;
  amount: number;
  categoryId: string;
  description: string;
  note: string;                 // oluşan her kayda kopyalanır
  dayOfMonth: number;           // 1–31
  startDate: string;            // ilk örneğin tarihi; sonradan değişmez
  endPeriod?: string;           // YYYY-MM, bu ay dahil
  active: boolean;
  lastGeneratedPeriod: string;  // YYYY-MM, işlenmiş son dönem
  createdAt: number;
  updatedAt: number;
}

interface Settings {
  id: 'app';
  lastBackupAt?: number;        // yalnızca JSON yedeği alınınca güncellenir
}
```

Dexie şeması (sürüm 1):
```
categories:   id, type
transactions: id, date, [type+date], categoryId, recurringId, &[recurringId+period]
recurrings:   id, categoryId
settings:     id
```

Şema kuralları:
- Bir işlem sabit işleme bağlı değilse `recurringId` ve `period` alanları hiç yazılmaz. Boş string de yazılmaz:
  - Boş string geçerli bir IndexedDB anahtarıdır, index'e girer ve çakışmaya yol açar.
  - Alanı `undefined` olan kayıtlar index'e hiç girmez.
- Boolean alanlar index'lenmez.
- Şema yalnızca yeni bir Dexie sürümü ve `upgrade()` ile değiştirilir.

Cihaza özgü tercihler localStorage'da tutulur ve yedeğe girmez:
- `theme`: `light` | `dark` | `system` (varsayılan `system`)
- `hideAmounts`: boolean

## 5. Kurallar

### 5.1 Para

#### Saklama ve hesap
Hiçbir hesapta float kullanılmaz; toplamlar tamsayı toplamıdır.

#### Gösterim
Tüm biçimlendirme `src/domain/format.ts` dosyasında toplanır. Ekrandaki her tutar tek bir `<Amount>` bileşeninden geçer.

Biçimlendirme fonksiyonları:
- `formatTRY` → `₺12.450,00`
  - Her zaman iki ondalık hane gösterir.
  - Paylaşılan tek bir `Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })` örneği kullanır.
- `formatSigned` → `+₺12.450,00` / `−₺1.250,00`
  - İşaret ₺ işaretinden önce gelir.
  - Eksi için gerçek eksi işareti (U+2212) kullanılır.
  - Sıfır işaretsiz yazılır: `₺0,00`.
  - Mutlak değer biçimlendirilir, işaret elle eklenir; Intl'in ürettiği eksi işaretine güvenilmez.
- `formatShort` → `₺12,4 B` / `₺1,2 Mn`
  - Yalnızca grafik eksenlerinde ve dar alanlarda kullanılır.
- `formatWhole` → `₺412`
  - Tam TL'ye yuvarlar; ör. günlük ortalama etiketinde kullanılır.
- `formatPercent` → `%12`
  - Tam sayı yüzde verir.
  - 0'dan büyük ama 0,01'den küçük oranlar için `<%1` döner.

Hangi tutarın işaretli, hangisinin standart biçimde görüneceği DESIGN §4 ve §6'ya göre belirlenir.

`<Amount>` bileşeninin davranışı:
- `font-variant-numeric: tabular-nums` uygular.
- Kahraman varyantında ₺ işaretini ve kuruş kısmını `formatToParts` ile ayırır, bir kademe küçük ve `text-2` renginde gösterir.
- Tutar gizleme açıkken her yerde `₺•••••` gösterir. Grafik eksenleri, baloncuklar ve ekran okuyucu metinleri de buna dahildir.

#### Form girişi (DESIGN §6.3)
Yazarken uygulanacak kurallar:
- Alana yalnızca rakam ve tek bir ondalık ayırıcı yazılabilir.
- Kullanıcının yazdığı `.` ya da `,` ondalık ayırıcı sayılır ve ekranda `,` olarak görünür. `beforeinput` olayında `.` girişi `,` olarak işlenir.
- Şunlar alana hiç girmez: harf, eksi, ikinci ayırıcı, üçüncü ondalık hane.
- Binlik ayırıcılar yazarken otomatik eklenir (`12450` → `12.450`). Ekrandaki noktalar her zaman binlik ayırıcıdır.
- Biçimlendirmeden sonra imleç aynı rakamın yanında kalır.
- Bu mantık saf bir fonksiyonda yaşar: `normalizeAmountInput(text, cursor) → { display, cursor, kurus | null }`.

Yapıştırma kuralları — yapıştırılan metin `parsePastedAmount` ile ayrıştırılır, geçersizse yapıştırma yok sayılır:
1. Baştaki ve sondaki boşluklar, `₺` ve `TL` atılır.
2. Hem `.` hem `,` varsa: en sağdaki ondalık ayırıcı, diğeri binlik ayırıcıdır.
3. Tek tür ayraç varsa:
   - Bir kez geçiyor ve ardından 1–2 basamak geliyorsa ondalık ayırıcıdır.
   - Bir kez geçiyor ve ardından tam 3 basamak geliyorsa binlik ayırıcıdır.
   - Birden fazla kez geçiyorsa binlik ayırıcıdır.
4. Binlik gruplamada:
   - İlk grup 1–3 basamaklıdır ve 0 ile başlamaz.
   - Diğer gruplar tam 3 basamaklıdır.
5. Kuruşa çevirme string işlemiyle yapılır; `parseFloat(x) * 100` yasaktır.

Doğrulama:
- Kaydet'e basılınca yapılan kontroller ve hata metinleri DESIGN §8'den alınır: boş tutar, sıfır tutar, üst sınır (`₺999.999.999,99`).

Gerçek cihaz testi:
- Android Chrome'da Gboard ve Samsung klavyesiyle, ayrıca iOS Safari'de test edilir.
- Bazı Android klavyeleri `beforeinput` olayını tutarsız gönderir. Sorun çıkarsa yedek bir yol ekle: önceki değerle yeni değeri karşılaştırıp eklenen karakteri `input` olayında tespit et.

### 5.2 Tarih ve Türkçe metin

#### Tarih saklama
- Tarihler yerel saate göre `YYYY-MM-DD`, dönemler `YYYY-MM` biçiminde string olarak saklanır.
- Tüm tarih mantığı `src/domain/date.ts` dosyasında toplanır.
- Şunlar yasaktır:
  - `new Date('YYYY-MM-DD')`,
  - tarih string'i üretmek için `toISOString()`,
  - `Date.parse`.
- Tarih string'i `getFullYear`, `getMonth` ve `getDate` ile üretilir.
- Date nesnesi `new Date(y, m - 1, d)` ile kurulur.
- "Bugün" dışarıdan verilebilen bir saat fonksiyonundan okunur. Domain fonksiyonları `today` değerini parametre olarak alır.

#### Tarih kuralları
- Hafta Pazartesi başlar.
- Elle girilen bir işlemin tarihi en fazla bugün olabilir; takvimde ileri günler seçilemez.
- Gelecek tarihli tutarlar yalnızca planlanan sabit işlemlerde görünür.

#### Tarih etiketleri (DESIGN §4)
- Liste başlıkları: "Bugün", "Dün", "16 Ekim Cuma".
- Farklı yıldaki tarihler: "16 Ekim 2025 Perşembe".
- Ay seçici: "Ekim 2026".
- Dar alanlar: "16 Eki".

#### Türkçe metin (`src/domain/text.ts`)
- Karşılaştırma `toLocaleLowerCase('tr-TR')` ile yapılır:
  - "ılık" araması "ILIK"ı bulur.
  - "sil" yazımı "SİL"i karşılar.
- Sıralama `Intl.Collator('tr')` ile yapılır.
- Kategori adı tekilliği, adın kırpılmış ve tr-TR kurallarıyla küçük harfe çevrilmiş haliyle kontrol edilir.
- Kullanıcının yazdığı adlar ve değişken tarihler ek almaz (DESIGN §9).

### 5.3 Sabit işlemler
Bu bölüm, DESIGN §7 tablosunun teknik karşılığıdır.

**Tanım — oluşma tarihi:** Bir sabit kaydın P dönemindeki oluşma tarihi, P ayının `min(dayOfMonth, o ayın gün sayısı)` günüdür.

#### Oluşturma
Sabit işlem her zaman gerçek bir kayıtla doğar. İşlem formunda "Her ay tekrarla" açıkken Kaydet'e basılınca tek bir transaction'da şunlar olur:
1. İşlem kaydedilir. Bu kayıt sabit işlemin ilk örneğidir:
   - `recurringId` doldurulur,
   - `period` = işlemin ayı.
2. Sabit kayıt oluşturulur:
   - `startDate` = işlemin tarihi,
   - `lastGeneratedPeriod` = işlemin ayı,
   - diğer alanlar formdan gelir.

Diğer oluşturma kuralları:
- Bir sabit işleme bağlı olmayan kayıt düzenlenirken anahtar açılırsa aynı iki adım uygulanır. Kayıt yeni sabit işlemin ilk örneği olur.
- İlk örnek geçmiş bir aydaysa aradaki aylar hemen üretilir (kaçırılan aylar kuralı).
- İşlemler › Sabit ekranındaki "+ Ekle" aynı formu, anahtar açık olarak açar.
- Formdaki "İlk tekrar · Son" özeti, üretimle aynı domain fonksiyonlarından hesaplanır.

Bitiş doğrulaması:
- Bitiş ayı (`endPeriod`), ilk tekrarın ayından (`startDate` ayı + 1) önce olamaz. Aynı ay olabilir.
- Aksi halde şu hata gösterilir: "Bitiş, ilk tekrardan sonra olmalı."

#### Üretim
Üretim saf bir `generateDue(recurring, today)` fonksiyonu ve onu uygulayan DB katmanı ile yapılır.

Ne zaman çalışır:
- Uygulama açılırken, ilk render'dan önce.
- Sayfa yeniden görünür olduğunda (`visibilitychange`).

Nasıl çalışır — her aktif kayıt için, `lastGeneratedPeriod`'dan sonraki aydan bugünün ayına kadar her P dönemi sırayla şu kontrollerden geçer:
1. Oluşma tarihi bugünden sonraysa dur. Bu dönem işlenmiş sayılmaz.
2. `endPeriod` varsa ve P ondan sonraysa işlem üretme; dönemi işlenmiş say.
3. Diğer durumlarda bir işlem oluştur:
   - tür, tutar, kategori, açıklama ve not kaydın güncel değerlerinden alınır;
   - `recurringId` ve `period` doldurulur.

Kontrollerin sırası önemlidir: Bitiş uzatıldığında, bu ayın henüz gelmemiş örneği yanlışlıkla "işlenmiş" sayılmamalı.

Durum güncellemesi ve bildirim:
- `lastGeneratedPeriod` yalnızca işlenmiş son döneme ilerler.
- Bir kaydın üretimi ve bu güncelleme aynı `rw` transaction'ında yapılır.
- Bir çalıştırmada en az bir işlem üretildiyse tek bir bildirim gösterilir: "N sabit işlem eklendi".

Mükerrer kayıt engeli:
- Veritabanında `&[recurringId+period]` unique index'i bulunur.
- Sekmeler arası eşzamanlı üretim `navigator.locks` ile tekilleştirilir.
- Yine de `ConstraintError` gelirse uygulama çökmez; o dönem zaten üretilmiş sayılır.

#### Planlanan örnekler
Planlanan örnekler saf bir `projectPlanned(recurrings, period, today)` fonksiyonuyla hesaplanır ve veritabanına yazılmaz.

Hangi aylarda görünür:
- **İçinde bulunulan ay:** Aktif bir kaydın örneği şu üç koşul birlikte sağlanırsa görünür:
  - dönemi `lastGeneratedPeriod`'dan sonra gelir,
  - oluşma tarihi bugünden sonradır,
  - bitişi geçmemiştir.
- **Gelecek aylar (en fazla 12 ay ileri):** O ayda aktif ve bitmemiş her kaydın örneği görünür.
- **Geçmiş aylar:** Planlanan örnek yoktur.

Hesaplama kuralları:
- Planlanan örnekler toplamlara girmez.
- Ay sonu tahmini = bu ayın gerçekleşmiş neti + bu ayın planlanan gelirleri − bu ayın planlanan giderleri.

Arayüz kuralları:
- Gelecek bir ayda Özet kartları planlanan toplamları "Planlanan" etiketiyle gösterir.
- Planlanan bir satıra dokununca ilgili sabit işlemin düzenleme formu açılır.

#### Düzenleme ve yaşam döngüsü
Üretilmiş bir kaydı düzenleme veya silme:
- Değişiklik yalnızca o kaydı etkiler; sabit işlem sürer.
- `recurringId` ve `period` korunur. Kaydın tarihi başka bir aya taşınsa bile değişmez.
- Silinen kayıt yeniden üretilmez.

Sabit işlemi düzenleme:
- Değişiklik yalnızca henüz üretilmemiş dönemleri etkiler; geçmiş kayıtlar değişmez.
- `startDate` düzenlenemez; sabit işlem düzenleme formunda tarih alanı yoktur (DESIGN §6.5).

Pasife alma ve yeniden açma:
- Pasif kayıt işlem üretmez.
- Kayıt yeniden aktife alındığında, aktife alındığı günden önceki oluşma tarihleri için işlem üretilmez. `lastGeneratedPeriod` buna göre ayarlanır.

Biten kayıtlar:
- Bitiş ayı bu aydan önce olan kayıt "Bitti" olarak görünür ve anahtarı olmaz.
- Bitiş uzatılırsa üretim sıradaki dönemden devam eder; aradaki aylar doldurulmaz.

Silme:
1. DESIGN §6.5'teki onay gösterilir.
2. Sabit kayıt silinir. Ondan üretilmiş kayıtlar kalır, ancak bağları (`recurringId`, `period`) kaldırılır.
3. "Sabit işlem silindi · Geri al" bildirimi 6 saniye görünür.
4. "Geri al", sabit kaydı ve kaldırılan bağları tek transaction'da geri yazar.

### 5.4 Kategoriler

#### Varsayılanlar ve sistem kategorileri
- Varsayılan kategoriler ilk açılışta yalnızca bir kez, Dexie `populate` ile yüklenir. Ad, ikon ve renk ailesi DESIGN §10'dan alınır.
- İki "Diğer" kategorisi `isSystem: true` taşır. Sistem kategorileri:
  - silinemez;
  - adı, rengi ve ikonu değiştirilebilir;
  - kod içinde isimle değil, `isSystem` bayrağıyla bulunur.

#### Tür ve silme
- Kategori türü yalnızca oluştururken seçilir, sonra değişmez.
- Bir kategori silinince bağlı işlemler ve sabit kayıtlar tek transaction'da aynı türün "Diğer" kategorisine taşınır.
- Onay ve bildirim metinleri DESIGN §6.4 ve §8'den alınır.

#### Sıralama
- İşlem formundaki ızgara Türkçe alfabeye göre sıralanır; "Diğer" en sonda yer alır.
- Kategoriler ekranında sıralama DESIGN §6.4'e göredir:
  - önce bu ayki toplama göre azalan sırada,
  - o ay kullanılmayanlar sonda, alfabetik.

#### İkon kataloğu (`src/ui/icons.ts`)
- Yaklaşık 48 Lucide ikonu içerir. Her ikon `{ key, component, group, keywords }` yapısındadır:
  - `group`: DESIGN §6.4'teki gruplardan biri,
  - `keywords`: Türkçe anahtar kelimeler (kahve, benzin, spor…).
- Arama, anahtar kelimelerde ve grup adında tr-TR kurallarıyla yapılır.
- `repeat` ve `sticky-note` katalogda yer almaz; bu ikonlar yalnızca durum ikonu olarak kullanılır.
- Yeni bir kategorinin varsayılan ikonu `tag`'dir.

#### Renk
- Kategori rengi 14 palet anahtarından biridir.
- Yeni bir kategorinin varsayılan rengi, o türde henüz kullanılmayan ilk palet rengidir. Bütün renkler kullanılmışsa ilk renk seçilir.

### 5.5 Yedekleme ve CSV

#### JSON yedeği
- Biçim:
  ```json
  { "app": "gelir-gider", "formatVersion": 1, "exportedAt": "<ISO-8601>", "data": { "categories": [], "transactions": [], "recurrings": [] } }
  ```
- Dosya adı: `gelir-gider-yedek-YYYY-MM-DD.json` (yerel tarih).
- Yedek başarıyla alınınca `lastBackupAt` güncellenir.

#### Geri yükleme
Dosya, veritabanına yazmadan önce baştan sona doğrulanır. Herhangi bir hata varsa hiçbir şey değişmez ve onay ekranı açılmaz.

Doğrulama adımları:
1. Dosya 10 MB'tan büyükse okunmaz.
2. JSON ayrıştırılamıyorsa ya da `app` alanı yanlışsa şu mesaj gösterilir: "Bu dosya geçerli bir yedek değil."
3. `formatVersion` uygulamanınkinden yeniyse şu mesaj gösterilir: "Bu yedek uygulamanın daha yeni bir sürümüyle alınmış. Önce uygulamayı güncelle." Eski sürümler bir migrasyon fonksiyonundan geçirilir.
4. zod `.strict()` şemalarıyla şunlar kontrol edilir:
   - Bölüm 4'teki tipler ve uzunluklar;
   - tarih biçimi ve tarihin takvimde geçerli olması (`2026-02-30` geçersizdir);
   - tutarın pozitif, güvenli bir tamsayı olması ve üst sınırı aşmaması;
   - rengin palette, ikonun katalogda olması;
   - tablo başına kayıt sınırı (ör. 100.000).
5. Bütünlük kontrolleri:
   - ID'ler tekildir.
   - Her `categoryId` mevcut bir kategoriye işaret eder.
   - İşlemlerin ve sabit kayıtların türü, kategorilerinin türüyle aynıdır.
   - Her türde tam olarak bir sistem "Diğer" kategorisi vardır.
   - `recurringId` olan her kayıt mevcut bir sabit kayda işaret eder ve `period` alanı doludur.
   - `[recurringId+period]` çifti tekrar etmez.

Doğrulama başarılıysa:
1. DESIGN §6.6'daki onay ekranı gösterilir: önizleme, karşılaştırma, uyarı ve onay kutusu.
2. "Geri yüklemeden önce mevcut verilerimin yedeğini indir" kutusu varsayılan olarak işaretlidir. İşaretliyse önce mevcut verinin yedeği indirilir.
3. Kullanıcı onaylayınca tüm tablolar tek bir `rw` transaction'ında temizlenip yeniden yazılır. Birleştirme yapılmaz; veri tamamen değiştirilir.
4. Geri yüklemeden hemen sonra sabit işlem üretimi çalışır, böylece eski bir yedekte kaçırılan aylar dolar.

Veritabanına ham JSON nesneleri değil, zod'un ürettiği çıktı yazılır.

#### CSV dışa aktarma (DESIGN §6.6)
İçerik ve dosya:
- Tüm işlemler dışa aktarılır.
- Sütunlar: Tarih, Tür, Kategori, Açıklama, Not, Tutar.
- Dosya adı: `gelir-gider-islemler-YYYY-MM-DD.csv`.

Biçim — dosya Excel'in Türkçe ayarlarında doğrudan açılmalı:
- UTF-8 BOM, `;` ayırıcı, CRLF satır sonu.
- Tarih `YYYY-MM-DD` biçiminde.
- Tür "Gelir" ya da "Gider".
- Tutar binlik ayırıcısız ve ondalık virgüllü yazılır (`1250,50`). Giderler negatiftir ve ASCII eksi işareti kullanır.

Kaçış kuralları:
- `;`, `"` ya da satır sonu içeren alanlar çift tırnağa alınır; alan içindeki `"` karakteri `""` olarak yazılır.
- Formül enjeksiyonu: `=`, `+`, `-`, `@`, sekme veya satır başı karakteriyle başlayan metin hücrelerinin başına `'` eklenir. Açıklama, not ve kategori adı kullanıcı girdisidir.

CSV dışa aktarma `lastBackupAt` değerini güncellemez.

#### İndirme
- Dosyalar bir Blob ve indirme bağlantısıyla oluşturulur.
- iOS'ta ana ekrandan açılan uygulamada indirme sorun çıkarabilir. Bu durumda `navigator.canShare({ files })` destekleniyorsa, paylaşım sayfasıyla kaydetme yedek yol olarak sunulur. Bu davranış gerçek cihazda test edilir.

### 5.6 Veri kalıcılığı
- İlk işlem kaydedildiğinde, tarayıcı destekliyorsa `navigator.storage.persist()` istenir (DESIGN §9).
- Ayarlar'daki "Son yedek" satırı ve 30 günlük eşik DESIGN §6.6'ya göre uygulanır.

### 5.7 Güvenlik ve gizlilik

#### Kullanıcı girdisi
- Kullanıcı girdisi yalnızca React metin düğümü olarak basılır.
- `innerHTML`, `dangerouslySetInnerHTML`, `eval` ve `new Function` kullanılmaz.
- Stile kullanıcıdan gelen hiçbir string girmez. Kategori rengi, palet anahtarından türetilen bir CSS değişkenidir.

#### Ağ
- Uygulama, service worker'ın kendi dosyalarını çekmesi dışında hiçbir ağ isteği yapmaz.
- Yazı tipi, ikonlar ve illüstrasyonlar pakete dahildir.

#### CSP
CSP `<meta>` etiketi yalnızca production build'e eklenir. Başlangıç noktası:
```
default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:;
font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self';
object-src 'none'; base-uri 'self'; form-action 'none'
```
- Build'i `vite preview` ile açıp konsolda CSP ihlali olmadığını doğrula.
- Bir yönergeyi gevşetmek gerekirse gerekçesini `DECISIONS.md`'ye yaz.
- PWA kayıt kodu inline script üretmemeli.

#### CI/CD
- GitHub Actions iş akışı yalnızca şu yetkileri alır: `contents: read`, `pages: write`, `id-token: write`.
- Bağımlılıklar `npm ci` ile kurulur.
- Deploy için resmi `actions/deploy-pages` akışı kullanılır.
- Deploy'dan önce typecheck, lint, test ve build çalışır.
- Teslim anında `npm audit` temiz olmalıdır.

## 6. Arayüz: teknik notlar
DESIGN §3–§9 eksiksiz uygulanır. Bu bölüm, tasarımın teknik karşılıklarını ve tasarımın açık bıraktığı noktaları tanımlar.

### Token'lar ve tema
- DESIGN §4'teki token'lar `:root` ve `.dark` altında CSS değişkeni olarak tanımlanır.
- Tailwind teması bu değişkenlere bağlanır; bileşenlerde ham hex kullanılmaz.
- Kategori paletinin 14 rengi de açık ve koyu varyantlarıyla değişken olarak tanımlanır.
- Gider tutarının rengi (kırmızı ya da nötr) tek bir token'dan gelir. DESIGN §6.2'deki karşılaştırmanın sonucuna göre tek satırla değiştirilebilmeli.
- Tema ve tutar gizleme tercihi, ilk render'dan önce localStorage'dan okunur.
- Tema "Sistem" iken `prefers-color-scheme` değişikliği dinlenir.
- `<meta name="theme-color">` etkin temaya göre güncellenir.
- Tüm arayüz metinleri `src/ui/copy.ts` dosyasında toplanır ve DESIGN'daki metinlerle birebir aynıdır.

### Yerleşim ve navigasyon
- Kırılım noktaları ve navigasyon biçimleri DESIGN §5'teki gibidir.
- 320 px genişlikte yatay kaydırma olmaz.
- `viewport-fit=cover` ayarlanır ve tüm sabit öğelere `env(safe-area-inset-*)` uygulanır.
- Klavye açıldığında:
  - alt çubuk gizlenir,
  - Kaydet butonu klavyenin hemen üstüne taşınır.
  Klavyenin açık olduğu `visualViewport` ile algılanır.
- Seçili ay, uygulama genelinde tek bir state'tir:
  - açılışta bu ay seçilidir,
  - en fazla 12 ay ileri gidilebilir.
- Özet'ten İşlemler'e geçerken tür, kategori ya da gün filtresi router state ile taşınır.
- Masaüstü kısayolları (N, /, ← →), bir giriş alanında odak varken devre dışı kalır.

### Ortak bileşenler

**`<Amount>`:** Bölüm 5.1'de tanımlandı.

**Alt sayfa (mobil) ve modal (masaüstü):**
- Odak hapsi uygulanır, Esc ile kapanır, `aria-modal` taşır.
- Kapanınca odak, açan öğeye geri döner.
- Mobilde aşağı çekerek kapatılabilir.
- Kaydedilmemiş değişiklik varsa kapatmadan önce DESIGN §6.3'teki onay gösterilir.

**Takvim ve ay-yıl seçici:**
- Projede yazılır; hafta Pazartesi başlar.
- Yerel `<input type="date">` kullanılmaz, çünkü hafta başlangıcını ve görünümü garanti etmez.

**Kaydırarak silme:**
- Pointer olaylarıyla yazılır.
- Yatay hareket belirli bir eşiği geçmeden devreye girmez; böylece dikey kaydırmayla çakışmaz.
- "Hareketi azalt" tercihinde animasyon kullanılmaz.
- Hareketsiz karşılıklar DESIGN §9'daki gibidir.

**Bildirimler:**
- Aynı anda tek bildirim gösterilir. Yeni bildirim eskisinin yerini alır ve eskisinin "Geri al" fırsatı biter.
- Süre 3 saniyedir; "Geri al" içerenlerde 6 saniyedir.
- Bildirimler `aria-live="polite"` ile ekran okuyucuya duyurulur.

**Formlar:**
- Kaydet butonu her zaman etkindir. Hata varsa ilk hatalı alana odaklanılır.
- Enter tuşu formu kaydeder; not alanında ise satır başı ekler.
- Tutar alanındaki sallanma animasyonu "hareketi azalt" tercihinde çalışmaz.
- İşlem formunda "+ Yeni" ile kategori eklenip forma dönüldüğünde yeni kategori seçili gelir.

### Hesaplamalar (`src/domain/stats.ts`)
Tüm hesaplamalar saf fonksiyonlardır.
- **Aylık özet:** gelir, gider ve kalan.
- **Bugün ve bu hafta:** Yalnızca gider sayılır. Hafta Pazartesi başlar ve ay sınırını aşabilir.
- **Günlük seri ve ortalama:**
  - İçinde bulunulan ayda: ortalama = bugüne kadarki gider / bugünün gün numarası.
  - Geçmiş aylarda: ortalama = ayın toplam gideri / ayın gün sayısı.
  - Gelecek aylarda günlük grafik boştur.
- **Kategori dağılımı:** En büyük 6 kategori ayrı gösterilir; kalanlar "Diğerleri (n)" diliminde toplanır.
- **Son 6 ay serisi.**
- **Sabit işlem özeti:** Aktif ve bitmemiş kayıtların aylık gelir ve gider toplamları.
- **Filtre özeti:** ör. "12 işlem · −₺2.340,00".

### Grafikler (Recharts, DESIGN §6.1)
Günlük harcama grafiği:
- Pazartesiler ve günlük ortalama `ReferenceLine` ile çizilir.
- Özel bir çubuk şekli kullanılır: bugünün çubuğu tam renk, diğerleri %60 opaklıkta.
- Dokunma alanı, günün tüm sütunudur.
- Baloncuğa dokununca İşlemler ekranı o günün grubuna kaydırılmış olarak açılır.

Her grafiğin görsel olarak gizli bir metin karşılığı vardır (DESIGN §9).

### İşlem listesi
- Ay görünümü, tarih aralığı sorgusuyla yüklenir.
- Arama:
  - tüm aylarda yapılır;
  - açıklama, not ve kategori adında arar;
  - tr-TR kurallarıyla karşılaştırır;
  - gecikmeli (debounce) çalışır.
- Liste çok uzarsa sanallaştırma eklenebilir; eklenirse gerekçesi yazılır.

### Diğer
- İlk açılış illüstrasyonu özgün, satır içi bir SVG'dir; harici görsel kullanılmaz.
- Hakkında bölümündeki "Ana ekrana ekle" yönergesi yalnızca uygulama kurulu değilken gösterilir. Kurulu olup olmadığı `display-mode: standalone` ile, iOS'ta ise `navigator.standalone` ile anlaşılır.

## 7. PWA ve yayın

### Manifest
- `name`: "Gelir Gider"
- `lang`: "tr"
- `display`: "standalone"
- `start_url` ve `scope`: base yoluyla uyumlu
- İkonlar: 192 px, 512 px, maskable ve `apple-touch-icon`

### Açılış ekranı
Android'de açılış ekranı manifest'teki tek bir `background_color` değerinden üretilir. Bu yüzden temaya göre iki ayrı açılış ekranı garanti edilemez. Her iki temada da rahatsız etmeyecek nötr bir renk seç ve `DECISIONS.md`'ye yaz.

### Önbellek ve güncelleme
- Uygulama kabuğu ve yazı tipleri precache edilir. İlk yüklemeden sonra uçak modunda her şey çalışır.
- `registerType: 'prompt'` kullanılır. Yeni sürüm hazır olduğunda "Yeni sürüm hazır · Yenile" bildirimi gösterilir.
- Başka bir sekme veritabanı sürümünü yükseltirse (Dexie `versionchange`), bağlantı kapatılır ve kullanıcıdan sayfayı yenilemesi istenir.

### Yayın
- `base` tek yerden yönetilir: `/<repo-adı>/`; custom domain kullanılırsa `/`.
- GitHub Actions: `main`'e push yapıldığında önce CI çalışır, ardından Pages'e deploy edilir.

## 8. Klasör yapısı (öneri)
```
src/
  domain/      # saf TypeScript; React ve Dexie bağımlılığı yok
    money.ts  format.ts  amount-input.ts  date.ts  text.ts
    recurring.ts  stats.ts  backup.ts  csv.ts
  db/
    db.ts      # Dexie şeması, populate, migrasyonlar
    ops/       # transaction'lı işlemler: üretim, kategori silme, geri yükleme, geri al
  ui/
    components/  pages/  icons.ts  copy.ts  tokens.css
  app/         # router, layout, tema, seçili ay, bildirimler, PWA güncelleme
```
Testler, ilgili dosyanın yanında `*.test.ts` olarak durur.

## 9. Testler (Vitest)

### Genel
- Domain testleri saf fonksiyonları test eder.
- DB testleri fake-indexeddb kullanır.
- `npm test` testleri iki kez çalıştırır: `TZ=Europe/Istanbul` ve `TZ=America/Los_Angeles`.

### format
- `formatTRY(125050)` → `₺1.250,50`
- `formatSigned`:
  - gelir → `+₺…`
  - gider → `−₺…` (U+2212 olduğu doğrulanır)
  - sıfır → `₺0,00`
- `formatShort` → `₺12,4 B`, `₺1,2 Mn`
- `formatPercent` → `%12`, `<%1`

### amount-input
Her satırda soldaki tuşlar boş bir alana sırayla yazılır, sağda beklenen ekran değeri ve kuruş karşılığı yer alır:

| Tuşlar | Ekran | Kuruş |
|---|---|---|
| `12450` | `12.450` | 1245000 |
| `1250,5` | `1.250,5` | 125050 |
| `1250.5` | `1.250,5` (nokta virgüle çevrilir) | 125050 |
| `12,345` | `12,34` (üçüncü ondalık girmez) | 1234 |
| `1,2,3` | `1,23` (ikinci ayırıcı girmez) | 123 |
| `-5` | `5` | 500 |
| `abc` | boş | — |

Ayrıca:
- Sondaki rakam silindiğinde imleç doğru yerde kalır.
- Yapıştırma:
  - doğru ayrıştırılmalı: `1.250,50`, `1,250.50`, `1.250`, `1.234.567,89`, `₺ 1.250,50`;
  - reddedilmeli: `1,2345`, `1.25.0`.

### date / text
- Ay sonu, artık yıl (Şubat 2028), ay ekleme ve çıkarma, yıl geçişi.
- Liste başlıkları: "Bugün", "Dün", farklı yıl.
- Pazartesi başlangıçlı hafta.
- "ılık" ↔ "ILIK" ve "sil" ↔ "SİL" eşleşir.
- Ç, Ğ, İ, Ö, Ş, Ü alfabede doğru yerde sıralanır.

### recurring
Üretim:
- İlk örnek bu aydaysa üretim sonraki aydan başlar.
- İlk örnek 3 ay önceyse aradaki 2 ay hemen üretilir.
- `dayOfMonth: 31` olan kayıt Şubat'ta ayın 28/29'unda, Nisan'da 30'unda oluşur.
- Oluşma tarihi bugünden sonraysa işlem üretilmez ve dönem işlenmiş sayılmaz.
- `endPeriod` dahildir; ondan sonraki ay üretilmez.
- Bitiş uzatılınca bu ayın henüz gelmemiş örneği kaybolmaz.
- Uygulama 8 ay açılmadıysa eksik dönemlerin hepsi tek çalıştırmada üretilir.
- Aynı girdiyle ikinci çalıştırma yeni işlem üretmez.
- Pasif kayıt işlem üretmez. Pasiften aktife alınan kayıt aradaki dönemleri üretmez.
- Aralık → Ocak geçişi doğru çalışır.

`projectPlanned`:
- İçinde bulunulan ay, gelecek ay, 12 aylık sınır ve geçmiş ay (boş sonuç).
- Ay sonu tahmini doğru hesaplanır.
- İlk örneği bu ay olan kayıt, bu ay için planlanan olarak görünmez.

### stats
- "Bu hafta" ay sınırını aştığında doğru hesaplanır.
- Günlük ortalama, içinde bulunulan ayda ve geçmiş aylarda doğru hesaplanır.
- Kategori dağılımı: ilk 6 kategori + "Diğerleri (n)".
- Planlanan örnekler toplamlara girmez.

### csv
- Dosya BOM ile başlar, `;` ayırıcı ve CRLF satır sonu kullanır.
- Tırnak kaçışı doğru yapılır; çok satırlı not tek hücrede kalır.
- `=1+1`, `+90...`, `-x` ve `@SUM` ile başlayan açıklamalar `'` önekini alır.
- Negatif gider tutarı ondalık virgülle yazılır.

### DB
- Aynı `[recurringId+period]` çifti ikinci kez eklenemez; sabit işleme bağlı olmayan kayıtlar birbirini engellemez.
- Üretilmiş bir kayıt silinip üretim tekrar çalıştırıldığında kayıt geri gelmez.
- Kategori silindiğinde işlemler ve sabit kayıtlar "Diğer"e taşınır; sistem kategorisi silinemez.
- Sabit işlem silindikten sonra "Geri al", sabit kaydı ve bağları birebir geri getirir.
- Başarısız bir geri yükleme mevcut veriyi değiştirmez.
- Başarılı bir geri yüklemenin ardından sabit işlem üretimi çalışır.

### Geri yükleme doğrulaması
Reddedilmesi gerekenler:
- Bozuk JSON, yanlış `app` değeri, uygulamanınkinden yeni `formatVersion`.
- Eksik alan veya fazladan alan.
- Geçersiz tutar: float, negatif, string ya da güvenli tamsayı aralığı dışında (`1e21`).
- Geçersiz tarih.
- Var olmayan bir kategoriye referans ya da tür uyuşmazlığı.
- Tekrarlı ID, iki sistem "Diğer" kategorisi, tekrarlı `[recurringId+period]`.
- `__proto__` anahtarı.
- Palet dışında bir renk ya da katalogda olmayan bir ikon.
- Aşırı uzun string ya da boyut sınırını aşan dosya.

Kabul edilmesi gerekenler:
- Uygulamanın kendi dışa aktardığı dosya. Geri yüklendiğinde veriler birebir aynı olmalı (round-trip).

## 10. Faz planı
0. **Plan ve onay** (Bölüm 2).
1. **İskelet:** Vite, TS, ESLint, Vitest, Tailwind, token'lar, tema, Inter, HashRouter, CI ve Pages deploy. Bu fazın sonunda boş uygulama yayında açılmalı.
2. **Domain I:** `money`, `format`, `amount-input`, `date`, `text` ve testleri.
3. **Domain II:** `recurring`, `stats`, `backup`, `csv` ve testleri.
4. **Veritabanı:** şema, `populate`, transaction'lı işlemler, geri al ve DB testleri.
5. **Uygulama kabuğu:** üç genişlik için navigasyon, seçili ay, bildirimler, alt sayfa/modal, `<Amount>`.
6. **İşlemler:** işlem ekleme/düzenleme formu, İşlemler › Kayıtlar, İşlemler › Sabit.
7. **Özet** ve grafikler.
8. **Kategoriler.**
9. **Ayarlar**, yedekleme ve CSV.
10. **PWA**, CSP, güncelleme akışı ve erişilebilirlik turu.
11. **README** ve son kontrol.

### Bitti sayılma kriterleri
- typecheck, lint, test ve build temiz geçiyor.
- DESIGN §12'deki her ekran durumu uygulamada oluşturulabiliyor. Her durum açık ve koyu temada, 390, 768 ve 1440 px genişlikte kontrol edildi.
- `vite preview` ile açılan build'de konsol hatası ve CSP ihlali yok.
- Uygulama kullanılırken DevTools Network sekmesinde dışarıya istek gitmiyor.
- Uçak modunda sayfa yeniden yüklenebiliyor.
- Uygulama Chrome'da kurulabiliyor ve iOS'ta ana ekrana eklenebiliyor.
- Tutar girişi gerçek bir Android ve bir iOS cihazda denendi.

## 11. Kapsam dışı (v1)
- DESIGN §11'deki her şey.
- Yedek şifreleme.
- CSV içe aktarma.

## 12. README
README şu başlıkları içerir:
- **Gereksinimler ve komutlar:** `npm install`, `npm run dev`, `npm test`, `npm run build`, `npm run preview`.
- **GitHub Pages:**
  - Pages kaynağını "GitHub Actions" yapma,
  - `base` yolunu ayarlama,
  - custom domain bağlama.
- **Telefona kurulum:**
  - Android/Chrome: "Uygulamayı yükle".
  - iOS/Safari: Paylaş → "Ana Ekrana Ekle".
  - iOS'ta ana ekrana eklenen uygulama Safari'deki siteyle aynı depolamayı paylaşmayabilir. Önce uygulamayı kur, sonra veri gir.
- **Cihazlar arası taşıma:**
  - Yedek al, dosyayı diğer cihaza aktar, Ayarlar'dan geri yükle.
  - Geri yükleme, o cihazdaki mevcut veriyi tamamen değiştirir.
  - Yedek dosyası şifresiz finansal veri içerir.
- **Origin uyarısı:**
  - `kullanici.github.io` altındaki tüm Pages projeleri aynı origin'i, dolayısıyla aynı IndexedDB'yi paylaşır.
  - O hesaptaki herhangi bir sayfada bulunan tek bir XSS açığı bu veriyi okuyabilir.
  - Tam izolasyon için projeye özel bir alt alan adı kullanılmalı.
- **Veri kaybı riskleri:**
  - kalıcı depolamanın nasıl çalıştığı,
  - düzenli yedek almanın neden gerektiği.

## 13. DESIGN.md'de tanımsız olup bu belgede karara bağlananlar
Bir kararı değiştirmek istersen ilgili maddeyi güncellemen yeterli.
- Elle girilen bir işlemin tarihi en fazla bugün olabilir. Bu yüzden ileride başlayacak bir sabit işlem, ilk ödemesi gerçekleştiğinde eklenir.
- Planlanan bir satıra dokununca sabit işlem düzenleme formu açılır.
- Bitiş ayı, ilk tekrarla aynı ay olabilir.
- İşlem formundaki kategori ızgarası Türkçe alfabeye göre sıralanır; "Diğer" en sonda yer alır.
- Yeni bir kategorinin varsayılan rengi, o türde henüz kullanılmayan ilk palet rengidir.
- CSV dışa aktarma:
  - tüm işlemleri içerir,
  - gider tutarlarını negatif sayı olarak yazar,
  - dosya adı `gelir-gider-islemler-YYYY-MM-DD.csv`'dir.
- Bir sabit işlem silinince ondan üretilmiş kayıtların bağı kaldırılır. Bu kayıtlar tekrar ikonunu ve "Sabit işlemi düzenle" bağlantısını kaybeder.
- Geri yüklemeden sonra sabit işlem üretimi çalışır.
- Uygulamanın adı geçici olarak "Gelir Gider"dir.
