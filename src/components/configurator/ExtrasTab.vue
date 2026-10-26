<script setup lang="ts">
import { computed } from 'vue'
import * as A from '../../core/actions'
import type { Compartment, Design } from '../../core/types'
import type { Configurator } from '../../useConfigurator'
import CellMap from './CellMap.vue'
import NumberField from './NumberField.vue'
import OptionTile from './OptionTile.vue'

const props = defineProps<{ cfg: Configurator }>()
const { design, apply, selection, selectCell } = props.cfg

const sel = computed(() => selection.value)
const section = computed(() => (sel.value ? design.value.sections[sel.value.section] : undefined))
const comps = computed<{ c: Compartment; i: number }[]>(() => {
  const s = sel.value
  if (!s || !section.value || section.value.knee) return []
  return section.value.compartments.map((c, i) => ({ c, i })).filter(({ i }) => i >= s.start && i <= s.end)
})
/** Seçimdeki tüm bölmelerde açıksa "açık" sayılır. */
const allOn = (key: 'back' | 'hanger' | 'light') => comps.value.length > 0 && comps.value.every(({ c }) => !!c[key])
const anyLights = computed(() => design.value.sections.some((s) => s.compartments.some((c) => c.light)))
const canSkirt = computed(() => design.value.elevation === 0 && design.value.sides === 1)

function toggle(key: 'back' | 'hanger' | 'light') {
  const s = sel.value
  if (!s) return
  const target = !allOn(key)
  let d: Design = design.value
  for (const { c, i } of comps.value) if (!!c[key] !== target) d = A.toggleCompartment(d, s.section, i, key).design
  apply({ design: d })
}
function setDivider(v: number) {
  const s = sel.value
  if (!s) return
  let d: Design = design.value
  for (const { i } of comps.value) d = A.setDivider(d, s.section, i, v <= 0 || v >= 100 ? null : v / 100).design
  apply({ design: d })
}
const dividerValue = computed(() => Math.round((comps.value[0]?.c.divider ?? 0) * 100))
const setAllLights = () => apply(A.setAllLights(design.value, !anyLights.value))
const toggleSkirting = () => apply(A.setSkirting(design.value, design.value.skirting ? null : { height: 80, depth: 15 }))
const setSkirt = (key: 'height' | 'depth', v: number) => design.value.skirting && apply(A.setSkirting(design.value, { ...design.value.skirting, [key]: v }))
</script>

<template>
  <div class="stack">
    <CellMap :design="design" :selection="sel" @select="(si, ci, ext) => selectCell(si, ci, ext)" />

    <section v-if="comps.length">
      <h4>Seçili bölme <small class="muted">{{ comps.length > 1 ? `${comps.length} bölme` : `Bölme ${sel!.start + 1}` }}</small></h4>
      <div class="tiles">
        <OptionTile icon="back-on" label="Arkalık" :active="allOn('back')" @select="toggle('back')" />
        <OptionTile icon="light" label="LED ışık" :active="allOn('light')" @select="toggle('light')" />
        <OptionTile icon="hanger" label="Askı borusu" :active="allOn('hanger')" @select="toggle('hanger')" />
      </div>
      <NumberField class="divider" label="Dikey bölücü konumu (0 = yok)" unit="%" :value="dividerValue" :min="0" :max="90" :step="5" @update="setDivider" />
    </section>
    <div v-else class="empty">
      <b>Bölmeye özel ekstralar</b>
      <p>Arkalık, LED aydınlatma, askı borusu ve dikey bölücü eklemek için bir bölme seçin.</p>
    </div>

    <section>
      <h4>Tüm ünite</h4>
      <div class="tiles">
        <OptionTile icon="light" :label="anyLights ? 'Işıkları kaldır' : 'Tüm bölmelere LED'" :active="anyLights" @select="setAllLights" />
        <OptionTile
          icon="skirting"
          label="Süpürgelik oyuğu"
          :active="!!design.skirting"
          :disabled="!canSkirt"
          :hint="canSkirt ? 'Yan dikmelerin arka-alt köşesi süpürgelik için oyulur; dolap duvara tam yaslanır.' : 'Yalnız yere basan, duvara dayalı ünitelerde'"
          @select="toggleSkirting"
        />
      </div>
      <template v-if="design.skirting">
        <NumberField label="Süpürgelik yüksekliği" :value="design.skirting.height" :min="20" :max="150" :step="5" @update="(v) => setSkirt('height', v)" />
        <NumberField label="Süpürgelik kalınlığı" :value="design.skirting.depth" :min="5" :max="40" @update="(v) => setSkirt('depth', v)" />
      </template>
    </section>
  </div>
</template>

<style scoped>
h4 {
  margin: 0 0 8px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
}
h4 small {
  font-weight: 400;
  margin-left: 4px;
}
section {
  display: grid;
  gap: 12px;
}
.tiles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.empty {
  padding: 16px;
  border-radius: 14px;
  background: var(--surface-2);
}
.empty p {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 12.5px;
}
</style>
