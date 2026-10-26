// Tüm ölçüler milimetre. Dünya ekseni: x sağa, y yukarı, z duvardan kullanıcıya (z=0 duvar).

export type Mm = number

/** Ürün ailesi: hangi üreticinin (generator) panel listesini kuracağını belirler. */
export type Family = 'cabinet' | 'desk' | 'corner' | 'table' | 'bed' | 'bench' | 'sofa' | 'mirror' | 'shape'

export type FrontKind = 'door' | 'glass' | 'drawer' | 'flapUp' | 'flapDown'

/** Bir sütundaki ön yüz: start..end bölmelerini kapatır (bölmeler alttan üste). */
export interface Front {
  start: number
  end: number
  kind: FrontKind
  /** Kapak menteşe yönü; çift kapak iki kanattır. */
  hinge: 'left' | 'right' | 'double'
  mirror: boolean
  /** Çok yönlü ünitelerde arka yüzden de kapak olabilir. */
  side: 'front' | 'back'
  finish?: Finish
  /** Kapak/çekmece kilidi. */
  lock?: boolean
  /** Kapak arkasında iç çekmece sayısı (yalnız kapaklarda). */
  innerDrawers?: number
}

export interface Compartment {
  /** İç (net) yükseklik. */
  height: Mm
  /** Bu bölmenin arkalığı var mı. */
  back: boolean
  /** Dikey bölücü konumu (0–1), yoksa null. */
  divider: number | null
  /** Askı borusu. */
  hanger: boolean
  /** Bölme tavanında LED raf aydınlatması. */
  light?: boolean
}

/** Bir sütun. Bölmeler alttan üste sıralıdır. */
export interface Section {
  /** İç (net) genişlik. */
  width: Mm
  compartments: Compartment[]
  fronts: Front[]
  /** Masa: bu sütun diz boşluğudur (raf/alt tabla yok). */
  knee: boolean
}

export interface Finish {
  /** Katalogdaki malzeme id'si. */
  material: number
  /** Lake malzemelerde RAL rengi (hex), diğerlerinde null. */
  color: string | null
}

export type BaseKind = 'none' | 'glides' | 'plinth' | 'legs' | 'wheels'
export type HandleKind = 'none' | 'bar' | 'knob'

export interface Design {
  family: Family
  overall: { width: Mm; height: Mm; depth: Mm }
  /** Gövde levha kalınlığı. */
  thickness: Mm
  top: {
    thickness: Mm
    overhang: { left: Mm; right: Mm; front: Mm; back: Mm }
    /** Köşe yuvarlatma yarıçapı. */
    radius: Mm
  }
  base: { kind: BaseKind; height: Mm }
  /** Duvara monte ürünlerde yerden yükseklik. */
  elevation: Mm
  /** Erişilebilen yüz sayısı (bölme dolapları / adalar için 2–4). */
  sides: 1 | 2 | 3 | 4
  handle: HandleKind
  sections: Section[]
  finish: {
    carcass: Finish
    front: Finish
    top: Finish
    accent: Finish
    fabric: Finish
    /** Arkalık rengi (yoksa gövde). */
    back?: Finish
    /** Kenar bandı rengi (yoksa her parçanın kendi rengi). */
    edge?: Finish
  }
  /** Duvar süpürgeliği için yan dikmelerin arka-alt köşesinde oyuk. */
  skirting?: { height: Mm; depth: Mm } | null
  /** Frenli (yumuşak kapanan) menteşe ve raylar. */
  softClose?: boolean

  corner?: { wingX: Mm; wingZ: Mm }
  sofa?: { armrests: boolean; backrest: boolean; chaise: { width: Mm; depth: Mm } | null }
  bed?: { headboard: Mm; footboard: Mm; drawers: boolean; mattress: boolean; rail: Mm }
  bench?: { cushion: boolean; boxed: boolean; stretcher: Mm }
  table?: { legs: 'square' | 'round' | 'panel'; apron: Mm }
  shape?: { kind: 'rect' | 'circle' | 'ellipse' | 'cubes'; count: number }
  mirror?: { frame: Mm }
}

export interface Range {
  min: Mm
  max: Mm
}

export interface CountStep {
  max: Mm
  count: number
}

export interface Rules {
  overall: { width: Range; height: Range; depth: Range }
  elevation: Range
  section: Range
  compartment: { minHeight: Mm }
  base: Range
  overhangMax: Mm
  thicknesses: Mm[]
  topThicknesses: Mm[]
  back: { thickness: Mm }
  front: { gapX: Mm; gapY: Mm; drawerGap: Mm }
  door: { maxWidth: Mm }
  drawer: Range
  legs: { small: Mm; large: Mm; inset: Mm }
  sofa: { seatHeight: Mm; cushionGap: Mm; backDepth: Mm; armExtra: Mm; backExtra: Mm; seats: CountStep[]; legs: CountStep[] }
  bed: { mattress: Mm; railMin: Mm }
  cubes: { count: Range }
}

export type PanelType =
  | 'side'
  | 'divider'
  | 'top'
  | 'bottom'
  | 'shelf'
  | 'plinth'
  | 'back'
  | 'door'
  | 'glass'
  | 'drawerFront'
  | 'handle'
  | 'leg'
  | 'apron'
  | 'modesty'
  | 'rail'
  | 'headboard'
  | 'slat'
  | 'cushion'
  | 'mirror'
  | 'rod'
  | 'panel'
  | 'light'
  | 'lock'
  | 'innerDrawer'
  | 'drawerBox'

/**
 * Hareketli parça (kapak, çekmece). Aynı gruptaki paneller birlikte hareket eder.
 * hingeLeft/Right: dikey menteşe; flapUp/Down: yatay menteşe; slide: dışarı kayar.
 */
export interface Motion {
  group: string
  kind: 'hingeLeft' | 'hingeRight' | 'flapUp' | 'flapDown' | 'slide'
  /** Dönme ekseni / başlangıç noktası (dünya, mm). */
  pivot: { x: Mm; y: Mm; z: Mm }
  /** Arka yüzdeki kapaklar ters yöne açılır. */
  dir: 1 | -1
  /** Çekmece için dışarı çıkma mesafesi. */
  travel?: Mm
}

/** Seçim ve vurgulama için bir bölmenin iç boşluğu (dünya, mm). */
export interface Cell {
  section: number
  compartment: number
  x: Mm
  y: Mm
  z: Mm
  width: Mm
  height: Mm
  depth: Mm
}

/**
 * Panelin yattığı düzlem.
 * XY: öne bakar (arkalık, kapak) → u=x, v=y, kalınlık z boyunca
 * YZ: yana bakar (yan, ara dikme) → u=z, v=y, kalınlık x boyunca
 * XZ: yatay (üst, alt, raf)       → u=x, v=z, kalınlık y boyunca
 */
export type Plane = 'XY' | 'YZ' | 'XZ'

/** Panelin kendi düzlemindeki dört kenarı: u0/u1 = sol/sağ, v0/v1 = alt/üst. */
export interface EdgeBanding {
  u0: boolean
  u1: boolean
  v0: boolean
  v1: boolean
}

export type Outline =
  | { kind: 'rect' }
  | { kind: 'rounded'; radius: Mm }
  | { kind: 'ellipse' }
  /** Panelin u/v düzleminde (0..width, 0..height) çokgen. */
  | { kind: 'polygon'; points: { u: Mm; v: Mm }[] }

export interface Panel {
  id: string
  type: PanelType
  plane: Plane
  /** u yönündeki ölçü. */
  width: Mm
  /** v yönündeki ölçü. */
  height: Mm
  thickness: Mm
  /** Panel kutusunun en küçük köşesi (dünya, mm). */
  origin: { x: Mm; y: Mm; z: Mm }
  finish: Finish
  edges: EdgeBanding
  /** Ahşap damarının yönü. */
  grain: 'u' | 'v'
  outline?: Outline
  /** Yumuşak kenar (minder) yarıçapı. */
  soft?: Mm
  /** Yalnız XY paneller: origin etrafında dikey eksende dönüş (radyan). */
  rotY?: number
  /** Kenar bandı rengi (yüzden farklıysa). */
  edgeFinish?: Finish
  motion?: Motion
  section?: number
  compartment?: number
}

export interface Issue {
  level: 'error' | 'warning' | 'info'
  path: string
  message: string
}
