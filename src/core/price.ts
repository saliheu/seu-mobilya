import { findMaterial, type Catalog } from '../catalog/catalog'
import type { Design, Panel } from './types'

export interface PriceLine {
  label: string
  quantity: number
  unit: 'm²' | 'm' | 'adet'
  amount: number
}

export interface Price {
  lines: PriceLine[]
  total: number
}

const NON_BOARD = new Set<Panel['type']>(['handle', 'rod', 'leg', 'light', 'lock'])

const edgeLength = (p: Panel) =>
  (p.edges.u0 ? p.height : 0) + (p.edges.u1 ? p.height : 0) + (p.edges.v0 ? p.width : 0) + (p.edges.v1 ? p.width : 0)

/** İşçilik ve kargo dahil satış çarpanı. */
const MARKUP = 1.35

/**
 * Panel listesinden tahmini fiyat. Çerçeveden bağımsızdır; sunucuda da aynı fonksiyon
 * çalıştırılmalı ve kesin fiyat oradan alınmalı (istemci verisine güvenilmez).
 */
export function estimatePrice(panels: Panel[], catalog: Catalog, design?: Design): Price {
  const area = new Map<number, number>()
  let edges = 0
  let hinges = 0
  let drawers = 0
  let legs = 0
  let handles = 0
  let rod = 0
  let light = 0
  let locks = 0
  let inner = 0

  for (const p of panels) {
    if (p.type === 'handle') handles++
    else if (p.type === 'rod') rod += p.thickness / 1000
    else if (p.type === 'leg') legs++
    else if (p.type === 'light') light += p.width / 1000
    else if (p.type === 'lock') locks++
    else if (p.type === 'innerDrawer') inner++
    if (NON_BOARD.has(p.type)) continue
    area.set(p.finish.material, (area.get(p.finish.material) ?? 0) + (p.width * p.height) / 1e6)
    edges += edgeLength(p) / 1000
    if (p.type === 'door' && !p.id.includes('-frame-')) hinges++
    if (p.type === 'glass') hinges++
    if (p.type === 'drawerFront') drawers++
  }

  const lines: PriceLine[] = []
  for (const [id, m2] of area) {
    const m = findMaterial(catalog, id)
    if (m && m.pricePerM2 > 0) lines.push({ label: m.name, quantity: m2, unit: 'm²', amount: m2 * m.pricePerM2 * MARKUP })
  }
  const h = catalog.hardware
  if (edges > 0) lines.push({ label: 'Kenar bandı', quantity: edges, unit: 'm', amount: edges * h.edgePerM })
  if (hinges) lines.push({ label: 'Menteşe seti', quantity: hinges, unit: 'adet', amount: hinges * h.hinge })
  if (drawers) lines.push({ label: 'Çekmece rayı', quantity: drawers, unit: 'adet', amount: drawers * h.drawer })
  if (legs) lines.push({ label: 'Ayak / teker', quantity: legs, unit: 'adet', amount: legs * h.leg })
  if (handles) lines.push({ label: 'Kulp', quantity: handles, unit: 'adet', amount: handles * h.handle })
  if (rod > 0) lines.push({ label: 'Askı borusu', quantity: rod, unit: 'm', amount: rod * h.rodPerM })
  if (light > 0) lines.push({ label: 'LED aydınlatma', quantity: light, unit: 'm', amount: light * h.lightPerM })
  if (locks) lines.push({ label: 'Kilit', quantity: locks, unit: 'adet', amount: locks * h.lock })
  if (inner) lines.push({ label: 'İç çekmece', quantity: inner, unit: 'adet', amount: inner * h.innerDrawer })
  if (design?.softClose && hinges + drawers + inner > 0) {
    const n = hinges + drawers + inner
    lines.push({ label: 'Frenli menteşe/ray farkı', quantity: n, unit: 'adet', amount: n * h.softClose })
  }

  // 50 ₺'ye yuvarla, en az 750 ₺.
  const total = Math.max(750, Math.round(lines.reduce((s, l) => s + l.amount, 0) / 50) * 50)
  return { lines, total }
}

export interface CutItem {
  type: Panel['type']
  width: number
  height: number
  thickness: number
  material: number
  color: string | null
  count: number
}

/** Aynı ölçü ve malzemedeki panelleri gruplayarak kesim listesi çıkarır. */
export function cutList(panels: Panel[]): CutItem[] {
  const map = new Map<string, CutItem>()
  for (const p of panels) {
    if (NON_BOARD.has(p.type) || p.type === 'cushion') continue
    const w = Math.round(p.width * 10) / 10
    const h = Math.round(p.height * 10) / 10
    const key = [p.type, w, h, p.thickness, p.finish.material, p.finish.color].join('|')
    const item = map.get(key)
    if (item) item.count++
    else map.set(key, { type: p.type, width: w, height: h, thickness: p.thickness, material: p.finish.material, color: p.finish.color, count: 1 })
  }
  return [...map.values()]
}
