# Kararlar

Küçük uygulama kararları, her biri tek satır (Gereksinimler §2). En yenisi en altta.

## Faz 0
- Tasarım belgesi proje sahibinin verdiği metinden oluşturuldu; aktarımda kaybolan "+ butonu" ve "2. adım" madde başları onarıldı.
- TypeScript `~6.0`: typescript-eslint 8.x en fazla TS 6.0'ı destekliyor (TS 7 çıkmış olsa da).
- Inter `@fontsource-variable/inter` ile paketlenir; `src/ui/fonts.css` yalnızca latin ve latin-ext yüzlerini tanımlar.
- `react-is`, Recharts'ın eş bağımlılığı olduğu için doğrudan eklendi.
- vite-plugin-pwa Faz 10'da eklenecek; PNG ikon üretimi için ek araç gerekirse o zaman sorulacak.
- Kırılımlar Tasarım §5'e göre: <640 alt çubuk, 640–1023 72 px ikon şeridi, ≥1024 200 px kenar çubuğu.
- Gider tutarı rengi varsayılan kırmızı (teslim kartları); `--amount-expense` token'ı tek satırla nötre çevrilir.
- "Tüm verileri sil": bütün tablolar (settings dahil, yani `lastBackupAt` da) tek transaction'da temizlenir, varsayılan kategoriler yeniden yüklenir; localStorage tercihleri (tema, gizleme) korunur.
- "Ayın kaçında" varsayılanı işlem tarihinin günü; ilk tekrar her zaman sonraki ayda.
- Sabit işlem formunda bitiş yoksa özet yalnızca "İlk tekrar: 16 Kasım" olarak yazılır.
- Kategori silme bildirimi taşınanlara göre kurulur: hiçbir şey taşınmadıysa "Kategori silindi"; sabit işlem de varsa "Kategori silindi, 14 işlem ve 1 sabit işlem Diğer kategorisine taşındı".
- Sabit işlem silme onayının başlığı "'İnternet' silinsin mi?"; korunacak kayıt yoksa ikinci cümle yazılmaz.
- Ay sonu tahmini standart biçimde; negatifse U+2212 eksi ve expense rengiyle (Özet kartı "eksi" durumu).
- Not sayacı Tasarım §6.3'e göre 400 karakterden sonra görünür (kart her zaman gösteriyor; metin esas).
- Kartlarda çizilmeyen ekranlar (sabit işlem formu, yeni kategori, takvim, ay-yıl seçici, kategori filtresi, "⋯" menüsü, 640–1023 yerleşimi) mevcut bileşenlerden türetilir.

## Faz 1
- Yayın yolu `vite.config.ts` içinde tek yerden: `BASE_PATH` ortam değişkeni, yoksa `/para-yonetimi/`.
- `npm test`, `scripts/test.mjs` ile Vitest'i iki kez başlatır; `src/test/timezone.test.ts` TZ'nin uygulandığını doğrular.
- Tema, ilk render öncesi `public/theme-init.js` (inline olmayan, modül olmayan script) ile uygulanır; Vite'ın "can't be bundled" uyarısı beklenen bir durum.
- Tema "Sistem" iken localStorage'a değer yazılmaz (anahtar silinir).
- Tailwind'in hazır renk ve font paleti `--color-*: initial` ile kapatıldı; yalnızca tasarım token'ları sınıf olarak kullanılabilir.
- Bileşen kartlarındaki ek token'lar (switch-off, toast, on-toast, toast-accent, scrim, shadow, on-expense) `tokens.css`'e eklendi.
- ESLint, Gereksinimler §5.2/§5.7 yasaklarını kural olarak uygular (innerHTML, dangerouslySetInnerHTML, eval, Date.parse, toISOString, `new Date('...')`).
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
- Yedek bütünlüğüne gereksinimlerdeki listeye ek olarak "aynı türde aynı adlı iki kategori olamaz" kontrolü eklendi (uygulamanın kendi kuralı).
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

## Faz 5
- Sağlayıcılar: Prefs (tema, tutar gizleme) › Today › SelectedMonth › Toast › Router › TxSheet. "Bugün" gece yarısında ve sayfa görünür olunca yenilenir.
- Seçili ay sınırı okunurken uygulanır (`clampPeriod`); seçim hep bu aydan en fazla 12 ay ileride kalır, geçmişe sınır yok.
- Yeni metinler (aynı tonda): "Ay seç" (ay-yıl seçici başlığı), "Önceki yıl"/"Sonraki yıl" (seçicide yıl düğmeleri), "Tutar gizli" (gizli tutarın ekran okuyucu karşılığı).
- Gizli tutar görünürde `₺•••••`, ekran okuyucuda "Tutar gizli"; bileşen dışı metinler (eksen, baloncuk, aria-label) `useAmountText` ile gizlenir.
- Kahraman tutar masaüstünde 48/52, ₺ ve kuruş 34/52 (mobilde 40/44 ve 28/44).
- Modal katmanı body'ye portal edilir; açıkken diğer body çocukları `inert` yapılır, Tab döngüsü ve Esc yalnızca en üstteki katmanda çalışır, kapanınca odak açan öğeye döner.
- Alt sayfa 640 px altında alttan açılır (tutamaç ve başlık alanından aşağı çekince 96 px'te kapanma istenir); 640 px ve üstünde ortada modal (işlem formu 480 px, ay seçici 400 px).
- Onay diyaloğu açılınca odak "Vazgeç"te; arka plana dokunmak Vazgeç sayılır.
- Klavye: iOS'ta `visualViewport` ile kapladığı yükseklik ölçülür ve alt sayfa o kadar yukarı alınır; Android'de görünür alan daralması ve odaktaki giriş alanı birlikte klavye sayılır. Klavye açıkken alt çubuk gizlenir.
- İkon şeridinde (640–1023) etiketler hover/odakta ipucu olarak görünür; "+ İşlem ekle" şeridin en üstünde.
- Masaüstü kısayolları bir giriş alanında, değiştirici tuşla ya da modal açıkken çalışmaz; "/" İşlemler'e arama isteğiyle gider (alanı Faz 6 açar).
- Bildirim alanı mobilde alt çubuğun hemen üstünde, 640 px ve üstünde sağ altta; tek `aria-live="polite"` bölgesi.
- Sabit işlem üretimi `main.tsx`'te ilk render'dan önce (top-level await) ve `visibilitychange` ile çalışır; hata olursa uygulama yine açılır.
- Context dosyaları (`src/app`) sağlayıcıyla birlikte hook da dışa aktardığı için react-refresh kuralı orada kapalı.
- Nav ikonları: Özet `layout-dashboard`, İşlemler `list`, Kategoriler `shapes`, Ayarlar `settings-2` (kartlardaki çizimlerle aynı).
- "+" ve N kısayolu şimdilik boş "Yeni işlem" sayfası açar; form Faz 6'da.

## Faz 6
- İkon kataloğu `src/ui/icons.ts`'te: her ikon ayrı import, Türkçe ad ve anahtar kelimeler; arama ad, anahtar kelime ve grup adında tr-TR kurallarıyla.
- Kategori düzenleyici bu fazda yazıldı (işlem formundaki "+ Yeni" için); Kategoriler ekranı Faz 8'de aynı bileşeni kullanacak. Yeni kategoride varsayılan renk kategoriler yüklendikten sonra hesaplanır.
- Tutar alanı yerel `beforeinput` dinler (React'in sentetik olayı `inputType` taşımaz); iptal edilemeyen olaylar (Android kompozisyonu) `input` olayında `applyRawChange` ile önceki/yeni değer karşılaştırılarak işlenir. Yapıştırma `paste` olayında.
- Tutar alanının genişliği karakter sayısına göre (`ch`) ayarlanır; ₺ solda, alt çizgi odakta vurgu, hatada expense renginde.
- Form durumu ilk değerle karşılaştırılarak "kaydedilmemiş değişiklik" anlaşılır; imleç konumu karşılaştırmaya girmez.
- "Ayın kaçında" kullanıcı elle seçene kadar seçilen tarihin gününü izler.
- Bitiş seçicide en erken ay ilk tekrarın ayıdır; altta "Bitiş yok" çipi bitişi kaldırır.
- Sabit işlem düzenleme formunda özet satırı "İlk tekrar" yerine "Sonraki: 1 Kasım" gösterir (işlem zaten başlamış olduğu için); tarih alanı yok.
- Kaydetten sonra tek bildirim: yeni işlemde "İşlem kaydedildi", düzenlemede "Değişiklikler kaydedildi"; kaçırılan aylar için ayrıca bildirim gösterilmez (tek bildirim kuralı).
- Kalıcı depolama ilk işlem kaydedilirken (öncesinde hiç işlem yoksa) istenir.
- Yeni metinler (✱ ile `copy.ts`'te): "Tür" (tür seçicinin adı), "Sabit işlemi sil", "Sil" (sabit işlem silme onayı), "N kategori" (çoklu kategori çipi), "Tamam" (kategori filtresi), "Bu aramayla eşleşen ikon yok.", "Gider kategorisi · tür sonradan değişmez" (kartta vardı), takvimde "Önceki ay"/"Sonraki ay".
- Sabit işlem silme onayında korunacak kayıt yoksa ikinci cümle "Bundan sonra kayıt oluşturulmayacak." olarak kısalır.
- Planlanan grubu yalnızca filtre ve arama yokken, bu ay ve gelecek aylarda gösterilir; satır "Kategori · 25 Eki" alt yazısı ve tekrar ikonu taşır, dokununca sabit işlem formu açılır.
- Planlanan satır varken "… için kayıt yok." mesajı gösterilmez.
- Arama tüm işlemleri belleğe alıp süzer (200 ms gecikmeli); masaüstünde arama alanı başlıkta hep açık, sorgu varken ay seçici gizlenir.
- Tür çipi değişince başka türün seçili kategorileri bırakılır; kategori filtresi sayfası seçili türün kategorilerini gösterir.
- Kaydırarak silme: yatay hareket 10 px'i ve dikey hareketi geçince başlar; 44 px'te "Sil" açık kalır, satır genişliğinin %60'ını geçince doğrudan siler. "Sil" alanı yalnızca satır kaydırılmışken çizilir. Açık satıra dokunmak satırı kapatır.
- Masaüstünde "⋯" menüsü satırın üzerine gelince ya da odakta görünür; Esc ve dışarı tıklama kapatır. Klavyeyle odaklanan satırın alt yazısı "Enter düzenler · Delete siler" olur (kart).
- Not ikonunun ipucu yalnızca 640 px ve üstünde, ilk iki satır.
- Sabit listesinde alt yazı 2 satıra kadar kırılabilir (tutar ve anahtar dar ekranda yer kaplıyor); tutar asla kesilmez.
- Sıfır tutar renklenmez (₺0,00 nötr).
- Klavye algılaması yalnızca bir giriş alanı odaktayken çalışır; pencere yeniden boyutlanınca alt çubuk yanlışlıkla gizlenmez.
- Özet'ten İşlemler'e geçişte router state (`type`, `categoryId`, `day`, `search`) her gezinmede bir kez uygulanır (`location.key`).

## Faz 7
- Grafiklerde Recharts yalnızca çubukları, donut'u ve eksenleri çizer; gün/ay sütunlarının dokunma alanları, pazartesi çizgileri, seçili gün vurgusu, ortalama etiketi ve baloncuk aynı geometriyle HTML katmanlar olarak çizilir. Grafik genişliği `ResizeObserver` ile ölçülür.
- Gün ve ay sütunları düğmedir; ekran okuyucu "16 Ekim Cuma · −₺340,00 · 3 işlem" ve "Ekim: gelir ₺18.000, gider ₺14.200" okur. Günler arasında ← → ile gezilir (tek sekme durağı). Svg'ler `accessibilityLayer` kapalı ve ekran okuyucudan gizli.
- Eksen üst sınırı 1/2/2,5/4/5/8/10 × 10ⁿ TL'ye yuvarlanır; üç çizgi (0, yarı, üst).
- Gün baloncuğu çubuğun ya da ortalama çizgisinin üstünde, yatayda %28–72 arasında tutulur; baloncuğa dokunmak İşlemler'i o günün grubuna kaydırarak açar.
- Geçmiş aylarda "bugün" çubuğu yoktur; seçili gün tam renk, diğerleri %60.
- Kategori dağılımı listesi donut'un metin karşılığıdır; tutarlar işaretsiz (kart). "Diğerleri (n)" satırına ya da "Tümünü göster"e dokununca tüm kategoriler tek tek listelenir, donut aynı kalır. Seçili türde veri yoksa boş halka ve ₺0,00.
- Renk doğrulamasında kategori paletinin bitişik çiftlerinde renk körlüğü ayrımının ve gelir/gider grafik renklerinde kontrastın düşük olduğu görüldü. Renkler tasarım belgesinden geldiği için değiştirilmedi; karşılığı: donut dilimleri arasında 2 px yüzey boşluğu, her dilimin listede adı ve tutarı, 6 ay grafiğinde sabit sıra (gelir solda) + lejant + ekran okuyucu metni.
- Gelecek ayda Kalan, gelir ve gider planlanan toplamlardan hesaplanır ve "Planlanan" rozeti taşır; grafikler ve son işlemler yerine "Planlanan sabit işlemler" listesi (kartlardaki açıklama metniyle) gösterilir.
- Bu ay kayıt yoksa kartlar ₺0,00, grafikler yerine "Ekim 2026 için kayıt yok." + "İşlem ekle"; içinde bulunulan ayda yaklaşanlar yine görünür.
- İlk açılış: hiç işlem ve sabit işlem yoksa; illüstrasyon özgün satır içi SVG.
- Yaklaşan satırında "25 Ekim · 7 gün sonra"; aynı gün için "· Bugün".
- Son işlemler satırı İşlemler'deki satır bileşeniyle (silme ve ⋯ menüsü dahil); alt yazı "Market · Bugün/Dün/16 Eki".
- Grafik animasyonları 400 ms; "hareketi azalt" tercihinde kapalı.
- Ay kaydırma (← →) art arda basışlarda kaybolmasın diye fonksiyonel state güncellemesiyle yapılır.
- Paket boyutu Recharts ile ~820 kB'a çıktı (gzip ~250 kB); uyarı şimdilik kabul edildi, Faz 10'da parçalara ayırma değerlendirilecek.

## Faz 8
- Kategoriler ekranında Gider/Gelir seçimi segment olarak (ekran içi filtre); toplam ve kart tutarları seçili ayın, kart tutarı işaretli ama nötr renkte (kart), kullanılmayanlarda "—".
- Kart altındaki ince çubuk o türün toplamındaki pay; en az %2 genişlik, renk türün grafik dolgusu.
- Silme onayı ve bildirim metinleri işlem ve sabit işlem sayısına göre kurulur: "14 işlem", "1 sabit işlem" ya da "14 işlem ve 1 sabit işlem". Hedef kategorinin adı sistem "Diğer"inin güncel adından alınır (yeniden adlandırılabildiği için).
- Kullanılmayan kategoride onay yalnızca başlık ve "Sil / Vazgeç"; taşıma olunca "Taşı ve sil".
- Kategori silinince açık düzenleme sayfası da kapanır; "Bu kategorinin işlemleri →" İşlemler'i tür ve kategori filtresiyle açar.
- Sistem kategorisinin düzenleme sayfasında "Kategoriyi sil" gösterilmez.

## Faz 9
- Sürüm numarası `package.json`'dan `__APP_VERSION__` olarak derlemeye gömülür (Faz 11'de 1.0.0'a çekilecek).
- "Son yedek": hiç yoksa "Henüz yedek almadın", aynı gün "Bugün" ✱, bir gün önce "Dün" ✱, diğerleri "N gün önce". Hiç yedek yoksa ya da 30 günü geçtiyse satır vurgu renginde ve uyarı ikonlu.
- İndirme: Blob + `download` bağlantısı; iOS'ta ana ekrandan açılan uygulamada `navigator.canShare({ files })` destekleniyorsa dosya doğrudan paylaşım sayfasıyla verilir. Paylaşım iptal edilirse yedek alınmış sayılmaz (`lastBackupAt` güncellenmez).
- CSV indirilince "CSV dosyası indirildi" ✱ bildirimi; `lastBackupAt` değişmez.
- Geçersiz, okunamayan ya da 10 MB'tan büyük dosyada "Bu dosya geçerli bir yedek değil.", daha yeni sürümde ayrı mesaj; ikisi de hata ikonlu bildirim (kart). Onay ekranı açılmaz.
- Geri yükleme onayı mobilde tam sayfa (alt sayfanın tam ekran hali), masaüstünde 480 px modal. "Önce yedeğimi indir" işaretliyken indirme iptal edilirse geri yükleme yapılmaz. Bu ön yedek de bir JSON yedeği olduğu için `lastBackupAt` güncellenir.
- Yedek tarihi gün adı olmadan "6 Ekim 2026" (`fullDate`).
- "Tüm verileri sil" ikinci adımında buton "SİL" Türkçe büyük-küçük harf kuralıyla eşleşince etkinleşir (alanda Enter de çalışır); sonrasında seçili ay bu aya döner ve Özet'in ilk açılış durumu gösterilir.
- "Ana ekrana ekle" yönergesi kurulu değilken: iOS'ta kart metni, diğer platformlarda "Tarayıcı menüsünden Uygulamayı yükle. …" ✱.

## Faz 10
- Uygulama ikonları ek bağımlılık olmadan `scripts/make-icons.mjs` ile üretilir (SDF şekiller, 4×4 süper örnekleme, Node zlib ile PNG): 192, 512, maskelenebilir 512 (içerik %78) ve 180 px apple-touch-icon; favicon elle yazılmış SVG. Tasarım: vurgu renginde zemin üstünde beyaz cüzdan.
- Android açılış ekranı rengi `#6B6862` (text-2 tonu): açık temada çok parlak, koyu temada çok karanlık olmayan nötr bir ara ton. `theme_color` manifestte `#F7F7F5`; çalışırken `<meta name="theme-color">` etkin temaya göre güncellenir.
- vite-plugin-pwa `generateSW`, `registerType: 'prompt'`, `injectRegister: null`; kayıt `virtual:pwa-register/react` ile uygulama kodundan. Uygulama kabuğu, yazı tipleri, ikonlar ve `theme-init.js` precache'te.
- "Yeni sürüm hazır · Yenile" ve "başka sekmede güncellendi" bildirimleri kendiliğinden kapanmaz (`persistent`); güncellemeyi kaçırmamak için 6 sn kuralının istisnası. Yeni bildirim yine yerlerini alır.
- Dexie `versionchange`: bağlantı kapatılır, "Uygulama başka bir sekmede güncellendi. Devam etmek için sayfayı yenile." ✱ + "Yenile".
- CSP, gereksinimlerdeki yönergelerle değiştirilmeden yalnızca build'e `<meta>` olarak (head'in başına) eklenir; hiçbir yönergenin gevşetilmesi gerekmedi. `vite preview`'da ekranlar, alt sayfalar, diyaloglar ve grafikler gezildi: CSP ihlali ve konsol hatası yok, tüm istekler aynı kaynağa.
- Sunucu kapatılıp sayfa yenilendiğinde uygulama önbellekten açıldı (uçak modu senaryosu); güncelleme bildirimi ve "Yenile" uçtan uca denendi.
- Paket parçalara ayrıldı (`codeSplitting` grupları: charts, react, data); 500 kB uyarısı kalktı.
- Dokunma alanları: görsel olarak küçük kontrollere (çip, anahtar, küçük segment, metin bağlantıları, "⋯", temizle) görünmez `hit-area` ile en az 44×44 px.
- %200 yazı boyutu (≈200 px genişlik) denendi: Özet'te üst kartlar tek sütuna iner, kahraman tutar satır kırabilir, donut kabına göre küçülür; hiçbir ekranda yatay kaydırma yok.
- Erişilebilir ad taraması: tüm ekranlarda ve işlem formunda adı olmayan etkileşimli öğe yok.

## Faz 11
- README Gereksinimler §12 başlıklarıyla yazıldı (komutlar, Pages, custom domain, kurulum, taşıma, origin uyarısı, veri kaybı riskleri).
- Sürüm 1.0.0.
- `index.html`'de public dosyalara kök yoluyla (`/theme-init.js`) başvurulur; Vite hem geliştirmede hem derlemede `base`'i kendisi ekler (`%BASE_URL%` geliştirme sunucusunda yolu ikiledi).
- Son tarama: beş ekran ve gelecek ay Özet'i, 390/768/1440 px × açık/koyu temada yatay taşma olmadan açıldı; konsolda hata yok.

## Sonradan: Tanıtım
- Proje sahibinin isteğiyle ilk girişe 5 adımlık tanıtım eklendi (Tasarım §6.7): hoş geldin, işlem ekleme (gelir/gider), açıklama-not ve tekrar, kategoriler, yedeğin önemi. Metinler `copy.tour`'da (✱).
- "Görüldü" bilgisi tema gibi cihaza özgü tercih: localStorage `tourSeen`; yedeğe girmez. Depolama kapalıysa tur her açılışta gösterilir.
- Tur yalnızca "Geç", Esc ya da "Başla" ile kapanır; arka plana dokunmak kapatmaz (yanlışlıkla atlanmasın).
- Ayarlar › Hakkında'ya "Tanıtımı yeniden göster" satırı eklendi.
- "Tüm verileri sil" turu yeniden göstermez (tercihler korunur).
- Tanıtıma ikinci adım olarak "Ana ekrana ekle" eklendi (iOS'ta veriler Safari ile ayrı tutulabildiği için erken gösteriliyor). Platform kullanıcı aracısından anlaşılır (iOS, iPadOS dahil; Android; diğerleri bilgisayar); uygulama zaten kuruluysa adım atlanır. Adımlar numaralı listeyle gösterilir; tur paneli kısa ekranlarda kaydırılabilir.

## Sonradan: Yeni ad
- Uygulamanın adı "Para Yönetimi" oldu; repo ve yayın yolu `para-yonetimi`. Yedek dosyaları `para-yonetimi-yedek-…json`, CSV `para-yonetimi-islemler-…csv` adını alır; yedekteki `app` alanı `para-yonetimi`.
- Eski adla (`"app": "gelir-gider"`) alınmış yedekler geri yüklenebilir; doğrulamadan önce yeni kimliğe çevrilir.
- IndexedDB adı (`gelir-gider`) ve localStorage anahtarları değişmedi: site aynı origin'de (`takgun0.github.io`) kaldığı için mevcut veriler yeni adreste de görünür.
