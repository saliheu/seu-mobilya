import type { Design, Front, Issue, Mm, Rules, Section } from './types'

const round = (v: number) => Math.round(v * 10) / 10

/**
 * Tasarımlar düz JSON'dur. JSON kopyası, structuredClone'un aksine Vue'nun reaktif
 * proxy nesnelerinde de çalışır.
 */
export const cloneDesign = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export interface FitResult {
  values: Mm[]
  ok: boolean
}

/**
 * Uzunlukları toplamları `total` olacak şekilde mevcut oranlarına göre dağıtır,
 * her birini [min, max] aralığında tutar (su doldurma yöntemi).
 * `locked` verilirse o eleman mümkün olduğunca kendi değerinde kalır, diğerleri farkı üstlenir.
 * Kısıtlar sağlanamıyorsa toplam yine korunur, `ok` false döner.
 */
export function fitLengths(values: Mm[], total: Mm, min: Mm, max: Mm, locked?: number): FitResult {
  const n = values.length
  if (n === 0) return { values: [], ok: total === 0 }
  if (n * min > total || n * max < total) {
    return { values: values.map(() => round(total / n)), ok: false }
  }

  const fixed: (number | null)[] = values.map(() => null)
  if (locked !== undefined && locked >= 0 && locked < n && n > 1) {
    const lo = Math.max(min, total - (n - 1) * max)
    const hi = Math.min(max, total - (n - 1) * min)
    fixed[locked] = clamp(values[locked] ?? 0, lo, hi)
  }

  const weights = values.map((v) => (v > 0 ? v : 0))
  for (let pass = 0; pass <= n; pass++) {
    const free = fixed.flatMap((f, i) => (f === null ? [i] : []))
    if (free.length === 0) break
    const remaining = total - fixed.reduce<number>((s, f) => s + (f ?? 0), 0)
    const weighted = free.reduce((s, i) => s + (weights[i] ?? 0), 0)
    // Hiç ağırlık yoksa (ör. yeni tasarım) eşit dağıt.
    const w = (i: number) => (weighted > 0 ? (weights[i] ?? 0) : 1)
    const wsum = weighted > 0 ? weighted : free.length
    const proposal = free.map((i) => ({ i, v: (remaining * w(i)) / wsum }))

    const under = proposal.filter((p) => p.v < min)
    const over = proposal.filter((p) => p.v > max)
    if (under.length) under.forEach((p) => (fixed[p.i] = min))
    else if (over.length) over.forEach((p) => (fixed[p.i] = max))
    else {
      proposal.forEach((p) => (fixed[p.i] = p.v))
      break
    }
  }

  const out = fixed.map((f) => round(f ?? 0))
  // Yuvarlama artığını son elemana ver ki toplam birebir tutsun.
  const diff = round(total - out.reduce((s, v) => s + v, 0))
  const last = out.length - 1
  out[last] = round((out[last] ?? 0) + diff)
  return { values: out, ok: true }
}

export interface Lock {
  section?: number
  compartment?: { section: number; index: number }
}

export interface Normalized {
  design: Design
  issues: Issue[]
}

const LABEL = { width: 'Genişlik', height: 'Yükseklik', depth: 'Derinlik' } as const

/** Bir sütundaki ön yüzleri geçerli bölme aralığına indirger, çakışanları ayıklar. */
export function cleanFronts(s: Section): Front[] {
  if (s.knee) return []
  const k = s.compartments.length
  const used = new Set<string>()
  const out: Front[] = []
  for (const f of s.fronts) {
    if (f.start >= k) continue
    const end = Math.min(f.end, k - 1)
    const span = Array.from({ length: end - f.start + 1 }, (_, i) => `${f.side}:${f.start + i}`)
    if (span.some((x) => used.has(x))) continue
    span.forEach((x) => used.add(x))
    out.push({ ...f, end })
  }
  return out
}

/** Tasarımı kurallara uydurur. Saf fonksiyon: girdiyi değiştirmez. */
export function normalizeDesign(input: Design, rules: Rules, lock: Lock = {}): Normalized {
  const d: Design = cloneDesign(input)
  const issues: Issue[] = []

  for (const key of ['width', 'height', 'depth'] as const) {
    const r = rules.overall[key]
    const v = d.overall[key]
    if (v < r.min || v > r.max) {
      d.overall[key] = clamp(v, r.min, r.max)
      issues.push({ level: 'warning', path: `overall.${key}`, message: `${LABEL[key]} ${r.min}–${r.max} mm aralığına çekildi.` })
    }
  }
  if (d.family === 'shape' && d.shape?.kind === 'circle') d.overall.height = d.overall.width

  d.elevation = clamp(d.elevation, rules.elevation.min, rules.elevation.max)
  if (d.base.kind === 'legs' || d.base.kind === 'wheels') d.base.height = clamp(d.base.height, rules.base.min, rules.base.max)
  else if (d.base.kind === 'plinth') d.base.height = clamp(d.base.height, 40, 200)
  else if (d.base.kind === 'glides') d.base.height = 4
  else d.base.height = 0

  const oh = d.top.overhang
  for (const k of ['left', 'right', 'front', 'back'] as const) oh[k] = clamp(oh[k], 0, rules.overhangMax)
  d.top.radius = clamp(d.top.radius, 0, Math.min(d.overall.width, d.overall.depth) / 2)

  if (d.skirting) {
    d.skirting.height = clamp(d.skirting.height, 20, 150)
    d.skirting.depth = clamp(d.skirting.depth, 5, 40)
  }

  if (d.family === 'cabinet' || d.family === 'desk' || d.family === 'corner') {
    fitSections(d, rules, lock, issues)
    stabilityHints(d, issues)
  }
  if (d.family === 'shape' && d.shape) {
    d.shape.count = Math.round(clamp(d.shape.count, rules.cubes.count.min, rules.cubes.count.max))
  }
  if (d.family === 'corner' && d.corner) {
    d.corner.wingX = clamp(d.corner.wingX, d.overall.width * 0.25, d.overall.width * 0.9)
    d.corner.wingZ = clamp(d.corner.wingZ, d.overall.depth * 0.25, d.overall.depth * 0.9)
  }
  if (d.family === 'sofa' && d.sofa?.chaise) {
    d.sofa.chaise.width = clamp(d.sofa.chaise.width, 400, d.overall.width - 400)
    d.sofa.chaise.depth = clamp(d.sofa.chaise.depth, d.overall.depth, 1800)
  }

  return { design: d, issues }
}

function fitSections(d: Design, rules: Rules, lock: Lock, issues: Issue[]) {
  if (d.sections.length === 0) d.sections.push(newSection(0))
  const t = d.thickness
  const oh = d.top.overhang

  if (d.family !== 'corner') {
    const n = d.sections.length
    const inner = d.overall.width - oh.left - oh.right - (n + 1) * t
    const fit = fitLengths(d.sections.map((s) => s.width), inner, rules.section.min, rules.section.max, lock.section)
    if (!fit.ok) {
      issues.push({
        level: 'error',
        path: 'sections',
        message: `${n} sütun ${d.overall.width} mm genişliğe sığmıyor (sütun ${rules.section.min}–${rules.section.max} mm).`,
      })
    }
    d.sections.forEach((s, i) => (s.width = fit.values[i] ?? 0))
  }

  // Dış yükseklik baza/ayağı içermez.
  const innerHeight = d.overall.height - d.top.thickness - t
  d.sections.forEach((s, si) => {
    if (s.knee) {
      s.compartments = []
      s.fronts = []
      return
    }
    if (s.compartments.length === 0) s.compartments.push(newCompartment(0))
    const k = s.compartments.length
    const fit = fitLengths(
      s.compartments.map((c) => c.height),
      innerHeight - (k - 1) * t,
      rules.compartment.minHeight,
      Number.POSITIVE_INFINITY,
      lock.compartment?.section === si ? lock.compartment.index : undefined,
    )
    if (!fit.ok) {
      issues.push({
        level: 'error',
        path: `sections.${si}`,
        message: `Sütun ${si + 1}: ${k} bölme sığmıyor (en az ${rules.compartment.minHeight} mm).`,
      })
    }
    s.compartments.forEach((c, ci) => (c.height = fit.values[ci] ?? 0))
    s.fronts = cleanFronts(s)
    const depth = d.overall.depth - oh.front - oh.back
    for (const f of s.fronts) {
      const c = s.compartments[f.start]!
      const where = `Sütun ${si + 1}, bölme ${f.start + 1}`
      const path = `sections.${si}.compartments.${f.start}`
      if (f.kind !== 'door') delete f.innerDrawers
      else if (f.innerDrawers) f.innerDrawers = Math.max(0, Math.min(f.innerDrawers, Math.floor(c.height / 160)))
      if (f.kind === 'drawer') {
        if (c.height < rules.drawer.min || c.height > rules.drawer.max)
          issues.push({ level: 'warning', path, message: `${where}: çekmece yüksekliği ${rules.drawer.min}–${rules.drawer.max} mm olmalı.` })
        if (s.width < 250) issues.push({ level: 'warning', path, message: `${where}: bölme çekmece için dar (en az 25 cm).` })
        if (depth < 250) issues.push({ level: 'warning', path, message: `${where}: derinlik çekmece için yetersiz (en az 25 cm).` })
      }
      if (f.kind === 'glass') {
        const h = s.compartments.slice(f.start, f.end + 1).reduce((a, x) => a + x.height + t, -t)
        const leaf = (s.width + 2 * t) / (f.hinge === 'double' ? 2 : 1)
        if (h > 1800 || leaf > 600)
          issues.push({ level: 'warning', path, message: `${where}: cam kapak 60 × 180 cm’den büyük; camda esneme olabilir.` })
      }
    }
  })
}

/** Referans sitedeki gibi stabilite önerileri (bilgi düzeyinde). */
function stabilityHints(d: Design, issues: Issue[]) {
  const total = d.overall.height + (d.base.kind === 'none' ? 0 : d.base.height)
  if (d.elevation === 0 && d.sides === 1 && total > 1500 && d.overall.depth < 400) {
    issues.push({ level: 'info', path: 'overall', message: 'Yüksek ve sığ bir ünite: duvara sabitlenmesi önerilir (sabitleme aparatı pakete dahildir).' })
  }
  d.sections.forEach((s, si) => {
    if (d.sides === 1 && !s.knee && s.compartments.length > 0 && s.compartments.every((c) => !c.back) && d.overall.height > 1000) {
      issues.push({ level: 'info', path: `sections.${si}`, message: `Sütun ${si + 1} arkalıksız: stabilite için en az bir bölmeye arkalık ekleyin.` })
    }
  })
}

export function newCompartment(height: Mm, back = true) {
  return { height, back, divider: null, hanger: false }
}

export function newSection(width: Mm, compartments = 1): Section {
  return { width, compartments: Array.from({ length: compartments }, () => newCompartment(0)), fronts: [], knee: false }
}
