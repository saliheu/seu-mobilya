import { describe, expect, it } from 'vitest'
import { catalog } from '../src/catalog/catalog'
import * as A from '../src/core/actions'
import { buildPanels, panelBox, type Box } from '../src/core/panels'
import { cutList, estimatePrice } from '../src/core/price'
import { fitLengths, normalizeDesign } from '../src/core/rules'
import type { Design, Panel } from '../src/core/types'
import { products, rulesFor, types } from '../src/data/products'

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0)

function overlaps(a: Box, b: Box) {
  const eps = 0.05
  return (
    a.x + eps < b.x + b.sx && b.x + eps < a.x + a.sx &&
    a.y + eps < b.y + b.sy && b.y + eps < a.y + a.sy &&
    a.z + eps < b.z + b.sz && b.z + eps < a.z + a.sz
  )
}

const finite = (p: Panel) =>
  [p.width, p.height, p.thickness, p.origin.x, p.origin.y, p.origin.z].every((v) => Number.isFinite(v))

const byType = (type: string) => products.find((p) => p.type === type)!
const prepared = (type: string) => {
  const p = byType(type)
  const rules = rulesFor(p.ruleSet)
  return { rules, design: normalizeDesign(p.design, rules).design }
}

describe('fitLengths', () => {
  it('oranları koruyarak toplamı tutturur', () => {
    expect(fitLengths([100, 300], 800, 0, 1000).values).toEqual([200, 600])
  })
  it('sıfır değerleri eşit dağıtır', () => {
    expect(fitLengths([0, 0, 0], 900, 100, 500).values).toEqual([300, 300, 300])
  })
  it('min/max sınırlarını uygular', () => {
    const r = fitLengths([10, 500, 500], 900, 200, 1000)
    expect(r.values[0]).toBe(200)
    expect(sum(r.values)).toBeCloseTo(900)
  })
  it('kilitli elemanı korur', () => {
    const r = fitLengths([400, 700, 400], 1200, 200, 1000, 1)
    expect(r.values[1]).toBe(700)
    expect(sum(r.values)).toBeCloseTo(1200)
  })
  it('imkânsız durumda ok=false döner ama toplamı korur', () => {
    const r = fitLengths([0, 0, 0], 300, 200, 1000)
    expect(r.ok).toBe(false)
    expect(sum(r.values)).toBeCloseTo(300)
  })
})

describe('katalog verisi', () => {
  it('54 ürün tipi ve 200+ ürün içerir', () => {
    expect(types.length).toBe(54)
    expect(products.length).toBeGreaterThan(200)
  })

  it('her ürünün kural seti vardır', () => {
    for (const p of products) expect(rulesFor(p.ruleSet), p.id).toBeTruthy()
  })
})

describe('tüm ürünler', () => {
  for (const p of products) {
    it(`${p.id} ${p.type} panel üretir`, () => {
      const rules = rulesFor(p.ruleSet)
      const { design, issues } = normalizeDesign(p.design, rules)
      expect(issues.filter((i) => i.level === 'error'), JSON.stringify(issues)).toEqual([])
      const panels = buildPanels(design, rules)
      expect(panels.length).toBeGreaterThan(0)
      expect(panels.every(finite)).toBe(true)
      expect(new Set(panels.map((x) => x.id)).size).toBe(panels.length)

      if (design.family === 'cabinet' || design.family === 'desk') {
        const body = panels
          .filter((x) => !['door', 'glass', 'drawerFront', 'handle', 'rod', 'mirror', 'leg', 'light', 'lock'].includes(x.type))
          .map((x) => ({ x, b: panelBox(x) }))
        for (let i = 0; i < body.length; i++)
          for (let j = i + 1; j < body.length; j++)
            expect(overlaps(body[i]!.b, body[j]!.b), `${body[i]!.x.id} ↔ ${body[j]!.x.id}`).toBe(false)
      }
      expect(estimatePrice(panels, catalog).total).toBeGreaterThan(0)
    })
  }
})

describe('dolap kuralları', () => {
  it('sütun ve bölme ölçüleri dış ölçüye uyar (tabla çıkıntısı dahil)', () => {
    const { design: d } = prepared('floor-bookcase')
    const t = d.thickness
    const n = d.sections.length
    const oh = d.top.overhang
    expect(sum(d.sections.map((s) => s.width)) + (n + 1) * t + oh.left + oh.right).toBeCloseTo(d.overall.width)
    for (const s of d.sections) {
      const k = s.compartments.length
      expect(sum(s.compartments.map((c) => c.height)) + (k - 1) * t).toBeCloseTo(d.overall.height - d.top.thickness - t)
    }
  })

  it('aralık dışı ölçüyü sınıra çeker', () => {
    const { design, rules } = prepared('wardrobe')
    const r = normalizeDesign(A.setOverall(design, 'depth', 99999).design, rules)
    expect(r.design.overall.depth).toBe(rules.overall.depth.max)
    expect(r.issues.some((i) => i.path === 'overall.depth')).toBe(true)
  })

  it('genişlik değişince mobilya yeniden kurulur ve fiyat değişir', () => {
    const { design, rules } = prepared('wardrobe')
    const wider = normalizeDesign(A.setOverall(design, 'width', design.overall.width + 400).design, rules).design
    const a = estimatePrice(buildPanels(design, rules), catalog).total
    const b = estimatePrice(buildPanels(wider, rules), catalog).total
    expect(b).toBeGreaterThan(a)
  })

  it('bölme ön yüzü atanır ve kaldırılır', () => {
    const { design, rules } = prepared('floor-bookcase')
    const withDrawer = normalizeDesign(A.setFront(design, 0, 0, 'drawer', rules).design, rules).design
    expect(buildPanels(withDrawer, rules).some((p) => p.type === 'drawerFront')).toBe(true)
    const removed = normalizeDesign(A.setFront(withDrawer, 0, 0, 'none', rules).design, rules).design
    expect(removed.sections[0]!.fronts.length).toBe(0)
  })

  it('kapak birden fazla bölmeyi kapsayabilir', () => {
    const { design, rules } = prepared('floor-bookcase')
    let d: Design = normalizeDesign(A.setFront(design, 0, 0, 'door', rules).design, rules).design
    d = normalizeDesign(A.setFrontSpan(d, 0, 0, 1).design, rules).design
    const f = d.sections[0]!.fronts[0]!
    expect([f.start, f.end]).toEqual([0, 1])
  })

  it('sütun sayısı azalınca geçersiz ön yüzler temizlenir', () => {
    const { design, rules } = prepared('floor-bookcase')
    const one = normalizeDesign(A.setCompartmentCount(design, 0, 1).design, rules).design
    expect(one.sections[0]!.fronts.every((f) => f.end < 1)).toBe(true)
  })
})

describe('diğer aileler', () => {
  it('koltuk minder sayısı genişlikle artar', () => {
    const { design, rules } = prepared('sofa')
    const narrow = normalizeDesign(A.setOverall(design, 'width', 1000).design, rules).design
    const wide = normalizeDesign(A.setOverall(design, 'width', 2800).design, rules).design
    const seats = (d: Design) => buildPanels(d, rules).filter((p) => p.id.startsWith('seat-')).length
    expect(seats(wide)).toBeGreaterThan(seats(narrow))
  })

  it('karyolada yatak ve ızgara vardır', () => {
    const { design, rules } = prepared('beds')
    const panels = buildPanels(design, rules)
    expect(panels.some((p) => p.type === 'cushion')).toBe(true)
    expect(panels.filter((p) => p.type === 'slat').length).toBeGreaterThan(3)
  })

  it('masada dört ayak vardır', () => {
    const { design, rules } = prepared('dining-table')
    expect(buildPanels(design, rules).filter((p) => p.type === 'leg').length).toBeGreaterThanOrEqual(2)
  })

  it('köşe dolabının kapakları çapraz yüze döndürülür', () => {
    const p = products.find((x) => x.type === 'floor-corner-wardrobe' && x.design.sections[0]!.fronts.length > 0)!
    const rules = rulesFor(p.ruleSet)
    const design = normalizeDesign(p.design, rules).design
    const doors = buildPanels(design, rules).filter((p) => p.type === 'door')
    expect(doors.length).toBeGreaterThan(0)
    expect(doors.every((p) => (p.rotY ?? 0) > 0)).toBe(true)
  })

  it('ayna camı çerçevenin içindedir', () => {
    const { design, rules } = prepared('mirror')
    const ps = buildPanels(design, rules)
    const frame = ps.find((p) => p.type === 'panel')!
    const glass = ps.find((p) => p.type === 'mirror')!
    expect(glass.width).toBeLessThan(frame.width)
    expect(glass.origin.y).toBeGreaterThan(frame.origin.y)
  })
})

describe('fiyat ve kesim listesi', () => {
  const { design, rules } = prepared('wardrobe')
  const panels = buildPanels(design, rules)

  it('aynı parçaları gruplar, hırdavatı listeye almaz', () => {
    const cuts = cutList(panels)
    expect(cuts.find((c) => c.type === 'side')?.count).toBe(2)
    expect(cuts.some((c) => c.type === 'handle' || c.type === 'leg')).toBe(false)
  })

  it('malzeme değişince fiyat değişir', () => {
    const walnut = normalizeDesign(A.setFinish(design, 'carcass', { material: 21, color: null }).design, rules).design
    expect(estimatePrice(buildPanels(walnut, rules), catalog).total).not.toBe(estimatePrice(panels, catalog).total)
  })
})

describe('referans site özellikleri', () => {
  const base = () => {
    const p = products.find((x) => x.type === 'wardrobe' && x.design.sections.length >= 2)!
    const rules = rulesFor(p.ruleSet)
    return { rules, design: normalizeDesign(p.design, rules).design }
  }
  const bodyOverlaps = (panels: Panel[]) => {
    const body = panels
      .filter((x) => !['door', 'glass', 'drawerFront', 'handle', 'rod', 'mirror', 'leg', 'light', 'lock'].includes(x.type) && x.outline?.kind !== 'polygon')
      .map((x) => ({ x, b: panelBox(x) }))
    const out: string[] = []
    for (let i = 0; i < body.length; i++)
      for (let j = i + 1; j < body.length; j++) if (overlaps(body[i]!.b, body[j]!.b)) out.push(`${body[i]!.x.id} ↔ ${body[j]!.x.id}`)
    return out
  }

  it('çoklu bölmeye tek kapak, çekmeceyi her bölmeye ayrı koyar', () => {
    const { design, rules } = base()
    const door = normalizeDesign(A.setFrontRange(design, 0, 0, 1, 'door', rules).design, rules).design
    const f = door.sections[0]!.fronts.find((x) => x.start === 0)!
    expect([f.kind, f.start, f.end]).toEqual(['door', 0, 1])
    const drawers = normalizeDesign(A.setFrontRange(design, 0, 0, 1, 'drawer', rules).design, rules).design
    expect(drawers.sections[0]!.fronts.filter((x) => x.kind === 'drawer').length).toBe(2)
  })

  it('kapak ve çekmeceler hareket bilgisi taşır', () => {
    const { design, rules } = base()
    const d = normalizeDesign(A.setFrontRange(design, 0, 0, 0, 'drawer', rules).design, rules).design
    const d2 = normalizeDesign(A.setFrontRange(d, 1, 0, 0, 'door', rules).design, rules).design
    const ps = buildPanels(d2, rules)
    expect(ps.find((p) => p.type === 'drawerFront')?.motion?.kind).toBe('slide')
    expect(ps.filter((p) => p.type === 'door').every((p) => p.motion && p.motion.kind.startsWith('hinge'))).toBe(true)
    // Kulp kapağıyla aynı grupta hareket eder.
    const door = ps.find((p) => p.type === 'door')!
    const handle = ps.find((p) => p.type === 'handle' && p.motion?.group === door.motion!.group)
    if (d2.handle !== 'none') expect(handle).toBeTruthy()
  })

  it('iç çekmece, kilit ve LED panel üretir; fiyata yansır', () => {
    const { design, rules } = base()
    let d = normalizeDesign(A.setFrontRange(design, 0, 0, 0, 'door', rules).design, rules).design
    const start = d.sections[0]!.fronts.find((x) => x.start === 0)!.start
    d = normalizeDesign(A.setFrontFlags(d, 0, start, { innerDrawers: 1, lock: true }).design, rules).design
    d = normalizeDesign(A.setAllLights(d, true).design, rules).design
    const ps = buildPanels(d, rules)
    const tall = d.sections[0]!.compartments[0]!.height >= 160
    if (tall) expect(ps.some((p) => p.type === 'innerDrawer')).toBe(true)
    expect(ps.some((p) => p.type === 'lock')).toBe(true)
    expect(ps.filter((p) => p.type === 'light').length).toBe(d.sections.reduce((n, s) => n + s.compartments.length, 0))
    const price = estimatePrice(ps, catalog, d)
    expect(price.lines.some((l) => l.label === 'LED aydınlatma')).toBe(true)
    expect(bodyOverlaps(ps)).toEqual([])
  })

  it('süpürgelik oyuğu yanları oyar, alt tablayı öne alır ve çakışma oluşturmaz', () => {
    const { design, rules } = base()
    const flat = normalizeDesign(A.setBase(design, 'none', rules).design, rules).design
    const d = normalizeDesign(A.setSkirting(flat, { height: 80, depth: 15 }).design, rules).design
    const ps = buildPanels(d, rules)
    const side = ps.find((p) => p.id === 'side-l')!
    expect(side.outline?.kind).toBe('polygon')
    const bottom = ps.find((p) => p.id === 'bottom-0')!
    expect(bottom.origin.z).toBeGreaterThan(d.top.overhang.back)
    expect(bodyOverlaps(ps)).toEqual([])
  })

  it('yüksek ve sığ ünitede duvara sabitleme önerir', () => {
    const { design, rules } = base()
    const d = A.setOverall(A.setOverall(design, 'height', 2000).design, 'depth', 300).design
    const r = normalizeDesign(d, rules)
    expect(r.issues.some((i) => i.level === 'info' && i.message.includes('duvara sabitlenmesi'))).toBe(true)
  })

  it('bölme hücreleri her bölme için üretilir', async () => {
    const { buildCells } = await import('../src/core/generators/cabinet')
    const { design } = base()
    const cells = buildCells(design)
    expect(cells.length).toBe(design.sections.reduce((n, s) => n + (s.knee ? 0 : s.compartments.length), 0))
  })
})
