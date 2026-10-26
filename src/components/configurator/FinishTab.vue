<script setup lang="ts">
import { computed, ref } from 'vue'
import { catalog, fabrics, findGroup, findMaterial, findRal, METAL, woods, type CatalogMaterial } from '../../catalog/catalog'
import * as A from '../../core/actions'
import type { Design, Finish } from '../../core/types'
import { woodSwatch } from '../../three/materials'
import type { Configurator } from '../../useConfigurator'

type Part = keyof Design['finish']
const props = defineProps<{ cfg: Configurator }>()
const { design, apply } = props.cfg

const LABELS: Record<Part, string> = {
  carcass: 'Gövde',
  front: 'Kapak ve çekmeceler',
  top: 'Tabla',
  accent: 'Ayak ve detaylar',
  fabric: 'Kumaş',
  back: 'Arkalık',
  edge: 'Kenar bandı',
}
/** Arkalık ve kenar bandı ayrıca seçilmediyse parçanın kendi rengini alır. */
const finishOf = (p: Part): Finish => design.value.finish[p] ?? design.value.finish.carcass
const inherits = (p: Part) => (p === 'back' || p === 'edge') && !design.value.finish[p]

const parts = computed<Part[]>(() => {
  const d = design.value
  const hasFronts = d.sections.some((s) => s.fronts.length > 0)
  switch (d.family) {
    case 'cabinet':
    case 'desk':
    case 'corner':
      return [
        'carcass',
        'top',
        ...(hasFronts ? (['front'] as Part[]) : []),
        ...(d.sections.some((s) => s.compartments.some((c) => c.back)) ? (['back'] as Part[]) : []),
        'edge',
        ...(d.base.kind === 'legs' || d.handle === 'bar' ? (['accent'] as Part[]) : []),
      ]
    case 'table':
      return ['top', 'accent']
    case 'bed':
      return ['carcass', ...(d.bed?.drawers ? (['front'] as Part[]) : []), 'accent']
    case 'bench':
      return ['carcass', 'top', ...(d.bench?.cushion ? (['fabric'] as Part[]) : [])]
    case 'sofa':
      return ['carcass', 'fabric', 'accent']
    default:
      return ['carcass']
  }
})

const part = ref<Part>('carcass')
const activePart = computed<Part>(() => (parts.value.includes(part.value) ? part.value : parts.value[0]!))
const current = computed(() => finishOf(activePart.value))

const groups = computed(() => {
  if (activePart.value === 'fabric') return [{ id: 'kumas', name: 'Kumaş', materials: fabrics() }]
  if (activePart.value === 'accent') return [{ id: 'masif', name: 'Masif ağaç', materials: woods() }, { id: 'metal', name: 'Metal', materials: [findMaterial(catalog, METAL)!] }]
  return catalog.groups.filter((g) => g.selectable)
})
const groupTab = ref<string | null>(null)
const activeGroup = computed(() => groups.value.find((g) => g.id === groupTab.value) ?? groups.value.find((g) => g.materials.some((m) => m.id === current.value.material)) ?? groups.value[0]!)

const ralQuery = ref('')
const rals = computed(() => {
  const q = ralQuery.value.trim()
  return q ? catalog.rals.filter((r) => r.code.includes(q)) : catalog.rals
})

function pick(m: CatalogMaterial) {
  const color = m.kind === 'lacquer' ? (current.value.color ?? catalog.rals.find((r) => r.code === 'RAL 9010')?.hex ?? null) : null
  apply(A.setFinish(design.value, activePart.value, { material: m.id, color }))
}
function pickRal(hex: string) {
  apply(A.setFinish(design.value, activePart.value, { material: 157, color: hex }))
}
const label = (f: Finish) => {
  const m = findMaterial(catalog, f.material)
  const ral = findRal(f.color)
  return [findGroup(f.material)?.name, m?.kind === 'lacquer' ? ral?.code ?? f.color : m?.name].filter(Boolean).join(' · ')
}
const swatchStyle = (m: CatalogMaterial) =>
  m.kind === 'wood' ? { background: `${m.color} url(${woodSwatch(m.color)}) center / cover` } : { background: m.color }
const dotStyle = (f: Finish) => {
  const m = findMaterial(catalog, f.material)
  return m?.kind === 'wood' ? { background: `${m.color} url(${woodSwatch(m.color)}) center / cover` } : { background: f.color ?? m?.color }
}
const resetPart = () => (activePart.value === 'back' || activePart.value === 'edge') && apply(A.clearFinish(design.value, activePart.value))
</script>

<template>
  <div class="stack">
    <div class="parts">
      <button v-for="p in parts" :key="p" class="part" :class="{ active: activePart === p }" @click="(part = p), (groupTab = null)">
        <span class="dot" :style="dotStyle(finishOf(p))" />
        <span>
          <b>{{ LABELS[p] }}</b>
          <small class="muted">{{ inherits(p) ? 'Gövdeyle aynı' : label(finishOf(p)) }}</small>
        </span>
      </button>
    </div>

    <button v-if="(activePart === 'back' || activePart === 'edge') && !inherits(activePart)" class="chip reset" @click="resetPart">Gövdeyle aynı yap</button>

    <div v-if="groups.length > 1" class="groups">
      <button v-for="g in groups" :key="g.id" class="chip" :class="{ active: activeGroup.id === g.id }" @click="groupTab = g.id">{{ g.name }}</button>
    </div>
    <p v-if="'description' in activeGroup && activeGroup.description" class="muted desc">{{ activeGroup.description }}</p>

    <div class="swatches">
      <button
        v-for="m in activeGroup.materials"
        :key="m.id"
        class="swatch"
        :class="{ active: !inherits(activePart) && current.material === m.id, lacquer: m.kind === 'lacquer' }"
        :style="swatchStyle(m)"
        :title="m.name"
        @click="pick(m)"
      >
        <small>{{ m.name }}</small>
      </button>
    </div>

    <template v-if="findMaterial(catalog, current.material)?.kind === 'lacquer'">
      <div class="row">
        <span class="label">RAL rengi · {{ findRal(current.color)?.code ?? current.color }}</span>
        <input v-model="ralQuery" class="input ral-search" placeholder="RAL ara (ör. 9010)" />
      </div>
      <div class="rals">
        <button v-for="r in rals" :key="r.code" class="ral" :class="{ active: current.color === r.hex }" :style="{ background: r.hex }" :title="r.code" @click="pickRal(r.hex)" />
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Parçalar yana kaydırılan kompakt kartlar: renk kartları hemen altında görünür kalır. */
.parts {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin: 0 -2px;
  padding: 2px 2px 6px;
  scroll-snap-type: x proximity;
}
.part {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: none;
  min-width: 150px;
  max-width: 200px;
  padding: 8px 12px 8px 8px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  text-align: left;
  cursor: pointer;
  scroll-snap-align: start;
}
.part small {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11.5px;
}
.part span:last-child {
  display: grid;
}
.part.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-soft);
}
.dot {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid var(--line);
  flex: none;
}
.groups {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.groups .chip {
  flex: none;
}
.groups .chip {
  padding: 6px 10px;
  font-size: 13px;
}
.desc {
  margin: 0;
  font-size: 13px;
}
.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 8px;
}
.swatch {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  border: 1px solid var(--line);
  cursor: pointer;
  padding: 0;
  overflow: hidden;
}
.swatch small {
  position: absolute;
  inset: auto 0 0 0;
  padding: 2px 4px;
  background: rgb(255 255 255 / 0.85);
  font-size: 10px;
  line-height: 1.3;
  color: var(--ink);
}
.reset {
  justify-self: start;
}
.swatch.lacquer {
  background-image: conic-gradient(#e85d4a, #f2c14e, #6cbf84, #4a90d9, #9b6fd1, #e85d4a) !important;
}
.swatch.active,
.ral.active {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.ral-search {
  max-width: 150px;
  padding: 6px 8px;
  font-size: 13px;
}
.rals {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(26px, 1fr));
  gap: 4px;
  max-height: 220px;
  overflow: auto;
  padding: 2px;
}
.ral {
  aspect-ratio: 1;
  border: 1px solid rgb(0 0 0 / 0.1);
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
}
</style>
