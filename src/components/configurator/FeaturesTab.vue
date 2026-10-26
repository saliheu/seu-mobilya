<script setup lang="ts">
import { computed } from 'vue'
import * as A from '../../core/actions'
import type { Design } from '../../core/types'
import type { Configurator } from '../../useConfigurator'
import NumberField from './NumberField.vue'

const props = defineProps<{ cfg: Configurator }>()
const { design, rules, apply } = props.cfg
const fam = computed(() => design.value.family)

const bed = (patch: Partial<NonNullable<Design['bed']>>) => apply(A.setExtra(design.value, 'bed', patch))
const bench = (patch: Partial<NonNullable<Design['bench']>>) => apply(A.setExtra(design.value, 'bench', patch))
const sofa = (patch: Partial<NonNullable<Design['sofa']>>) => apply(A.setExtra(design.value, 'sofa', patch))
const table = (patch: Partial<NonNullable<Design['table']>>) => apply(A.setExtra(design.value, 'table', patch))
const shape = (patch: Partial<NonNullable<Design['shape']>>) => apply(A.setExtra(design.value, 'shape', patch))
const mirror = (patch: Partial<NonNullable<Design['mirror']>>) => apply(A.setExtra(design.value, 'mirror', patch))
const corner = (patch: Partial<NonNullable<Design['corner']>>) => apply(A.setExtra(design.value, 'corner', patch))
const chaise = (on: boolean) =>
  sofa({ chaise: on ? { width: Math.round(design.value.overall.width * 0.33), depth: Math.max(design.value.overall.depth + 200, 900) } : null })
const setLegHeight = (v: number) => apply(A.setBaseHeight(design.value, v))
</script>

<template>
  <div class="stack">
    <template v-if="fam === 'bed' && design.bed">
      <NumberField label="Başlık yüksekliği (gövde üstü)" :value="design.bed.headboard" :min="0" :max="900" :step="10" @update="(v) => bed({ headboard: v })" />
      <NumberField label="Ayak ucu yüksekliği" :value="design.bed.footboard" :min="0" :max="400" :step="10" @update="(v) => bed({ footboard: v })" />
      <NumberField label="Yan kayıt yüksekliği" :value="design.bed.rail" :min="rules.bed.railMin" :max="Math.max(rules.bed.railMin, design.overall.height)" :step="5" @update="(v) => bed({ rail: v })" />
      <label class="check"><input type="checkbox" :checked="design.bed.drawers" @change="bed({ drawers: !design.bed!.drawers })" /> Yatak altı çekmece</label>
      <label class="check"><input type="checkbox" :checked="design.bed.mattress" @change="bed({ mattress: !design.bed!.mattress })" /> Yatak dahil</label>
    </template>

    <template v-else-if="fam === 'bench' && design.bench">
      <label class="check"><input type="checkbox" :checked="design.bench.cushion" @change="bench({ cushion: !design.bench!.cushion })" /> Minder</label>
      <label class="check"><input type="checkbox" :checked="design.bench.boxed" @change="bench({ boxed: !design.bench!.boxed })" /> Kapalı (sandık) gövde</label>
      <NumberField v-if="!design.bench.boxed" label="Alt kayıt yüksekliği" :value="design.bench.stretcher" :min="60" :max="200" :step="5" @update="(v) => bench({ stretcher: v })" />
    </template>

    <template v-else-if="fam === 'sofa' && design.sofa">
      <label class="check"><input type="checkbox" :checked="design.sofa.armrests" @change="sofa({ armrests: !design.sofa!.armrests })" /> Kolçaklar</label>
      <label class="check"><input type="checkbox" :checked="design.sofa.backrest" @change="sofa({ backrest: !design.sofa!.backrest })" /> Sırtlık</label>
      <label class="check"><input type="checkbox" :checked="!!design.sofa.chaise" @change="chaise(!design.sofa!.chaise)" /> L köşe (şezlong)</label>
      <template v-if="design.sofa.chaise">
        <NumberField label="Şezlong genişliği" :value="design.sofa.chaise.width" :min="400" :max="design.overall.width - 400" :step="10" @update="(v) => sofa({ chaise: { ...design.sofa!.chaise!, width: v } })" />
        <NumberField label="Şezlong derinliği" :value="design.sofa.chaise.depth" :min="design.overall.depth" :max="1800" :step="10" @update="(v) => sofa({ chaise: { ...design.sofa!.chaise!, depth: v } })" />
      </template>
      <NumberField label="Ayak yüksekliği" :value="design.base.height" :min="rules.base.min" :max="rules.base.max" :step="5" @update="setLegHeight" />
    </template>

    <template v-else-if="fam === 'table' && design.table">
      <div class="block">
        <span class="label">Ayak tipi</span>
        <div class="segmented">
          <button :class="{ active: design.table.legs === 'square' }" @click="table({ legs: 'square' })">Köşebent</button>
          <button :class="{ active: design.table.legs === 'round' }" @click="table({ legs: 'round' })">Yuvarlak</button>
          <button :class="{ active: design.table.legs === 'panel' }" @click="table({ legs: 'panel' })">Panel</button>
        </div>
      </div>
      <NumberField label="Etek yüksekliği (0 = yok)" :value="design.table.apron" :min="0" :max="200" :step="5" @update="(v) => table({ apron: v })" />
    </template>

    <template v-else-if="fam === 'shape' && design.shape">
      <NumberField v-if="design.shape.kind === 'cubes'" label="Küp sayısı" unit="adet" :value="design.shape.count" :min="rules.cubes.count.min" :max="rules.cubes.count.max" @update="(v) => shape({ count: v })" />
      <p v-else class="muted">Bu panelin ölçüsünü ve rengini Ölçü ve Renk sekmelerinden değiştirebilirsiniz.</p>
    </template>

    <template v-else-if="fam === 'mirror' && design.mirror">
      <NumberField label="Çerçeve genişliği" :value="design.mirror.frame" :min="20" :max="200" :step="5" @update="(v) => mirror({ frame: v })" />
    </template>

    <template v-else-if="fam === 'corner' && design.corner">
      <NumberField label="Sağ kanat derinliği" :value="design.corner.wingZ" :min="design.overall.depth * 0.25" :max="design.overall.depth * 0.9" :step="10" @update="(v) => corner({ wingZ: v })" />
      <NumberField label="Sol kanat genişliği" :value="design.corner.wingX" :min="design.overall.width * 0.25" :max="design.overall.width * 0.9" :step="10" @update="(v) => corner({ wingX: v })" />
    </template>
  </div>
</template>

<style scoped>
.check {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.block {
  display: grid;
  gap: 6px;
}
</style>
