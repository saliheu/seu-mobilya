import { cloneDesign, newCompartment, newSection, type Lock } from './rules'
import type { BaseKind, Design, Finish, FrontKind, HandleKind, Mm, Rules } from './types'

/** Her düzenleme yeni bir tasarım ve (varsa) sabit tutulacak öğe döndürür; ardından normalize edilir. */
export interface Edit {
  design: Design
  lock?: Lock
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0)
const edit = (d: Design, fn: (n: Design) => void, lock?: Lock): Edit => {
  const next = cloneDesign(d)
  fn(next)
  return { design: next, lock }
}

export const setOverall = (d: Design, key: keyof Design['overall'], value: Mm) =>
  edit(d, (n) => {
    n.overall[key] = value
    if (n.family === 'shape' && n.shape?.kind === 'circle' && key === 'width') n.overall.height = value
  })

export const setThickness = (d: Design, value: Mm) => edit(d, (n) => (n.thickness = value))
export const setTopThickness = (d: Design, value: Mm) => edit(d, (n) => (n.top.thickness = value))
export const setOverhang = (d: Design, side: keyof Design['top']['overhang'], value: Mm) => edit(d, (n) => (n.top.overhang[side] = value))
export const setRadius = (d: Design, value: Mm) => edit(d, (n) => (n.top.radius = value))
export const setElevation = (d: Design, value: Mm) => edit(d, (n) => (n.elevation = value))
export const setHandle = (d: Design, value: HandleKind) => edit(d, (n) => (n.handle = value))

export const setBase = (d: Design, kind: BaseKind, rules: Rules) =>
  edit(d, (n) => {
    n.base.kind = kind
    n.base.height = kind === 'plinth' ? 80 : kind === 'legs' ? Math.max(rules.base.min, 120) : kind === 'wheels' ? 90 : kind === 'glides' ? 4 : 0
  })
export const setBaseHeight = (d: Design, value: Mm) => edit(d, (n) => (n.base.height = value))

export const setSectionCount = (d: Design, count: number) =>
  edit(d, (n) => {
    const width = avg(n.sections.map((s) => s.width))
    while (n.sections.length < count) {
      const last = n.sections[n.sections.length - 1]
      const s = newSection(width, Math.max(1, last?.compartments.length ?? 1))
      s.compartments.forEach((c, i) => (c.height = last?.compartments[i]?.height ?? 0))
      n.sections.push(s)
    }
    n.sections.length = Math.max(1, count)
  })

export const setSectionWidth = (d: Design, section: number, width: Mm) =>
  edit(d, (n) => {
    const s = n.sections[section]
    if (s) s.width = width
  }, { section })

export const setKnee = (d: Design, section: number, knee: boolean) =>
  edit(d, (n) => {
    const s = n.sections[section]
    if (!s) return
    s.knee = knee
    if (!knee && s.compartments.length === 0) s.compartments = [newCompartment(0), newCompartment(0), newCompartment(0)]
  })

export const setCompartmentCount = (d: Design, section: number, count: number) =>
  edit(d, (n) => {
    const s = n.sections[section]
    if (!s) return
    const height = avg(s.compartments.map((c) => c.height))
    const back = s.compartments[0]?.back ?? true
    while (s.compartments.length < count) s.compartments.push(newCompartment(height, back))
    s.compartments.length = Math.max(1, count)
  })

export const setCompartmentHeight = (d: Design, section: number, index: number, height: Mm) =>
  edit(d, (n) => {
    const c = n.sections[section]?.compartments[index]
    if (c) c.height = height
  }, { compartment: { section, index } })

export const toggleCompartment = (d: Design, section: number, index: number, key: 'back' | 'hanger' | 'light') =>
  edit(d, (n) => {
    const c = n.sections[section]?.compartments[index]
    if (c) c[key] = !c[key]
  })

/** Tüm bölmelerde LED aydınlatmayı aç/kapat. */
export const setAllLights = (d: Design, on: boolean) =>
  edit(d, (n) => n.sections.forEach((s) => s.compartments.forEach((c) => (c.light = on))))

export const setSkirting = (d: Design, value: { height: Mm; depth: Mm } | null) => edit(d, (n) => (n.skirting = value))
export const setSoftClose = (d: Design, value: boolean) => edit(d, (n) => (n.softClose = value))

/**
 * Bir sütunda start..end bölmelerine ön yüz atar. Bu aralıkla kesişen ön yüzler kaldırılır.
 * Çekmece her bölmeye ayrı ayrı konur; kapaklar aralığın tamamını tek parça kapatır.
 */
export const setFrontRange = (d: Design, section: number, start: number, end: number, kind: FrontKind | 'none', rules: Rules) =>
  edit(d, (n) => {
    const s = n.sections[section]
    if (!s) return
    const lo = Math.min(start, end)
    const hi = Math.max(start, end)
    s.fronts = s.fronts.filter((f) => f.side !== 'front' || f.end < lo || f.start > hi)
    if (kind === 'none') return
    if (kind === 'drawer') {
      for (let i = lo; i <= hi; i++) s.fronts.push({ start: i, end: i, kind, hinge: 'left', mirror: false, side: 'front' })
      return
    }
    const hinge = kind === 'door' || kind === 'glass' ? (s.width + 2 * n.thickness > rules.door.maxWidth ? 'double' : 'left') : 'left'
    s.fronts.push({ start: lo, end: hi, kind, hinge, mirror: false, side: 'front' })
  })

/** Ön yüzün menteşe, ayna, kilit ve iç çekmece ayarları. */
export const setFrontFlags = (
  d: Design,
  section: number,
  start: number,
  patch: { hinge?: 'left' | 'right' | 'double'; mirror?: boolean; lock?: boolean; innerDrawers?: number },
) =>
  edit(d, (n) => {
    const f = n.sections[section]?.fronts.find((x) => x.side === 'front' && x.start === start)
    if (f) Object.assign(f, patch)
  })

/** Arkalık/kenar bandı rengini gövdeyle aynı yap (özel rengi kaldır). */
export const clearFinish = (d: Design, part: 'back' | 'edge') => edit(d, (n) => delete n.finish[part])

export const setDivider = (d: Design, section: number, index: number, value: number | null) =>
  edit(d, (n) => {
    const c = n.sections[section]?.compartments[index]
    if (c) c.divider = value
  })

/** Bir bölmenin ön yüzünü ayarlar; o bölmeyi kapsayan önceki ön yüz kaldırılır. */
export const setFront = (d: Design, section: number, index: number, kind: FrontKind | 'none', rules: Rules) =>
  edit(d, (n) => {
    const s = n.sections[section]
    if (!s) return
    s.fronts = s.fronts.filter((f) => f.side !== 'front' || index < f.start || index > f.end)
    if (kind === 'none') return
    const hinge = kind === 'door' || kind === 'glass' ? (s.width + 2 * n.thickness > rules.door.maxWidth ? 'double' : 'left') : 'left'
    s.fronts.push({ start: index, end: index, kind, hinge, mirror: false, side: 'front' })
  })

/** Kapağı bir üstteki bölmeyi de kapsayacak şekilde uzatır (veya kısaltır). */
export const setFrontSpan = (d: Design, section: number, start: number, end: number) =>
  edit(d, (n) => {
    const s = n.sections[section]
    const f = s?.fronts.find((x) => x.side === 'front' && x.start === start)
    if (!s || !f) return
    s.fronts = s.fronts.filter((x) => x === f || x.side !== 'front' || x.end < start || x.start > end)
    f.end = end
  })

export const setFrontOption = (d: Design, section: number, start: number, patch: { hinge?: 'left' | 'right' | 'double'; mirror?: boolean }) =>
  edit(d, (n) => {
    const f = n.sections[section]?.fronts.find((x) => x.side === 'front' && x.start === start)
    if (f) Object.assign(f, patch)
  })

/** Parça rengini değiştirir. Ön yüz rengi değişince tek tek ön yüz renkleri de güncellenir. */
export const setFinish = (d: Design, part: keyof Design['finish'], value: Finish) =>
  edit(d, (n) => {
    n.finish[part] = { ...value }
    if (part === 'front') n.sections.forEach((s) => s.fronts.forEach((f) => delete f.finish))
    if (part === 'carcass' && (n.family === 'mirror' || n.family === 'shape')) n.finish.top = { ...value }
  })

export function setExtra<K extends 'bed' | 'bench' | 'sofa' | 'table' | 'shape' | 'mirror' | 'corner'>(
  d: Design,
  key: K,
  patch: Partial<NonNullable<Design[K]>>,
): Edit {
  return edit(d, (n) => {
    const cur = (n[key] ?? {}) as object
    ;(n as unknown as Record<string, unknown>)[key] = { ...cur, ...patch }
  })
}
