<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next'
import { computed } from 'vue'
import * as A from '../../core/actions'
import type { Configurator } from '../../useConfigurator'
import CellMap from './CellMap.vue'
import NumberField from './NumberField.vue'

const props = defineProps<{ cfg: Configurator }>()
const { design, rules, apply, selection, selectCell } = props.cfg

const fam = computed(() => design.value.family)
const sel = computed(() => selection.value)
const section = computed(() => (sel.value ? design.value.sections[sel.value.section] : undefined))
const compartment = computed(() => (sel.value && section.value ? section.value.compartments[sel.value.start] : undefined))
const maxSections = 10
const maxCompartments = 12

const d = () => design.value
const setCount = (n: number) => apply(A.setSectionCount(d(), n))
const setWidth = (v: number) => sel.value && apply(A.setSectionWidth(d(), sel.value.section, v))
const setComps = (n: number) => sel.value && apply(A.setCompartmentCount(d(), sel.value.section, n))
const setHeight = (v: number) => sel.value && apply(A.setCompartmentHeight(d(), sel.value.section, sel.value.start, v))
const setKnee = (knee: boolean) => sel.value && apply(A.setKnee(d(), sel.value.section, knee))
const pickFirst = (si: number) => selectCell(si, 0)
</script>

<template>
  <div class="stack">
    <div v-if="fam !== 'corner'" class="row">
      <span class="label">Sütun sayısı</span>
      <div class="stepper">
        <button :disabled="design.sections.length <= 1" aria-label="Sütun azalt" @click="setCount(design.sections.length - 1)"><Minus :size="14" /></button>
        <b>{{ design.sections.length }}</b>
        <button :disabled="design.sections.length >= maxSections" aria-label="Sütun ekle" @click="setCount(design.sections.length + 1)"><Plus :size="14" /></button>
      </div>
    </div>

    <CellMap :design="design" :selection="sel" @select="(si, ci, ext) => selectCell(si, ci, ext)" />

    <div v-if="!sel" class="empty">
      <b>Bir bölme seçin</b>
      <p>Sütun genişliğini, raf sayısını ve bölme yüksekliğini düzenlemek için şemada ya da 3D görünümde bir bölmeye tıklayın.</p>
      <div v-if="design.sections.some((s) => s.knee)" class="knees">
        <button v-for="(s, si) in design.sections" v-show="s.knee" :key="si" class="chip" @click="pickFirst(si)">Sütun {{ si + 1 }} (diz boşluğu)</button>
      </div>
    </div>

    <template v-else-if="section">
      <div class="pcard">
        <div class="row">
          <b>{{ fam === 'corner' ? 'Köşe gövdesi' : `Sütun ${sel.section + 1}` }}</b>
          <small class="muted">{{ section.compartments.length }} bölme</small>
        </div>
        <NumberField
          v-if="design.sections.length > 1"
          label="Sütun genişliği (iç)"
          :value="section.width"
          :min="rules.section.min"
          :max="rules.section.max"
          @update="setWidth"
        />
        <div v-if="!section.knee" class="row">
          <span class="label">Raf sayısı</span>
          <div class="stepper">
            <button :disabled="section.compartments.length <= 1" aria-label="Raf azalt" @click="setComps(section.compartments.length - 1)"><Minus :size="14" /></button>
            <b>{{ section.compartments.length - 1 }}</b>
            <button :disabled="section.compartments.length >= maxCompartments" aria-label="Raf ekle" @click="setComps(section.compartments.length + 1)"><Plus :size="14" /></button>
          </div>
        </div>
        <label v-if="fam === 'desk'" class="check">
          <input type="checkbox" :checked="section.knee" @change="setKnee(!section.knee)" /> Diz boşluğu (açık alan)
        </label>
      </div>

      <div v-if="compartment" class="pcard">
        <div class="row">
          <b>Bölme {{ sel.start + 1 }}</b>
          <small class="muted">alttan sayılır</small>
        </div>
        <NumberField label="Bölme yüksekliği (iç)" :value="compartment.height" :min="rules.compartment.minHeight" :max="design.overall.height" @update="setHeight" />
        <p class="hint">Diğer bölmeler farkı otomatik paylaşır; toplam yükseklik korunur.</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.empty {
  padding: 16px;
  border-radius: 14px;
  background: var(--surface-2);
}
.empty p {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 13px;
}
.knees {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.check {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13.5px;
}
.hint {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}
.stepper button {
  display: grid;
  place-items: center;
}
</style>
