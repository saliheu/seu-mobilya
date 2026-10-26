import { computed, ref, shallowRef } from 'vue'
import { catalog } from './catalog/catalog'
import type { Edit } from './core/actions'
import { buildCells } from './core/generators/cabinet'
import { buildPanels } from './core/panels'
import { cutList, estimatePrice } from './core/price'
import { normalizeDesign } from './core/rules'
import type { Design, Issue, Rules } from './core/types'

/** Bir sütunda ardışık bölme aralığı (kapak birden fazla bölmeyi kapsayabilir). */
export interface Selection {
  section: number
  start: number
  end: number
}

/**
 * Akış: düzenleme (Edit) → kural motoru (normalizeDesign) → panel listesi → sahne / fiyat / kesim listesi.
 */
export function useConfigurator(rules: Rules, initial: Design) {
  const start = normalizeDesign(initial, rules)
  const design = shallowRef<Design>(start.design)
  const issues = shallowRef<Issue[]>(start.issues)
  const selection = ref<Selection | null>(null)
  const past = shallowRef<Design[]>([])
  const future = shallowRef<Design[]>([])
  const dirty = ref(false)

  function validateSelection(d: Design) {
    const s = selection.value
    if (!s) return
    const sec = d.sections[s.section]
    if (!sec) return (selection.value = null)
    // Diz boşluğu sütunu da seçilebilir (yeniden dolaba çevirmek için).
    if (sec.knee || sec.compartments.length === 0) return (selection.value = { section: s.section, start: 0, end: 0 })
    const k = sec.compartments.length
    selection.value = { section: s.section, start: Math.min(s.start, k - 1), end: Math.min(s.end, k - 1) }
  }

  function commit(next: Design, nextIssues: Issue[]) {
    design.value = next
    issues.value = nextIssues
    validateSelection(next)
  }

  function apply(edit: Edit) {
    const result = normalizeDesign(edit.design, rules, edit.lock)
    past.value = [...past.value.slice(-49), design.value]
    future.value = []
    dirty.value = true
    commit(result.design, result.issues)
  }

  function undo() {
    const prev = past.value[past.value.length - 1]
    if (!prev) return
    future.value = [design.value, ...future.value]
    past.value = past.value.slice(0, -1)
    commit(prev, normalizeDesign(prev, rules).issues)
  }

  function redo() {
    const next = future.value[0]
    if (!next) return
    past.value = [...past.value, design.value]
    future.value = future.value.slice(1)
    commit(next, normalizeDesign(next, rules).issues)
  }

  /** Bölme seç; Shift ile aynı sütunda aralığı genişlet. Aynı bölmeye tekrar tıklamak seçimi kaldırır. */
  function selectCell(section: number, compartment: number, extend = false) {
    const s = selection.value
    if (extend && s && s.section === section) {
      selection.value = { section, start: Math.min(s.start, compartment), end: Math.max(s.end, compartment) }
      return
    }
    if (s && s.section === section && s.start === compartment && s.end === compartment) {
      selection.value = null
      return
    }
    selection.value = { section, start: compartment, end: compartment }
  }

  const panels = computed(() => buildPanels(design.value, rules))
  const cells = computed(() => buildCells(design.value))
  const price = computed(() => estimatePrice(panels.value, catalog, design.value))
  const cuts = computed(() => cutList(panels.value))
  const selectedCells = computed(() => {
    const s = selection.value
    if (!s) return []
    return Array.from({ length: s.end - s.start + 1 }, (_, i) => ({ section: s.section, compartment: s.start + i }))
  })

  return {
    rules,
    catalog,
    design,
    issues,
    selection,
    selectedCells,
    selectCell,
    panels,
    cells,
    price,
    cuts,
    dirty,
    apply,
    undo,
    redo,
    canUndo: computed(() => past.value.length > 0),
    canRedo: computed(() => future.value.length > 0),
  }
}

export type Configurator = ReturnType<typeof useConfigurator>
