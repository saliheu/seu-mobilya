import { catalog } from '../catalog/catalog'
import { buildPanels } from '../core/panels'
import { estimatePrice } from '../core/price'
import { normalizeDesign } from '../core/rules'
import type { Design } from '../core/types'
import { rulesFor, type Product } from '../data/products'

const cache = new Map<string, number>()

export function priceOf(design: Design, ruleSet: string): number {
  const rules = rulesFor(ruleSet)
  const d = normalizeDesign(design, rules).design
  return estimatePrice(buildPanels(d, rules), catalog, d).total
}

/** Kataloğa göre ürün fiyatı (önbellekli). */
export function productPrice(p: Product): number {
  let v = cache.get(p.id)
  if (v === undefined) {
    v = priceOf(p.design, p.ruleSet)
    cache.set(p.id, v)
  }
  return v
}

/** Dış ölçü metni: G × Y × D cm. */
export function sizeLabel(d: Design): string {
  const cm = (v: number) => Math.round(v / 10)
  if (d.family === 'shape' && d.shape?.kind === 'circle') return `Ø ${cm(d.overall.width)} cm`
  if (d.family === 'mirror' || (d.family === 'shape' && d.shape?.kind !== 'cubes')) return `${cm(d.overall.width)} × ${cm(d.overall.height)} cm`
  const extra = d.family === 'cabinet' || d.family === 'desk' || d.family === 'corner' ? (d.base.kind === 'none' ? 0 : d.base.height) : 0
  return `${cm(d.overall.width)} × ${cm(d.overall.height + extra)} × ${cm(d.overall.depth)} cm`
}
