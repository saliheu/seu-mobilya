<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Catalog } from '../../catalog/catalog'
import type { Cell, Panel } from '../../core/types'
import { ConfiguratorScene, type CellRef, type ViewMode } from '../../three/ConfiguratorScene'
import type { DimensionValues } from '../../three/dimensions'
import type { PanelUserData } from '../../three/meshes'

const props = defineProps<{
  panels: Panel[]
  cells: Cell[]
  catalog: Catalog
  human: boolean
  dims: boolean
  dimValues: DimensionValues
  open: boolean
  view: ViewMode
  selection: CellRef[]
}>()
const emit = defineEmits<{ pick: [data: PanelUserData | null, shift: boolean] }>()

const host = ref<HTMLDivElement>()
let scene: ConfiguratorScene | null = null

onMounted(() => {
  scene = new ConfiguratorScene(host.value!, props.catalog, { room: true, human: props.human, onPick: (d, o) => emit('pick', d, o.shift) })
  scene.setPanels(props.panels, false, props.cells)
  scene.setDimensions(props.dims, props.dimValues)
  scene.setSelection(props.selection)
})

watch(
  () => props.panels,
  (panels) => {
    scene?.setPanels(panels, false, props.cells)
    scene?.setDimensions(props.dims, props.dimValues)
    scene?.setSelection(props.selection)
  },
)
watch(
  () => props.human,
  (v) => scene?.setHumanVisible(v),
)
watch(
  () => props.dims,
  (v) => {
    scene?.setDimensions(v, props.dimValues)
    scene?.frameCamera()
  },
)
watch(
  () => props.open,
  (v) => scene?.setOpen(v),
)
watch(
  () => props.view,
  (v) => scene?.setView(v),
)
watch(
  () => props.selection,
  (v) => scene?.setSelection(v),
  { deep: true },
)

onBeforeUnmount(() => scene?.dispose())

defineExpose({ reframe: () => scene?.frameCamera() })
</script>

<template>
  <div ref="host" class="viewport" />
</template>

<style scoped>
.viewport {
  position: absolute;
  inset: 0;
}
.viewport :deep(canvas) {
  display: block;
  touch-action: none;
}
</style>
