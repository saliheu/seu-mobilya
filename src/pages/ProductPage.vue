<script setup lang="ts">
import { ArrowRight, Bookmark, Box, Check, Hammer, Pencil, ShieldCheck, ShoppingBag, Timer, Truck } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import Breadcrumbs from '../components/site/Breadcrumbs.vue'
import ProductCard from '../components/site/ProductCard.vue'
import ProductThumb from '../components/site/ProductThumb.vue'
import StarRating from '../components/site/StarRating.vue'
import { catalog, findMaterial } from '../catalog/catalog'
import { familyLabel, productById, products, roomBySlug, typeBySlug } from '../data/products'
import { cart, tl } from '../site/cart'
import { productPrice, sizeLabel } from '../site/pricing'
import { ratingOf, specsOf } from '../site/specs'
import { woodSwatch } from '../three/materials'

const route = useRoute()
const product = productById(route.params.id as string) ?? products[0]!
const type = typeBySlug(product.type)
const room = roomBySlug(product.rooms[0]!)
const price = productPrice(product)
const listPrice = Math.round((price * 1.12) / 50) * 50
const specs = specsOf(product)
const rating = ratingOf(product.id)
const hasFronts = specs.doors + specs.drawers > 0

const views = [
  { key: 'main', label: 'Çapraz', opts: { azimuth: 0.55, width: 1000, height: 750 } },
  { key: 'front', label: 'Karşıdan', opts: { azimuth: 0, elevation: 0.12, width: 1000, height: 750 } },
  ...(hasFronts ? [{ key: 'open', label: 'Kapaklar açık', opts: { azimuth: 0.45, open: true, width: 1000, height: 750 } }] : []),
  { key: 'human', label: 'Ölçek', opts: { azimuth: 0.3, elevation: 0.15, human: true, width: 1000, height: 750 } },
]
const active = ref(0)
const view = computed(() => views[active.value]!)

const similar = computed(() => {
  const same = products.filter((p) => p.id !== product.id && p.type === product.type)
  const room = products.filter((p) => p.id !== product.id && p.type !== product.type && p.rooms.some((r) => product.rooms.includes(r)))
  return [...same, ...room].slice(0, 4)
})

const d = specs.design
const total = (d: typeof specs.design) => d.overall.height + (['cabinet', 'desk', 'corner'].includes(d.family) && d.base.kind !== 'none' ? d.base.height : 0)
const rows = [
  ['Ölçü (G × Y × D)', sizeLabel(d)],
  ['Toplam yükseklik', `${Math.round(total(d) / 10)} cm`],
  ['Ürün tipi', `${type?.title} · ${familyLabel[d.family]}`],
  ...(specs.doors ? [['Kapak', `${specs.doors} adet`]] : []),
  ...(specs.drawers ? [['Çekmece', `${specs.drawers} adet, tam açılım ray`]] : []),
  ...(specs.shelves ? [['Raf', `${specs.shelves} adet`]] : []),
  ['Levha kalınlığı', `${d.thickness} mm gövde, ${d.top.thickness} mm tabla`],
  ['Parça sayısı', `${specs.parts} parça, numaralı`],
  ['Tahmini ağırlık', `${specs.weight} kg`],
  ['Kenar bandı', '2 mm ABS, görünen tüm kenarlar'],
]
const swatch = (f: { material: number; color: string | null }) => {
  const m = findMaterial(catalog, f.material)
  return m?.kind === 'wood' ? { background: `${m.color} url(${woodSwatch(m.color)}) center / cover` } : { background: f.color ?? m?.color }
}
const addToCart = () => cart.add({ productId: product.id, name: product.name, ruleSet: product.ruleSet, design: specs.design, price })
const save = () => cart.save({ productId: product.id, name: product.name, ruleSet: product.ruleSet, design: specs.design, price })
</script>

<template>
  <div class="container">
    <Breadcrumbs
      :items="[
        { label: 'Ana sayfa', to: '/' },
        { label: 'Tasarımlar', to: '/tasarimlar' },
        ...(room ? [{ label: room.title, to: `/tasarimlar/${room.slug}` }] : []),
        { label: product.name },
      ]"
    />

    <div class="layout">
      <div class="gallery">
        <div class="stage">
          <ProductThumb :thumb-key="`${product.id}-${view.key}`" :design="product.design" :rule-set="product.ruleSet" :alt="`${product.name} – ${view.label}`" :options="view.opts" />
          <span v-if="product.premium" class="badge">Premium koleksiyon</span>
        </div>
        <div class="thumbs" role="tablist">
          <button v-for="(v, i) in views" :key="v.key" :class="{ active: i === active }" :aria-label="v.label" @click="active = i">
            <ProductThumb :thumb-key="`${product.id}-${v.key}`" :design="product.design" :rule-set="product.ruleSet" :alt="v.label" :options="v.opts" />
            <small>{{ v.label }}</small>
          </button>
        </div>
      </div>

      <aside class="info">
        <small class="type">{{ type?.title }}</small>
        <h1>{{ product.name }}</h1>
        <div class="rating">
          <StarRating :value="Math.round(rating.value)" />
          <span><b>{{ rating.value.toFixed(1).replace('.', ',') }}</b> · {{ rating.count }} değerlendirme</span>
        </div>

        <div class="price">
          <s>{{ tl(listPrice) }}</s>
          <b>{{ tl(price) }}</b>
          <span class="save">%{{ Math.round((1 - price / listPrice) * 100) }} indirim</span>
        </div>
        <small class="muted">KDV ve kargo dahil · Peşin ödemede ek %10 indirim</small>

        <div class="chips">
          <span class="chip-static"><Box :size="15" /> {{ sizeLabel(d) }}</span>
          <span v-for="m in specs.materials" :key="m.label" class="chip-static"><i :style="swatch(m.finish)" /> {{ m.label }}</span>
        </div>

        <div class="actions">
          <RouterLink :to="`/tasarla/${product.id}`" class="btn accent big"><Pencil :size="18" /> Bu tasarımı özelleştir</RouterLink>
          <div class="row2">
            <button class="btn ghost" @click="addToCart"><ShoppingBag :size="17" /> Olduğu gibi sepete ekle</button>
            <button class="icon-btn" title="Tasarımlarıma kaydet" aria-label="Kaydet" @click="save"><Bookmark :size="18" /></button>
          </div>
        </div>

        <ul class="perks">
          <li><Truck :size="18" /> <span><b>Ücretsiz kargo</b> · paketli ve sigortalı</span></li>
          <li><Timer :size="18" /> <span><b>15 iş gününde üretim</b> · ölçünüze göre kesilir</span></li>
          <li><Hammer :size="18" /> <span><b>Kolay montaj</b> · numaralı parçalar ve video</span></li>
          <li><ShieldCheck :size="18" /> <span><b>10 yıl garanti</b> · gövde ve menteşelerde</span></li>
        </ul>

        <details open>
          <summary>Ürün özellikleri</summary>
          <dl>
            <template v-for="[k, v] in rows" :key="k">
              <dt>{{ k }}</dt>
              <dd>{{ v }}</dd>
            </template>
          </dl>
        </details>
        <details>
          <summary>Neleri değiştirebilirim?</summary>
          <ul class="checks">
            <li><Check :size="15" /> Genişlik, yükseklik ve derinliği milimetre hassasiyetinde</li>
            <li><Check :size="15" /> Sütun ve raf sayısı, bölme yükseklikleri</li>
            <li><Check :size="15" /> Kapak, cam kapak, çekmece, iç çekmece ve kilit</li>
            <li><Check :size="15" /> Gövde, kapak, tabla, arkalık ve kenar bandı renkleri</li>
            <li><Check :size="15" /> Ayak, baza, teker; LED aydınlatma ve askı borusu</li>
          </ul>
        </details>
        <details>
          <summary>Teslimat ve montaj</summary>
          <p class="muted">Ürününüz 15 iş gününde üretilir ve 2–4 iş gününde kapınıza teslim edilir. Parçalar numaralıdır; montaj kılavuzu ve QR kodlu montaj videosu pakettedir. Büyük şehirlerde ücretli montaj hizmeti sepet adımında seçilebilir.</p>
        </details>
        <details>
          <summary>Bakım</summary>
          <p class="muted">Nemli, yumuşak bir bezle silin; aşındırıcı temizleyici kullanmayın. Masif ağaç yüzeyleri yılda bir doğal yağ ile besleyin.</p>
        </details>
      </aside>
    </div>

    <section class="section similar">
      <div class="head-row">
        <h2>Benzer tasarımlar</h2>
        <RouterLink :to="room ? `/tasarimlar/${room.slug}` : '/tasarimlar'" class="btn ghost">Tümünü gör <ArrowRight :size="16" /></RouterLink>
      </div>
      <div class="grid-cards">
        <ProductCard v-for="p in similar" :key="p.id" :product="p" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 48px;
  margin-top: 20px;
  align-items: start;
}
.gallery {
  position: sticky;
  top: 96px;
  display: grid;
  gap: 12px;
}
.stage {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(160deg, #f1e9de 0%, #e7dccd 100%);
}
.stage :deep(.thumb) {
  background: transparent;
}
.badge {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 5px 12px;
  border-radius: 999px;
  background: var(--ink);
  color: #f3d9a4;
  font-size: 12px;
  font-weight: 600;
}
.thumbs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.thumbs button {
  display: grid;
  gap: 4px;
  padding: 0 0 6px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  overflow: hidden;
  cursor: pointer;
  font-size: 12px;
  color: var(--muted);
}
.thumbs button.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-soft);
  color: var(--accent-dark);
}
.info {
  display: grid;
  gap: 14px;
}
.type {
  color: var(--accent);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 12px;
}
.info h1 {
  font-size: clamp(32px, 3.6vw, 46px);
  margin: 0;
}
.rating {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}
.price {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-top: 6px;
}
.price s {
  color: var(--muted);
  font-size: 18px;
}
.price b {
  font-family: var(--serif);
  font-size: 40px;
  font-weight: 600;
  line-height: 1;
}
.save {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--sage-soft);
  color: var(--sage);
  font-size: 13px;
  font-weight: 600;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip-static {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  font-size: 13px;
}
.chip-static i {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.12);
}
.actions {
  display: grid;
  gap: 10px;
  margin: 6px 0;
}
.btn.big {
  padding: 16px 22px;
  font-size: 16px;
}
.row2 {
  display: flex;
  gap: 10px;
}
.row2 .btn {
  flex: 1;
}
.row2 .icon-btn {
  width: 50px;
  height: auto;
}
.perks {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 0;
  padding: 16px;
  list-style: none;
  border-radius: 16px;
  background: var(--surface-2);
  font-size: 13px;
}
.perks li {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.perks svg {
  color: var(--accent);
  margin-top: 2px;
}
details {
  border-top: 1px solid var(--line);
  padding: 14px 0 4px;
}
summary {
  cursor: pointer;
  font-weight: 600;
  list-style-position: outside;
}
dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 18px;
  margin: 14px 0 6px;
  font-size: 14px;
}
dt {
  color: var(--muted);
}
dd {
  margin: 0;
}
.checks {
  display: grid;
  gap: 8px;
  margin: 12px 0 6px;
  padding: 0;
  list-style: none;
  font-size: 14px;
}
.checks li {
  display: flex;
  gap: 8px;
}
.checks svg {
  color: var(--sage);
  margin-top: 3px;
}
details p {
  margin: 10px 0 6px;
  font-size: 14px;
}
.head-row {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
  margin-bottom: 24px;
}
.head-row h2 {
  margin: 0;
}
@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .gallery {
    position: static;
  }
  .perks {
    grid-template-columns: 1fr;
  }
}
</style>
