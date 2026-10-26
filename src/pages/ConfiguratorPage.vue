<script setup lang="ts">
import {
  ArrowLeft,
  Bookmark,
  DoorClosed,
  DoorOpen,
  Focus,
  Headset,
  Lightbulb,
  LayoutGrid,
  PanelTop,
  RulerDimensionLine,
  MousePointerClick,
  Palette,
  PersonStanding,
  ReceiptText,
  Redo2,
  Ruler,
  Share2,
  ShoppingBag,
  SlidersHorizontal,
  Undo2,
} from 'lucide-vue-next'
import { computed, ref, type Component } from 'vue'
import { useRoute } from 'vue-router'
import ExtrasTab from '../components/configurator/ExtrasTab.vue'
import FeaturesTab from '../components/configurator/FeaturesTab.vue'
import FinishTab from '../components/configurator/FinishTab.vue'
import FrontsTab from '../components/configurator/FrontsTab.vue'
import LayoutTab from '../components/configurator/LayoutTab.vue'
import SizeTab from '../components/configurator/SizeTab.vue'
import SummaryTab from '../components/configurator/SummaryTab.vue'
import Viewport from '../components/configurator/Viewport.vue'
import BrandLogo from '../components/site/BrandLogo.vue'
import { productById, products, rulesFor, typeBySlug } from '../data/products'
import { cart, decodeDesign, encodeDesign, tl, toast } from '../site/cart'
import { sizeLabel } from '../site/pricing'
import type { ViewMode } from '../three/ConfiguratorScene'
import type { PanelUserData } from '../three/meshes'
import { useConfigurator } from '../useConfigurator'

const route = useRoute()
const product = productById(route.params.id as string) ?? products[0]!
const shared = typeof route.query.d === 'string' ? decodeDesign(route.query.d) : null
const type = typeBySlug(product.type)
const rules = rulesFor(product.ruleSet)
const cfg = useConfigurator(rules, shared && shared.family === product.design.family ? shared : product.design)
const { design, panels, cells, price, issues, catalog, selectedCells, selectCell, undo, redo, canUndo, canRedo } = cfg

const fam = computed(() => design.value.family)
const tabs = computed(() => {
  const list: { key: string; label: string; icon: Component }[] = [{ key: 'size', label: 'Ölçü', icon: Ruler }]
  if (['cabinet', 'desk', 'corner'].includes(fam.value)) {
    list.push({ key: 'layout', label: 'Bölmeler', icon: LayoutGrid }, { key: 'fronts', label: 'Kapaklar', icon: PanelTop })
  }
  if (['cabinet', 'desk'].includes(fam.value)) list.push({ key: 'extras', label: 'Ekstralar', icon: Lightbulb })
  if (['bed', 'bench', 'sofa', 'table', 'shape', 'mirror', 'corner'].includes(fam.value)) list.push({ key: 'features', label: 'Özellikler', icon: SlidersHorizontal })
  list.push({ key: 'finish', label: 'Renk', icon: Palette }, { key: 'summary', label: 'Özet', icon: ReceiptText })
  return list
})
const tab = ref('size')
// Ölçek referansı için 180 cm insan figürü varsayılan olarak açık.
const human = ref(true)
const dims = ref(true)
const open = ref(false)
const view = ref<ViewMode>('3d')
const views: { key: ViewMode; label: string }[] = [
  { key: 'front', label: 'Ön' },
  { key: 'side', label: 'Yan' },
  { key: 'top', label: 'Üst' },
]
const viewport = ref<InstanceType<typeof Viewport>>()
const hasFronts = computed(() => design.value.sections.some((s) => s.fronts.length > 0))
const dimValues = computed(() => {
  const d = design.value
  const base = ['cabinet', 'desk', 'corner'].includes(d.family) && d.base.kind !== 'none' ? d.base.height : 0
  return { width: d.overall.width, height: d.overall.height + base, depth: d.overall.depth }
})
// Liste fiyatı: kampanya indirimi gösterimi için (demo).
const listPrice = computed(() => Math.round((price.value.total * 1.12) / 50) * 50)

function onPick(d: PanelUserData | null, shift: boolean) {
  if (!d || d.section === undefined || d.compartment === undefined || !tabs.value.some((t) => t.key === 'fronts')) return
  selectCell(d.section, d.compartment, shift)
  if (!['layout', 'fronts', 'extras'].includes(tab.value)) tab.value = 'fronts'
}

const name = computed(() => (route.query.yeni ? `Yeni ${type?.title ?? 'tasarım'}` : product.name))

function addToCart() {
  cart.add({ productId: product.id, name: name.value, ruleSet: product.ruleSet, design: design.value, price: price.value.total })
}
function save() {
  cart.save({ productId: product.id, name: name.value, ruleSet: product.ruleSet, design: design.value, price: price.value.total })
}
async function share() {
  const url = `${location.origin}/tasarla/${product.id}?d=${encodeDesign(design.value)}`
  try {
    await navigator.clipboard.writeText(url)
    toast('Paylaşım bağlantısı kopyalandı')
  } catch {
    window.prompt('Bağlantıyı kopyalayın:', url)
  }
}
</script>

<template>
  <div class="cfg">
    <header class="topbar">
      <RouterLink to="/tasarimlar" class="icon-btn" aria-label="Tasarımlara dön"><ArrowLeft :size="18" /></RouterLink>
      <RouterLink to="/" class="logo" aria-label="Ana sayfa"><BrandLogo /></RouterLink>
      <span class="divider logo-divider" />
      <div class="title">
        <b>{{ name }}</b>
        <small class="muted">{{ type?.title }} · {{ sizeLabel(design) }}</small>
      </div>
      <div class="tools">
        <button class="icon-btn" :disabled="!canUndo" title="Geri al" aria-label="Geri al" @click="undo"><Undo2 :size="18" /></button>
        <button class="icon-btn" :disabled="!canRedo" title="Yinele" aria-label="Yinele" @click="redo"><Redo2 :size="18" /></button>
        <button class="icon-btn" title="Tasarımı kaydet" aria-label="Kaydet" @click="save"><Bookmark :size="18" /></button>
        <button class="icon-btn" title="Bağlantıyı paylaş" aria-label="Paylaş" @click="share"><Share2 :size="18" /></button>
        <RouterLink to="/sepet" class="icon-btn" title="Sepet" aria-label="Sepet">
          <ShoppingBag :size="18" /><span v-if="cart.count.value" class="badge-count">{{ cart.count.value }}</span>
        </RouterLink>
      </div>
    </header>

    <div class="layout">
      <section class="stage">
        <Viewport
          ref="viewport"
          :panels="panels"
          :cells="cells"
          :catalog="catalog"
          :human="human"
          :dims="dims"
          :dim-values="dimValues"
          :open="open"
          :view="view"
          :selection="selectedCells"
          @pick="onPick"
        />
        <div class="rail" role="toolbar" aria-label="Görünüm araçları">
          <button class="rail-btn" :class="{ active: human }" title="180 cm insan figürü" aria-label="İnsan figürünü göster" :aria-pressed="human" @click="human = !human">
            <PersonStanding :size="19" /><span>İnsan</span>
          </button>
          <button class="rail-btn" :class="{ active: dims }" title="Ölçüleri göster" aria-label="Ölçüleri göster" :aria-pressed="dims" @click="dims = !dims">
            <RulerDimensionLine :size="19" /><span>Ölçü</span>
          </button>
          <button v-if="hasFronts" class="rail-btn" :class="{ active: open }" :title="open ? 'Kapakları kapat' : 'Kapakları aç'" :aria-pressed="open" @click="open = !open">
            <DoorOpen v-if="!open" :size="19" /><DoorClosed v-else :size="19" /><span>{{ open ? 'Kapat' : 'Aç' }}</span>
          </button>
          <button class="rail-btn" :class="{ active: view !== '3d' }" title="2D teknik görünüş" :aria-pressed="view !== '3d'" @click="view = view === '3d' ? 'front' : '3d'">
            <b>{{ view === '3d' ? '2D' : '3D' }}</b><span>Görünüş</span>
          </button>
          <button class="rail-btn" title="Kamerayı ortala" aria-label="Kamerayı ortala" @click="viewport?.reframe()">
            <Focus :size="19" /><span>Ortala</span>
          </button>
        </div>
        <div v-if="view !== '3d'" class="views" role="tablist" aria-label="2D görünüş">
          <button v-for="v in views" :key="v.key" :class="{ active: view === v.key }" @click="view = v.key">{{ v.label }}</button>
        </div>
        <div class="price-box">
          <small class="muted">KDV ve kargo dahil</small>
          <span class="prices"><s>{{ tl(listPrice) }}</s><b>{{ tl(price.total) }}</b></span>
          <small class="deal">Peşin ödemede ek %10 indirim</small>
          <button class="btn accent" @click="addToCart"><ShoppingBag :size="16" /> Sepete ekle</button>
          <small class="muted eta">Tahmini teslim: 15 iş günü</small>
        </div>
        <RouterLink to="/iletisim" class="support"><Headset :size="18" /> <span>Ücretsiz tasarım desteği</span></RouterLink>
        <p class="hint"><MousePointerClick :size="14" /> Sürükleyerek döndürün · tekerlekle yakınlaştırın · bölmeye tıklayarak seçin</p>
      </section>

      <aside class="panel">
        <nav class="tabs">
          <button v-for="t in tabs" :key="t.key" :class="{ active: tab === t.key }" @click="tab = t.key">
            <component :is="t.icon" :size="19" :stroke-width="1.7" />{{ t.label }}
          </button>
        </nav>
        <ul v-if="issues.length" class="issues">
          <li v-for="(i, n) in issues" :key="n" :class="i.level">{{ i.message }}</li>
        </ul>
        <div class="panel-body">
          <SizeTab v-if="tab === 'size'" :cfg="cfg" />
          <LayoutTab v-else-if="tab === 'layout'" :cfg="cfg" />
          <FrontsTab v-else-if="tab === 'fronts'" :cfg="cfg" />
          <ExtrasTab v-else-if="tab === 'extras'" :cfg="cfg" />
          <FeaturesTab v-else-if="tab === 'features'" :cfg="cfg" />
          <FinishTab v-else-if="tab === 'finish'" :cfg="cfg" />
          <SummaryTab v-else :cfg="cfg" />
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.cfg {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100dvh;
  background: var(--bg);
}
.topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}
.logo {
  text-decoration: none;
}
.divider {
  width: 1px;
  height: 28px;
  background: var(--line);
}
.title {
  display: grid;
  flex: 1;
  line-height: 1.25;
  min-width: 0;
}
.title b {
  font-family: var(--serif);
  font-size: 18px;
  font-weight: 600;
}
.title b,
.title small {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.title small {
  font-size: 12.5px;
}
.tools {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}
.tools .icon-btn {
  width: 40px;
  height: 40px;
}
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  min-height: 0;
  min-width: 0;
}
.rail {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px;
  border-radius: 18px;
  background: rgb(255 255 255 / 0.82);
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-sm);
}
.rail-btn {
  display: grid;
  justify-items: center;
  gap: 2px;
  width: 54px;
  padding: 8px 0 6px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--ink-2);
  cursor: pointer;
  font-size: 10.5px;
  font-weight: 500;
  transition:
    background 0.15s,
    color 0.15s;
}
.rail-btn b {
  font-size: 14px;
  line-height: 19px;
}
.rail-btn:hover {
  background: var(--surface-2);
}
.rail-btn.active {
  background: var(--ink);
  color: #fff;
}
.stage {
  position: relative;
  min-height: 0;
  overflow: hidden;
}
.price-box {
  position: absolute;
  top: 18px;
  right: 18px;
  display: grid;
  justify-items: end;
  gap: 2px;
  padding: 16px 18px;
  border-radius: 20px;
  background: rgb(255 255 255 / 0.94);
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow);
}
.price-box small {
  font-size: 12px;
}
.price-box b {
  font-family: var(--serif);
  font-size: 30px;
  font-weight: 600;
  line-height: 1.1;
}
.price-box .btn {
  margin-top: 10px;
}
.hint {
  position: absolute;
  left: 18px;
  bottom: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.78);
  color: var(--ink-2);
  font-size: 12px;
}
.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--surface);
  border-left: 1px solid var(--line);
}
.tabs {
  display: flex;
  gap: 4px;
  padding: 10px;
  border-bottom: 1px solid var(--line);
  overflow-x: auto;
}
.tabs button {
  flex: 1;
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 9px 4px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  transition:
    background 0.15s,
    color 0.15s;
}
.tabs button:hover {
  color: var(--ink);
}
.tabs button.active {
  background: var(--ink);
  color: #fff;
}
.issues {
  margin: 12px 12px 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 4px;
  font-size: 12.5px;
}
.issues li {
  padding: 8px 10px;
  border-radius: 10px;
}
.issues .warning {
  background: #fdf3df;
  color: #7a5200;
}
.issues .error {
  background: #fde8e8;
  color: #9b1c1c;
}
.issues .info {
  background: var(--sage-soft);
  color: var(--sage);
}
.text-btn {
  font-weight: 700;
  font-size: 13px;
}
.views {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.92);
  box-shadow: var(--shadow-sm);
}
.views button {
  padding: 6px 16px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}
.views button.active {
  background: var(--ink);
  color: #fff;
}
.prices {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.prices s {
  color: var(--muted);
  font-size: 15px;
}
.deal {
  color: var(--sage);
  font-weight: 600;
  font-size: 12px;
}
.eta {
  font-size: 11.5px;
}
.support {
  position: absolute;
  right: 18px;
  bottom: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 999px;
  background: var(--sage);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  box-shadow: var(--shadow);
}
.panel-body {
  flex: 1;
  overflow: auto;
  padding: 18px;
}

@media (max-width: 1100px) {
  .logo,
  .logo-divider {
    display: none;
  }
}
@media (max-width: 860px) {
  .cfg {
    grid-template-rows: auto minmax(0, 1fr);
  }
  .layout {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: 46dvh minmax(0, 1fr);
  }
  .rail {
    top: 10px;
    left: 10px;
    gap: 2px;
    padding: 4px;
    border-radius: 14px;
  }
  .rail-btn {
    width: 46px;
    padding: 6px 0 4px;
    font-size: 9.5px;
  }
  .rail-btn svg {
    width: 17px;
    height: 17px;
  }
  .title b {
    font-size: 16px;
  }
  .tabs {
    padding: 8px;
    gap: 2px;
  }
  .tabs button {
    min-width: 62px;
    padding: 7px 2px;
    font-size: 11px;
  }
  .issues {
    max-height: 76px;
    overflow-y: auto;
    margin: 8px 8px 0;
  }
  .panel-body {
    padding: 16px 14px 90px;
  }
  .panel {
    border-left: 0;
    border-top: 1px solid var(--line);
  }
  .title small,
  .hide-sm {
    display: none;
  }
  .topbar {
    padding: 8px 10px;
    gap: 8px;
  }
  .tools {
    gap: 4px;
  }
  .tools .icon-btn {
    width: 34px;
    height: 34px;
  }
  /* Telefonda fiyat ve sepete ekle ekranın altında sabit şerit. */
  .price-box {
    position: fixed;
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
    border-radius: 0;
    background: rgb(255 255 255 / 0.96);
    border-top: 1px solid var(--line);
    box-shadow: 0 -6px 20px rgb(29 26 22 / 0.08);
  }
  .prices {
    display: grid;
    gap: 0;
    line-height: 1.1;
  }
  .prices s {
    display: block !important;
    font-size: 12px;
  }
  .price-box b {
    font-size: 24px;
  }
  .price-box .btn {
    margin: 0;
    padding: 13px 20px;
  }
  .price-box > small {
    display: none;
  }
  .hint,
  .deal,
  .eta,
  .support span {
    display: none;
  }
  .support {
    left: auto;
    right: 10px;
    top: 10px;
    bottom: auto;
    padding: 10px;
  }
  .views {
    top: 10px;
  }
}
</style>
