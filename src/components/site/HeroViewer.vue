<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { catalog } from '../../catalog/catalog'
import { buildPanels } from '../../core/panels'
import { normalizeDesign } from '../../core/rules'
import { rulesFor, type Product } from '../../data/products'
import { ConfiguratorScene } from '../../three/ConfiguratorScene'

const props = defineProps<{ product: Product }>()
const host = ref<HTMLDivElement>()
let scene: ConfiguratorScene | null = null

function show(p: Product) {
  const rules = rulesFor(p.ruleSet)
  scene?.setPanels(buildPanels(normalizeDesign(p.design, rules).design, rules), true)
}

onMounted(() => {
  scene = new ConfiguratorScene(host.value!, catalog, { autoRotate: true, room: false })
  show(props.product)
})
watch(() => props.product, show)
onBeforeUnmount(() => scene?.dispose())
</script>

<template>
  <div ref="host" class="hero-viewer" />
</template>

<style scoped>
.hero-viewer {
  position: absolute;
  inset: 0;
}
.hero-viewer :deep(canvas) {
  display: block;
  cursor: grab;
}
</style>
