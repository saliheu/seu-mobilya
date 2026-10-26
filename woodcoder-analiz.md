# Woodcoder 3D yapılandırıcı – teknik analiz (2026-10-25)

İncelenen sayfa: `https://tr.woodcoder.com/tr/share/design/01a0e7d1-681d-727e-a2b3-a3057d071934`
(Ana sayfa `/tr` üzerinde 3D yok; yapılandırıcı paylaşım/tasarım sayfalarında açılıyor.)

REA kanıtları:
- `ev_7007c37c…` – ana sayfa ağ yakalaması (Laravel + Inertia + Vue, Vite/rolldown paketleri, 3D yok)
- `ev_4e7fa3e3…` – yapılandırıcı sayfası ağ yakalaması (gövdeler dahil)
- `ev_e4176a84…` – script dışa aktarımı (`vendor-three`, `secure-core`, `secure-site`, `MultiEditor` …)

## Yığın
| Katman | Gözlenen |
|---|---|
| Sunucu | Laravel (Inertia props, `App\Services\Editor\Product\StandardUnit\…`, laravel-precognition) |
| Ön yüz | Vue 3 + Inertia, Tailwind, sayfa bileşeni `Configurator/MultiEditor` |
| 3D | **three.js r186** (`canvas[data-engine="three.js r186"]`, `window.__THREE__ = "186"`) |
| three eklentileri | GLTFLoader, DRACOLoader (paketli, örnek GLB'lerde kullanılmıyor), HDRLoader, PMREMGenerator, OrbitControls, GLTFExporter, RoomEnvironment, three-csg-ts (union/subtract/intersect) |
| 2D görünüm | two.js (`vendor-two.js`, "2D" düğmesi) |
| Animasyon | GSAP |
| Editör motoru | `secure-core-*.js` (1,26 MB) – **javascript-obfuscator ile karıştırılmış** (string dizisi + çözücü fonksiyon) |

## Model formatı
- Mobilya gövdesi **dosyadan yüklenmiyor**; JSON parametrelerinden çalışma anında üretiliyor.
  - Paneller: `THREE.Shape` (mm cinsinden köşe noktaları) → `ExtrudeGeometry({depth: kalınlık, bevelEnabled:false})`. 1 birim = 1 m (18 mm → `depth: 0.018`).
  - Kenar bantları: ayrı ince mesh'ler (`depth 0.001` Extrude veya `BoxGeometry`), strip dokusu ile.
  - Askı borusu: `CylinderGeometry` (r = 15 mm).
  - Örnek sahne: 62 mesh – 31 Extrude, 15 Box, 15 BufferGeometry (GLB'lerden), 1 Cylinder.
- Aksesuarlar **GLB (glTF 2.0 binary)**, Blender ile dışa aktarılmış: `/asset/site/model/{handle, spherical-handle, wood-handle, lock, feet, metal-feet, table-feet, square-feet, wheel-8/9/10, woodman2}.glb`. `woodman2.glb` ölçek için insan figürü.
- Ortam: `studio.hdr` (Radiance RGBE, 1024×512) yükleniyor; gözlenen anda `scene.environment` ve malzemelerin `envMap`'i boştu.
- Işıklar: Hemisphere (0.6), Directional (1.1, gölge açık), Ambient (1.0). Kamera: Perspective, fov 45, near 0.1, far 100.

## Veri modeli (sayfaya gömülü Inertia JSON → `props.json`)
- `product[0].overall` → `{width, height, depth}` (mm)
- `product[0].sections[]` → sütunlar: `width`, `height`, `compartments[] {height, addons}`
- `product[0].parts` → `base, ceil, door, feet, curve, floor, shelf, drawer, pillar, backboard, cover_left, cover_right`; her biri `material`, `ral`, `strip`, `thickness`
- `product[0].rules` → üretim kuralları (sunucudan gelir), örn.:
  - `overall.depth` 150–1800 (kavisliyse min 200), `width/height` max 3600
  - `section.min_width 200 / max_width 2100`
  - `compartment.min_height 100`, `avg_height 450`
  - `door.margin_left_right 2.6`, `margin_top_bottom 2.7`; `drawer.margin 4`
  - `inner_drawer` 150–700 yükseklik, `feet` 50–200 mm, `double.min_depth 400` …
- `data[0].materialCategories[].thicknesses[].materials[]` → `{id, title, picture (jpg/webp doku), width 1830, height 3660, default_strip_id}`
- `data[0].ralCategories[].rals[]` → `{id, code: "RAL 1000", hex: "#CDBA88"}` (lake boyalı MDF)
- `data[0].strips[]` → kenar bandı dokuları; `feets`, `handleTypes`, `doorTypes`, `boards`, `adds` (ışık, kilit, askı…)

## Ölçü değiştirme
- Gözlem: genişlik +1 cm → mobilyaya ait **50 mesh silinip yeniden oluşturuldu**, 12 mesh (figür/oda) aynı kaldı, hiçbir mesh'te `scale ≠ 1` yok. Yani ölçekleme değil, **parametrik yeniden üretim**.
- Akış (gözlenen): JSON durumu güncellenir → kurallarla panel listesi hesaplanır → sahne yeniden kurulur → panel listesi `POST /tr/get-price`'a gider.
- `get-price` gövdesi: `{form:{panels:[[{type, width, height, depth, thickness, material, ral, strip, points[], xStart, yStart, z, rotation, rotation_type, stripSide[], cornerRadius, woodOrientation, handle*, doorType, …}]], product:[…]}}` → yanıt `{"symbol":"₺","total_price":21400,"total_board_price":22550}`. **Fiyat sunucuda hesaplanıyor**, istemci kesim listesi gönderiyor.
- Panel tip kodları (sahne `userData.type` ile eşleşen): 2 alt tabla, 3 dikme/yan, 4 raf, 5 üst tabla, 9 baza, 7 çekmece kutusu (yalnızca fiyat isteğinde), -1 kapak/çekmece önü, -2 kenar bandı, -5 askı borusu.

## Renk / malzeme değiştirme
- Malzemeler: `MeshPhysicalMaterial` (roughness 0.6, metalness 0.2, color #fff) + `map` = malzemenin `picture` dokusu (sRGB, `MirroredRepeatWrapping`); dikey panellerde `map.rotation = π/2` (damar yönü). Kenar bandı: `MeshStandardMaterial` (roughness 1) + strip dokusu (`ClampToEdge`).
- Tüm malzeme ve strip görselleri sayfa açılışında önceden yükleniyor (performance kaydında hepsi açılışta).
- RAL seçimi verisi `hex` içeriyor → düz renk (`material.color`), doku yok (çıkarım; canlı doğrulanmadı).
- Seçim kimlikleri (`material`, `ral`, `strip`) her panelle birlikte fiyat isteğine gidiyor.
- **Doğrulanmamış:** Yerleşik tarayıcıda "Koyu meşe" seçimi arayüzde işaretlendi ama sahnedeki doku `Beige.jpg` olarak kaldı. Renk değişiminin mesh'i yeniden mi ürettiği yoksa sadece `map`'i mi değiştirdiği gözlenemedi.

## Kendi uygulamamız için öneri (bizim tasarım kararlarımız)
1. three.js + Vue (veya React-three-fiber) ile aynı mimari: **JSON durum → kural motoru → panel listesi → sahne üretici**.
2. Kural motorunu saf fonksiyon olarak yaz (`buildPanels(design, rules) → Panel[]`); aynı çıktı hem 3D hem 2D hem fiyat hem de kesim listesi için kullanılsın.
3. Paneller için `Shape` + `ExtrudeGeometry` kullan; kenar bantlarını ayrı mesh ya da Extrude'un yan yüz malzeme grubu (`groups[1]`) olarak ver.
4. Doku önbelleği: malzeme id → `Texture` (önceden yükleme), RAL → `Color`.
5. Fiyatı sunucuda panel listesinden hesapla (istemciye güvenme).
6. Onların karıştırılmış kodunu, dokularını, GLB'lerini ve `woodman` modelini kopyalama; kural değerlerini kendi üretim toleranslarınla yeniden belirle.
