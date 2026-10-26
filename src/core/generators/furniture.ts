import { MIRROR } from '../../catalog/catalog'
import type { Design, Mm, Rules } from '../types'
import { ALL, NONE, addFoot, countFor, panelSink, roundedOutline } from './builder'

/** Masa ve sehpa: tabla + dört ayak (ya da yan panel ayak) + isteğe bağlı etek. */
export function buildTable(d: Design, rules: Rules) {
  const { panels, add } = panelSink(d)
  const { width: W, height: H, depth: D } = d.overall
  const T = d.top.thickness
  const t = d.thickness
  const legH = H - T
  add('top', 'top', 'XZ', W, D, { x: 0, y: legH, z: 0 }, { thickness: T, finish: d.finish.top, edges: ALL, outline: roundedOutline(d.top.radius) })

  const legs = d.table?.legs ?? 'square'
  const inset = Math.min(60, Math.min(W, D) / 6)
  const apron = d.table?.apron ?? 0
  if (legs === 'panel') {
    add('leg-l', 'leg', 'YZ', D - 2 * inset, legH, { x: inset, y: 0, z: inset }, { finish: d.finish.accent, edges: { ...NONE, v1: true, u1: true } })
    add('leg-r', 'leg', 'YZ', D - 2 * inset, legH, { x: W - inset - t, y: 0, z: inset }, { finish: d.finish.accent, edges: { ...NONE, v1: true, u1: true } })
    add('stretcher', 'apron', 'XY', W - 2 * inset - 2 * t, Math.max(80, apron || 100), { x: inset + t, y: legH * 0.25, z: D / 2 - t / 2 }, { finish: d.finish.accent, grain: 'u' })
    return panels
  }

  const a = legs === 'round' ? 50 : rules.legs.large
  const b = legs === 'round' ? 50 : rules.legs.small
  const corners = [
    [inset, inset],
    [W - inset - a, inset],
    [inset, D - inset - b],
    [W - inset - a, D - inset - b],
  ]
  corners.forEach(([x, z], i) =>
    add(`leg-${i}`, 'leg', 'XZ', a, b, { x: x!, y: 0, z: z! }, {
      thickness: legH,
      finish: d.finish.accent,
      outline: legs === 'round' ? { kind: 'ellipse' } : undefined,
    }),
  )
  if (apron > 0) {
    const y = legH - apron
    add('apron-f', 'apron', 'XY', W - 2 * inset - 2 * a, apron, { x: inset + a, y, z: D - inset - b / 2 - t / 2 }, { finish: d.finish.accent, grain: 'u' })
    add('apron-b', 'apron', 'XY', W - 2 * inset - 2 * a, apron, { x: inset + a, y, z: inset + b / 2 - t / 2 }, { finish: d.finish.accent, grain: 'u' })
    add('apron-l', 'apron', 'YZ', D - 2 * inset - 2 * b, apron, { x: inset + a / 2 - t / 2, y, z: inset + b }, { finish: d.finish.accent })
    add('apron-r', 'apron', 'YZ', D - 2 * inset - 2 * b, apron, { x: W - inset - a / 2 - t / 2, y, z: inset + b }, { finish: d.finish.accent })
  }
  return panels
}

/** Karyola: uç panelleri, yan kayıtlar, ızgara ve yatak. Uzun kenar x boyunca. */
export function buildBed(d: Design, rules: Rules) {
  const { panels, add } = panelSink(d)
  const { width: W, height: H, depth: D } = d.overall
  const t = d.thickness
  const b = d.bed ?? { headboard: 350, footboard: 0, drawers: false, mattress: true, rail: 240 }
  const rail = Math.min(Math.max(b.rail, rules.bed.railMin), H)
  const ry = H - rail
  const end = { ...NONE, v1: true, u1: true }

  add('head', 'headboard', 'YZ', D, H + b.headboard, { x: 0, y: 0, z: 0 }, { edges: end, outline: roundedOutline(b.headboard > 0 ? 60 : 0) })
  add('foot', 'headboard', 'YZ', D, H + b.footboard, { x: W - t, y: 0, z: 0 }, { edges: end })
  add('rail-b', 'rail', 'XY', W - 2 * t, rail, { x: t, y: ry, z: 0 }, { grain: 'u', edges: { ...NONE, v1: true } })

  if (b.drawers && H > 200) {
    const g = rules.front.drawerGap
    const dw = (W - 2 * t - 3 * g) / 2
    for (let i = 0; i < 2; i++) {
      add(`drawer-${i}`, 'drawerFront', 'XY', dw, H - 30, { x: t + g + i * (dw + g), y: 20, z: D - t }, {
        finish: d.finish.front,
        edges: ALL,
        grain: 'u',
      })
    }
  } else {
    add('rail-f', 'rail', 'XY', W - 2 * t, rail, { x: t, y: ry, z: D - t }, { grain: 'u', edges: { ...NONE, v1: true } })
  }

  // Izgara: 70 mm lata, ~150 mm aralık.
  const sy = Math.max(ry, H - 60)
  const count = Math.max(4, Math.floor((W - 2 * t) / 150))
  const step = (W - 2 * t - 70) / (count - 1)
  for (let i = 0; i < count; i++) {
    add(`slat-${i}`, 'slat', 'XZ', 70, D - 2 * t, { x: t + i * step, y: sy - 12, z: t }, { thickness: 12, finish: d.finish.accent })
  }

  if (b.mattress) {
    add('mattress', 'cushion', 'XZ', W - 2 * t - 10, D - 2 * t - 10, { x: t + 5, y: sy, z: t + 5 }, {
      thickness: rules.bed.mattress,
      finish: { material: 1001, color: null },
      soft: 40,
    })
  }
  return panels
}

/** Oturma bankı: kenar ayaklı ya da kutu tipi, isteğe bağlı minder. */
export function buildBench(d: Design, _rules: Rules) {
  const { panels, add } = panelSink(d)
  const { width: W, height: H, depth: D } = d.overall
  const t = d.thickness
  const T = d.top.thickness
  const oh = d.top.overhang
  const bench = d.bench ?? { cushion: false, boxed: false, stretcher: 96 }
  const cushion = bench.cushion ? 50 : 0
  const topY = H - cushion - T
  const Wc = W - oh.left - oh.right
  const Dc = D - oh.front - oh.back

  add('top', 'top', 'XZ', W, D, { x: 0, y: topY, z: 0 }, { thickness: T, finish: d.finish.top, edges: ALL, outline: roundedOutline(d.top.radius) })

  if (bench.boxed) {
    const by = d.base.kind === 'none' ? 0 : d.base.height
    add('side-l', 'side', 'YZ', Dc, topY - by, { x: oh.left, y: by, z: oh.back }, { edges: ALL })
    add('side-r', 'side', 'YZ', Dc, topY - by, { x: oh.left + Wc - t, y: by, z: oh.back }, { edges: ALL })
    add('front', 'side', 'XY', Wc - 2 * t, topY - by, { x: oh.left + t, y: by, z: oh.back + Dc - t }, { edges: ALL, grain: 'u' })
    add('back', 'side', 'XY', Wc - 2 * t, topY - by, { x: oh.left + t, y: by, z: oh.back }, { grain: 'u' })
    add('floor', 'bottom', 'XZ', Wc - 2 * t, Dc - 2 * t, { x: oh.left + t, y: by, z: oh.back + t }, { finish: d.finish.carcass })
    if (by > 0) {
      for (const [x, z] of [
        [oh.left + 20, oh.back + 20],
        [oh.left + Wc - 20, oh.back + 20],
        [oh.left + 20, oh.back + Dc - 20],
        [oh.left + Wc - 20, oh.back + Dc - 20],
      ])
        addFoot(add, d, `foot-${x}-${z}`, x!, z!)
    }
  } else {
    add('leg-l', 'side', 'YZ', Dc, topY, { x: oh.left, y: 0, z: oh.back }, { edges: { ...NONE, u1: true } })
    add('leg-r', 'side', 'YZ', Dc, topY, { x: oh.left + Wc - t, y: 0, z: oh.back }, { edges: { ...NONE, u1: true } })
    const sh = Math.max(60, bench.stretcher)
    add('stretcher', 'apron', 'XY', Wc - 2 * t, sh, { x: oh.left + t, y: topY - sh - 120, z: oh.back + Dc / 2 - t / 2 }, { grain: 'u' })
  }

  if (cushion) {
    add('cushion', 'cushion', 'XZ', W - 20, D - 20, { x: 10, y: H - cushion, z: 10 }, { thickness: cushion, finish: d.finish.fabric, soft: 18 })
  }
  return panels
}

/** Koltuk: ayaklar, oturma platformu, kolçak, sırtlık ve minderler. İsteğe bağlı şezlong (L). */
export function buildSofa(d: Design, rules: Rules) {
  const { panels, add } = panelSink(d)
  const { width: W, height: H, depth: D } = d.overall
  const t = d.thickness
  const s = d.sofa ?? { armrests: true, backrest: true, chaise: null }
  const r = rules.sofa
  const legH = d.base.height
  const py = legH
  const seatH = Math.max(80, H - legH - t)
  const armW = s.armrests ? t * 2 : 0
  const ch = s.chaise && s.chaise.width > 0 ? s.chaise : null
  const backD = s.backrest ? r.backDepth : 0

  // Platformlar.
  const blocks: { x: Mm; w: Mm; d: Mm; leftArm: boolean; rightArm: boolean }[] = ch
    ? [
        { x: 0, w: ch.width, d: Math.max(D, ch.depth), leftArm: s.armrests, rightArm: false },
        { x: ch.width, w: W - ch.width, d: D, leftArm: false, rightArm: s.armrests },
      ]
    : [{ x: 0, w: W, d: D, leftArm: s.armrests, rightArm: s.armrests }]

  blocks.forEach((b, bi) => {
    add(`platform-${bi}`, 'bottom', 'XZ', b.w, b.d, { x: b.x, y: py, z: 0 }, { edges: { ...NONE, v1: true } })
    add(`skirt-${bi}`, 'apron', 'XY', b.w, Math.min(120, legH + t), { x: b.x, y: Math.max(0, py - 60), z: b.d - t }, { grain: 'u' })

    // Ayaklar: genişliğe göre ön ve arkada.
    const n = Math.max(2, countFor(r.legs, b.w))
    for (let i = 0; i < n; i++) {
      const lx = b.x + 80 + (i * (b.w - 160)) / (n - 1)
      addFoot(add, d, `leg-${bi}-${i}-f`, lx, b.d - 60, 40)
      addFoot(add, d, `leg-${bi}-${i}-b`, lx, 60, 40)
    }

    const armTop = py + t + r.armExtra
    if (b.leftArm) add(`arm-l-${bi}`, 'side', 'YZ', b.d, armTop - py, { x: b.x, y: py, z: 0 }, { edges: ALL, outline: roundedOutline(40) })
    if (b.rightArm) add(`arm-r-${bi}`, 'side', 'YZ', b.d, armTop - py, { x: b.x + b.w - t, y: py, z: 0 }, { edges: ALL, outline: roundedOutline(40) })

    // Oturma minderleri.
    const innerX = b.x + (b.leftArm ? armW / 2 + t / 2 : 0)
    const innerW = b.w - (b.leftArm ? armW / 2 + t / 2 : 0) - (b.rightArm ? armW / 2 + t / 2 : 0)
    const seats = Math.max(1, countFor(r.seats, innerW))
    const gap = r.cushionGap
    const cw = (innerW - gap * (seats + 1)) / seats
    for (let i = 0; i < seats; i++) {
      add(`seat-${bi}-${i}`, 'cushion', 'XZ', cw, b.d - backD - t - gap * 2, { x: innerX + gap + i * (cw + gap), y: py + t, z: backD + t + gap }, {
        thickness: seatH,
        finish: d.finish.fabric,
        soft: 35,
      })
      if (s.backrest) {
        add(`backc-${bi}-${i}`, 'cushion', 'XY', cw, seatH + r.backExtra - 20, { x: innerX + gap + i * (cw + gap), y: py + t, z: t }, {
          thickness: backD,
          finish: d.finish.fabric,
          soft: 35,
        })
      }
    }
  })

  if (s.backrest) {
    add('backrest', 'side', 'XY', W, t + seatH + r.backExtra, { x: 0, y: py, z: 0 }, { edges: { ...NONE, v1: true }, grain: 'u' })
  }
  return panels
}

/** Ayna: çerçeve paneli + ayna camı. */
export function buildMirror(d: Design, _rules: Rules) {
  const { panels, add } = panelSink(d)
  const { width: W, height: H } = d.overall
  const fr = Math.min(d.mirror?.frame ?? 80, Math.min(W, H) / 4)
  const radius = d.top.radius
  add('frame', 'panel', 'XY', W, H, { x: 0, y: 0, z: 0 }, { edges: ALL, outline: roundedOutline(radius) })
  add('mirror', 'mirror', 'XY', W - 2 * fr, H - 2 * fr, { x: fr, y: fr, z: d.thickness }, {
    thickness: 4,
    finish: { material: MIRROR, color: null },
    outline: roundedOutline(Math.max(0, radius - fr / 2)),
  })
  return panels
}

/** Basit şekiller: dikdörtgen/daire/elips duvar paneli veya kademeli küp raf. */
export function buildShape(d: Design, rules: Rules) {
  const { panels, add } = panelSink(d)
  const { width: W, height: H, depth: D } = d.overall
  const t = d.thickness
  const kind = d.shape?.kind ?? 'rect'
  if (kind !== 'cubes') {
    const outline = kind === 'rect' ? roundedOutline(d.top.radius) : ({ kind: 'ellipse' } as const)
    add('panel', 'panel', 'XY', W, H, { x: 0, y: 0, z: 0 }, { edges: ALL, outline })
    return panels
  }
  const count = Math.round(Math.min(Math.max(d.shape?.count ?? 3, rules.cubes.count.min), rules.cubes.count.max))
  const ch = H / count
  const shift = W * 0.2
  for (let i = 0; i < count; i++) {
    const x = shift + (i % 2 === 0 ? -1 : 1) * shift
    const y = i * ch
    add(`cube-${i}-b`, 'bottom', 'XZ', W, D, { x, y, z: 0 }, { edges: { ...NONE, v1: true } })
    add(`cube-${i}-t`, 'top', 'XZ', W, D, { x, y: y + ch - t, z: 0 }, { edges: { ...NONE, v1: true } })
    add(`cube-${i}-l`, 'side', 'YZ', D, ch - 2 * t, { x, y: y + t, z: 0 }, { edges: { ...NONE, u1: true } })
    add(`cube-${i}-r`, 'side', 'YZ', D, ch - 2 * t, { x: x + W - t, y: y + t, z: 0 }, { edges: { ...NONE, u1: true } })
    add(`cube-${i}-back`, 'back', 'XY', W - 2 * t, ch - 2 * t, { x: x + t, y: y + t, z: 0 }, { thickness: rules.back.thickness })
  }
  return panels
}
