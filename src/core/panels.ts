import { buildCabinet } from './generators/cabinet'
import { buildCorner } from './generators/corner'
import { buildBed, buildBench, buildMirror, buildShape, buildSofa, buildTable } from './generators/furniture'
import type { Design, Mm, Panel, Rules } from './types'

export interface Box {
  x: Mm
  y: Mm
  z: Mm
  sx: Mm
  sy: Mm
  sz: Mm
}

/** Panelin dünya eksenlerindeki kutusu (döndürülmemiş paneller için). */
export function panelBox(p: Panel): Box {
  const { x, y, z } = p.origin
  switch (p.plane) {
    case 'XY':
      return { x, y, z, sx: p.width, sy: p.height, sz: p.thickness }
    case 'YZ':
      return { x, y, z, sx: p.thickness, sy: p.height, sz: p.width }
    case 'XZ':
      return { x, y, z, sx: p.width, sy: p.thickness, sz: p.height }
  }
}

/**
 * Normalize edilmiş tasarımdan panel listesi üretir.
 * Bu liste 3D sahnenin, fiyatın ve kesim listesinin tek kaynağıdır.
 */
export function buildPanels(d: Design, rules: Rules): Panel[] {
  switch (d.family) {
    case 'cabinet':
    case 'desk':
      return buildCabinet(d, rules)
    case 'corner':
      return buildCorner(d, rules)
    case 'table':
      return buildTable(d, rules)
    case 'bed':
      return buildBed(d, rules)
    case 'bench':
      return buildBench(d, rules)
    case 'sofa':
      return buildSofa(d, rules)
    case 'mirror':
      return buildMirror(d, rules)
    case 'shape':
      return buildShape(d, rules)
  }
}
