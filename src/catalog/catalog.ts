import ralData from '../data/ral.json'

export type MaterialKind = 'decor' | 'wood' | 'lacquer' | 'fabric' | 'mirror' | 'glass' | 'metal' | 'light'

export interface CatalogMaterial {
  id: number
  name: string
  kind: MaterialKind
  /** Taban rengi (lake için RAL seçilmezse kullanılır). */
  color: string
  roughness: number
  pricePerM2: number
}

export interface MaterialGroup {
  id: string
  name: string
  description: string
  /** Kullanıcının seçebileceği gövde/kapak grupları. Kumaş vb. ayrı. */
  selectable: boolean
  materials: CatalogMaterial[]
}

export interface CatalogRal {
  code: string
  hex: string
}

export interface Catalog {
  groups: MaterialGroup[]
  rals: CatalogRal[]
  hardware: {
    hinge: number
    drawer: number
    leg: number
    wheel: number
    handle: number
    rodPerM: number
    edgePerM: number
    lightPerM: number
    lock: number
    innerDrawer: number
    softClose: number
  }
}

const m = (id: number, name: string, kind: MaterialKind, color: string, pricePerM2: number, roughness = 0.6): CatalogMaterial => ({
  id,
  name,
  kind,
  color,
  roughness,
  pricePerM2,
})

export const catalog: Catalog = {
  groups: [
    {
      id: 'mdf-lam',
      name: 'MDF Lam',
      description: 'Su itici, kolay temizlenen melamin kaplı MDF.',
      selectable: true,
      materials: [
        m(93, 'Kırık beyaz', 'decor', '#EEEAE1', 420, 0.55),
        m(259, 'Beyaz', 'decor', '#F6F6F3', 420, 0.5),
        m(1, 'Kömür grisi', 'decor', '#3A3C3F', 440),
        m(4, 'Keten', 'decor', '#D8CEBE', 430),
        m(2, 'Bej', 'decor', '#C9BCA9', 430),
        m(6, 'Açık meşe', 'wood', '#CDA676', 460),
        m(5, 'Koyu meşe', 'wood', '#6E4B31', 460),
      ],
    },
    {
      id: 'mdf-dekor',
      name: 'Dekoratif MDF Lam',
      description: 'Canlı renkli, mat dokulu dekoratif yüzeyler.',
      selectable: true,
      materials: [
        m(3, 'Kiraz', 'wood', '#9A4F35', 490),
        m(7, 'Orman yeşili', 'decor', '#3F5C48', 490),
        m(8, 'Gece mavisi', 'decor', '#2C3B56', 490),
        m(9, 'Okyanus mavisi', 'decor', '#3E6F8B', 490),
        m(10, 'Pembe', 'decor', '#E2B4B2', 490),
      ],
    },
    {
      id: 'lake',
      name: 'Lake boyalı MDF',
      description: 'İstediğiniz RAL tonunda, ipeksi lake boya.',
      selectable: true,
      materials: [m(157, 'Lake MDF', 'lacquer', '#E8E4DA', 780, 0.35)],
    },
    {
      id: 'ceviz',
      name: 'Doğal ceviz',
      description: 'Masif ceviz kaplama, yağ cilalı.',
      selectable: true,
      materials: [
        m(21, 'Ceviz naturel', 'wood', '#8B6243', 1250),
        m(20, 'Ceviz maun', 'wood', '#6F3C2B', 1250),
        m(18, 'Ceviz çikolata', 'wood', '#4B3121', 1250),
        m(17, 'Ceviz siyah', 'wood', '#252220', 1250),
      ],
    },
    {
      id: 'cam',
      name: 'Doğal çam',
      description: 'Sıcak tonlu masif çam.',
      selectable: true,
      materials: [
        m(16, 'Çam naturel', 'wood', '#D9B98B', 700),
        m(15, 'Çam maun', 'wood', '#8F4B2F', 700),
        m(13, 'Çam çikolata', 'wood', '#5C3B27', 700),
        m(12, 'Çam siyah', 'wood', '#2B2825', 700),
      ],
    },
    {
      id: 'kayin',
      name: 'Kayın ağacı',
      description: 'Sert ve dayanıklı masif kayın.',
      selectable: true,
      materials: [
        m(167, 'Kayın naturel', 'wood', '#DAB58D', 950),
        m(166, 'Kayın maun', 'wood', '#8D4C33', 950),
        m(164, 'Kayın çikolata', 'wood', '#583927', 950),
        m(163, 'Kayın siyah', 'wood', '#272422', 950),
      ],
    },
    {
      id: 'kumas',
      name: 'Döşemelik kumaş',
      description: 'Leke tutmayan, yıkanabilir kılıflı kumaşlar.',
      selectable: false,
      materials: [
        m(1001, 'Krem', 'fabric', '#E7DFD0', 600, 0.95),
        m(1002, 'Taş grisi', 'fabric', '#A8A39B', 600, 0.95),
        m(1003, 'Antrasit', 'fabric', '#4A4B4E', 600, 0.95),
        m(1004, 'Hardal', 'fabric', '#C9973A', 600, 0.95),
        m(1005, 'Zeytin', 'fabric', '#7A7A4A', 600, 0.95),
        m(1006, 'Lacivert', 'fabric', '#2F3E5C', 600, 0.95),
        m(1007, 'Kiremit', 'fabric', '#A85A3C', 600, 0.95),
        m(1008, 'Kum beji', 'fabric', '#CDB99A', 600, 0.95),
      ],
    },
    {
      id: 'ozel',
      name: 'Cam ve ayna',
      description: '',
      selectable: false,
      materials: [
        m(2001, 'Ayna', 'mirror', '#DDE3E6', 1100, 0.04),
        m(2002, 'Füme cam', 'glass', '#9FB0B5', 900, 0.08),
        m(2003, 'Siyah metal', 'metal', '#222222', 0, 0.4),
        m(2004, 'LED şerit', 'light', '#fff2d6', 0, 0.3),
      ],
    },
  ],
  rals: ralData as CatalogRal[],
  hardware: { hinge: 180, drawer: 320, leg: 120, wheel: 150, handle: 60, rodPerM: 90, edgePerM: 9, lightPerM: 260, lock: 140, innerDrawer: 380, softClose: 70 },
}

export const MIRROR = 2001
export const GLASS = 2002
export const METAL = 2003
export const LED = 2004

const index = new Map<number, CatalogMaterial>()
const groupOf = new Map<number, MaterialGroup>()
for (const g of catalog.groups)
  for (const mat of g.materials) {
    index.set(mat.id, mat)
    groupOf.set(mat.id, g)
  }

export const findMaterial = (_c: Catalog, id: number) => index.get(id)
export const findGroup = (id: number) => groupOf.get(id)
export const fabrics = () => catalog.groups.find((g) => g.id === 'kumas')!.materials
export const woods = () => catalog.groups.filter((g) => ['ceviz', 'cam', 'kayin'].includes(g.id)).flatMap((g) => g.materials)
export const findRal = (hex: string | null) => (hex ? catalog.rals.find((r) => r.hex === hex.toUpperCase()) : undefined)
