<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Design, Front } from '../../core/types'
import type { Selection } from '../../useConfigurator'

/**
 * Dolabın önden şeması: sütunlar ve bölmeler gerçek oranlarında.
 * Tıklayınca bölme seçilir, Shift + tıklama aynı sütunda aralığı genişletir.
 */
const props = defineProps<{ design: Design; selection: Selection | null }>()
const emit = defineEmits<{ select: [section: number, compartment: number, extend: boolean] }>()

// Dokunmatik ekranlarda Shift yok: açıkken her dokunuş seçimi aynı sütunda genişletir.
const multi = ref(false)
const total = computed(() => props.design.sections.reduce((s, x) => s + x.width, 0) || 1)
const frontAt = (fronts: Front[], ci: number) => fronts.find((f) => f.side === 'front' && ci >= f.start && ci <= f.end)
const isSel = (si: number, ci: number) => {
  const s = props.selection
  return !!s && s.section === si && ci >= s.start && ci <= s.end
}
const label: Record<string, string> = { door: 'Kapak', glass: 'Cam', drawer: 'Çekmece', flapUp: 'Klapa', flapDown: 'Klapa' }
</script>

<template>
  <div class="map" role="group" aria-label="Bölme haritası">
    <div v-for="(s, si) in design.sections" :key="si" class="col" :style="{ flexGrow: s.width / total }">
      <button v-if="s.knee" class="knee" :class="{ sel: selection?.section === si }" @click="emit('select', si, 0, false)">Diz boşluğu</button>
      <template v-else>
        <button
          v-for="ci in [...s.compartments.keys()].reverse()"
          :key="ci"
          class="cell"
          :class="{
            sel: isSel(si, ci),
            [frontAt(s.fronts, ci)?.kind ?? 'none']: true,
            joinTop: frontAt(s.fronts, ci) && frontAt(s.fronts, ci)!.end > ci,
            joinBottom: frontAt(s.fronts, ci) && frontAt(s.fronts, ci)!.start < ci,
          }"
          :style="{ flexGrow: s.compartments[ci]!.height }"
          :aria-label="`Sütun ${si + 1}, bölme ${ci + 1}`"
          @click="(e) => emit('select', si, ci, e.shiftKey || multi)"
        >
          <small v-if="frontAt(s.fronts, ci) && frontAt(s.fronts, ci)!.start === ci">{{ label[frontAt(s.fronts, ci)!.kind] }}</small>
          <i v-if="s.compartments[ci]!.light" class="led" />
          <i v-if="s.compartments[ci]!.hanger" class="rod" />
          <i v-if="s.compartments[ci]!.divider" class="vd" :style="{ left: `${s.compartments[ci]!.divider! * 100}%` }" />
        </button>
      </template>
    </div>
  </div>
  <div class="tip">
    <span>{{ multi ? 'Aynı sütunda alt alta bölmelere dokunarak seçimi genişletin.' : 'Düzenlemek için bir bölmeye dokunun.' }}</span>
    <button type="button" class="multi" :class="{ on: multi }" :aria-pressed="multi" @click="multi = !multi">Çoklu seçim</button>
  </div>
</template>

<style scoped>
.map {
  display: flex;
  gap: 3px;
  height: 190px;
  padding: 6px;
  border-radius: 14px;
  background: #e9e1d4;
}
.col {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex-basis: 0;
  min-width: 18px;
}
.cell {
  position: relative;
  flex-basis: 0;
  min-height: 12px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: #fbf8f3;
  cursor: pointer;
  font-size: 10px;
  color: var(--ink-2);
  overflow: hidden;
  transition: background 0.12s;
}
.cell:hover {
  background: #fff;
  box-shadow: inset 0 0 0 1.5px var(--ink-2);
}
.cell.door,
.cell.glass,
.cell.flapUp,
.cell.flapDown,
.cell.drawer {
  background: #d9c8b2;
}
.cell.glass {
  background: #c9d6d8;
}
.cell.drawer::after {
  content: '';
  position: absolute;
  top: 6px;
  width: 30%;
  height: 2px;
  border-radius: 2px;
  background: var(--ink-2);
  opacity: 0.6;
}
.cell.joinTop {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
.cell.joinBottom {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.cell.sel {
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 2px var(--accent);
  color: var(--accent-dark);
}
.cell small {
  font-weight: 600;
  letter-spacing: 0.02em;
}
.led {
  position: absolute;
  top: 2px;
  left: 10%;
  right: 10%;
  height: 3px;
  border-radius: 2px;
  background: #f2b84b;
  box-shadow: 0 0 6px #f2b84b;
}
.rod {
  position: absolute;
  top: 10px;
  left: 8%;
  right: 8%;
  height: 2px;
  background: #555;
}
.vd {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--ink-2);
  opacity: 0.6;
}
.knee {
  flex: 1;
  display: grid;
  place-items: center;
  border: 1.5px dashed #c9b9a3;
  border-radius: 4px;
  background: transparent;
  color: var(--muted);
  font-size: 10px;
  text-align: center;
  cursor: pointer;
}
.knee.sel {
  border-color: var(--accent);
  color: var(--accent-dark);
}
.tip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 8px;
  color: var(--muted);
  font-size: 12px;
}
.multi {
  flex: none;
  padding: 6px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--ink-2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.multi.on {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
}
kbd {
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid var(--line);
  background: var(--surface);
  font-size: 10.5px;
}
</style>
