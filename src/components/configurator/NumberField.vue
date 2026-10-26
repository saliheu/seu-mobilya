<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next'
import { computed } from 'vue'

/**
 * Ölçü girişi: büyük değer göstergesi, −/+ düğmeleri ve dolgu renkli kaydırıcı.
 * Değerler mm olarak gelir/gider; 300 mm'den uzun ölçüler kullanıcıya cm olarak gösterilir.
 */
const props = defineProps<{ label: string; value: number; min: number; max: number; step?: number; unit?: string }>()
const emit = defineEmits<{ update: [value: number] }>()

const cm = computed(() => (props.unit ?? 'mm') === 'mm' && props.max >= 300)
const unitLabel = computed(() => (cm.value ? 'cm' : (props.unit ?? 'mm')))
const factor = computed(() => (cm.value ? 10 : 1))
// cm modunda kaydırıcı 1 cm, −/+ düğmeleri de 1 cm adımlarla çalışır.
const step = computed(() => (cm.value ? Math.max(10, props.step ?? 10) : (props.step ?? 1)))
const shown = (v: number) => Math.round((v / factor.value) * 10) / 10
const fill = computed(() => `${((props.value - props.min) / Math.max(1, props.max - props.min)) * 100}%`)
const clamp = (v: number) => Math.min(props.max, Math.max(props.min, v))

function fromRange(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (Number.isFinite(v)) emit('update', v)
}
function fromInput(e: Event) {
  const el = e.target as HTMLInputElement
  const v = Number(el.value.replace(',', '.'))
  if (!Number.isFinite(v)) return
  const mm = clamp(v * factor.value)
  el.value = String(shown(mm))
  emit('update', mm)
}
const bump = (dir: 1 | -1) => emit('update', clamp(props.value + dir * step.value))
</script>

<template>
  <div class="field">
    <div class="head">
      <span class="label">{{ label }}</span>
      <div class="val">
        <button type="button" :disabled="value <= min" :aria-label="`${label} azalt`" @click="bump(-1)"><Minus :size="15" /></button>
        <label class="box">
          <input type="text" inputmode="decimal" :value="shown(value)" :aria-label="label" @change="fromInput" @keydown.enter="($event.target as HTMLInputElement).blur()" />
          <small>{{ unitLabel }}</small>
        </label>
        <button type="button" :disabled="value >= max" :aria-label="`${label} artır`" @click="bump(1)"><Plus :size="15" /></button>
      </div>
    </div>
    <input class="range" type="range" :min="min" :max="max" :step="step" :value="value" :style="{ '--p': fill }" :aria-label="`${label} kaydırıcı`" @input="fromRange" />
    <div class="scale">
      <small>{{ shown(min) }}</small>
      <small>{{ shown(max) }} {{ unitLabel }}</small>
    </div>
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: 4px;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.label {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--ink-2);
}
.val {
  display: flex;
  align-items: center;
  gap: 4px;
}
.val button {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.val button:hover:not(:disabled) {
  border-color: var(--ink-2);
}
.val button:disabled {
  opacity: 0.35;
  cursor: default;
}
.box {
  display: flex;
  align-items: baseline;
  gap: 3px;
  padding: 5px 10px;
  border-radius: 10px;
  background: var(--surface-2);
  cursor: text;
}
.box:focus-within {
  box-shadow: 0 0 0 2px var(--accent);
  background: var(--surface);
}
.box input {
  width: 52px;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 16px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  text-align: right;
  color: var(--ink);
  padding: 0;
}
.box input:focus {
  outline: none;
}
.box small {
  font-size: 12px;
  color: var(--muted);
}
.scale {
  display: flex;
  justify-content: space-between;
  margin-top: -4px;
}
.scale small {
  font-size: 11px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

/* Kaydırıcı: dolgu renkli ray ve büyük, dokunmaya uygun tutamaç. */
.range {
  --p: 50%;
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 30px;
  margin: 0;
  background: transparent;
  cursor: pointer;
}
.range:focus {
  outline: none;
}
.range::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(to right, var(--accent) var(--p), #e4dccf var(--p));
}
.range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  margin-top: -9px;
  border-radius: 50%;
  border: 3px solid var(--accent);
  background: #fff;
  box-shadow: 0 2px 8px rgb(29 26 22 / 0.22);
  transition: transform 0.12s;
}
.range:active::-webkit-slider-thumb {
  transform: scale(1.12);
}
.range:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 5px var(--accent-soft);
}
.range::-moz-range-track {
  height: 6px;
  border-radius: 999px;
  background: #e4dccf;
}
.range::-moz-range-progress {
  height: 6px;
  border-radius: 999px;
  background: var(--accent);
}
.range::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 3px solid var(--accent);
  background: #fff;
  box-shadow: 0 2px 8px rgb(29 26 22 / 0.22);
}
</style>
