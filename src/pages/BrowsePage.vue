<script setup lang="ts">
import { SlidersHorizontal, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Breadcrumbs from '../components/site/Breadcrumbs.vue'
import ProductCard from '../components/site/ProductCard.vue'
import { catalog, findMaterial } from '../catalog/catalog'
import { products, roomBySlug, rooms, typeBySlug, type Product } from '../data/products'
import { roomBlurb } from '../site/brand'
import { roomIcon } from '../site/icons'
import { productPrice } from '../site/pricing'

const route = useRoute()
const room = computed(() => (route.params.room as string | undefined) ?? '')
const type = ref('')
const query = ref('')
const sort = ref<'popular' | 'price-asc' | 'price-desc' | 'width' | 'name'>('popular')
const maxPrice = ref(0)
const width = ref<[number, number]>([0, 0])
const colors = ref<string[]>([])
const features = ref<string[]>([])
const showFilters = ref(false)
watch(room, () => {
  type.value = ''
  resetFilters()
})

const inRoom = computed(() => (room.value ? products.filter((p) => p.rooms.includes(room.value)) : products))
const typeOptions = computed(() => {
  const counts = new Map<string, number>()
  inRoom.value.forEach((p) => counts.set(p.type, (counts.get(p.type) ?? 0) + 1))
  return [...counts].map(([slug, n]) => ({ slug, n, title: typeBySlug(slug)?.title ?? slug })).sort((a, b) => b.n - a.n)
})

// Filtre aralıkları mevcut ürünlerden türetilir.
const priceCeil = computed(() => Math.ceil(Math.max(...inRoom.value.map(productPrice)) / 1000) * 1000)
const widthFloor = computed(() => Math.floor(Math.min(...inRoom.value.map((p) => p.design.overall.width)) / 100) * 10)
const widthCeil = computed(() => Math.ceil(Math.max(...inRoom.value.map((p) => p.design.overall.width)) / 100) * 10)
function resetFilters() {
  maxPrice.value = 0
  width.value = [0, 0]
  colors.value = []
  features.value = []
}

/** Renk ailesi: ürünün ana (gövde) rengini kaba bir gruba ayırır. */
function colorFamily(p: Product): string {
  const m = findMaterial(catalog, p.design.finish.carcass.material)
  if (!m) return 'diger'
  if (m.kind === 'wood') return 'ahsap'
  if (m.kind === 'lacquer') return 'renkli'
  const hex = (p.design.finish.carcass.color ?? m.color).replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const lum = (0.299 * r! + 0.587 * g! + 0.114 * b!) / 255
  if (lum > 0.8) return 'beyaz'
  if (lum < 0.35) return 'koyu'
  return Math.max(r!, g!, b!) - Math.min(r!, g!, b!) > 40 ? 'renkli' : 'bej'
}
const colorOptions = [
  { key: 'beyaz', label: 'Beyaz', swatch: '#f3f1ec' },
  { key: 'bej', label: 'Bej / Gri', swatch: '#cfc4b3' },
  { key: 'ahsap', label: 'Ahşap', swatch: '#b98a5a' },
  { key: 'koyu', label: 'Koyu', swatch: '#3a3c3f' },
  { key: 'renkli', label: 'Renkli', swatch: 'conic-gradient(#e85d4a, #f2c14e, #6cbf84, #4a90d9, #9b6fd1, #e85d4a)' },
]
const featureOptions = [
  { key: 'doors', label: 'Kapaklı', test: (p: Product) => p.design.sections.some((s) => s.fronts.some((f) => f.kind !== 'drawer')) },
  { key: 'drawers', label: 'Çekmeceli', test: (p: Product) => p.design.sections.some((s) => s.fronts.some((f) => f.kind === 'drawer')) || !!p.design.bed?.drawers },
  { key: 'wall', label: 'Duvara monte', test: (p: Product) => p.design.elevation > 0 },
  { key: 'legs', label: 'Ayaklı', test: (p: Product) => p.design.base.kind === 'legs' || p.design.family === 'table' || p.design.family === 'sofa' },
  { key: 'glass', label: 'Camlı', test: (p: Product) => p.design.sections.some((s) => s.fronts.some((f) => f.kind === 'glass')) },
  { key: 'open', label: 'Açık raflı', test: (p: Product) => p.design.sections.some((s) => !s.knee && s.fronts.length === 0) },
]
const toggle = (list: string[], key: string) => (list.includes(key) ? list.splice(list.indexOf(key), 1) : list.push(key))
const activeCount = computed(() => colors.value.length + features.value.length + (maxPrice.value ? 1 : 0) + (width.value[0] || width.value[1] ? 1 : 0))

const filtered = computed(() => {
  const q = query.value.trim().toLocaleLowerCase('tr')
  const [wMin, wMax] = width.value
  let list = inRoom.value.filter((p) => {
    if (type.value && p.type !== type.value) return false
    if (q && !`${p.name} ${typeBySlug(p.type)?.title}`.toLocaleLowerCase('tr').includes(q)) return false
    if (maxPrice.value && productPrice(p) > maxPrice.value) return false
    const wcm = p.design.overall.width / 10
    if (wMin && wcm < wMin) return false
    if (wMax && wcm > wMax) return false
    if (colors.value.length && !colors.value.includes(colorFamily(p))) return false
    for (const f of features.value) if (!featureOptions.find((o) => o.key === f)!.test(p)) return false
    return true
  })
  const by = (f: (p: Product) => number | string) => [...list].sort((a, b) => (f(a) > f(b) ? 1 : f(a) < f(b) ? -1 : 0))
  if (sort.value === 'price-asc') list = by(productPrice)
  if (sort.value === 'price-desc') list = by(productPrice).reverse()
  if (sort.value === 'width') list = by((p) => p.design.overall.width)
  if (sort.value === 'name') list = by((p) => p.name)
  return list
})
const standard = computed(() => filtered.value.filter((p) => !p.premium))
const premium = computed(() => filtered.value.filter((p) => p.premium))
const roomInfo = computed(() => roomBySlug(room.value))
const title = computed(() => roomInfo.value?.title ?? 'Tüm tasarımlar')
const setWidth = (i: 0 | 1, e: Event) => {
  const v = Number((e.target as HTMLInputElement).value) || 0
  width.value = i === 0 ? [v, width.value[1]] : [width.value[0], v]
}
</script>

<template>
  <div class="container">
    <Breadcrumbs :items="[{ label: 'Ana sayfa', to: '/' }, { label: 'Tasarımlar', to: room ? '/tasarimlar' : undefined }, ...(roomInfo ? [{ label: roomInfo.title }] : [])]" />
    <header class="page-head">
      <span class="eyebrow">Kullanıcı tasarımları</span>
      <h1>{{ title }}</h1>
      <p class="muted">
        {{ room ? roomBlurb[room] : 'Odaya göre arayın, beğendiğiniz tasarımı açıp ölçüsünü ve rengini değiştirin.' }}
        Her tasarım tamamen özelleştirilebilir.
      </p>
    </header>

    <div class="rooms-bar">
      <RouterLink to="/tasarimlar" class="chip" :class="{ active: !room }">Tümü</RouterLink>
      <RouterLink v-for="r in rooms" :key="r.slug" :to="`/tasarimlar/${r.slug}`" class="chip">
        <component :is="roomIcon[r.slug]" :size="16" :stroke-width="1.8" /> {{ r.title }}
      </RouterLink>
    </div>

    <div class="types">
      <button class="chip" :class="{ active: !type }" @click="type = ''">Hepsi ({{ inRoom.length }})</button>
      <button v-for="t in typeOptions" :key="t.slug" class="chip" :class="{ active: type === t.slug }" @click="type = t.slug">{{ t.title }} ({{ t.n }})</button>
    </div>

    <div class="toolbar">
      <button class="chip filter-toggle" :class="{ active: showFilters }" @click="showFilters = !showFilters">
        <SlidersHorizontal :size="16" /> Filtreler <b v-if="activeCount">{{ activeCount }}</b>
      </button>
      <input v-model="query" class="input search" type="search" placeholder="Ürün ara…" aria-label="Ürün ara" />
      <select v-model="sort" class="input sort" aria-label="Sırala">
        <option value="popular">Önerilen</option>
        <option value="price-asc">Fiyat: artan</option>
        <option value="price-desc">Fiyat: azalan</option>
        <option value="width">Genişlik</option>
        <option value="name">İsim</option>
      </select>
      <span class="count muted">{{ filtered.length }} tasarım</span>
    </div>

    <Transition name="drop">
      <div v-if="showFilters" class="filters">
        <div class="fgroup">
          <b>Renk</b>
          <div class="opts">
            <button v-for="c in colorOptions" :key="c.key" class="chip" :class="{ active: colors.includes(c.key) }" @click="toggle(colors, c.key)">
              <i class="sw" :style="{ background: c.swatch }" /> {{ c.label }}
            </button>
          </div>
        </div>
        <div class="fgroup">
          <b>Özellik</b>
          <div class="opts">
            <button v-for="f in featureOptions" :key="f.key" class="chip" :class="{ active: features.includes(f.key) }" @click="toggle(features, f.key)">{{ f.label }}</button>
          </div>
        </div>
        <div class="fgroup">
          <b>Genişlik (cm)</b>
          <div class="range">
            <input class="input" type="number" :placeholder="String(widthFloor)" :value="width[0] || ''" aria-label="En az genişlik" @change="(e) => setWidth(0, e)" />
            <span>–</span>
            <input class="input" type="number" :placeholder="String(widthCeil)" :value="width[1] || ''" aria-label="En fazla genişlik" @change="(e) => setWidth(1, e)" />
          </div>
        </div>
        <div class="fgroup">
          <b>En yüksek fiyat <span class="muted">{{ maxPrice ? maxPrice.toLocaleString('tr-TR') + ' ₺' : 'Tümü' }}</span></b>
          <input v-model.number="maxPrice" type="range" :min="0" :max="priceCeil" :step="500" aria-label="En yüksek fiyat" />
        </div>
        <button v-if="activeCount" class="clear" @click="resetFilters"><X :size="14" /> Filtreleri temizle</button>
      </div>
    </Transition>

    <p v-if="!filtered.length" class="muted empty">Filtrelerinize uygun tasarım bulunamadı. Filtreleri gevşetin ya da sıfırdan tasarlayın.</p>

    <section v-if="standard.length" class="block">
      <div class="grid-cards">
        <ProductCard v-for="p in standard" :key="p.id" :product="p" />
      </div>
    </section>

    <section v-if="premium.length" class="block">
      <h2 class="h3">Premium koleksiyon <small class="muted">{{ premium.length }}</small></h2>
      <p class="muted">Masif ağaç ve lake detaylı, tasarım ekibimizin imzalı modelleri.</p>
      <div class="grid-cards">
        <ProductCard v-for="p in premium" :key="p.id" :product="p" />
      </div>
    </section>

    <div class="start">
      <div>
        <b>Aradığınızı bulamadınız mı?</b>
        <p class="muted">Boş bir şablondan başlayıp kendi ölçünüzde tasarlayın.</p>
      </div>
      <RouterLink :to="room ? `/odaya-gore/${room}` : '/odaya-gore'" class="btn accent">Sıfırdan tasarla</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.rooms-bar,
.types {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 6px;
}
.types {
  margin-top: 10px;
}
.types .chip {
  padding: 7px 12px;
  font-size: 13px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 18px 0 8px;
  flex-wrap: wrap;
}
.filter-toggle b {
  display: grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-size: 11px;
}
.search {
  max-width: 280px;
  border-radius: 999px;
  padding: 9px 16px;
}
.sort {
  max-width: 190px;
  border-radius: 999px;
  padding: 9px 14px;
}
.count {
  margin-left: auto;
  font-size: 13.5px;
}
.filters {
  display: grid;
  grid-template-columns: 1.3fr 1.3fr 1fr 1fr;
  gap: 24px;
  padding: 22px;
  margin-bottom: 10px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--line);
}
.fgroup {
  display: grid;
  gap: 10px;
  align-content: start;
}
.fgroup b {
  font-size: 13.5px;
  font-weight: 600;
}
.opts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.opts .chip {
  padding: 6px 11px;
  font-size: 12.5px;
}
.sw {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.15);
}
.range {
  display: flex;
  align-items: center;
  gap: 8px;
}
.range .input {
  padding: 8px 10px;
}
input[type='range'] {
  accent-color: var(--accent);
}
.clear {
  grid-column: 1 / -1;
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: none;
  color: var(--accent-dark);
  cursor: pointer;
  font-size: 13px;
}
.block {
  margin-top: 22px;
}
.h3 {
  font-size: 24px;
}
.h3 small {
  font-size: 14px;
  font-weight: 400;
}
.empty {
  padding: 40px 0;
}
.start {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 48px;
  padding: 26px;
  border-radius: var(--radius);
  background: var(--accent-soft);
}
.start p {
  margin: 0;
}
.drop-enter-active,
.drop-leave-active {
  transition:
    opacity 0.18s,
    transform 0.18s;
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
@media (max-width: 960px) {
  .filters {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 560px) {
  .filters {
    grid-template-columns: 1fr;
  }
  .search,
  .sort {
    max-width: none;
    flex: 1;
  }
  .count {
    margin-left: 0;
  }
}
</style>
