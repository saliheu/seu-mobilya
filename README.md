# Salih Enes Ünal Mobilya (demo)

Ölçüye göre mobilya satan **kurgusal** bir e-ticaret sitesi: Vue 3 + TypeScript + three.js (Vite).
Gerçek satış yapılmaz; sepet ve kayıtlı tasarımlar tarayıcıda (localStorage) tutulur, formlar hiçbir yere gönderilmez.

```
npm install
npm run dev        # http://localhost:5173
npm test           # 209 ürünün tamamı + kural motoru + 3D yerleşim testleri
npm run build      # tip kontrolü + üretim derlemesi
```

## Sayfalar

| Yol | İçerik |
|---|---|
| `/` | Dönen 3D vitrin, avantajlar, adımlar, odalar, öne çıkanlar, malzemeler, yorumlar |
| `/tasarimlar/:oda?` | 209 tasarım; oda, tip, arama ve fiyat sıralaması; Premium koleksiyon |
| `/odaya-gore/:oda?` | 54 mobilya tipinden şablonla sıfırdan tasarım |
| `/tasarla/:id` | Tam ekran 3D yapılandırıcı (ölçü, bölmeler, özellikler, renk, özet) |
| `/sepet` | Sepet, kayıtlı tasarımlar, demo sipariş |
| `/nasil-calisir`, `/galeri`, `/yorumlar`, `/sss`, `/hakkimizda`, `/iletisim`, `/yasal` | İçerik sayfaları |

Yapılandırıcıda **Paylaş** tasarımı bağlantıya gömer (`?d=`), **Kaydet** tarayıcıda saklar. Sahnede ölçek
referansı olarak 180 cm’lik bir insan figürü durur (`three/human.ts`, üst çubuktaki insan ikonuyla açılıp kapanır).
Varsayılan figür gerçek oranlarla çizilmiş, kameraya dönük bir silüettir. Lisansı size ait gerçekçi bir 3D insan
modelini `public/models/insan.glb` olarak koyarsanız otomatik yüklenir ve 180 cm’ye ölçeklenir.

Görsel kimlik: başlıklarda Fraunces, metinde Inter; ikonlar `lucide-vue-next` (emoji kullanılmaz).
Renk ve boşluk belirteçleri `src/style.css` içindeki `:root` değişkenlerindedir.

## Mimari

```
Düzenleme (core/actions) → Kural motoru (core/rules) → Panel listesi (core/panels + generators/)
                                                         ├─ 3D sahne       (three/)
                                                         ├─ Küçük resimler (three/thumbnails)
                                                         ├─ Fiyat          (core/price → estimatePrice)
                                                         └─ Kesim listesi  (core/price → cutList)
```

- **`src/core/`** – çerçeveden bağımsız (sunucuda da çalışır).
  - `types.ts` – `Design` (aile, ölçü, tabla, ayak, sütun/bölme/ön yüz, renkler), `Rules`, `Panel`.
  - `rules.ts` – ölçüleri kural aralığına çeker, sütun genişliklerini ve bölme yüksekliklerini dağıtır,
    çakışan ön yüzleri ayıklar, uyarı/hata üretir.
  - `generators/` – aile başına panel üreticileri: `cabinet` (dolap ve masa), `corner` (beşgen köşe
    dolabı, çapraz kapaklar), `furniture` (masa/sehpa, karyola, bank, koltuk, ayna, basit şekiller).
  - `actions.ts` – değişmez düzenleme fonksiyonları; `price.ts` – fiyat ve kesim listesi.
- **`src/three/`** – panel → `Shape` + `ExtrudeGeometry` (yuvarlak köşe, elips, çokgen, yumuşak minder),
  malzeme önbelleği (prosedürel ahşap, lake RAL, kumaş, ayna, cam, metal), sahne ve küçük resim üretici.
- **`src/data/`** – `products.json` (209 tasarım, 54 tip, 10 oda), `rules.json` (27 kural seti), `ral.json`.
  `tools/convert.py` ile üretilir.
- **`src/site/`** – marka metinleri, sepet/kayıt deposu, fiyat yardımcıları; **`src/pages/`** – sayfalar.

### Ölçü kuralları

- Dış genişlik/derinlik tabla çıkıntılarını içerir: `G = Σ sütun + (n+1)·kalınlık + sol + sağ çıkıntı`.
- Dış yükseklik gövde + tabladır; baza/ayak bunun **altına** eklenir.
- Kapak boşlukları, çekmece boşluğu, sütun min/max, bölme min yüksekliği, ayak aralığı, tabla çıkıntısı
  sınırı gibi değerler ürünün kural setinden (`rules.json`) gelir.

## Veri kaynağı ve uyarı

Ürün tipleri, ürünlerin ölçü/bölme düzenleri ve kural değerleri, referans alınan sitenin herkese açık
yapılandırıcı verisinden `tools/convert.py` ile kendi şemamıza çevrildi. Görseller, dokular, 3D modeller,
metinler ve marka kopyalanmadı: tüm görüntüler kendi motorumuzla üretiliyor, renkler/fiyatlar ve sayfa
metinleri bize ait. Bu proje bir demo olarak tasarlandı; ticari kullanımdan önce verilerin ve ürün
düzenlerinin kendi tasarımlarınızla değiştirilmesi önerilir.
