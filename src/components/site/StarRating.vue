<script setup lang="ts">
import { Star } from 'lucide-vue-next'

withDefaults(defineProps<{ value: number; size?: number }>(), { size: 15 })
</script>

<template>
  <span class="stars" :aria-label="`5 üzerinden ${value}`">
    <Star v-for="i in 5" :key="i" :size="size" :class="{ off: i > value }" :fill="i > value ? 'none' : 'currentColor'" />
  </span>
</template>

<style scoped>
.stars {
  display: inline-flex;
  gap: 2px;
  color: var(--gold);
}
.off {
  color: var(--line);
}
</style>
