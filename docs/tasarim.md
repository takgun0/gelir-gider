# Para Yönetimi — Tasarım Belgesi

> Bölüm numaraları docs/gereksinimler.md'deki "Tasarım §x" atıflarıyla eşleşir. Görsel karşılıklar [`tasarim-kartlari/`](tasarim-kartlari) klasöründeki tasarım kartlarındadır.

## 2. Ürün özeti ve kısıtlar
Tek kişinin aylık gelir ve giderini kaydettiği, hesap gerektirmeyen, tamamen çevrimdışı çalışan bir web uygulaması. Birincil kullanım mobil tarayıcı ve ana ekrana eklenmiş PWA; masaüstü ikincil ama eksiksiz.

- **Dil:** Türkçe, "sen" diliyle. Samimi ama ölçülü; "Harika!" gibi aşırı coşku yok.
- **Para birimi:** Yalnızca TL (₺). Kur ve çoklu hesap yok.
- **Veri:** Yalnızca cihazda, tarayıcı depolamasında. Sunucu, giriş ve senkronizasyon yok.
- **Zaman birimi:** Takvim ayı. Her şey "seçili ay" üzerinden okunur.
- **Temel varlıklar:** İşlem (tür, tutar, kategori, tarih, açıklama) · Kategori (tür, ad, renk, ikon) · Sabit işlem (işlem şablonu, ayın günü, isteğe bağlı bitiş).

## 3. Tasarım ilkeleri
Ekranın yıldızı rakamlar; geri kalan her şey onlara yer açmak için var.

1. **Rakam önce.** Her ekranda en büyük ve en kontrastlı öğe bir tutar. Etiketler küçük ve ikincil tonda.
2. **Sakin renk.** Ekranın büyük kısmı nötr. Yeşil ve kırmızı yalnızca tutarlarda ve grafiklerde; vurgu rengi yalnızca etkileşimde (seçili sekme, birincil buton, odak halkası).
3. **Panik değil, bilgi.** Negatif bakiye görünür olmalı ama ekranı kırmızıya boyamamalı: tutar kırmızı, zemin nötr.
4. **Tek elle kullanım.** Mobilde birincil eylemler ekranın alt yarısında; + butonu başparmak erişiminde.
5. **Bol boşluk, az çizgi.** Gruplamayı boşluk ve zemin tonu yapar; ayırıcı çizgi ve gölge en az düzeyde.
6. **Yıkıcı eylem ya geri alınır ya onaylanır.** Tek işlem silme geri alınabilir; toplu etkisi olanlar (kategori silme, geri yükleme, tümünü silme) onay ister.

## 4. Görsel dil
Aşağıdaki değerler başlangıç önerisi; metin renklerinin kontrastı WCAG AA'ya göre kontrol edildi, ton ayarı tasarımcıya bırakılabilir.

### Renk token'ları
| Token | Açık tema | Koyu tema | Kullanım |
|---|---|---|---|
| bg | #F7F7F5 | #111214 | Sayfa zemini |
| surface | #FFFFFF | #1A1B1E | Kart, liste, alt sayfa |
| surface-2 | #F0EFEC | #232428 | Giriş alanı, segment zemini, seçili satır |
| border | #E6E4DF | #2C2D31 | Yalnızca gerektiğinde ince ayırıcı |
| text | #1C1B19 | #F2F1EE | Tutarlar, başlıklar |
| text-2 | #6B6862 | #A3A19B | Etiket, kategori adı, tarih |
| accent | #3D4ED8 | #8C98FF | Birincil buton, seçili sekme, odak, bağlantı |
| income | #237A4B | #6FD39A | Gelir tutarı (metin) |
| income-soft | #E5F3EA | #1B2E23 | Gelir rozeti ve seçili segment zemini |
| income-chart | #6CC08F | #4FAF7A | Grafik dolgusu |
| expense | #C2453A | #FF8A7A | Gider tutarı, negatif bakiye, hata |
| expense-soft | #FBEAE7 | #36201E | Gider rozeti, uyarı ve tehlikeli bölge zemini |
| expense-chart | #EE8577 | #E06E60 | Grafik dolgusu |

- Metin rengi ile grafik dolgusu ayrı token: küçük metinde koyu ton (kontrast için), grafikte yumuşak ton.
- Her tutar işaretle yazılır (+ / −); renk tek başına anlam taşımaz.
- Koyu tema düz siyah değil; yükseklik gölgeyle değil, zemin tonunun açılmasıyla anlatılır.

### Kategori paleti
14 renk, orta doygunlukta, her birinin açık ve koyu tema varyantı var. Aileler: gül, fuşya, mor, çivit, mavi, gök mavisi, camgöbeği, petrol, zeytin, hardal, amber, turuncu, kahve, arduvaz grisi.

- Saf yeşil ve saf kırmızı palette yok; yakın tonlar gelir/gider renklerinden ayırt edilecek kadar kaydırılmış (zümrüt yerine zeytin, kırmızı yerine gül).
- Kategori rengi yalnızca üç yerde: ikonun arkasındaki yumuşak daire (%15–20 opaklık, ikon tam renk), donut dilimi, liste renk noktası.
- Tutarlar asla kategori rengine boyanmaz; ya gelir/gider rengi ya nötr.

### Tipografi
- Font Türkçe karakterleri (ğ, ş, ı, İ) ve ₺ işaretini içermeli; Inter iyi bir aday. Çevrimdışı çalışma için uygulamayla birlikte paketlenir.
- Tüm tutarlarda tabular rakam (`font-variant-numeric: tabular-nums`): sütunlar hizalı durur, sayı değişirken genişlik oynamaz.
- Kahraman tutarda ₺ işareti ve kuruş kısmı (",00") bir kademe küçük ve text-2 renginde. Kartlarda ve listelerde tutar tek parça.

| Rol | Boyut / satır yüksekliği (px) | Ağırlık |
|---|---|---|
| Kahraman tutar | 40/44 mobil, 48/52 masaüstü | 600 |
| Kart tutarı, ekran başlığı | 22/28 | 600 |
| Liste tutarı | 16/22 | 600 |
| Bölüm başlığı | 15/20 | 600 |
| Gövde, açıklama | 15/22 | 400 |
| Etiket, kategori adı, tarih | 13/18 | 500 |
| Rozet, grafik ekseni | 12/16 | 500 |

### Sayı ve tarih biçimi
- Standart: ₺12.450,00 — binlik ayırıcı nokta, ondalık virgül, her zaman iki hane.
- İşaretli: +₺12.450,00 ve −₺1.250,00. İşaret ₺'den önce; eksi için kısa çizgi değil gerçek eksi işareti (−). Sıfır işaretsiz: ₺0,00.
- Kısa biçim (yalnızca grafik ekseni ve dar alanlar): ₺12,4 B · ₺1,2 Mn.
- Yüzde: işaret önde, tam sayı: %12. %1'in altı "<%1".
- Tarih: liste başlıklarında "Bugün", "Dün", sonra "16 Ekim Cuma"; farklı yılsa yıl eklenir. Ay seçicide "Ekim 2026", dar alanda "16 Eki".

### Şekil, boşluk ve ikon
- Boşluk ölçeği: 4, 8, 12, 16, 24, 32, 48 px. Mobil yan boşluk 16, masaüstü kart iç boşluğu 24.
- Köşe yarıçapı: kart 16, buton ve giriş alanı 12, alt sayfanın üst köşeleri 20, ikon zemini tam daire.
- Gölge yalnızca alt sayfa, modal ve + butonunda (tek, yumuşak). Kartlar gölgesiz, zemin farkıyla ayrılır.
- İkonlar tek set, çizgi stili, 1,5–2 px kalınlık (ör. Lucide). Kategori ikonu 20 px, 40 px'lik renkli daire içinde.
- "Tekrar eden" ikonu (repeat) ve not ikonu (sticky-note) yalnızca kendi anlamlarında kullanılır; kategori ikonu olarak seçilemez.

## 5. Yerleşim ve navigasyon
Tasarım 390 px genişlikte başlar, 320 px'te bozulmadan çalışır ve iki kırılım noktasında genişler.

| Genişlik | Navigasyon | İçerik |
|---|---|---|
| < 640 px | Alt çubuk, ortada + | Tek sütun, 16 px yan boşluk |
| 640–1023 px | Sol ikon şeridi (72 px), etiket ipucunda | Tek sütun, en fazla 640 px |
| ≥ 1024 px | Sol kenar çubuğu (200 px, ikon + etiket) | Özet iki sütunlu ızgara, en fazla 1120 px |

### Mobil alt çubuk
- Sıra: Özet · İşlemler · + · Kategoriler · Ayarlar. Etiketler hep görünür.
- + butonu 56 px daire, vurgu renginde, çubuktan hafifçe yukarı taşar; dokununca İşlem ekle sayfası açılır.
- Seçili sekme vurgu renginde ikon ve etiket; diğerleri text-2.
- Çubuk alttaki güvenli alanı (home indicator) hesaba katar. Klavye açıkken gizlenir.

### Masaüstü kenar çubuğu
- Üstte uygulama adı, altında birincil "+ İşlem ekle" butonu, sonra Özet, İşlemler, Kategoriler. Ayarlar en altta ayrı.
- Kısayollar (bir giriş alanında değilken): N yeni işlem, / arama, ← → önceki/sonraki ay.

### Ay seçimi
- Seçili ay uygulama genelinde tek: Özet'te değişen ay İşlemler ve Kategoriler'de de geçerli.
- Biçim: ‹ Ekim 2026 ›. Ortadaki etikete dokununca ay-yıl seçici açılır. Bu ay dışındayken yanında "Bu ay" kısa yolu belirir.
- Ay, içerikte yatay kaydırmayla değişmez; bu hareket satır silmeye ayrılmış.
- En fazla 12 ay ileri gidilebilir. Gelecek aylarda yalnızca planlanan sabit işlemler görünür, kartlar "Planlanan" etiketi taşır.

## 6. Ekranlar

### 6.1 Özet (ana ekran)
Kullanıcı açar açmaz "bu ay ne durumdayım" sorusunun cevabını görür: önce Kalan, sonra gelir ve gider, sonra ayrıntı.

1. **Başlık satırı:** ay seçici; sağda göz ikonu (tutarları gizle). Gizliyken tüm tutarlar "₺•••••" olur, tercih hatırlanır.
2. **Kalan (kahraman kart):** "Kalan · Ekim" etiketi, altında büyük tutar = seçili ayın geliri eksi gideri. Altında tek satır: "Ay sonu tahmini: ₺3.200,00" (bu ay henüz gerçekleşmemiş sabit işlemler dahil); yalnızca içinde bulunulan ayda görünür.
   - Negatifse tutar expense renginde ve eksi işaretli, yanında küçük "Eksi bakiye" rozeti (expense-soft). Kart zemini nötr kalır.
3. **Gelir ve gider kartları:** Kalan'ın altında yan yana iki eşit kart. Her birinde küçük yön oku (↑ gelir, ↓ gider), etiket, tutar. Dokununca İşlemler o türe filtreli açılır.
4. **Bugün · Bu hafta:** kartların altında tek satır, yalnızca içinde bulunulan ayda: "Bugün −₺340,00 · Bu hafta −₺1.250,00". Yalnızca gideri sayar; hafta Pazartesi başlar ve ay sınırını aşabilir.
5. **Günlük harcama:** seçili ayın her günü için bir gider çubuğu. Gelir ayda bir iki kez geldiği için bu grafiğe girmez.
   - X ekseni ayın günleri (1, 5, 10, 15, 20, 25, 30 etiketli); pazartesiler eksende hafif çizgiyle işaretli, böylece haftalar gözle ayrılır. Y ekseni kısa biçimde.
   - Bugünün çubuğu tam renk, diğerleri %60 opaklıkta; bugünden sonraki günler boş. Harcama olmayan günde çubuk çizilmez.
   - Kesikli ince yatay çizgi günlük ortalamayı gösterir, ucunda "Ort. ₺412" etiketi. Bu ayda bugüne kadarki günlere, geçmiş aylarda tüm günlere göre hesaplanır.
   - Çubuğa dokununca üstünde baloncuk: "16 Ekim Cuma · −₺340,00 · 3 işlem". Baloncuğa dokununca İşlemler o günün grubuna kaydırılmış açılır.
   - Mobilde çubuklar 6–8 px genişlikte; dokunma alanı çubuktan geniş, günün tüm sütunu.
6. **Kategori dağılımı:** başlıkta Gider / Gelir anahtarı (varsayılan Gider). Donut ortasında toplamı gösterir; yanında (mobilde altında) liste: renk noktası, ad, tutar, yüzde, tutara göre azalan.
   - En büyük 6 kategori ayrı; kalanlar "Diğerleri (4)" diliminde toplanır, listede "Tümünü göster" ile açılır.
   - Dilime ya da satıra dokununca İşlemler o kategori ve ayla filtreli açılır.
7. **Son 6 ay:** seçili ay dahil geriye 6 ay; her ayda gelir ve gider çubuğu yan yana. Seçili ay tam renk, diğerleri %50 opaklıkta. Y ekseni kısa biçimde (₺12 B). Bir aya dokununca o aya geçilir. Verisi olmayan ayda çubuk çizilmez.
8. **Yaklaşan sabit işlemler:** bu ay bugünden sonra gerçekleşecek sabit gelir ve giderler, tarih sırasıyla, en fazla 5 satır. Satır: ikon, ad, "25 Ekim · 7 gün sonra", işaretli tutar. Başlıkta "Tümü" → İşlemler › Sabit. Hiç yoksa tek satır: "Bu ay başka sabit işlem yok." Yalnızca içinde bulunulan ayda görünür.
9. **Son işlemler:** seçili ayın tarihe göre en yeni 5 işlemi, İşlemler'deki satır bileşeniyle. Altında "Tümünü gör".

**Masaüstü:** üst satırda Kalan (2 birim genişlik), gelir ve gider (1'er birim) yan yana. Altında tam genişlikte günlük harcama grafiği. Sonra iki sütun: solda kategori dağılımı, sağda 6 ay grafiği. En altta iki sütun: yaklaşanlar ve son işlemler.

### 6.2 İşlemler
Ekranın üstünde iki sekme var: **Kayıtlar** (gerçekleşmiş işlemler) ve **Sabit** (tekrar eden işlem tanımları, bkz. 6.5). Sabit işlemler burada, çünkü kullanıcı onları işlemlerin olduğu yerde arar.

#### Kontroller (Kayıtlar)
- Satır 1: ay seçici, sağda arama ikonu. Aramaya dokununca alan bu satırın yerine açılır.
- Satır 2: yatay kaydırılabilir çipler: Tümü / Gelir / Gider (tekli seçim), sonra "Kategori" çipi (çoklu seçimli alt sayfa açar). Etkin filtrede çip dolgulu olur, sonda "Temizle" belirir.
- Filtre ya da arama etkinken listenin üstünde özet: "12 işlem · −₺2.340,00".
- Arama açıklama, not ve kategori adında yapılır, tüm aylarda arar; ay seçici gizlenir, sonuçlar ay başlıklarıyla gruplanır.

#### Liste
- Günlere göre gruplu, yeniden eskiye. Grup başlığı: solda "Bugün" / "Dün" / "16 Ekim Cuma", sağda o günün neti (işaretli, text-2, tabular).
- Bu ay henüz gerçekleşmemiş sabit işlemler en üstte "Planlanan" grubunda, %55 opaklıkta; toplamlara girmez.
- Satır (64 px): solda 40 px renkli daire içinde kategori ikonu; ortada açıklama (yoksa kategori adı), altında kategori adı (text-2); sağda işaretli tutar.
- Açıklamanın yanında 14 px durum ikonları (text-2): notu olan kayıtta not ikonu, sabit işlemden gelen kayıtta tekrar ikonu. Masaüstünde not ikonunun üzerine gelince notun ilk iki satırı ipucunda görünür.
- Uzun açıklama tek satırda üç noktayla kesilir; tutar asla kesilmez.
- Liste çok kırmızı ve yorucu görünürse alternatif: gider tutarları nötr renkte (yalnızca eksi işaretiyle), gelir yeşil. İki varyant birlikte çizilip karşılaştırılmalı.

#### Etkileşimler
- Dokun → düzenleme sayfası.
- Mobilde sola kaydır → kırmızı "Sil" alanı açılır; sonuna kadar kaydırmak doğrudan siler. Ardından "İşlem silindi · Geri al" bildirimi.
- Masaüstünde satırın üzerine gelince sağda "⋯" menüsü (Düzenle, Sil). Klavyeyle odaklanılan satırda Enter düzenler, Delete siler.

### 6.3 İşlem ekle / düzenle
Hedef: sık yapılan bir gideri, tutarı yazmak dışında üç dokunuşla kaydetmek (+ → kategori → Kaydet).

#### Kap
- Mobil: alttan açılan, ekranın neredeyse tamamını kaplayan sayfa; üstte tutamaç, aşağı çekince kapanır. Başlık "Yeni işlem" / "İşlemi düzenle", solda "Vazgeç".
- Masaüstü: 480 px genişlikte modal. Esc kapatır, Enter kaydeder.
- Kaydedilmemiş değişiklik varken kapatılırsa: "Değişiklikler kaydedilmedi. Çıkılsın mı?" (Çık / Düzenlemeye dön).

#### Alanlar (yukarıdan aşağı)
1. **Tür:** Gider / Gelir segmenti, yeni işlemde varsayılan Gider. Seçili parça tür rengini alır (soft zemin, koyu metin). Tür değişince kategori seçimi sıfırlanır, ızgara o türün kategorileriyle değişir.
2. **Tutar:** ortada büyük (40 px) tutar, solunda ₺. Sayfa açılınca odaklanır ve sayısal klavye açılır (`inputmode="decimal"`).
   - Hem virgül hem nokta ondalık ayırıcı kabul edilir; yazarken binlik ayırıcı otomatik eklenir (12450 → 12.450).
   - En fazla 2 ondalık hane, üst sınır ₺999.999.999,99. Eksi girilemez; yön tür seçicisinden gelir.
   - iOS sayısal klavyesinde "Bitti" tuşu yok: sayfa kaydırılınca ya da boş alana dokununca klavye kapanır.
3. **Kategori:** 4 sütunlu ızgara; kutucukta renkli daire içinde ikon, altında ad (en fazla 2 satır). Seçili kutucuk vurgu halkası alır. Yeni işlemde ön seçim yok. Son kutucuk "+ Yeni": kategori eklemeyi açar, dönüşte yeni kategori seçili gelir.
4. **Tarih:** çipler: "Bugün" (varsayılan) · "Dün" · "Tarih seç" (takvim, hafta Pazartesi başlar). Seçilen tarih çipte "16 Eki" olarak yazar.
5. **Açıklama:** tek satır, isteğe bağlı, en fazla 80 karakter. Listede satırın başlığı olarak görünür (ör. "Migros"). Yer tutucu: "Açıklama (isteğe bağlı)".
6. **Not:** açıklamanın altında "+ Not ekle" metin butonu; dokununca çok satırlı alan açılır. İsteğe bağlı, gelir ve giderin hepsinde var.
   - Alan 3 satırla başlar, yazdıkça büyür, en fazla 500 karakter. 400 karakterden sonra sayaç görünür: "450/500".
   - Açıklama kısa başlık, not ayrıntıdır: "Migros" / "Misafir için haftalık alışveriş, yarısını ev arkadaşım ödeyecek."
   - Düzenlemede not varsa alan açık gelir. Sabit işlemde yazılan not, oluşan her kayda kopyalanır.
7. **Her ay tekrarla:** anahtar ve altında "Bu işlem her ay otomatik eklensin". Açılınca yumuşak geçişle iki alan belirir:
   - "Ayın kaçında": 1–31, varsayılan seçilen tarihin günü. 29–31 seçilince not: "Kısa aylarda ayın son günü eklenir."
   - "Bitiş": varsayılan "Bitiş yok"; dokununca ay-yıl seçici.
   - Altta özet: "İlk tekrar: 16 Kasım · Son: Mayıs 2027".
8. **Kaydet:** altta sabit, tam genişlik, 52 px, vurgu renginde. Klavye açıkken klavyenin hemen üstünde, kapalıyken güvenli alanın üstünde durur.

#### Düzenleme modunda farklar
- Formun en altında (kaydırılan alanda) expense renginde "Bu işlemi sil" metin butonu.
- Sabit işlemden gelen kayıtta tekrar anahtarı yerine bilgi satırı: "Bu kayıt bir sabit işlemden geldi · Sabit işlemi düzenle →". Buradaki değişiklik yalnızca bu kaydı etkiler.

### 6.4 Kategoriler
Kategoriler ekranı hem düzenleme yeri hem de "paramı nereye harcadım" sorusunun kategori bazlı cevabı.

- Üstte Gider / Gelir sekmeleri, altında ay seçici; kartlardaki toplamlar seçili aya göre.
- Kartlar 2 sütunlu ızgarada (masaüstünde 4): renkli dairede ikon, ad, bu ayki toplam, altında ince çubuk = o türün toplamındaki payı. Toplama göre azalan; o ay kullanılmayanlar sonda, tutar yerine "—".
- Karta dokununca düzenleme açılır. Düzenleme sayfasının altında "Bu kategorinin işlemleri →" bağlantısı.
- Izgaranın sonunda kesikli kenarlı "+ Kategori ekle" kartı.

#### Ekle / düzenle (mobilde alt sayfa, masaüstünde modal)
- Üstte canlı önizleme: seçilen ikon ve renkle büyük daire, altında ad.
- Ad: zorunlu, en fazla 24 karakter, aynı türde tekrar edemez.
- Renk: 14 renklik palet, 7×2 ızgara, seçili renk halkayla.
- İkon: konuya göre gruplu (Alışveriş, Ev, Ulaşım, Yemek, Sağlık, Eğlence, Finans, Eğitim, Diğer) yaklaşık 48 ikon. Üstte arama alanı; ikonlar Türkçe anahtar kelimeyle bulunur (kahve, benzin, spor). Yeni kategoride varsayılan ikon etiket, varsayılan renk paletin henüz kullanılmayan ilk rengi.
- Tür yalnızca oluştururken seçilir, sonra değişmez.
- Düzenlemede en altta "Kategoriyi sil".

#### Silme
- "Diğer" kategorileri silinemez; adı, rengi ve ikonu değiştirilebilir.
- Kullanılmayan kategori: "'Eğlence' silinsin mi?" (Sil / Vazgeç).
- İşlemi ya da sabit işlemi olan kategori: "'Eğlence' kategorisinde 14 işlem ve 1 sabit işlem var. Bunlar 'Diğer' kategorisine taşınacak." Butonlar: "Taşı ve sil" (expense) / "Vazgeç".

### 6.5 Sabit işlemler (İşlemler › Sabit)
Kullanıcı her ay tekrar eden gelir ve giderlerini tek listede görür, durdurur ve düzenler.

- Üstte özet satırı, yalnızca aktiflerden: "Aylık sabit gelir +₺18.000,00 · Aylık sabit gider −₺9.450,00".
- İki grup: Aktif (sonraki tarihe göre sıralı) ve Durdurulan ve bitenler (soluk).
- Satır: solda kategori ikonu; ortada ad (açıklama, yoksa kategori adı) ve altında "Ayın 1. günü · Sonraki: 1 Kasım"; sağda işaretli tutar ve aktif/pasif anahtarı.
- Pasif satırda "Sonraki" yerine "Durduruldu"; bitiş tarihi geçmişse "Bitti · Mayıs 2027" ve anahtar yok.
- Dokununca 6.3'teki formun sabit işlem hali açılır (başlık "Sabit işlemi düzenle"; tarih yerine "Ayın kaçında" ve "Bitiş"). Altta not: "Değişiklikler sonraki kayıtlardan itibaren geçerli. Geçmiş kayıtlar değişmez."
- Silme onayı: "Bundan sonra kayıt oluşturulmayacak. Daha önce eklenen 6 kayıt korunur." Ardından geri alınabilir bildirim.
- Sağ üstte "+ Ekle": formu "Her ay tekrarla" açık şekilde açar.

### 6.6 Ayarlar
Gruplu liste; her grup başlıklı bir kart. Sıra: Görünüm, Verilerin, Tehlikeli bölge, Hakkında.

#### Görünüm
- Tema: Açık / Koyu / Sistem üçlü segmenti, varsayılan Sistem. Değişim anında uygulanır.

#### Verilerin
- Bilgi notu (ikonlu, nötr zemin): "Verilerin yalnızca bu cihazda, bu tarayıcıda saklanır. Tarayıcı verilerini silersen ya da cihaz değiştirirsen kaybolur. Düzenli yedek al."
- "Son yedek: 12 gün önce" satırı. Hiç yoksa "Henüz yedek almadın"; 30 günü geçtiyse satır vurgu renginde ve ikonlu.
- Yedek indir (JSON): dosya adı para-yonetimi-yedek-2026-10-18.json.
- CSV olarak dışa aktar: Excel'de açılabilen işlem listesi; geri yüklenemez, yalnızca okumak için.
- Yedekten geri yükle: dosya seçici, ardından onay ekranı.

#### Geri yükleme onayı (mobilde tam sayfa, masaüstünde modal)
- Dosya önizlemesi: yedek tarihi, işlem sayısı, kategori sayısı, sabit işlem sayısı, kapsadığı aralık ("Mart 2025 – Ekim 2026").
- Karşılaştırma satırı: "Şu an 412 işlem → Yedekte 380 işlem".
- Uyarı kutusu (expense-soft): "Mevcut verilerin silinip yedektekilerle değiştirilecek. Bu işlem geri alınamaz."
- Varsayılan işaretli onay kutusu: "Geri yüklemeden önce mevcut verilerimin yedeğini indir".
- Butonlar: "Geri yükle" (expense) / "Vazgeç".
- Dosya geçersizse onay ekranına geçilmez, hata bildirimi çıkar (bkz. 8).

#### Tehlikeli bölge (en altta, expense-soft çerçeveli)
- "Tüm verileri sil" → 1. adım: "Tüm işlemler, kategoriler ve sabit işlemler silinecek. Varsayılan kategoriler geri gelecek." (Devam / Vazgeç).
- 2. adım: "Onaylamak için SİL yaz" alanı; buton yalnızca doğru yazılınca etkinleşir. Sonra Özet'in ilk açılış durumuna dönülür.

#### Hakkında
- Sürüm numarası. Uygulama ana ekrana eklenmemişse "Ana ekrana ekle" yönergesi (iOS'ta Paylaş › Ana Ekrana Ekle).

### 6.7 Tanıtım (ilk giriş)
Sonradan eklendi (proje sahibinin isteği). Siteye ilk kez girene birkaç adımda uygulamayı tanıtır.

- İlk açılışta Özet'in üstünde açılır; mobilde alttan sayfa, 640 px ve üstünde ortada kart.
- Adımlar:
  1. Hoş geldin: hesap gerekmez, internetsiz çalışır.
  2. Ana ekrana ekle: platforma göre numaralı adımlar (iOS: Paylaş › Ana Ekrana Ekle › Ekle; Android: menü › Uygulamayı yükle › Yükle; bilgisayar: adres çubuğundaki yükle simgesi). iOS'ta "önce ana ekrana ekle, verilerini oradan gir" notu. Uygulama zaten kuruluysa bu adım gösterilmez.
  3. İşlem ekleme: + → tutar → kategori → Kaydet; gelir mi gider mi üstteki seçiciden.
  4. Açıklama ve not; "Her ay tekrarla".
  5. Kendi kategorilerin; silinen kategorinin işlemleri "Diğer"e taşınır.
  6. Yedek almanın önemi (uyarı tonunda).
- Üstte adım sayacı ("2 / 6") ve "Geç"; altta adım noktaları, "Geri" ve "İleri" (son adımda "Başla").
- ← → ile adımlar arasında gezilir, Esc ve "Geç" kapatır. Kapandıktan sonra bir daha kendiliğinden açılmaz.
- Ayarlar › Hakkında'da "Tanıtımı yeniden göster" satırıyla yeniden açılır.

## 7. Sabit işlem kuralları
Bu kurallar arayüzde görünen her sabit işlem davranışını belirler; tasarımcı ve geliştirici aynı tabloya bakmalı.

| Durum | Kural | Arayüzde |
|---|---|---|
| Kayıt oluşturma | Günü geldiğinde, uygulama o gün ya da sonra ilk açıldığında kayıt otomatik oluşur | Listede tekrar ikonuyla |
| Kaçırılan aylar | Uygulama aylarca açılmadıysa kaçırılan her ay için kayıt geriye dönük oluşur | Tek bildirim: "3 sabit işlem eklendi" |
| İlk örnek | Kaydedilen işlem ilk örnektir; tekrarlar bir sonraki aydan başlar | Formda "İlk tekrar: 16 Kasım" |
| Ayın 29–31'i | O gün olmayan ayda ayın son günü kullanılır | Formda tek satır not |
| Bitiş | Bitiş ayından sonra kayıt oluşmaz | "Bitti · Mayıs 2027", soluk |
| Pasife alma | Pasifken kayıt oluşmaz; yeniden aktifleşince arada kalan aylar oluşturulmaz | "Durduruldu", soluk |
| Sabit işlemi düzenleme | Yalnızca sonraki kayıtları etkiler | Formda not |
| Oluşmuş kaydı düzenleme ya da silme | Yalnızca o kaydı etkiler; sabit işlem sürer | Düzenlemede "Sabit işlemi düzenle →" |
| Bu ay henüz gelmemiş örnek | Toplamlara girmez; Ay sonu tahminine girer | Özet'te "Yaklaşan", İşlemler'de soluk "Planlanan" |
| Gelecek aylar | Kayıt oluşmaz, yalnızca planlanan olarak gösterilir | Kartlarda "Planlanan" etiketi |

## 8. Durumlar, geri bildirim ve doğrulama

### Boş durumlar
"Hiç veri yok" ile "bu ay veri yok" farklı durumlar ve farklı mesaj alır.

| Durum | Ekran | Mesaj | Eylem |
|---|---|---|---|
| İlk açılış, hiç işlem yok | Özet | Sade çizgi illüstrasyon + "Hoş geldin! Gelir ve giderlerini ekledikçe ayın özeti burada oluşacak." Kartlar ve grafikler gizli | İlk işlemini ekle |
| Hiç işlem yok | İşlemler | "Henüz işlem yok." | İlk işlemini ekle |
| Bu ay kayıt yok, başka aylarda var | Özet, İşlemler | "Ekim 2026 için kayıt yok." Kartlar ₺0,00 | İşlem ekle |
| Arama ya da filtre sonuçsuz | İşlemler | "Bu aramayla eşleşen işlem yok." | Filtreleri temizle |
| Sabit işlem yok | İşlemler › Sabit | "Kira, maaş, abonelik gibi her ay tekrar edenleri buraya ekle." | Sabit işlem ekle |

### Bildirimler
- Mobilde alt çubuğun hemen üstünde, masaüstünde sağ altta. Aynı anda tek bildirim; yenisi eskisinin yerini alır.
- Süre 3 sn; "Geri al" içerenler 6 sn. Ekran okuyuculara duyurulur.
- Metinler: "İşlem kaydedildi" · "Değişiklikler kaydedildi" · "İşlem silindi · Geri al" · "Sabit işlem silindi · Geri al" · "Kategori silindi, 14 işlem Diğer kategorisine taşındı" · "Yedek indirildi" · "Veriler geri yüklendi" · "3 sabit işlem eklendi" · "Yeni sürüm hazır · Yenile".
- Geri al yalnızca işlem ve sabit işlem silmede. Kategori silme, geri yükleme ve tümünü silme önceden onaylanır, sonradan geri alınmaz.

### Doğrulama
- Kaydet butonu hep etkin. Basılınca hatalı alanlar işaretlenir ve ilk hatalı alana odaklanılır. Pasif buton nedenini söylemediği için kullanılmaz.
- Hata gösterimi: alan çerçevesi expense rengine döner, altında 13 px expense renginde mesaj. Tutar alanı hafifçe yatay sallanır (hareketi azalt tercihinde sallanmaz). Hata düzelince mesaj anında kalkar.

| Hata | Mesaj |
|---|---|
| Tutar boş | Tutar gir. |
| Tutar sıfır | Tutar sıfırdan büyük olmalı. |
| Tutar üst sınırı aşıyor | Tutar en fazla ₺999.999.999,99 olabilir. |
| Kategori seçilmemiş | Bir kategori seç. |
| Bitiş ilk tekrardan önce | Bitiş, ilk tekrardan sonra olmalı. |
| Kategori adı boş | Kategori adı gir. |
| Kategori adı tekrar ediyor | Bu adda bir kategori zaten var. |
| Yedek dosyası okunamıyor | Bu dosya geçerli bir yedek değil. |
| Yedek daha yeni sürümden | Bu yedek uygulamanın daha yeni bir sürümüyle alınmış. Önce uygulamayı güncelle. |

Harf ya da ikinci virgül gibi geçersiz karakterler tutar alanına hiç yazılamaz; bunlar için mesaj gerekmez.

## 9. PWA, erişilebilirlik ve Türkçe'ye özgü detaylar

### PWA
- Tamamen çevrimdışı çalışır; hiçbir ekran ağ gerektirmez, bu yüzden "çevrimdışısın" uyarısı da yok.
- Ana ekrandan tarayıcı çubuğu olmadan açılır. Çentik ve home indicator için güvenli alan boşlukları tüm sabit öğelerde uygulanır.
- Uygulama ikonu (maskeli varyant dahil), açılış ekranı ve durum çubuğu rengi her iki tema için tanımlı.
- İlk kullanımda tarayıcıdan kalıcı depolama istenir; böylece tarayıcı yer açarken verileri kendiliğinden silmez.
- Klavye açıldığında sabit Kaydet butonu klavyenin üstüne taşınır.

### Erişilebilirlik
- Metin kontrastı en az 4,5:1, büyük tutarlarda en az 3:1; bölüm 4'teki token'lar buna göre seçildi.
- Dokunma alanları en az 44×44 px.
- Kaydırarak silmenin hareketsiz karşılığı var: düzenleme sayfasındaki Sil, masaüstünde satır menüsü.
- Donut'un yanındaki liste grafiğin metin karşılığıdır. Çubuk grafikler ekran okuyucuya gün gün ve ay ay okunur: "Ekim: gelir ₺18.000, gider ₺14.200".
- Yazı boyutu %200'e büyütüldüğünde tutarlar kesilmez, satır alta kayar.
- "Hareketi azalt" tercihinde geçiş ve sallanma animasyonları kapalı.
- Masaüstünde tüm akışlar yalnızca klavyeyle tamamlanabilir; odak halkası 2 px, vurgu renginde.

### Türkçe'ye özgü
- Para ve sayılar tr-TR yerel ayarıyla biçimlenir (₺12.450,00; kısa biçim ₺12,4 B).
- Arama ve "SİL" onayı Türkçe büyük-küçük harf kurallarıyla karşılaştırılır: "ılık" araması "ILIK"ı, "sil" yazımı "SİL"i karşılar.
- Kategori adları Türkçe alfabeye göre sıralanır (Ç, Ğ, İ, Ö, Ş, Ü doğru yerde).
- Kullanıcının yazdığı adlar ve değişken tarihler ek almaz; cümleler eke ihtiyaç bırakmayacak şekilde kurulur: "'Market' silinsin mi?", "Ekim 2026 için kayıt yok", "Ayın 1. günü".
- Ay ve gün adları Türkçe; takvimde hafta Pazartesi başlar.

## 10. Varsayılan kategoriler
İlk açılışta bu 14 kategori hazır gelir; ikon adları Lucide setinden örnek. İki "Diğer" kategorisi silinemez.

| Tür | Kategori | İkon | Renk ailesi |
|---|---|---|---|
| Gider | Market | shopping-cart | turuncu |
| Gider | Kira | house | kahve |
| Gider | Faturalar | receipt | amber |
| Gider | Ulaşım | bus | mavi |
| Gider | Yemek | utensils | gül |
| Gider | Eğlence | ticket | fuşya |
| Gider | Sağlık | heart-pulse | camgöbeği |
| Gider | Abonelikler | monitor-play | mor |
| Gider | Eğitim | book-open | gök mavisi |
| Gider | Diğer | ellipsis | arduvaz grisi |
| Gelir | Maaş | banknote | petrol |
| Gelir | Burs | graduation-cap | zeytin |
| Gelir | Ek gelir | coins | hardal |
| Gelir | Diğer | ellipsis | arduvaz grisi |

## 11. Kapsam dışı
Bu sürümde tasarlanmayacaklar; tasarım aracı bunları kendiliğinden eklememeli:

- Bütçe limitleri ve birikim hedefleri
- Birden fazla hesap ya da cüzdan, hesaplar arası transfer
- Döviz ve çoklu para birimi
- Hesap, giriş, bulut senkronizasyonu
- Fiş fotoğrafı, banka entegrasyonu
- Haftalık ya da yıllık tekrar (yalnızca aylık var)
- Push bildirimleri
- Uygulama kilidi (PIN, biyometrik): sonraki sürüm adayı

## 12. Teslim edilecekler
Her ekran açık ve koyu temada, mobil (390×844) ve masaüstü (1440×900) boyutunda çizilir. Ara genişlik (768) için yalnızca Özet ve İşlemler yeterli.

| Ekran | Çizilecek durumlar |
|---|---|
| Özet | Dolu · günlük grafikte gün seçili · eksi bakiye · bu ay boş · ilk açılış · tutarlar gizli · gelecek ay (planlanan) |
| İşlemler › Kayıtlar | Dolu (Planlanan grubu dahil) · filtre etkin · arama sonuçlu · sonuçsuz · kaydırarak silme · silindi bildirimi |
| İşlemler › Sabit | Dolu (aktif, durdurulan, biten) · boş |
| İşlem ekle / düzenle | Yeni gider (klavye açık) · not açık · tekrar açık · hatalı (boş ve sıfır tutar) · sabitten gelen kaydı düzenleme · kaydedilmemiş değişiklik uyarısı |
| Kategoriler | Gider sekmesi · ekle/düzenle · silme onayı (işlem varken) |
| Ayarlar | Ana görünüm · geri yükleme onayı · geçersiz dosya · tümünü sil (2 adım) |
| Bileşenler | Buton, giriş alanı, çip, segment, anahtar, liste satırı, kart, bildirim, diyalog, alt sayfa — tüm halleriyle (normal, basılı, odak, pasif, hata) |
