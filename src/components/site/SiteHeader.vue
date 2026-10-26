<script setup lang="ts">
import { ArrowRight, Bookmark, ChevronDown, Menu, Phone, Search, ShieldCheck, ShoppingBag, Timer, Truck, X } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { productsInRoom, rooms } from '../../data/products'
import { brand, roomBlurb } from '../../site/brand'
import { cart } from '../../site/cart'
import { roomIcon } from '../../site/icons'
import BrandLogo from './BrandLogo.vue'
import SearchOverlay from './SearchOverlay.vue'

const open = ref(false)
const mega = ref(false)
const search = ref(false)
const route = useRoute()
watch(
  () => route.fullPath,
  () => {
    open.value = false
    mega.value = false
  },
)
watch(open, (v) => (document.body.style.overflow = v ? 'hidden' : ''))

const links = [
  { to: '/tasarimlar', label: 'Tasarımlar' },
  { to: '/nasil-calisir', label: 'Nasıl çalışır' },
  { to: '/galeri', label: 'Galeri' },
  { to: '/yorumlar', label: 'Yorumlar' },
  { to: '/sss', label: 'SSS' },
]
</script>

<template>
  <div class="announce">
    <div class="container announce-row">
      <span><Truck :size="15" /> Türkiye’nin her yerine ücretsiz kargo</span>
      <span class="hide-sm"><Timer :size="15" /> 15 iş gününde üretim</span>
      <span class="hide-sm"><ShieldCheck :size="15" /> 10 yıl garanti</span>
      <a :href="`tel:${brand.phone.replace(/\D/g, '')}`" class="phone"><Phone :size="15" /> {{ brand.phone }}</a>
    </div>
  </div>

  <header class="header">
    <div class="container bar">
      <RouterLink to="/" class="logo-link" :aria-label="brand.name"><BrandLogo /></RouterLink>

      <nav class="nav" aria-label="Ana menü">
        <div class="mega-wrap" @mouseenter="mega = true" @mouseleave="mega = false">
          <button class="nav-link" :aria-expanded="mega" @click="mega = !mega">
            Odalar <ChevronDown :size="15" class="chev" :class="{ up: mega }" />
          </button>
          <Transition name="drop">
            <div v-if="mega" class="mega">
              <div class="mega-grid">
                <RouterLink v-for="r in rooms" :key="r.slug" :to="`/tasarimlar/${r.slug}`" class="mega-item">
                  <span class="mega-icon"><component :is="roomIcon[r.slug]" :size="20" :stroke-width="1.6" /></span>
                  <span class="mega-text">
                    <b>{{ r.title }} <small>{{ productsInRoom(r.slug).length }}</small></b>
                    <small>{{ roomBlurb[r.slug] }}</small>
                  </span>
                </RouterLink>
              </div>
              <div class="mega-side">
                <span class="eyebrow">Sıfırdan tasarla</span>
                <b>Aklınızdakini birkaç dakikada kurun.</b>
                <p>54 mobilya tipinden birini seçin; ölçü, bölme ve rengi 3D olarak belirleyin.</p>
                <RouterLink to="/odaya-gore" class="btn light">Tasarlamaya başla <ArrowRight :size="16" /></RouterLink>
              </div>
            </div>
          </Transition>
        </div>
        <RouterLink v-for="l in links" :key="l.to" :to="l.to" class="nav-link">{{ l.label }}</RouterLink>
      </nav>

      <div class="actions">
        <button class="search-btn hide-sm" aria-label="Tasarım ara" @click="search = true">
          <Search :size="17" /> <span>Ara</span> <kbd>Ctrl K</kbd>
        </button>
        <button class="icon-btn only-sm" aria-label="Tasarım ara" @click="search = true"><Search :size="18" /></button>
        <RouterLink to="/tasarimlarim" class="icon-btn hide-sm" aria-label="Tasarımlarım" title="Tasarımlarım">
          <Bookmark :size="18" />
          <span v-if="cart.state.saved.length" class="badge-count">{{ cart.state.saved.length }}</span>
        </RouterLink>
        <RouterLink to="/sepet" class="icon-btn" aria-label="Sepet">
          <ShoppingBag :size="18" />
          <span v-if="cart.count.value" class="badge-count">{{ cart.count.value }}</span>
        </RouterLink>
        <RouterLink to="/odaya-gore" class="btn cta-btn hide-sm">Hemen tasarla</RouterLink>
        <button class="icon-btn burger" aria-label="Menüyü aç" @click="open = true"><Menu :size="20" /></button>
      </div>
    </div>
  </header>

  <SearchOverlay v-model="search" />

  <Transition name="fade">
    <div v-if="open" class="drawer-backdrop" @click="open = false" />
  </Transition>
  <Transition name="slide">
    <aside v-if="open" class="drawer" aria-label="Mobil menü">
      <div class="drawer-head">
        <BrandLogo />
        <button class="icon-btn" aria-label="Menüyü kapat" @click="open = false"><X :size="20" /></button>
      </div>
      <RouterLink to="/odaya-gore" class="btn accent drawer-cta">Hemen tasarla <ArrowRight :size="16" /></RouterLink>
      <small class="drawer-label">Odalar</small>
      <div class="drawer-rooms">
        <RouterLink v-for="r in rooms" :key="r.slug" :to="`/tasarimlar/${r.slug}`" class="drawer-room">
          <component :is="roomIcon[r.slug]" :size="18" :stroke-width="1.7" /> {{ r.title }}
        </RouterLink>
      </div>
      <small class="drawer-label">Menü</small>
      <RouterLink v-for="l in links" :key="l.to" :to="l.to" class="drawer-link">{{ l.label }}</RouterLink>
      <RouterLink to="/tasarimlarim" class="drawer-link">Tasarımlarım</RouterLink>
      <RouterLink to="/hakkimizda" class="drawer-link">Hakkımızda</RouterLink>
      <RouterLink to="/iletisim" class="drawer-link">İletişim</RouterLink>
    </aside>
  </Transition>
</template>

<style scoped>
.announce {
  background: var(--ink);
  color: #e9e2d8;
  font-size: 12.5px;
}
.announce-row {
  display: flex;
  align-items: center;
  gap: 28px;
  height: 36px;
}
.announce-row span,
.phone {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.phone {
  margin-left: auto;
  color: #fff;
  text-decoration: none;
  font-weight: 500;
}
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--bg) 90%, transparent);
  backdrop-filter: saturate(1.4) blur(12px);
  border-bottom: 1px solid var(--line);
}
.bar {
  display: flex;
  align-items: center;
  gap: 28px;
  height: 74px;
}
.logo-link {
  text-decoration: none;
}
.nav {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
}
.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 9px 13px;
  border: 0;
  border-radius: 999px;
  background: none;
  color: var(--ink-2);
  text-decoration: none;
  font-size: 14.5px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.nav-link:hover,
.nav-link.router-link-active {
  background: var(--surface-2);
  color: var(--ink);
}
.chev {
  transition: transform 0.2s;
}
.chev.up {
  transform: rotate(180deg);
}
.mega-wrap {
  position: relative;
}
.mega {
  position: absolute;
  top: calc(100% + 12px);
  left: -20px;
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 8px;
  width: min(880px, 90vw);
  padding: 10px;
  border-radius: 22px;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-lg);
}
.mega::before {
  content: '';
  position: absolute;
  inset: -14px 0 auto 0;
  height: 14px;
}
.mega-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  padding: 6px;
}
.mega-item {
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  color: var(--ink);
  text-decoration: none;
  transition: background 0.15s;
}
.mega-item:hover {
  background: var(--surface-2);
}
.mega-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--accent-soft);
  color: var(--accent-dark);
  flex: none;
}
.mega-text {
  display: grid;
  line-height: 1.35;
}
.mega-text b {
  font-size: 14px;
  font-weight: 600;
}
.mega-text b small {
  margin-left: 4px;
  color: var(--accent);
  font-weight: 600;
  font-size: 11px;
}
.mega-text > small {
  color: var(--muted);
  font-size: 12px;
}
.mega-side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 22px;
  border-radius: 16px;
  background: linear-gradient(160deg, var(--ink) 0%, #3a2f25 100%);
  color: #fff;
}
.mega-side .eyebrow {
  color: #e8b48c;
  margin: 0;
}
.mega-side b {
  font-family: var(--serif);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.15;
}
.mega-side p {
  color: #cbc2b6;
  font-size: 13px;
  margin: 0;
}
.mega-side .btn {
  margin-top: auto;
  align-self: flex-start;
}
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.cta-btn {
  padding: 11px 18px;
}
.search-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 10px 0 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  font-size: 14px;
}
.search-btn:hover {
  border-color: var(--ink-2);
}
.search-btn kbd {
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--surface-2);
  font-size: 11px;
  font-family: inherit;
}
.only-sm {
  display: none;
}
.burger {
  display: none;
}
.drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgb(29 26 22 / 0.45);
}
.drawer {
  position: fixed;
  inset: 0 0 0 auto;
  z-index: 90;
  width: min(380px, 100%);
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 18px 20px 28px;
  background: var(--bg);
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}
.drawer-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.drawer-cta {
  margin-bottom: 10px;
}
.drawer-label {
  margin: 14px 0 6px;
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 600;
}
.drawer-rooms {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.drawer-room {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--ink);
  text-decoration: none;
  font-size: 13.5px;
}
.drawer-room svg {
  color: var(--accent);
}
.drawer-link {
  padding: 12px 4px;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
  text-decoration: none;
  font-weight: 500;
}
.drop-enter-active,
.drop-leave-active,
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.18s,
    transform 0.18s;
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

@media (max-width: 1100px) {
  .nav {
    display: none;
  }
  .burger {
    display: inline-grid;
  }
}
@media (max-width: 640px) {
  .hide-sm {
    display: none !important;
  }
  .only-sm {
    display: inline-grid;
  }
  .announce-row {
    justify-content: space-between;
    gap: 12px;
  }
  .bar {
    height: 64px;
  }
}
</style>
