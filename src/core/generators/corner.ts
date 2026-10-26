import type { Design, Mm, Rules } from '../types'
import { ALL, NONE, addFoot, baseOffset, panelSink } from './builder'

/**
 * Köşe dolabı: duvar köşesine oturan beşgen taban.
 * Köşe arka-solda (0,0). Arka duvar boyunca W, sol duvar boyunca D.
 * Sağ kanat derinliği wingZ, ön kanat genişliği wingX; aradaki çapraz yüzde kapaklar.
 */
export function buildCorner(d: Design, rules: Rules) {
  const { panels, add } = panelSink(d)
  const { width: W, height: H, depth: D } = d.overall
  const t = d.thickness
  const T = d.top.thickness
  const bt = rules.back.thickness
  const by = baseOffset(d)
  const Hs = H - T
  const wx = Math.min(d.corner?.wingX ?? W * 0.45, W - 2 * t)
  const wz = Math.min(d.corner?.wingZ ?? D * 0.4, D - 2 * t)

  // Çapraz çizgi: (wx, D) → (W, wz)
  const zAt = (x: Mm) => D + ((x - wx) * (wz - D)) / (W - wx)
  const xAt = (z: Mm) => wx + ((z - D) * (W - wx)) / (wz - D)

  const outer = [
    { u: 0, v: 0 },
    { u: W, v: 0 },
    { u: W, v: wz },
    { u: wx, v: D },
    { u: 0, v: D },
  ]
  add('top', 'top', 'XZ', W, D, { x: 0, y: by + H - T, z: 0 }, {
    thickness: T,
    finish: d.finish.top,
    edges: ALL,
    outline: { kind: 'polygon', points: outer },
  })

  // İç raf/alt tabla çokgeni: arkalıklar ve uç dikmelerin içinde.
  const ix = W - t
  const iz = D - t
  const inner = [
    { u: bt, v: bt },
    { u: ix, v: bt },
    { u: ix, v: Math.max(bt + 1, zAt(ix)) },
    { u: Math.max(bt + 1, xAt(iz)), v: iz },
    { u: bt, v: iz },
  ]
  const innerShape = { kind: 'polygon' as const, points: inner.map((p) => ({ u: p.u - bt, v: p.v - bt })) }
  const iw = ix - bt
  const id = iz - bt

  add('back-x', 'back', 'XY', W - t, Hs, { x: 0, y: by, z: 0 }, { thickness: bt })
  add('back-z', 'back', 'YZ', D - t - bt, Hs, { x: 0, y: by, z: bt }, { thickness: bt })
  add('side-r', 'side', 'YZ', wz, Hs, { x: W - t, y: by, z: 0 }, { edges: { ...NONE, u1: true } })
  add('side-f', 'side', 'XY', wx, Hs, { x: 0, y: by, z: D - t }, { edges: { ...NONE, u1: true } })

  const s = d.sections[0]
  const comps = s?.compartments ?? []
  let cy = by
  add('bottom', 'bottom', 'XZ', iw, id, { x: bt, y: cy, z: bt }, { outline: innerShape, edges: NONE })
  cy += t
  const openings: { y: Mm; h: Mm }[] = []
  comps.forEach((c, ci) => {
    if (ci > 0) add(`shelf-${ci}`, 'shelf', 'XZ', iw, id, { x: bt, y: cy - t, z: bt }, { outline: innerShape, section: 0, compartment: ci })
    openings.push({ y: cy, h: c.height })
    cy += c.height + t
  })

  // Çapraz kapaklar (dışa bakan normal için başlangıç noktası sol uç).
  const vx = W - wx
  const vz = wz - D
  const len = Math.hypot(vx, vz)
  const rotY = Math.atan2(-vz, vx)
  const g = rules.front.gapX
  for (const f of s?.fronts ?? []) {
    const lo = openings[f.start]
    const hi = openings[f.end]
    if (!lo || !hi) continue
    const fy = lo.y - (f.start === 0 ? t : t / 2) + rules.front.gapY / 2
    const fh = hi.y + hi.h + (f.end === comps.length - 1 ? 0 : t / 2) - fy - rules.front.gapY / 2
    const leaves = f.hinge === 'double' ? 2 : 1
    const lw = (len - g * (leaves + 1)) / leaves
    for (let l = 0; l < leaves; l++) {
      const along = g + l * (lw + g)
      add(`door-${f.start}-${l}`, f.kind === 'drawer' ? 'drawerFront' : 'door', 'XY', lw, fh, {
        x: wx + (vx / len) * along,
        y: fy,
        z: D + (vz / len) * along,
      }, { finish: f.finish ?? d.finish.front, edges: ALL, rotY, section: 0, compartment: f.start })
    }
  }

  if (by > 0) {
    if (d.base.kind === 'plinth') {
      // Kapak çizgisinden 40 mm içeri çekilmiş baza.
      const nx = Math.sin(rotY)
      const nz = Math.cos(rotY)
      const sb = 40 + t
      add('plinth', 'plinth', 'XY', len - 80, by, { x: wx + (vx / len) * 40 - nx * sb, y: 0, z: D + (vz / len) * 40 - nz * sb }, { rotY, grain: 'u' })
    } else {
      const pts = [
        [50, 50],
        [W - 50, 50],
        [W - 50, Math.max(60, wz - 50)],
        [Math.max(60, wx - 50), D - 50],
        [50, D - 50],
      ]
      pts.forEach(([x, z], i) => addFoot(add, d, `foot-${i}`, x!, z!))
    }
  }

  return panels
}
