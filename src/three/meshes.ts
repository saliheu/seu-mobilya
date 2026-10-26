import * as THREE from 'three'
import type { Motion, Outline, Panel } from '../core/types'
import type { MaterialSource } from './materials'

const MM = 0.001

export interface PanelUserData {
  panelId: string
  type: Panel['type']
  section?: number
  compartment?: number
}

/** Panelin u/v düzlemindeki kesitini çizer (metre). `inset` kadar içeriden başlar. */
function shapeFor(outline: Outline | undefined, w: number, h: number, inset = 0): THREE.Shape {
  const s = new THREE.Shape()
  const x0 = inset
  const y0 = inset
  const x1 = w - inset
  const y1 = h - inset
  const kind = outline?.kind ?? 'rect'

  if (kind === 'ellipse') {
    s.absellipse(w / 2, h / 2, (w - 2 * inset) / 2, (h - 2 * inset) / 2, 0, Math.PI * 2, false, 0)
    return s
  }
  if (outline?.kind === 'polygon') {
    outline.points.forEach((p, i) => (i === 0 ? s.moveTo(p.u * MM, p.v * MM) : s.lineTo(p.u * MM, p.v * MM)))
    s.closePath()
    return s
  }
  const r = outline?.kind === 'rounded' ? Math.min(outline.radius * MM, (x1 - x0) / 2, (y1 - y0) / 2) : 0
  if (r <= 0) {
    s.moveTo(x0, y0)
    s.lineTo(x1, y0)
    s.lineTo(x1, y1)
    s.lineTo(x0, y1)
    s.closePath()
    return s
  }
  s.moveTo(x0 + r, y0)
  s.lineTo(x1 - r, y0)
  s.quadraticCurveTo(x1, y0, x1, y0 + r)
  s.lineTo(x1, y1 - r)
  s.quadraticCurveTo(x1, y1, x1 - r, y1)
  s.lineTo(x0 + r, y1)
  s.quadraticCurveTo(x0, y1, x0, y1 - r)
  s.lineTo(x0, y0 + r)
  s.quadraticCurveTo(x0, y0, x0 + r, y0)
  return s
}

function geometryFor(p: Panel): THREE.BufferGeometry {
  const w = p.width * MM
  const h = p.height * MM
  const t = p.thickness * MM
  const curved = p.outline?.kind === 'ellipse' || p.outline?.kind === 'rounded'
  const soft = Math.min((p.soft ?? 0) * MM, t / 2.2, w / 4, h / 4)
  if (soft > 0) {
    // Minder: kesit bevel kadar küçültülür, bevel dışa taşarak tam ölçüye tamamlar.
    const g = new THREE.ExtrudeGeometry(shapeFor(p.outline ?? { kind: 'rounded', radius: soft / MM }, w, h, soft), {
      depth: Math.max(t - 2 * soft, 0.001),
      bevelEnabled: true,
      bevelThickness: soft,
      bevelSize: soft,
      bevelSegments: 4,
      curveSegments: 12,
    })
    g.translate(0, 0, soft)
    return g
  }
  return new THREE.ExtrudeGeometry(shapeFor(p.outline, w, h), {
    depth: t,
    bevelEnabled: false,
    steps: 1,
    curveSegments: curved ? 24 : 4,
  })
}

/**
 * Panel listesini three.js nesnelerine çevirir. Her panel: kesit Shape → kalınlık kadar
 * ExtrudeGeometry. Malzeme grupları: [0] geniş yüzler, [1] kenarlar.
 */
export function buildFurniture(panels: Panel[], materials: MaterialSource): THREE.Group {
  const group = new THREE.Group()
  group.name = 'furniture'
  // Hareketli parçalar menteşe/ray noktasında bir pivot grubuna toplanır.
  const pivots = new Map<string, THREE.Group>()

  for (const p of panels) {
    const face = materials.face(p.finish, p.grain)
    const banded = p.edges.u0 || p.edges.u1 || p.edges.v0 || p.edges.v1
    const plain = p.soft || p.type === 'leg' || p.type === 'handle' || p.type === 'rod' || p.type === 'light' || p.type === 'lock'
    const edge = plain ? face : materials.edge(p.edgeFinish ?? p.finish, banded)
    const mesh = new THREE.Mesh(geometryFor(p), [face, edge])
    mesh.name = p.id
    mesh.castShadow = p.type !== 'glass' && p.type !== 'light'
    mesh.receiveShadow = true
    mesh.userData = { panelId: p.id, type: p.type, section: p.section, compartment: p.compartment } satisfies PanelUserData
    place(mesh, p)

    if (p.type === 'light') {
      // LED şeridin altını aydınlatan yumuşak nokta ışık.
      const lamp = new THREE.PointLight('#ffd9a0', 0.9, 0.9, 2)
      lamp.position.set((p.width * MM) / 2, -0.03, (p.height * MM) / 2)
      mesh.add(lamp)
    }

    if (p.motion) {
      let pivot = pivots.get(p.motion.group)
      if (!pivot) {
        pivot = new THREE.Group()
        pivot.position.set(p.motion.pivot.x * MM, p.motion.pivot.y * MM, p.motion.pivot.z * MM)
        pivot.userData.motion = p.motion
        pivots.set(p.motion.group, pivot)
        group.add(pivot)
      }
      mesh.position.sub(pivot.position)
      pivot.add(mesh)
    } else {
      group.add(mesh)
    }
  }

  return group
}

/** Kapakları/çekmeceleri açar: 0 = kapalı, 1 = tam açık. */
export function applyOpen(group: THREE.Object3D, t: number) {
  group.traverse((o) => {
    const m = o.userData.motion as Motion | undefined
    if (!m) return
    const base = o.userData.base ?? (o.userData.base = o.position.clone())
    o.position.copy(base)
    o.rotation.set(0, 0, 0)
    const e = t * t * (3 - 2 * t)
    switch (m.kind) {
      case 'hingeLeft':
        o.rotation.y = -1.6 * e * m.dir
        break
      case 'hingeRight':
        o.rotation.y = 1.6 * e * m.dir
        break
      case 'flapUp':
        o.rotation.x = -1.35 * e * m.dir
        break
      case 'flapDown':
        o.rotation.x = 1.35 * e * m.dir
        break
      case 'slide':
        o.position.z = base.z + ((m.travel ?? 300) * MM) * e * m.dir
        break
    }
  })
}

/** Extrude yerel ekseni (u, v, kalınlık) → dünya eksenine yerleştirir. */
function place(mesh: THREE.Mesh, p: Panel) {
  const x = p.origin.x * MM
  const y = p.origin.y * MM
  const z = p.origin.z * MM
  const t = p.thickness * MM
  switch (p.plane) {
    case 'XY':
      mesh.position.set(x, y, z)
      if (p.rotY) mesh.rotation.y = p.rotY
      break
    case 'YZ':
      // (u, v, e) → (-e, v, u)
      mesh.rotation.y = -Math.PI / 2
      mesh.position.set(x + t, y, z)
      break
    case 'XZ':
      // (u, v, e) → (u, -e, v)
      mesh.rotation.x = Math.PI / 2
      mesh.position.set(x, y + t, z)
      break
  }
}

/** Grubun geometrilerini serbest bırakır (malzemeler kütüphaneye aittir). */
export function disposeFurniture(group: THREE.Group) {
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) o.geometry.dispose()
  })
  group.removeFromParent()
}
