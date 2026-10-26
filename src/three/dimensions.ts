import * as THREE from 'three'

export interface DimensionValues {
  /** mm cinsinden gösterilecek değerler (tasarım ölçüleri; sınır kutusundan farklı olabilir). */
  width: number
  height: number
  depth: number
}

const INK = '#1d1a16'

/** Mobilyanın sınır kutusu etrafına genişlik, yükseklik ve derinlik ölçü çizgileri çizer. */
export function createDimensions(box: THREE.Box3, values: DimensionValues): THREE.Group {
  const g = new THREE.Group()
  g.name = 'dimensions'
  const { min, max } = box
  const size = box.getSize(new THREE.Vector3())
  // Etiket ve boşluklar mobilyanın boyuna göre ölçeklenir (her iki kamera tipinde tutarlı).
  const unit = THREE.MathUtils.clamp(Math.max(size.x, size.y) * 0.11, 0.11, 0.28)
  const gap = unit * 0.9
  const tick = unit * 0.3

  // Genişlik: üst ön kenarın üstünde.
  line(g, new THREE.Vector3(min.x, max.y + gap, max.z), new THREE.Vector3(max.x, max.y + gap, max.z), new THREE.Vector3(0, tick, 0), values.width, unit)
  // Yükseklik: sağ ön kenarda.
  line(g, new THREE.Vector3(max.x + gap, min.y, max.z), new THREE.Vector3(max.x + gap, max.y, max.z), new THREE.Vector3(tick, 0, 0), values.height, unit)
  // Derinlik: sağ üst kenarda.
  line(g, new THREE.Vector3(max.x + gap, max.y + gap, min.z), new THREE.Vector3(max.x + gap, max.y + gap, max.z), new THREE.Vector3(0, tick, 0), values.depth, unit)
  return g
}

function line(g: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, tickDir: THREE.Vector3, mm: number, unit: number) {
  const mat = new THREE.LineBasicMaterial({ color: INK, depthTest: false, transparent: true, opacity: 0.85 })
  const pts = [a, b, a.clone().add(tickDir), a.clone().sub(tickDir), b.clone().add(tickDir), b.clone().sub(tickDir)]
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  const seg = new THREE.LineSegments(geo, mat)
  seg.renderOrder = 20
  g.add(seg)

  const label = labelSprite(`${(mm / 10).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} cm`, unit)
  label.position.copy(a).add(b).multiplyScalar(0.5)
  g.add(label)
}

function labelSprite(text: string, unit: number): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 80
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = 'rgba(29,26,22,0.18)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(6, 10, 244, 60, 30)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = INK
  ctx.font = '600 32px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 128, 41)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }))
  sprite.scale.set(unit * 2.6, unit * 0.81, 1)
  sprite.renderOrder = 21
  return sprite
}

export function disposeGroup(g: THREE.Object3D) {
  g.traverse((o) => {
    if (o instanceof THREE.LineSegments || o instanceof THREE.Mesh) o.geometry.dispose()
    if (o instanceof THREE.Sprite) {
      o.material.map?.dispose()
      o.material.dispose()
    }
  })
  g.removeFromParent()
}
