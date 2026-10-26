<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { Design } from '../../core/types'
import { rulesFor } from '../../data/products'
import { thumbnails, type ThumbOptions } from '../../three/thumbnails'

const props = defineProps<{ thumbKey: string; design: Design; ruleSet: string; alt: string; options?: ThumbOptions; ratio?: string }>()

const src = ref<string | undefined>(thumbnails.cached(props.thumbKey))

// Kuyruk sırayla işler; kartlar sayfa sırasıyla bağlandığı için üstteki resimler önce gelir.
function request() {
  const key = props.thumbKey
  thumbnails.render(key, props.design, rulesFor(props.ruleSet), props.options).then((url) => {
    if (key === props.thumbKey) src.value = url
  })
}

onMounted(() => {
  if (!src.value) request()
})

watch(
  () => props.thumbKey,
  (k) => {
    src.value = thumbnails.cached(k)
    if (!src.value) request()
  },
)
</script>

<template>
  <div class="thumb" :style="ratio ? { aspectRatio: ratio } : undefined">
    <img v-if="src" :src="src" :alt="alt" />
    <div v-else class="skeleton" aria-hidden="true" />
  </div>
</template>

<style scoped>
.thumb {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--card-bg);
  overflow: hidden;
}
img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.skeleton {
  position: absolute;
  inset: 18%;
  border-radius: 12px;
  background: linear-gradient(90deg, var(--line) 0%, var(--surface-2) 50%, var(--line) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite linear;
  opacity: 0.6;
}
@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}
</style>
