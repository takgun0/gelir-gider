# Gelir Gider

Aylık gelirini ve giderini kaydetmek için sade, Türkçe bir web uygulaması. Hesap açmadan kullanılır, internet olmadan da çalışır. Telefonuna uygulama olarak kurabilirsin.

**Uygulamayı aç:** <https://takgun0.github.io/gelir-gider/>

## Özellikler

- **Özet:**
  - Ayın kalanı ve ay sonu tahmini
  - Gelir ve gider toplamları
  - Bugün ve bu hafta yapılan harcama
  - Günlük harcama grafiği, kategori dağılımı ve son 6 ay grafiği
- **İşlemler:**
  - Tutar, kategori, tarih, açıklama ve not ile gelir ya da gider kaydı
  - Arama ve tür/kategori filtreleri
  - Kaydırarak silme ve "Geri al"
- **Sabit işlemler:** Kira, maaş, abonelik gibi her ay tekrar eden kayıtlar kendiliğinden eklenir. Durdurulabilir ve bitiş ayı verilebilir.
- **Kategoriler:** Ad, renk ve ikonla kendi kategorilerini oluşturabilirsin. Kategori bazında aylık toplamlar görünür.
- **Yedek:**
  - JSON yedeği alma ve yedekten geri yükleme
  - Excel'de açılan CSV dışa aktarma
- **Görünüm ve gizlilik:**
  - Açık ve koyu tema
  - Tutarları gizleme
  - İlk girişte kısa bir tanıtım
- **Çevrimdışı ve gizli:** Veriler yalnızca cihazındaki tarayıcıda tutulur. Uygulama hiçbir sunucuya veri göndermez; analitik ya da izleme yoktur.

## Telefona kurulum

- **iPhone / iPad (Safari):**
  1. Paylaş düğmesine dokun.
  2. **Ana Ekrana Ekle**'yi seç.
  3. **Ekle**'ye dokun.
- **Android (Chrome):**
  1. Menüyü (⋮) aç.
  2. **Uygulamayı yükle**'ye dokun.
  3. **Yükle** ile onayla.
- **Bilgisayar (Chrome, Edge):** Adres çubuğundaki yükle simgesine tıkla.

iPhone'da önce uygulamayı ana ekrana ekle, verilerini oradan gir. Safari ile ana ekrandaki uygulama verileri ayrı tutabilir.

Uygulama kurulduktan sonra internet olmadan da açılır. Yeni bir sürüm yayınlandığında "Yeni sürüm hazır · Yenile" bildirimi çıkar.

## Verilerin ve yedek

- Verilerin bu cihazda, bu tarayıcıda (IndexedDB) saklanır. Uygulama, ilk kaydında tarayıcıdan kalıcı depolama izni ister.
- Veriler şu durumlarda kaybolur:
  - tarayıcı ya da site verilerini silersen,
  - gizli pencere kullanırsan,
  - uygulamayı ana ekrandan kaldırırsan,
  - cihaz değiştirirsen.

  **Ayarlar › Yedek indir** ile düzenli yedek al. "Son yedek" satırı 30 günü geçince vurgulanır.
- **Başka cihaza taşımak için:**
  1. Eski cihazda yedeği indir.
  2. Dosyayı yeni cihaza aktar.
  3. Yeni cihazda **Ayarlar › Yedekten geri yükle**'yi seç.

  Geri yükleme o cihazdaki verilerin tamamını yedektekilerle değiştirir.
- Yedek dosyası şifresizdir ve finansal bilgilerini içerir; nerede sakladığına ve kiminle paylaştığına dikkat et.

### Aynı adres altındaki diğer siteler

- `kullanici.github.io` altındaki tüm GitHub Pages projeleri aynı tarayıcı depolamasını paylaşır.
- O hesaptaki başka bir sayfada bulunacak bir güvenlik açığı bu verilere erişebilir.

## Geliştirme

Gereksinim: Node.js 22.12 veya üstü. CI'da `.nvmrc` dosyasındaki 24 sürümü kullanılır.

```bash
npm install        # bağımlılıkları kurar
npm run dev        # geliştirme sunucusu: http://localhost:5173/gelir-gider/
npm test           # testler, iki saat diliminde (Europe/Istanbul, America/Los_Angeles)
npm run typecheck  # TypeScript denetimi
npm run lint       # ESLint
npm run build      # production derlemesi: dist/
npm run preview    # derlemeyi sunar: http://localhost:4173/gelir-gider/
```

**Teknolojiler:**
- Vite, React, TypeScript
- Tailwind CSS
- Dexie (IndexedDB)
- Recharts, lucide-react
- zod
- vite-plugin-pwa
- Vitest ve fake-indexeddb

### Proje yapısı

```
src/
  domain/   saf iş kuralları: para, tarih, sabit işlemler, istatistik, yedek, CSV
  db/       Dexie şeması ve transaction'lı veritabanı işlemleri
  ui/       bileşenler, ekranlar, ikon kataloğu, arayüz metinleri (copy.ts)
  app/      yönlendirme, tema, seçili ay, bildirimler, PWA, tanıtım
public/     ikonlar ve tema ön yüklemesi
scripts/    test çalıştırıcısı ve ikon üretici
docs/       gereksinimler, tasarım, kararlar ve tasarım kartları
```

Testler ilgili dosyanın yanında `*.test.ts` olarak durur.

### Belgeler

- [Gereksinimler](docs/gereksinimler.md): veri modeli, iş kuralları, güvenlik, test
- [Tasarım](docs/tasarim.md): görsel dil, ekranlar, metinler
- [Kararlar](docs/kararlar.md): geliştirme sırasında verilen uygulama kararları
- [Tasarım kartları](docs/tasarim-kartlari)

## Yayın (GitHub Pages)

1. Depoda *Settings › Pages › Build and deployment › Source* olarak **GitHub Actions**'ı seç.
2. `main` dalına yapılan her push'ta `.github/workflows/deploy.yml` önce typecheck, lint, test ve build çalıştırır, ardından `dist/` klasörünü yayınlar.
3. Yayın yolu [`vite.config.ts`](vite.config.ts) içinde tek yerden tanımlıdır (varsayılan `/gelir-gider/`). Depo adı değişirse bu değeri güncelle ya da derlerken ver:
   ```bash
   BASE_PATH=/yeni-ad/ npm run build
   ```

## Güvenlik

- Production derlemesi katı bir İçerik Güvenlik Politikası (CSP) ile gelir.
- Uygulama dış kaynak yüklemez: CDN, yazı tipi servisi ya da analitik yoktur. Inter yazı tipi pakete dahildir.
- Kullanıcı girdisi yalnızca metin olarak gösterilir.
- Yedek dosyaları geri yüklenmeden önce baştan sona doğrulanır.
