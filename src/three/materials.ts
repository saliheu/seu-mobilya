import * as THREE from 'three'
import { findMaterial, type Catalog } from '../catalog/catalog'
import type { Finish } from '../core/types'

export interface MaterialSource {
  /** Panelin geniş yüzleri. */
  face(finish: Finish, grain: 'u' | 'v'): THREE.Material
  /** Panelin kenarları: bantlıysa yüz rengi, değilse ham levha kesiti. */
  edge(finish: Finish, banded: boolean): THREE.Material
}

/**
 * Malzemeleri ve dokuları önbellekler. Aynı (malzeme, renk, damar) için tek örnek
 * üretilir; sahne yeniden kurulduğunda dokular tekrar üretilmez.
 */
export class MaterialLibrary implements MaterialSource {
  private faces = new Map<string, THREE.Material>()
  private edges = new Map<string, THREE.Material>()
  private textures = new Map<string, THREE.Texture>()

  constructor(private catalog: Catalog) {}

  face(finish: Finish, grain: 'u' | 'v'): THREE.Material {
    const key = `${finish.material}|${finish.color}|${grain}`
    const cached = this.faces.get(key)
    if (cached) return cached

    const m = findMaterial(this.catalog, finish.material)
    const base = m?.color ?? '#cccccc'
    let mat: THREE.Material
    switch (m?.kind) {
      case 'lacquer':
        mat = new THREE.MeshPhysicalMaterial({ color: finish.color ?? base, roughness: 0.38, clearcoat: 0.3, clearcoatRoughness: 0.35 })
        break
      case 'wood':
        mat = new THREE.MeshPhysicalMaterial({ map: this.woodTexture(base, grain), roughness: m.roughness })
        break
      case 'fabric':
        mat = new THREE.MeshPhysicalMaterial({ color: base, roughness: 0.95, sheen: 1, sheenRoughness: 0.8, sheenColor: new THREE.Color(base).lerp(new THREE.Color('#ffffff'), 0.3) })
        break
      case 'mirror':
        mat = new THREE.MeshStandardMaterial({ color: '#f4f7f8', metalness: 1, roughness: 0.03, envMapIntensity: 1.4 })
        break
      case 'glass':
        mat = new THREE.MeshPhysicalMaterial({ color: base, roughness: 0.06, metalness: 0.1, transparent: true, opacity: 0.38, depthWrite: false })
        break
      case 'light':
        mat = new THREE.MeshStandardMaterial({ color: '#fff4dc', emissive: '#ffd9a0', emissiveIntensity: 2.2 })
        break
      case 'metal':
        mat = new THREE.MeshStandardMaterial({ color: base, metalness: 0.75, roughness: 0.35 })
        break
      default:
        mat = new THREE.MeshPhysicalMaterial({ color: base, roughness: m?.roughness ?? 0.6 })
    }
    this.faces.set(key, mat)
    return mat
  }

  edge(finish: Finish, banded: boolean): THREE.Material {
    const m = findMaterial(this.catalog, finish.material)
    if (m && (m.kind === 'fabric' || m.kind === 'mirror' || m.kind === 'glass' || m.kind === 'metal' || m.kind === 'light')) return this.face(finish, 'u')
    const key = `${finish.material}|${finish.color}|${banded}`
    const cached = this.edges.get(key)
    if (cached) return cached
    const color = new THREE.Color(finish.color ?? m?.color ?? '#bbbbbb')
    // Bant yoksa ham MDF kesiti; bantlıda yüzeyden biraz koyu ton.
    if (!banded) color.lerp(new THREE.Color('#c9b79a'), 0.6)
    else color.multiplyScalar(0.93)
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
    this.edges.set(key, mat)
    return mat
  }

  dispose() {
    this.faces.forEach((m) => m.dispose())
    this.edges.forEach((m) => m.dispose())
    this.textures.forEach((t) => t.dispose())
    this.faces.clear()
    this.edges.clear()
    this.textures.clear()
  }

  private woodTexture(base: string, grain: 'u' | 'v'): THREE.Texture {
    const key = `${base}|${grain}`
    const cached = this.textures.get(key)
    if (cached) return cached
    const tex = new THREE.CanvasTexture(woodCanvas(base))
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    // Extrude kapak UV'leri metre cinsinden: doku 1 m × 1 m tekrar eder.
    // Damar yatay çizildi; dikey paneller için 90° döndür.
    tex.center.set(0.5, 0.5)
    tex.rotation = grain === 'v' ? Math.PI / 2 : 0
    tex.anisotropy = 8
    this.textures.set(key, tex)
    return tex
  }
}

const canvasCache = new Map<string, HTMLCanvasElement>()

/** Doku görseli olmayan ahşaplar için prosedürel damar. */
function woodCanvas(base: string): HTMLCanvasElement {
  const cached = canvasCache.get(base)
  if (cached) return cached
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  let seed = 1337
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const dark = new THREE.Color(base).multiplyScalar(0.55)
  const light = new THREE.Color(base).lerp(new THREE.Color('#ffffff'), 0.35)
  const rgba = (c: THREE.Color, a: number) => `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},${a})`

  for (let i = 0; i < 160; i++) {
    const y = rand() * size
    const amp = 2 + rand() * 7
    const freq = 0.002 + rand() * 0.006
    const phase = rand() * Math.PI * 2
    ctx.strokeStyle = rand() > 0.45 ? rgba(dark, 0.08 + rand() * 0.16) : rgba(light, 0.06 + rand() * 0.1)
    ctx.lineWidth = 0.6 + rand() * 2.4
    ctx.beginPath()
    for (let x = 0; x <= size; x += 8) {
      const yy = y + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 3.1 + phase) * amp * 0.25
      if (x === 0) ctx.moveTo(x, yy)
      else ctx.lineTo(x, yy)
    }
    ctx.stroke()
  }
  canvasCache.set(base, canvas)
  return canvas
}

const swatchCache = new Map<string, string>()

/** Renk kartları için prosedürel ahşap dokusundan küçük bir görsel. */
export function woodSwatch(base: string): string {
  const hit = swatchCache.get(base)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = c.height = 120
  c.getContext('2d')!.drawImage(woodCanvas(base), 0, 0, 300, 300, 0, 0, 120, 120)
  const url = c.toDataURL('image/webp', 0.85)
  swatchCache.set(base, url)
  return url
}
