# Gelir Gider

Tek kişinin aylık gelir ve giderini kaydettiği, hesap gerektirmeyen ve tamamen çevrimdışı çalışan bir web uygulaması. Veriler yalnızca cihazındaki tarayıcıda (IndexedDB) tutulur. Uygulama hiçbir sunucuya veri göndermez.

Yayındaki adres: <https://takgun0.github.io/gelir-gider/>

Belgeler:
- [SPEC.md](SPEC.md): veri modeli, kurallar, mimari, güvenlik
- [DESIGN.md](DESIGN.md): görsel dil, ekranlar, metinler
- [DECISIONS.md](DECISIONS.md): geliştirme sırasında verilen küçük kararlar
- [`project/`](project): tasarım kartları

## Gereksinimler ve komutlar

Node.js 22.12 veya üstü gerekir (CI'da `.nvmrc` dosyasındaki sürüm, yani 24 kullanılır).

```bash
npm install        # bağımlılıkları kurar
npm run dev        # geliştirme sunucusu: http://localhost:5173/gelir-gider/
npm test           # testleri iki saat diliminde çalıştırır (Europe/Istanbul, America/Los_Angeles)
npm run build      # production derlemesi: dist/
npm run preview    # derlemeyi sunar: http://localhost:4173/gelir-gider/
```

Ek komutlar: `npm run typecheck`, `npm run lint`. İkonları yeniden üretmek için `node scripts/make-icons.mjs` çalıştırılır.

## GitHub Pages

1. **Kaynağı ayarla:** Depoda *Settings › Pages › Build and deployment › Source* için **GitHub Actions** seç. `.github/workflows/deploy.yml`, `main` dalına yapılan her push'ta önce typecheck, lint, test ve build çalıştırır, ardından `dist/` klasörünü Pages'e yayınlar.
2. **`base` yolunu ayarla:** Yayın yolu yalnızca [`vite.config.ts`](vite.config.ts) dosyasında tanımlıdır. Varsayılan `/gelir-gider/`, yani depo adıdır. Depo adını değiştirirsen bu değeri de değiştir ya da derlerken ortam değişkeniyle ver:
   ```bash
   BASE_PATH=/yeni-ad/ npm run build
   ```
   PWA manifest'indeki `start_url` ve `scope` da bu değerden üretilir.
3. **Custom domain bağla:**
   - *Settings › Pages › Custom domain* alanına alan adını yaz (ör. `gelir.ornek.com`).
   - DNS'te bu ad için `takgun0.github.io` hedefli bir CNAME kaydı aç.
   - `base` değerini `/` yap: ya `vite.config.ts` içindeki varsayılanı değiştir ya da iş akışındaki build adımına `BASE_PATH: /` ortam değişkenini ekle.
   - Yeniden yayınla ve *Enforce HTTPS* seçeneğini aç.

## Telefona kurulum

- **Android / Chrome:** Siteyi aç, menüden **Uygulamayı yükle**'ye dokun.
- **iOS / Safari:** Siteyi aç, **Paylaş › Ana Ekrana Ekle**'ye dokun.
- **Önemli:** iOS'ta ana ekrana eklenen uygulama, Safari'deki siteyle aynı depolamayı paylaşmayabilir. Bu yüzden önce uygulamayı kur, verileri kurduğun uygulamaya gir.

Uygulama kurulduktan sonra ağ olmadan da açılır. Yeni bir sürüm yayınlandığında "Yeni sürüm hazır · Yenile" bildirimi çıkar.

## Cihazlar arası taşıma

1. Eski cihazda **Ayarlar › Yedek indir** ile `gelir-gider-yedek-YYYY-MM-DD.json` dosyasını al.
2. Dosyayı yeni cihaza aktar (e-posta, bulut sürücü, kablo vb.).
3. Yeni cihazda **Ayarlar › Yedekten geri yükle** ile dosyayı seç ve onayla.

- Geri yükleme, o cihazdaki mevcut verilerin **tamamını** yedektekilerle değiştirir; birleştirme yapılmaz. Onay ekranındaki kutu işaretliyse önce mevcut verilerin yedeği indirilir.
- Yedek dosyası **şifresiz** finansal veri içerir. Paylaştığın ve sakladığın yere dikkat et.
- **CSV olarak dışa aktar** yalnızca okumak içindir (Excel'in Türkçe ayarlarında doğrudan açılır); geri yüklenemez.

## Origin uyarısı

- `kullanici.github.io` altındaki tüm GitHub Pages projeleri aynı origin'i, dolayısıyla aynı IndexedDB'yi paylaşır.
- O hesaptaki herhangi bir sayfada bulunacak tek bir XSS açığı bu veriyi okuyabilir.
- Tam izolasyon için uygulamayı projeye özel bir alt alan adında yayınla (bkz. "Custom domain bağla").

## Veri kaybı riskleri

- **Kalıcı depolama:** Tarayıcılar yer açmak için site verilerini kendiliğinden silebilir. Uygulama ilk işlem kaydedildiğinde tarayıcıdan kalıcı depolama ister (`navigator.storage.persist()`). Tarayıcı bu isteği reddedebilir ya da hiç sormayabilir; izin verilse bile veriler aşağıdaki durumlarda kaybolur.
- **Veriler şu durumlarda kaybolur:**
  - tarayıcı verilerini ya da site verilerini silersen,
  - gizli pencere kullanırsan,
  - uygulamayı ana ekrandan kaldırırsan (iOS),
  - cihaz değiştirirsen ya da cihaz bozulursa.
- **Düzenli yedek al.** Veriler sunucuda tutulmadığı için tek güvence yedek dosyasıdır. Ayarlar'daki "Son yedek" satırı 30 günü geçince vurgulanır.

## Geliştirme notları

- Klasör yapısı:
  - `src/domain`: saf TypeScript
  - `src/db`: Dexie şeması ve transaction'lı işlemler
  - `src/ui`: bileşenler ve ekranlar
  - `src/app`: yönlendirme, tema, seçili ay, bildirimler, PWA
- Testler ilgili dosyanın yanında `*.test.ts` olarak durur. DB testleri `fake-indexeddb` kullanır.
- Arayüz metinlerinin tamamı [`src/ui/copy.ts`](src/ui/copy.ts) dosyasındadır.
- Production derlemesinde CSP `<meta>` etiketi bulunur. Uygulama hiçbir dış kaynağa (CDN, analitik, yazı tipi servisi) istek yapmaz.
