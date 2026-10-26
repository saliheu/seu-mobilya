<script setup lang="ts">
import { computed } from 'vue'
import * as A from '../../core/actions'
import type { BaseKind, Design } from '../../core/types'
import type { Configurator } from '../../useConfigurator'
import NumberField from './NumberField.vue'
import OptionTile from './OptionTile.vue'

const props = defineProps<{ cfg: Configurator }>()
const { design, rules, apply } = props.cfg

const fam = computed(() => design.value.family)
const isCircle = computed(() => fam.value === 'shape' && design.value.shape?.kind === 'circle')
const flat = computed(() => fam.value === 'mirror' || (fam.value === 'shape' && design.value.shape?.kind !== 'cubes'))
const hasTop = computed(() => ['cabinet', 'desk', 'corner', 'table', 'bench'].includes(fam.value))
const hasOverhang = computed(() => ['cabinet', 'desk', 'bench'].includes(fam.value))
const hasBase = computed(() => ['cabinet', 'desk', 'corner'].includes(fam.value) || (fam.value === 'bench' && !!design.value.bench?.boxed))
const hasElevation = computed(() => design.value.elevation > 0 || fam.value === 'mirror' || flat.value)
const hasRadius = computed(() => ['table', 'bench', 'mirror'].includes(fam.value) || (fam.value === 'shape' && design.value.shape?.kind === 'rect') || hasTop.value)

const heightLabel = computed(() => (['cabinet', 'desk', 'corner'].includes(fam.value) ? 'Gövde yüksekliği' : 'Yükseklik'))
const bases: { value: BaseKind; label: string; icon: string }[] = [
  { value: 'none', label: 'Yok', icon: 'base-none' },
  { value: 'glides', label: 'Pabuç', icon: 'base-glides' },
  { value: 'plinth', label: 'Baza', icon: 'base-plinth' },
  { value: 'legs', label: 'Ayak', icon: 'base-legs' },
  { value: 'wheels', label: 'Teker', icon: 'base-wheels' },
]
const setBase = (k: BaseKind) => apply(A.setBase(design.value, k, rules))

const setSize = (key: keyof Design['overall'], v: number) => apply(A.setOverall(design.value, key, v))
const setOverhang = (side: keyof Design['top']['overhang'], v: number) => apply(A.setOverhang(design.value, side, v))
const setElevation = (v: number) => apply(A.setElevation(design.value, v))
const setRadius = (v: number) => apply(A.setRadius(design.value, v))
const setBaseHeight = (v: number) => apply(A.setBaseHeight(design.value, v))
const setSides = (v: number) => {
  let d = A.setOverhang(design.value, 'left', v).design
  d = A.setOverhang(d, 'right', v).design
  apply({ design: d })
}
</script>

<template>
  <div class="stack">
    <NumberField
      :label="isCircle ? 'Çap' : 'Genişlik'"
      :value="design.overall.width"
      :min="rules.overall.width.min"
      :max="rules.overall.width.max"
      :step="10"
      @update="(v) => setSize('width', v)"
    />
    <NumberField
      v-if="!isCircle"
      :label="heightLabel"
      :value="design.overall.height"
      :min="rules.overall.height.min"
      :max="Math.min(rules.overall.height.max, 3600)"
      :step="10"
      @update="(v) => setSize('height', v)"
    />
    <NumberField
      v-if="!flat"
      label="Derinlik"
      :value="design.overall.depth"
      :min="rules.overall.depth.min"
      :max="rules.overall.depth.max"
      :step="10"
      @update="(v) => setSize('depth', v)"
    />
    <NumberField
      v-if="hasElevation"
      label="Yerden yükseklik"
      :value="design.elevation"
      :min="rules.elevation.min"
      :max="rules.elevation.max"
      :step="10"
      @update="setElevation"
    />

    <template v-if="hasTop">
      <div class="row">
        <span class="label">Tabla kalınlığı</span>
        <div class="segmented">
          <button v-for="t in rules.topThicknesses" :key="t" :class="{ active: design.top.thickness === t }" @click="apply(A.setTopThickness(design, t))">
            {{ t }} mm
          </button>
        </div>
      </div>
    </template>
    <template v-if="hasOverhang">
      <NumberField label="Tabla önden taşma" :value="design.top.overhang.front" :min="0" :max="Math.min(rules.overhangMax, 200)" @update="(v) => setOverhang('front', v)" />
      <NumberField label="Tabla yanlardan taşma" :value="design.top.overhang.left" :min="0" :max="Math.min(rules.overhangMax, 200)" @update="setSides" />
    </template>
    <NumberField v-if="hasRadius" label="Köşe yuvarlatma" :value="design.top.radius" :min="0" :max="200" :step="5" @update="setRadius" />

    <template v-if="hasBase">
      <div class="block">
        <span class="label">Ayak tipi</span>
        <div class="tiles">
          <OptionTile v-for="b in bases" :key="b.value" :icon="b.icon" :label="b.label" :active="design.base.kind === b.value" @select="setBase(b.value)" />
        </div>
      </div>
      <NumberField
        v-if="design.base.kind === 'legs' || design.base.kind === 'wheels' || design.base.kind === 'plinth'"
        :label="design.base.kind === 'plinth' ? 'Baza yüksekliği' : 'Ayak yüksekliği'"
        :value="design.base.height"
        :min="design.base.kind === 'plinth' ? 40 : rules.base.min"
        :max="design.base.kind === 'plinth' ? 200 : rules.base.max"
        :step="5"
        @update="setBaseHeight"
      />
    </template>

  </div>
</template>

<style scoped>
.block {
  display: grid;
  gap: 8px;
}
.tiles {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}
</style>
