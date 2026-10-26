import { catalog, findGroup, findMaterial, findRal } from '../catalog/catalog'
import { buildPanels } from '../core/panels'
import { normalizeDesign } from '../core/rules'
import type { Design, Finish } from '../core/types'
import { rulesFor, type Product } from '../data/products'

export interface ProductSpecs {
  design: Design
  doors: number
  drawers: number
  shelves: number
  parts: number
  weight: number
  materials: { label: string; finish: Finish }[]
}

const finishName = (f: Finish) => {
  const m = findMaterial(catalog, f.material)
  if (m?.kind === 'lacquer') return `Lake · ${findRal(f.color)?.code ?? f.color}`
  return [findGroup(f.material)?.name, m?.name].filter(Boolean).join(' · ')
}

/** Ürün sayfası için özet bilgiler: parça sayıları, tahmini ağırlık, malzemeler. */
export function specsOf(p: Product): ProductSpecs {
  const rules = rulesFor(p.ruleSet)
  const design = normalizeDesign(p.design, rules).design
  const panels = buildPanels(design, rules)
  // Levhalar için ~0,75 kg / m² / mm (MDF yoğunluğu ≈ 750 kg/m³).
  const weight = panels
    .filter((x) => !['handle', 'rod', 'light', 'lock', 'cushion', 'leg'].includes(x.type))
    .reduce((s, x) => s + ((x.width * x.height) / 1e6) * x.thickness * 0.75, 0)
  const seen = new Set<string>()
  const materials: { label: string; finish: Finish }[] = []
  for (const [label, f] of [
    ['Gövde', design.finish.carcass],
    ['Kapak', design.finish.front],
    ['Tabla', design.finish.top],
  ] as const) {
    const key = `${f.material}|${f.color}`
    if (seen.has(key)) continue
    seen.add(key)
    materials.push({ label: `${label}: ${finishName(f)}`, finish: f })
  }
  return {
    design,
    doors: panels.filter((x) => x.type === 'door' && !x.id.includes('-frame-')).length + panels.filter((x) => x.type === 'glass').length,
    drawers: panels.filter((x) => x.type === 'drawerFront').length,
    shelves: panels.filter((x) => x.type === 'shelf').length,
    parts: panels.filter((x) => !['handle', 'light', 'lock', 'leg'].includes(x.type)).length,
    weight: Math.round(weight),
    materials,
  }
}

/** Ürüne özgü, sabit (deterministik) puan ve yorum sayısı. */
export function ratingOf(id: string) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return { value: 4.6 + (h % 5) / 10, count: 12 + (h % 140) }
}
