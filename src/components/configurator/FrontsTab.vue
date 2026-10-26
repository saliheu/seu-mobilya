<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next'
import { computed } from 'vue'
import * as A from '../../core/actions'
import type { Front, FrontKind, HandleKind } from '../../core/types'
import type { Configurator } from '../../useConfigurator'
import CellMap from './CellMap.vue'
import OptionTile from './OptionTile.vue'

const props = defineProps<{ cfg: Configurator }>()
const { design, rules, apply, selection, selectCell } = props.cfg

const sel = computed(() => selection.value)
const section = computed(() => (sel.value ? design.value.sections[sel.value.section] : undefined))
const multi = computed(() => !!sel.value && sel.value.end > sel.value.start)
/** Seçimi tam olarak kapsayan ön yüz (varsa). */
const front = computed<Front | undefined>(() => {
  const s = sel.value
  if (!s || !section.value) return undefined
  return section.value.fronts.find((f) => f.side === 'front' && f.start <= s.start && f.end >= s.end)
})
const currentKind = computed(() => front.value?.kind ?? 'none')
const selHeight = computed(() => {
  const s = sel.value
  if (!s || !section.value) return 0
  return section.value.compartments.slice(s.start, s.end + 1).reduce((a, c) => a + c.height, 0)
})

const kinds: { value: FrontKind | 'none'; label: string; icon: string }[] = [
  { value: 'none', label: 'Açık raf', icon: 'open' },
  { value: 'door', label: 'Kapak', icon: 'door-left' },
  { value: 'glass', label: 'Cam kapak', icon: 'glass' },
  { value: 'drawer', label: 'Çekmece', icon: 'drawer' },
  { value: 'flapUp', label: 'Yukarı açılır', icon: 'flap-up' },
  { value: 'flapDown', label: 'Aşağı açılır', icon: 'flap-down' },
]
const hinges: { value: Front['hinge']; label: string; icon: string }[] = [
  { value: 'left', label: 'Soldan', icon: 'hinge-left' },
  { value: 'right', label: 'Sağdan', icon: 'hinge-right' },
  { value: 'double', label: 'Çift kanat', icon: 'door-double' },
]
const handles: { value: HandleKind; label: string; icon: string }[] = [
  { value: 'none', label: 'Bas-aç', icon: 'handle-none' },
  { value: 'knob', label: 'Topuz', icon: 'handle-knob' },
  { value: 'bar', label: 'Çubuk', icon: 'handle-bar' },
]

function disabledKind(k: FrontKind | 'none') {
  if (!section.value) return true
  // Çekmece ve klapa tek bölmeye uygulanır; çekmece için en az 25 cm genişlik.
  if (k === 'drawer') return section.value.width < 200
  if ((k === 'flapUp' || k === 'flapDown') && multi.value) return true
  return false
}
const kindHint = (k: FrontKind | 'none') =>
  k === 'drawer' && section.value && section.value.width < 200 ? 'Bölme çekmece için dar' : (k === 'flapUp' || k === 'flapDown') && multi.value ? 'Klapa tek bölmeye uygulanır' : undefined

const d = () => design.value
const setKind = (k: FrontKind | 'none') => sel.value && apply(A.setFrontRange(d(), sel.value.section, sel.value.start, sel.value.end, k, rules))
const flags = (patch: Parameters<typeof A.setFrontFlags>[3]) => sel.value && front.value && apply(A.setFrontFlags(d(), sel.value.section, front.value.start, patch))
const setHandle = (h: HandleKind) => apply(A.setHandle(d(), h))
const setSoftClose = () => apply(A.setSoftClose(d(), !design.value.softClose))
const maxInner = computed(() => Math.floor((section.value?.compartments[front.value?.start ?? 0]?.height ?? 0) / 160))
</script>

<template>
  <div class="stack">
    <CellMap :design="design" :selection="sel" @select="(si, ci, ext) => selectCell(si, ci, ext)" />

    <div v-if="!sel || section?.knee" class="empty">
      <b>Kapak veya çekmece eklemek için bölme seçin</b>
      <p>Bir bölmeye tıklayın. Birden fazla bölmeyi tek kapakla kapatmak için “Çoklu seçim”i açıp alt alta bölmelere dokunun.</p>
    </div>

    <template v-else>
      <section>
        <h4>Ön yüz <small class="muted">{{ multi ? `${sel.end - sel.start + 1} bölme · ${Math.round(selHeight / 10)} cm` : `Bölme ${sel.start + 1}` }}</small></h4>
        <div class="tiles">
          <OptionTile
            v-for="k in kinds"
            :key="k.value"
            :icon="k.icon"
            :label="k.label"
            :active="currentKind === k.value"
            :disabled="disabledKind(k.value)"
            :hint="kindHint(k.value)"
            @select="setKind(k.value)"
          />
        </div>
        <p v-if="multi && currentKind === 'drawer'" class="hint">Çekmeceler her bölmeye ayrı ayrı yerleştirildi.</p>
      </section>

      <section v-if="front && (front.kind === 'door' || front.kind === 'glass')">
        <h4>Açılış yönü</h4>
        <div class="tiles three">
          <OptionTile v-for="h in hinges" :key="h.value" :icon="h.icon" :label="h.label" :active="front.hinge === h.value" @select="flags({ hinge: h.value })" />
        </div>
      </section>

      <section v-if="front">
        <h4>Donanım</h4>
        <div class="tiles three">
          <OptionTile v-if="front.kind === 'door'" icon="mirror" label="Aynalı" :active="front.mirror" @select="flags({ mirror: !front.mirror })" />
          <OptionTile icon="lock" label="Kilit" :active="!!front.lock" @select="flags({ lock: !front.lock })" />
        </div>
        <div v-if="front.kind === 'door' && maxInner > 0" class="row inner">
          <span class="label">İç çekmece <small class="muted">(kapak arkasında)</small></span>
          <div class="stepper">
            <button :disabled="!front.innerDrawers" aria-label="Azalt" @click="flags({ innerDrawers: (front.innerDrawers ?? 0) - 1 })"><Minus :size="14" /></button>
            <b>{{ front.innerDrawers ?? 0 }}</b>
            <button :disabled="(front.innerDrawers ?? 0) >= maxInner" aria-label="Artır" @click="flags({ innerDrawers: (front.innerDrawers ?? 0) + 1 })"><Plus :size="14" /></button>
          </div>
        </div>
      </section>
    </template>

    <section>
      <h4>Kulp <small class="muted">tüm kapak ve çekmeceler</small></h4>
      <div class="tiles three">
        <OptionTile v-for="h in handles" :key="h.value" :icon="h.icon" :label="h.label" :active="design.handle === h.value" @select="setHandle(h.value)" />
      </div>
    </section>

    <label class="switch">
      <input type="checkbox" :checked="!!design.softClose" @change="setSoftClose" />
      <span>
        <b>Frenli menteşe ve raylar</b>
        <small class="muted">Kapak ve çekmeceler sessizce, yavaşça kapanır.</small>
      </span>
    </label>
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
.empty p,
.hint {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 12.5px;
}
.inner {
  margin-top: 10px;
}
.stepper button {
  display: grid;
  place-items: center;
}
.switch {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--line);
  cursor: pointer;
}
.switch input {
  margin-top: 3px;
  accent-color: var(--accent);
}
.switch span {
  display: grid;
}
.switch small {
  font-size: 12px;
}
kbd {
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid var(--line);
  background: var(--surface);
  font-size: 10.5px;
}
</style>
