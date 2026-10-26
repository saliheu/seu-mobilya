<script setup lang="ts">
import { ArrowRight, Search, X } from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { products, rooms, templateFor, typeBySlug, types } from '../../data/products'
import { tl } from '../../site/cart'
import { roomIcon } from '../../site/icons'
import { productPrice, sizeLabel } from '../../site/pricing'
import ProductThumb from './ProductThumb.vue'

const open = defineModel<boolean>({ required: true })
const router = useRouter()
const q = ref('')
const input = ref<HTMLInputElement>()
const cursor = ref(0)

const norm = (s: string) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/\p{Diacritic}/gu, '')
const popular = ['wardrobe', 'floor-tv-stand', 'floor-bookcase', 'student-desk', 'sofa', 'beds']

interface Hit {
  kind: 'product' | 'type' | 'room'
  label: string
  sub: string
  to: string
  id?: string
}

const hits = computed<Hit[]>(() => {
  const t = norm(q.value.trim())
  if (!t) {
    return popular.map((slug) => {
      const ty = typeBySlug(slug)!
      return { kind: 'type', label: ty.title, sub: 'Popüler kategori', to: `/tasarla/${templateFor(slug)!.id}?yeni=1` }
    })
  }
  const roomHits: Hit[] = rooms.filter((r) => norm(r.title).includes(t)).map((r) => ({ kind: 'room', label: r.title, sub: 'Oda', to: `/tasarimlar/${r.slug}` }))
  const typeHits: Hit[] = types
    .filter((ty) => norm(ty.title).includes(t))
    .slice(0, 4)
    .map((ty) => ({ kind: 'type', label: ty.title, sub: 'Sıfırdan tasarla', to: `/tasarla/${templateFor(ty.slug)!.id}?yeni=1` }))
  const productHits: Hit[] = products
    .filter((p) => norm(`${p.name} ${typeBySlug(p.type)?.title}`).includes(t))
    .slice(0, 6)
    .map((p) => ({ kind: 'product', label: p.name, sub: `${sizeLabel(p.design)} · ${tl(productPrice(p))}`, to: `/urun/${p.id}`, id: p.id }))
  return [...productHits, ...roomHits, ...typeHits]
})

watch(q, () => (cursor.value = 0))
watch(open, async (v) => {
  if (v) {
    q.value = ''
    await nextTick()
    input.value?.focus()
  }
})

function go(h?: Hit) {
  if (!h) return
  open.value = false
  router.push(h.to)
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') cursor.value = Math.min(hits.value.length - 1, cursor.value + 1)
  else if (e.key === 'ArrowUp') cursor.value = Math.max(0, cursor.value - 1)
  else if (e.key === 'Enter') go(hits.value[cursor.value])
  else if (e.key === 'Escape') open.value = false
  else return
  e.preventDefault()
}
function global(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open.value = true
  }
}
onMounted(() => window.addEventListener('keydown', global))
onBeforeUnmount(() => window.removeEventListener('keydown', global))
const productOf = (id?: string) => products.find((p) => p.id === id)
</script>

<template>
  <Transition name="fade">
    <div v-if="open" class="overlay" @click.self="open = false">
      <div class="panel" role="dialog" aria-label="Arama">
        <div class="field">
          <Search :size="20" />
          <input ref="input" v-model="q" placeholder="Gardırop, kitaplık, çalışma masası…" aria-label="Ara" @keydown="onKey" />
          <button class="icon-btn" aria-label="Kapat" @click="open = false"><X :size="18" /></button>
        </div>
        <small v-if="!q" class="label">Popüler kategoriler</small>
        <ul class="list">
          <li v-for="(h, i) in hits" :key="h.to + i">
            <button :class="{ active: i === cursor }" @mouseenter="cursor = i" @click="go(h)">
              <span class="thumb">
                <ProductThumb v-if="h.kind === 'product' && productOf(h.id)" :thumb-key="h.id!" :design="productOf(h.id)!.design" :rule-set="productOf(h.id)!.ruleSet" :alt="h.label" />
                <component :is="roomIcon[rooms.find((r) => r.title === h.label)?.slug ?? '']" v-else-if="h.kind === 'room'" :size="20" />
                <Search v-else :size="18" />
              </span>
              <span class="text">
                <b>{{ h.label }}</b>
                <small>{{ h.sub }}</small>
              </span>
              <ArrowRight :size="16" class="arrow" />
            </button>
          </li>
          <li v-if="q && !hits.length" class="none">“{{ q }}” için sonuç bulunamadı.</li>
        </ul>
        <footer><kbd>↑</kbd><kbd>↓</kbd> gezin · <kbd>Enter</kbd> aç · <kbd>Esc</kbd> kapat · <kbd>Ctrl</kbd>+<kbd>K</kbd> ara</footer>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  justify-items: center;
  align-items: start;
  padding: 10vh 16px 16px;
  background: rgb(29 26 22 / 0.45);
  backdrop-filter: blur(4px);
}
.panel {
  width: min(640px, 100%);
  max-height: 76vh;
  display: flex;
  flex-direction: column;
  border-radius: 22px;
  background: var(--surface);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
.field {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 14px 14px 20px;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
}
.field input {
  flex: 1;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 17px;
  color: var(--ink);
}
.field input:focus {
  outline: none;
}
.label {
  padding: 14px 20px 4px;
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 600;
}
.list {
  margin: 0;
  padding: 8px;
  list-style: none;
  overflow-y: auto;
}
.list button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.list button.active {
  background: var(--surface-2);
}
.thumb {
  display: grid;
  place-items: center;
  width: 56px;
  height: 42px;
  border-radius: 10px;
  background: var(--card-bg);
  color: var(--accent-dark);
  overflow: hidden;
  flex: none;
}
.thumb :deep(.thumb) {
  width: 56px;
}
.text {
  display: grid;
  flex: 1;
  min-width: 0;
}
.text small {
  color: var(--muted);
  font-size: 12px;
}
.arrow {
  color: var(--muted);
}
.none {
  padding: 20px;
  color: var(--muted);
  text-align: center;
}
footer {
  padding: 10px 20px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 12px;
}
kbd {
  margin: 0 2px;
  padding: 1px 6px;
  border-radius: 5px;
  border: 1px solid var(--line);
  background: var(--surface-2);
  font-size: 11px;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
