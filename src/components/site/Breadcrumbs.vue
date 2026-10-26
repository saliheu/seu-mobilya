<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'

defineProps<{ items: { label: string; to?: string }[] }>()
</script>

<template>
  <nav class="crumbs" aria-label="Sayfa yolu">
    <template v-for="(it, i) in items" :key="i">
      <RouterLink v-if="it.to" :to="it.to">{{ it.label }}</RouterLink>
      <span v-else aria-current="page">{{ it.label }}</span>
      <ChevronRight v-if="i < items.length - 1" :size="14" />
    </template>
  </nav>
</template>

<style scoped>
.crumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding-top: 22px;
  color: var(--muted);
  font-size: 13px;
}
.crumbs a {
  color: var(--muted);
  text-decoration: none;
}
.crumbs a:hover {
  color: var(--ink);
}
.crumbs span {
  color: var(--ink);
  font-weight: 500;
}
</style>
