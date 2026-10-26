import { GLASS, LED, MIRROR } from '../../catalog/catalog'
import type { Cell, Design, Front, Mm, Motion, Rules } from '../types'
import { ALL, NONE, addFoot, baseOffset, metal, panelSink, roundedOutline } from './builder'

type Add = ReturnType<typeof panelSink>['add']

/** Dolap gövdesinin ortak ölçüleri. */
function frame(d: Design) {
  const oh = d.top.overhang
  const by = baseOffset(d)
  const skirt = d.skirting && d.elevation === 0 && d.sides === 1 ? d.skirting : null
  return {
    t: d.thickness,
    T: d.top.thickness,
    x0: oh.left,
    z0: oh.back,
    Wc: d.overall.width - oh.left - oh.right,
    Dc: d.overall.depth - oh.back - oh.front,
    by,
    Hs: d.overall.height - d.top.thickness,
    // Süpürgelik oyuğu: yalnız gövdenin yere değen kısmında anlamlı.
    skirt: skirt && skirt.height > by ? { h: skirt.height - by, d: skirt.depth } : null,
  }
}

/**
 * Dolap ve masa üreticisi.
 * Dış ölçü tabla çıkıntılarını içerir: gövde genişliği = W − sol − sağ çıkıntı.
 * Yükseklik (H) = yan dikme + üst tabla; baza/ayak bunun altına eklenir.
 */
export function buildCabinet(d: Design, rules: Rules) {
  const { panels, add } = panelSink(d)
  const { width: W, height: H, depth: D } = d.overall
  const { t, T, x0, z0, Wc, Dc, by, Hs, skirt } = frame(d)
  const bt = rules.back.thickness
  const frontEdge = { ...NONE, v1: true }
  const sideEdge = { ...NONE, u1: true }
  const backFinish = d.finish.back ?? d.finish.carcass
  // Yan dikmelerde süpürgelik oyuğu (u = derinlik, v = yükseklik).
  const sideOutline = (height: Mm) =>
    skirt
      ? {
          kind: 'polygon' as const,
          points: [
            { u: skirt.d, v: 0 },
            { u: Dc, v: 0 },
            { u: Dc, v: height },
            { u: 0, v: height },
            { u: 0, v: skirt.h },
            { u: skirt.d, v: skirt.h },
          ],
        }
      : undefined

  add('top', 'top', 'XZ', W, D, { x: 0, y: by + H - T, z: 0 }, {
    thickness: T,
    finish: d.finish.top,
    edges: ALL,
    outline: roundedOutline(d.top.radius),
  })
  add('side-l', 'side', 'YZ', Dc, Hs, { x: x0, y: by, z: z0 }, { edges: sideEdge, outline: sideOutline(Hs) })
  add('side-r', 'side', 'YZ', Dc, Hs, { x: x0 + Wc - t, y: by, z: z0 }, { edges: sideEdge, outline: sideOutline(Hs) })

  addBase(add, d, rules, x0, z0, Wc, Dc)

  const n = d.sections.length
  let x = x0 + t
  d.sections.forEach((s, si) => {
    const w = s.width
    if (si > 0) add(`divider-${si}`, 'divider', 'YZ', Dc, Hs, { x: x - t, y: by, z: z0 }, { edges: sideEdge, outline: sideOutline(Hs) })

    if (s.knee) {
      // Diz boşluğu: arkada etek (modesty) paneli.
      const mh = Math.min(400, Hs * 0.5)
      add(`modesty-${si}`, 'modesty', 'XY', w, mh, { x, y: by + Hs - mh, z: z0 + 20 }, { section: si, grain: 'u' })
      x += w + t
      return
    }

    // Süpürgelik varsa alt tabla oyuğun önünden başlar.
    const bz = skirt ? z0 + skirt.d : z0
    add(`bottom-${si}`, 'bottom', 'XZ', w, Dc - (bz - z0), { x, y: by, z: bz }, { edges: frontEdge, section: si })

    const k = s.compartments.length
    const openings: { y: Mm; h: Mm }[] = []
    let cy = by + t
    s.compartments.forEach((c, ci) => {
      if (ci > 0) {
        add(`shelf-${si}-${ci}`, 'shelf', 'XZ', w, Dc, { x, y: cy - t, z: z0 }, { edges: frontEdge, section: si, compartment: ci })
      }
      openings.push({ y: cy, h: c.height })
      // Süpürgelik yüksekliğine uzanan bölmelerde arkalık ve bölücü öne alınır.
      const zb = skirt && cy - by < skirt.h ? z0 + skirt.d : z0
      const back = c.back && !hasBackFront(s.fronts, ci)
      if (back) {
        add(`back-${si}-${ci}`, 'back', 'XY', w, c.height, { x, y: cy, z: zb }, { thickness: bt, finish: backFinish, section: si, compartment: ci })
      }
      const zi = zb + (back ? bt : 0)
      if (c.divider !== null && c.divider > 0 && c.divider < 1) {
        add(`vdiv-${si}-${ci}`, 'divider', 'YZ', Dc - (zi - z0), c.height, { x: x + w * c.divider - t / 2, y: cy, z: zi }, {
          edges: sideEdge,
          section: si,
          compartment: ci,
        })
      }
      if (c.hanger) {
        add(`rod-${si}-${ci}`, 'rod', 'YZ', 25, 25, { x, y: cy + c.height - 70, z: z0 + Dc / 2 - 12.5 }, {
          thickness: w,
          finish: metal,
          outline: { kind: 'ellipse' },
        })
      }
      if (c.light) {
        // Bölme tavanının önüne gömme LED şerit.
        add(`light-${si}-${ci}`, 'light', 'XZ', Math.max(40, w - 40), 14, { x: x + 20, y: cy + c.height - 6, z: z0 + Dc - 60 }, {
          thickness: 6,
          finish: { material: LED, color: null },
          section: si,
          compartment: ci,
        })
      }
      cy += c.height + t
    })

    for (const f of s.fronts) {
      if (f.end >= k) continue
      addFront(add, d, rules, f, {
        si,
        x,
        w,
        openings,
        first: si === 0,
        last: si === n - 1,
        k,
        zFront: z0 + Dc,
        zBack: z0 - t,
        depth: Dc,
        z0,
        hasDivider: s.compartments.slice(f.start, f.end + 1).some((c) => c.divider !== null),
        // Çok yönlü ünitede karşı yüzde de ön yüz varsa çekmece kutuları derinliği paylaşır.
        shared: s.fronts.some((o) => o !== f && o.side !== f.side && o.start <= f.end && o.end >= f.start),
      })
    }

    x += w + t
  })

  return panels
}

/** Bölme boşlukları: 3D'de seçim/vurgulama için (yalnız dolap ve masa). */
export function buildCells(d: Design): Cell[] {
  if (d.family !== 'cabinet' && d.family !== 'desk') return []
  const { t, x0, z0, Dc, by } = frame(d)
  const cells: Cell[] = []
  let x = x0 + t
  d.sections.forEach((s, si) => {
    let cy = by + t
    if (!s.knee)
      s.compartments.forEach((c, ci) => {
        cells.push({ section: si, compartment: ci, x, y: cy + d.elevation, z: z0, width: s.width, height: c.height, depth: Dc })
        cy += c.height + t
      })
    x += s.width + t
  })
  return cells
}

function hasBackFront(fronts: Front[], ci: number) {
  return fronts.some((f) => f.side === 'back' && ci >= f.start && ci <= f.end)
}

function addBase(add: Add, d: Design, rules: Rules, x0: Mm, z0: Mm, Wc: Mm, Dc: Mm) {
  const t = d.thickness
  const by = baseOffset(d)
  if (by <= 0) return
  if (d.base.kind === 'plinth') {
    const setback = d.sides > 1 ? 40 : 30
    add('plinth-f', 'plinth', 'XY', Wc - 2 * t, by, { x: x0 + t, y: 0, z: z0 + Dc - setback - t }, { grain: 'u' })
    add('plinth-b', 'plinth', 'XY', Wc - 2 * t, by, { x: x0 + t, y: 0, z: z0 + (d.sides > 1 ? setback : 0) }, { grain: 'u' })
    return
  }
  const inset = d.base.kind === 'glides' ? 25 : Math.min(rules.legs.inset, Math.min(Wc, Dc) / 4)
  const xs = [x0 + inset, x0 + Wc - inset]
  // Geniş ünitelerde ara dikmelerin altına da ayak.
  if (Wc > 1000) {
    let x = x0 + t
    d.sections.slice(0, -1).forEach((s) => {
      x += s.width + t
      xs.push(x - t / 2)
    })
  }
  xs.forEach((x, i) => {
    addFoot(add, d, `foot-${i}-f`, x, z0 + Dc - inset)
    addFoot(add, d, `foot-${i}-b`, x, z0 + inset)
  })
}

interface FrontContext {
  si: number
  x: Mm
  w: Mm
  openings: { y: Mm; h: Mm }[]
  first: boolean
  last: boolean
  k: number
  zFront: Mm
  zBack: Mm
  depth: Mm
  z0: Mm
  hasDivider: boolean
  shared: boolean
}

/** Tam bindirme ön yüz: dış kenarda levhanın tamamını, iç kenarda yarısını örter. */
function addFront(add: Add, d: Design, rules: Rules, f: Front, c: FrontContext) {
  const t = d.thickness
  const gx = rules.front.gapX
  const gy = f.kind === 'drawer' ? rules.front.drawerGap : rules.front.gapY
  const left = c.first ? t : t / 2
  const right = c.last ? t : t / 2
  const bottom = f.start === 0 ? t : t / 2
  const top = f.end === c.k - 1 ? 0 : t / 2
  const lo = c.openings[f.start]!
  const hi = c.openings[f.end]!
  const fx = c.x - left + gx / 2
  const fw = c.w + left + right - gx
  const fy = lo.y - bottom + gy / 2
  const fh = hi.y + hi.h + top - (lo.y - bottom) - gy
  const back = f.side === 'back'
  const dir: 1 | -1 = back ? -1 : 1
  const z = back ? c.zBack : c.zFront
  // Menteşe ekseni kapağın iç yüzünde.
  const pz = back ? z + t : z
  const finish = f.finish ?? d.finish.front
  const id = `${f.kind}-${c.si}-${f.start}${back ? '-b' : ''}`
  const meta = { section: c.si, compartment: f.start }

  if (f.kind === 'drawer') {
    const motion: Motion = { group: id, kind: 'slide', pivot: { x: fx, y: fy, z: pz }, dir, travel: c.depth * 0.6 }
    add(id, 'drawerFront', 'XY', fw, fh, { x: fx, y: fy, z }, { finish, edges: ALL, grain: 'u', motion, ...meta })
    const boxDepth = c.shared ? c.depth / 2 - 40 : c.depth - 60
    if (!c.hasDivider) addDrawerBox(add, id, c.x, lo.y + 12, c.w, lo.h - 30, back ? c.zBack + t : c.zFront, boxDepth, dir, motion)
    addHandle(add, d, `${id}-h`, fx + fw / 2, fy + fh - Math.min(45, fh / 3), back ? z : z + t, back, 'h', motion)
    if (f.lock) addLock(add, `${id}-lock`, fx + fw / 2, fy + fh - Math.min(90, fh / 2), back ? z : z + t, back, motion)
    return
  }

  const leaves = f.hinge === 'double' && (f.kind === 'door' || f.kind === 'glass') ? 2 : 1
  const lw = (fw - (leaves - 1) * gx) / leaves
  for (let l = 0; l < leaves; l++) {
    const lx = fx + l * (lw + gx)
    const lid = leaves > 1 ? `${id}-${l}` : id
    const hingeLeft = leaves === 2 ? l === 0 : f.hinge === 'left'
    let motion: Motion
    if (f.kind === 'flapUp') motion = { group: lid, kind: 'flapUp', pivot: { x: lx, y: fy + fh, z: pz }, dir }
    else if (f.kind === 'flapDown') motion = { group: lid, kind: 'flapDown', pivot: { x: lx, y: fy, z: pz }, dir }
    else motion = { group: lid, kind: hingeLeft ? 'hingeLeft' : 'hingeRight', pivot: { x: hingeLeft ? lx : lx + lw, y: fy, z: pz }, dir }

    if (f.kind === 'glass') {
      // Cam kapak: ince çerçeve + füme cam.
      const fr = 40
      const o = { finish, edges: ALL, motion, ...meta }
      add(`${lid}-frame-l`, 'door', 'XY', fr, fh, { x: lx, y: fy, z }, o)
      add(`${lid}-frame-r`, 'door', 'XY', fr, fh, { x: lx + lw - fr, y: fy, z }, o)
      add(`${lid}-frame-b`, 'door', 'XY', lw - 2 * fr, fr, { x: lx + fr, y: fy, z }, { ...o, grain: 'u' })
      add(`${lid}-frame-t`, 'door', 'XY', lw - 2 * fr, fr, { x: lx + fr, y: fy + fh - fr, z }, { ...o, grain: 'u' })
      add(`${lid}-glass`, 'glass', 'XY', lw - 2 * fr, fh - 2 * fr, { x: lx + fr, y: fy + fr, z: z + t / 2 - 3 }, {
        finish: { material: GLASS, color: null },
        thickness: 6,
        motion,
        ...meta,
      })
    } else {
      add(lid, 'door', 'XY', lw, fh, { x: lx, y: fy, z }, { finish, edges: ALL, motion, ...meta })
      if (f.mirror && lw > 120 && fh > 200) {
        add(`${lid}-mirror`, 'mirror', 'XY', lw - 60, fh - 100, { x: lx + 30, y: fy + 50, z: back ? z - 3 : z + t }, {
          finish: { material: MIRROR, color: null },
          thickness: 3,
          motion,
          ...meta,
        })
      }
    }
    const zh = back ? z : z + t
    if (f.kind === 'flapUp' || f.kind === 'flapDown') {
      const hy = f.kind === 'flapUp' ? fy + 40 : fy + fh - 40
      addHandle(add, d, `${lid}-h`, lx + lw / 2, hy, zh, back, 'h', motion)
    } else {
      // Menteşe solda ise kulp sağ kenarda.
      const hx = hingeLeft ? lx + lw - 35 : lx + 35
      const hy = fy + (fh > 900 ? Math.min(fh * 0.5, 1050 - fy) : fh / 2)
      const cy = Math.max(fy + 80, Math.min(fy + fh - 80, hy))
      addHandle(add, d, `${lid}-h`, hx, cy, zh, back, 'v', motion)
      if (f.lock) addLock(add, `${lid}-lock`, hingeLeft ? lx + lw - 35 : lx + 35, Math.min(fy + fh - 40, cy + 140), zh, back, motion)
    }
  }

  // Kapak arkasında iç çekmeceler (kapak açılınca görünür).
  const count = f.kind === 'door' && !c.hasDivider ? Math.min(f.innerDrawers ?? 0, Math.floor(lo.h / 160)) : 0
  const ih = 150
  for (let i = 0; i < count; i++) {
    const iz = (back ? c.zBack + t : c.zFront) - (back ? -25 : 25 + t)
    const iy = lo.y + 10 + i * (ih + 12)
    const iid = `${id}-in-${i}`
    add(iid, 'innerDrawer', 'XY', c.w - 20, ih, { x: c.x + 10, y: iy, z: iz }, {
      finish: d.finish.carcass,
      edges: { ...NONE, v1: true },
      grain: 'u',
      motion: { group: iid, kind: 'slide', pivot: { x: c.x, y: iy, z: iz }, dir, travel: c.depth * 0.45 },
      ...meta,
    })
    const im: Motion = { group: iid, kind: 'slide', pivot: { x: c.x, y: iy, z: iz }, dir, travel: c.depth * 0.45 }
    addDrawerBox(add, iid, c.x + 10, iy + 8, c.w - 20, ih - 30, back ? iz + t : iz, (c.shared ? c.depth / 2 : c.depth) - 90, dir, im)
  }
}

/**
 * Çekmece kutusu: iki yan, taban ve arka (12 mm). Ön yüzün arkasında, onunla birlikte kayar.
 * `face` ön yüzün kutuya bakan yüzeyidir; kutu oradan gövdenin içine doğru uzanır.
 */
function addDrawerBox(add: Add, id: string, x: Mm, y: Mm, w: Mm, h: Mm, face: Mm, depth: Mm, dir: 1 | -1, motion: Motion) {
  const bt = 12
  const gap = 13 // ray boşluğu
  const bw = w - 2 * gap
  const bh = Math.max(60, h)
  const bd = Math.max(150, depth)
  const z = dir === 1 ? face - bd : face
  const o = { thickness: bt, finish: { material: 93, color: null }, motion, edges: { ...NONE, v1: true } }
  add(`${id}-box-l`, 'drawerBox', 'YZ', bd, bh, { x: x + gap, y, z }, o)
  add(`${id}-box-r`, 'drawerBox', 'YZ', bd, bh, { x: x + gap + bw - bt, y, z }, o)
  add(`${id}-box-b`, 'drawerBox', 'XZ', bw - 2 * bt, bd, { x: x + gap + bt, y, z }, { ...o, edges: NONE })
  add(`${id}-box-k`, 'drawerBox', 'XY', bw - 2 * bt, bh - bt, { x: x + gap + bt, y: y + bt, z: dir === 1 ? z : z + bd - bt }, o)
}

function addHandle(add: Add, d: Design, id: string, cx: Mm, cy: Mm, z: Mm, back: boolean, dir: 'h' | 'v', motion: Motion) {
  if (d.handle === 'none') return
  const depth = 24
  const zz = back ? z - depth : z
  if (d.handle === 'knob') {
    add(id, 'handle', 'XY', 30, 30, { x: cx - 15, y: cy - 15, z: zz }, { thickness: depth, finish: metal, outline: { kind: 'ellipse' }, motion })
    return
  }
  const [hw, hh] = dir === 'h' ? [160, 14] : [14, 160]
  add(id, 'handle', 'XY', hw, hh, { x: cx - hw / 2, y: cy - hh / 2, z: zz }, {
    thickness: depth,
    finish: d.finish.accent,
    outline: { kind: 'rounded', radius: 6 },
    motion,
  })
}

function addLock(add: Add, id: string, cx: Mm, cy: Mm, z: Mm, back: boolean, motion: Motion) {
  add(id, 'lock', 'XY', 20, 20, { x: cx - 10, y: cy - 10, z: back ? z - 5 : z }, { thickness: 5, finish: metal, outline: { kind: 'ellipse' }, motion })
}
