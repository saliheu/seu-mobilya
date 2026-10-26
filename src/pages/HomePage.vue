<script setup lang="ts">
import { ArrowRight, Check, Move3d, Palette, Ruler, Rows3 } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { catalog } from '../catalog/catalog'
import HeroViewer from '../components/site/HeroViewer.vue'
import ProductCard from '../components/site/ProductCard.vue'
import ProductThumb from '../components/site/ProductThumb.vue'
import StarRating from '../components/site/StarRating.vue'
import { products, productsInRoom, productsOfType, rooms, typeBySlug, type Product } from '../data/products'
import { brand, reviews, roomBlurb, steps, usps } from '../site/brand'
import { tl } from '../site/cart'
import { roomIcon, uspIcon } from '../site/icons'
import { productPrice, sizeLabel } from '../site/pricing'

// Vitrinde dönen ürünler.
const showcaseTypes = ['wardrobe', 'floor-tv-stand', 'l-shaped', 'buffet', 'floor-display-cabinet']
// Her tipten en çok kapak/çekmecesi olan (en "dolu" görünen) tasarımı seç.
const richness = (p: Product) => p.design.sections.reduce((n, s) => n + s.fronts.length, 0) + (p.design.family === 'sofa' ? 10 : 0)
const showcase = showcaseTypes
  .map((t) => productsOfType(t).sort((a, b) => richness(b) - richness(a))[0]!)
  .filter(Boolean)
const current = ref(0)
let timer = 0
onMounted(() => (timer = window.setInterval(() => (current.value = (current.value + 1) % showcase.length), 7000)))
onBeforeUnmount(() => clearInterval(timer))
const hero = computed(() => showcase[current.value]!)

const featured = ['floor-bookcase', 'buffet', 'night-stand', 'student-desk', 'coffee-table', 'wall-mounted-shoe-rack', 'beds', 'double-sided-divider']
  .map((t) => products.find((p) => p.type === t)!)
  .filter(Boolean)

const roomCover = (slug: string) => productsInRoom(slug).find((p) => !p.premium) ?? productsInRoom(slug)[0]!
const swatches = catalog.groups.filter((g) => g.selectable).flatMap((g) => g.materials).filter((m) => m.kind !== 'lacquer')
const features = [
  { icon: Ruler, title: 'Milimetrik ölçü', text: 'Genişlik, yükseklik ve derinliği 1 mm hassasiyetle girin.' },
  { icon: Rows3, title: 'Bölme ve kapak', text: 'Raf, çekmece, cam kapak, askı borusu; hepsi tek tıkla.' },
  { icon: Palette, title: '200+ renk', text: 'MDF lam, masif ağaç ve istediğiniz RAL tonunda lake.' },
  { icon: Move3d, title: 'Gerçek zamanlı 3D', text: 'Her değişikliği anında görün, fiyat da anında güncellensin.' },
]
const stats = [
  { v: '2.400+', l: 'teslim edilen sipariş' },
  { v: '4,9/5', l: 'ortalama müşteri puanı' },
  { v: '54', l: 'özelleştirilebilir mobilya tipi' },
  { v: '15 gün', l: 'ortalama üretim süresi' },
]
</script>

<template>
  <section class="hero">
    <div class="container hero-grid">
      <div class="hero-copy">
        <span class="eyebrow">{{ brand.founded }}’ten beri atölyeden kapınıza</span>
        <h1>Mobilyanız,<br /><em>tam ölçünüzde.</em></h1>
        <p class="lead">
          Gardıroptan kitaplığa, TV ünitesinden çalışma masasına 54 mobilya tipini 3D olarak tasarlayın. Ölçüyü,
          bölmeleri ve rengi siz seçin; biz atölyemizde milimetrik keselim.
        </p>
        <div class="cta">
          <RouterLink to="/tasarimlar" class="btn accent">Tasarımları keşfet <ArrowRight :size="17" /></RouterLink>
          <RouterLink to="/odaya-gore" class="btn ghost">Sıfırdan tasarla</RouterLink>
        </div>
        <div class="trust">
          <div class="avatars" aria-hidden="true">
            <span v-for="r in reviews.slice(0, 4)" :key="r.name">{{ r.name[0] }}</span>
          </div>
          <div>
            <StarRating :value="5" />
            <small><b>4,9 / 5</b> · 2.400+ mutlu müşteri</small>
          </div>
        </div>
      </div>

      <div class="hero-visual">
        <HeroViewer :product="hero" />
        <div class="hero-chip">
          <small>{{ typeBySlug(hero.type)?.title }}</small>
          <b>{{ hero.name }}</b>
          <span class="chip-meta">{{ sizeLabel(hero.design) }} · <strong>{{ tl(productPrice(hero)) }}</strong></span>
          <RouterLink :to="`/tasarla/${hero.id}`" class="chip-link">Bunu özelleştir <ArrowRight :size="15" /></RouterLink>
        </div>
        <span class="hint"><Move3d :size="15" /> Sürükleyip döndürün</span>
        <div class="dots">
          <button v-for="(_, i) in showcase" :key="i" :class="{ active: i === current }" :aria-label="`Ürün ${i + 1}`" @click="current = i" />
        </div>
      </div>
    </div>
  </section>

  <section class="container usps">
    <div v-for="u in usps" :key="u.title" class="usp">
      <span class="usp-icon"><component :is="uspIcon[u.icon]" :size="22" :stroke-width="1.6" /></span>
      <div>
        <b>{{ u.title }}</b>
        <p class="muted">{{ u.text }}</p>
      </div>
    </div>
  </section>

  <section class="section container">
    <div class="center-head">
      <span class="eyebrow">Nasıl çalışır</span>
      <h2>Üç adımda kendi mobilyanız</h2>
    </div>
    <div class="steps">
      <div v-for="(s, i) in steps" :key="s.title" class="step">
        <span class="num">0{{ i + 1 }}</span>
        <h3>{{ s.title }}</h3>
        <p class="muted">{{ s.text }}</p>
      </div>
    </div>
  </section>

  <section class="section container rooms-section">
    <div class="head-row">
      <div>
        <span class="eyebrow">Odaya göre</span>
        <h2>Hangi odayı yeniliyorsunuz?</h2>
      </div>
      <RouterLink to="/tasarimlar" class="btn ghost">Tüm tasarımlar <ArrowRight :size="16" /></RouterLink>
    </div>
    <div class="rooms">
      <RouterLink v-for="r in rooms" :key="r.slug" :to="`/tasarimlar/${r.slug}`" class="room">
        <ProductThumb :thumb-key="roomCover(r.slug).id" :design="roomCover(r.slug).design" :rule-set="roomCover(r.slug).ruleSet" :alt="r.title" />
        <span class="room-icon"><component :is="roomIcon[r.slug]" :size="18" :stroke-width="1.7" /></span>
        <div class="room-body">
          <b>{{ r.title }}</b>
          <small class="muted">{{ roomBlurb[r.slug] }}</small>
          <small class="count">{{ productsInRoom(r.slug).length }} tasarım <ArrowRight :size="13" /></small>
        </div>
      </RouterLink>
    </div>
  </section>

  <section class="configurator-band">
    <div class="container band-grid">
      <div>
        <span class="eyebrow light">3D yapılandırıcı</span>
        <h2>Mağazada değil, kendi ekranınızda tasarlayın.</h2>
        <p class="band-lead">Yanına 180 cm’lik bir insan figürü koyduk; mobilyanın odanızda nasıl duracağını gerçek ölçeğiyle görün.</p>
        <ul class="features">
          <li v-for="f in features" :key="f.title">
            <span><component :is="f.icon" :size="20" :stroke-width="1.6" /></span>
            <div>
              <b>{{ f.title }}</b>
              <small>{{ f.text }}</small>
            </div>
          </li>
        </ul>
        <RouterLink :to="`/tasarla/${showcase[0]!.id}`" class="btn light">Yapılandırıcıyı dene <ArrowRight :size="16" /></RouterLink>
      </div>
      <div class="band-swatches">
        <span v-for="m in swatches" :key="m.id" class="swatch" :class="{ wood: m.kind === 'wood' }" :style="{ background: m.color }" :title="m.name" />
      </div>
    </div>
  </section>

  <section class="section container">
    <div class="head-row">
      <div>
        <span class="eyebrow">Çok sevilenler</span>
        <h2>Öne çıkan tasarımlar</h2>
      </div>
      <RouterLink to="/tasarimlar" class="btn ghost">Hepsini gör <ArrowRight :size="16" /></RouterLink>
    </div>
    <div class="grid-cards">
      <ProductCard v-for="p in featured" :key="p.id" :product="p" />
    </div>
  </section>

  <section class="container stats">
    <div v-for="s in stats" :key="s.l" class="stat">
      <b>{{ s.v }}</b>
      <span>{{ s.l }}</span>
    </div>
  </section>

  <section class="section container">
    <div class="head-row">
      <div>
        <span class="eyebrow">Müşterilerimiz anlatıyor</span>
        <h2>Evlerine tam oturan mobilyalar</h2>
      </div>
      <RouterLink to="/yorumlar" class="btn ghost">Tüm yorumlar <ArrowRight :size="16" /></RouterLink>
    </div>
    <div class="reviews">
      <figure v-for="r in reviews.slice(0, 3)" :key="r.name" class="review">
        <StarRating :value="r.rating" />
        <blockquote>“{{ r.text }}”</blockquote>
        <figcaption>
          <span class="avatar">{{ r.name[0] }}</span>
          <span>
            <b>{{ r.name }}</b>
            <small class="muted">{{ r.city }} · {{ r.product }}</small>
          </span>
          <span class="verified"><Check :size="13" /> Doğrulanmış alışveriş</span>
        </figcaption>
      </figure>
    </div>
  </section>

  <section class="container">
    <div class="cta-band">
      <div>
        <h2>Aklınızdaki mobilya hazır değil mi?</h2>
        <p>Boş bir şablondan başlayın; bölmeleri, kapakları ve ölçüyü dakikalar içinde kurun.</p>
      </div>
      <RouterLink to="/odaya-gore" class="btn accent">Hemen tasarlamaya başla <ArrowRight :size="17" /></RouterLink>
    </div>
  </section>
</template>

<style scoped>
.hero {
  padding: 48px 0 32px;
}
.hero-grid {
  display: grid;
  grid-template-columns: 1fr 1.12fr;
  gap: 48px;
  align-items: center;
}
h1 em {
  font-style: italic;
  color: var(--accent);
}
.lead {
  font-size: 17.5px;
  color: var(--muted);
  max-width: 520px;
}
.cta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin: 30px 0 34px;
}
.trust {
  display: flex;
  align-items: center;
  gap: 14px;
}
.trust > div:last-child {
  display: grid;
  gap: 2px;
}
.avatars {
  display: flex;
}
.avatars span {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  margin-left: -10px;
  border-radius: 50%;
  border: 2.5px solid var(--bg);
  background: var(--accent-soft);
  color: var(--accent-dark);
  font-weight: 700;
  font-size: 14px;
}
.avatars span:first-child {
  margin-left: 0;
}
.avatars span:nth-child(2) {
  background: var(--sage-soft);
  color: var(--sage);
}
.avatars span:nth-child(3) {
  background: #efe3c8;
  color: #8a6418;
}
.hero-visual {
  position: relative;
  min-height: 560px;
  border-radius: 32px;
  background:
    radial-gradient(circle at 55% 35%, #ffffff 0%, rgb(255 255 255 / 0) 60%),
    linear-gradient(160deg, #efe6da 0%, #e4d7c6 100%);
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgb(29 26 22 / 0.05);
}
.hero-chip {
  position: absolute;
  left: 22px;
  bottom: 22px;
  display: grid;
  gap: 2px;
  min-width: 240px;
  padding: 16px 18px;
  border-radius: 18px;
  background: rgb(255 255 255 / 0.92);
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow);
}
.hero-chip small {
  color: var(--muted);
  font-size: 12px;
}
.hero-chip b {
  font-family: var(--serif);
  font-size: 19px;
  font-weight: 600;
}
.chip-meta {
  font-size: 13px;
  color: var(--muted);
}
.chip-meta strong {
  color: var(--ink);
}
.chip-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  color: var(--accent);
  font-weight: 600;
  font-size: 13.5px;
  text-decoration: none;
}
.hint {
  position: absolute;
  top: 20px;
  left: 22px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.7);
  font-size: 12px;
  color: var(--ink-2);
}
.dots {
  position: absolute;
  right: 24px;
  bottom: 30px;
  display: flex;
  gap: 6px;
}
.dots button {
  width: 8px;
  height: 8px;
  padding: 0;
  border-radius: 999px;
  border: 0;
  background: rgb(29 26 22 / 0.2);
  cursor: pointer;
  transition: width 0.2s;
}
.dots button.active {
  background: var(--ink);
  width: 26px;
}
.usps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  margin-top: 8px;
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--line);
  border: 1px solid var(--line);
}
.usp {
  display: flex;
  gap: 14px;
  padding: 22px;
  background: var(--surface);
}
.usp-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: var(--accent-soft);
  color: var(--accent-dark);
  flex: none;
}
.usp p {
  margin: 3px 0 0;
  font-size: 13px;
  line-height: 1.45;
}
.center-head {
  text-align: center;
  margin-bottom: 36px;
}
.steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.step {
  position: relative;
  padding: 30px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--line);
}
.num {
  display: block;
  margin-bottom: 16px;
  font-family: var(--serif);
  font-size: 46px;
  font-weight: 600;
  line-height: 1;
  color: var(--accent);
  opacity: 0.85;
}
.head-row {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
  margin-bottom: 28px;
}
.head-row h2 {
  margin: 0;
}
.rooms {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}
.room {
  position: relative;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--line);
  overflow: hidden;
  color: inherit;
  text-decoration: none;
  transition:
    transform 0.25s,
    box-shadow 0.25s;
}
.room:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
}
.room-icon {
  position: absolute;
  top: 12px;
  left: 12px;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgb(255 255 255 / 0.9);
  color: var(--accent-dark);
  box-shadow: var(--shadow-sm);
}
.room-body {
  display: grid;
  padding: 12px 14px 14px;
  gap: 3px;
}
.room-body b {
  font-weight: 600;
}
.room-body small {
  font-size: 12px;
  line-height: 1.4;
}
.count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  color: var(--accent);
  font-weight: 600;
}
.configurator-band {
  margin: 40px 0;
  padding: 88px 0;
  background:
    radial-gradient(circle at 85% 20%, rgb(168 88 42 / 0.35), transparent 45%),
    var(--ink);
  color: #fff;
}
.band-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 56px;
  align-items: center;
}
.eyebrow.light {
  color: #e8b48c;
}
.band-lead {
  color: #cbc2b6;
  font-size: 17px;
  max-width: 520px;
}
.features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 24px;
  margin: 28px 0 32px;
  padding: 0;
  list-style: none;
}
.features li {
  display: flex;
  gap: 12px;
}
.features li > span {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgb(255 255 255 / 0.08);
  color: #e8b48c;
  flex: none;
}
.features li div {
  display: grid;
}
.features small {
  color: #b9b0a4;
  font-size: 13px;
  line-height: 1.45;
}
.band-swatches {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  transform: rotate(-4deg);
}
.swatch {
  aspect-ratio: 1;
  border-radius: 16px;
  box-shadow: 0 10px 24px -10px rgb(0 0 0 / 0.6);
}
.swatch.wood {
  background-image: repeating-linear-gradient(8deg, rgb(60 35 15 / 0.22) 0 1px, transparent 1px 6px) !important;
}
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 16px;
}
.stat {
  display: grid;
  gap: 4px;
  padding: 26px;
  border-radius: var(--radius);
  background: var(--sage-soft);
}
.stat b {
  font-family: var(--serif);
  font-size: 40px;
  font-weight: 600;
  line-height: 1;
  color: var(--sage);
}
.stat span {
  color: var(--ink-2);
  font-size: 14px;
}
.reviews {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.review {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 26px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--line);
}
blockquote {
  flex: 1;
  margin: 14px 0 20px;
  font-family: var(--serif);
  font-size: 18px;
  line-height: 1.45;
}
figcaption {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
figcaption > span:nth-child(2) {
  display: grid;
  line-height: 1.3;
}
.avatar {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent-dark);
  font-weight: 700;
}
.verified {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  color: var(--sage);
  font-size: 12px;
  font-weight: 500;
}
.cta-band {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  padding: 44px;
  border-radius: 32px;
  background: linear-gradient(120deg, var(--accent-soft) 0%, #f1dcc8 100%);
}
.cta-band h2 {
  margin-bottom: 8px;
}
.cta-band p {
  margin: 0;
  color: var(--ink-2);
}

@media (max-width: 1000px) {
  .hero-grid,
  .band-grid {
    grid-template-columns: 1fr;
  }
  .hero-visual {
    min-height: 420px;
  }
  .usps,
  .stats {
    grid-template-columns: 1fr 1fr;
  }
  .steps,
  .reviews {
    grid-template-columns: 1fr;
  }
  .rooms {
    grid-template-columns: repeat(2, 1fr);
  }
  .band-swatches {
    transform: none;
  }
}
@media (max-width: 560px) {
  .usps,
  .features {
    grid-template-columns: 1fr;
  }
  .head-row {
    flex-direction: column;
    align-items: start;
  }
  .cta-band {
    padding: 28px;
  }
  .hero-chip {
    left: 12px;
    right: 12px;
    min-width: 0;
  }
  .dots {
    top: 22px;
    bottom: auto;
  }
}
</style>
