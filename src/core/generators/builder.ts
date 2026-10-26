import { METAL } from '../../catalog/catalog'
import type { Design, EdgeBanding, Finish, Mm, Motion, Outline, Panel, PanelType, Plane } from '../types'

export const NONE: EdgeBanding = { u0: false, u1: false, v0: false, v1: false }
export const ALL: EdgeBanding = { u0: true, u1: true, v0: true, v1: true }
export const metal: Finish = { material: METAL, color: null }

export interface PanelOptions {
  finish?: Finish
  thickness?: Mm
  edges?: EdgeBanding
  grain?: 'u' | 'v'
  outline?: Outline
  soft?: Mm
  rotY?: number
  motion?: Motion
  section?: number
  compartment?: number
}

/** Panel ekleme yardımcısı. Tüm y değerlerine ürünün yerden yüksekliği (elevation) eklenir. */
export function panelSink(d: Design) {
  const panels: Panel[] = []
  const lift = d.elevation
  const add = (
    id: string,
    type: PanelType,
    plane: Plane,
    width: Mm,
    height: Mm,
    origin: { x: Mm; y: Mm; z: Mm },
    o: PanelOptions = {},
  ) => {
    if (!(width > 0.5 && height > 0.5 && (o.thickness ?? d.thickness) > 0.1)) return
    const edges = o.edges ?? NONE
    const banded = edges.u0 || edges.u1 || edges.v0 || edges.v1
    panels.push({
      id,
      type,
      plane,
      width,
      height,
      thickness: o.thickness ?? d.thickness,
      origin: { x: origin.x, y: origin.y + lift, z: origin.z },
      finish: o.finish ?? d.finish.carcass,
      edges,
      edgeFinish: banded && d.finish.edge ? d.finish.edge : undefined,
      grain: o.grain ?? (plane === 'XZ' ? 'u' : 'v'),
      outline: o.outline,
      soft: o.soft,
      rotY: o.rotY,
      motion: o.motion ? { ...o.motion, pivot: { ...o.motion.pivot, y: o.motion.pivot.y + lift } } : undefined,
      section: o.section,
      compartment: o.compartment,
    })
  }
  return { panels, add }
}

/** Gövdenin yerden başladığı yükseklik (baza/ayak). */
export function baseOffset(d: Design): Mm {
  return d.base.kind === 'none' ? 0 : d.base.height
}

export function roundedOutline(radius: Mm): Outline | undefined {
  return radius > 0 ? { kind: 'rounded', radius } : undefined
}

/** Ayak/teker/plastik pabuç: yatay düzlemde elips kesitli, yüksekliği kadar "kalınlıkta" panel. */
export function addFoot(
  add: ReturnType<typeof panelSink>['add'],
  d: Design,
  id: string,
  x: Mm,
  z: Mm,
  size?: Mm,
) {
  const h = baseOffset(d)
  const s = size ?? (d.base.kind === 'wheels' ? 55 : d.base.kind === 'glides' ? 24 : 38)
  const finish = d.base.kind === 'legs' ? d.finish.accent : metal
  add(id, 'leg', 'XZ', s, s, { x: x - s / 2, y: 0, z: z - s / 2 }, { thickness: h, finish, outline: { kind: 'ellipse' } })
}

/** Genişliğe göre adım tablosundan sayı seç. */
export function countFor(steps: { max: Mm; count: number }[], value: Mm): number {
  return (steps.find((s) => value <= s.max) ?? steps[steps.length - 1])?.count ?? 1
}
