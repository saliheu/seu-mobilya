<script setup lang="ts">
import OptionIcon from './OptionIcon.vue'

defineProps<{ icon: string; label: string; active?: boolean; disabled?: boolean; hint?: string }>()
defineEmits<{ select: [] }>()
</script>

<template>
  <button class="tile" :class="{ active }" :disabled="disabled" :title="hint ?? label" :aria-pressed="!!active" @click="$emit('select')">
    <OptionIcon :name="icon" class="ico" />
    <span>{{ label }}</span>
  </button>
</template>

<style scoped>
.tile {
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 10px 6px 8px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  color: var(--ink-2);
  cursor: pointer;
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
  transition:
    border-color 0.15s,
    background 0.15s,
    color 0.15s;
}
.tile:hover:not(:disabled) {
  border-color: var(--ink-2);
}
.tile.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent-dark);
  box-shadow: 0 0 0 1px var(--accent);
}
.tile:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.ico {
  width: 38px;
  height: 38px;
}
</style>
