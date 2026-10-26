import * as THREE from 'three'
import { catalog } from '../catalog/catalog'
import { buildPanels } from '../core/panels'
import { normalizeDesign } from '../core/rules'
import type { Design, Rules } from '../core/types'
import { createHuman } from './human'
import { MaterialLibrary } from './materials'
import { applyOpen, buildFurniture, disposeFurniture } from './meshes'
import { frameBox, lightStage, setupRenderer } from './stage'

export interface ThumbOptions {
  /** Yatay bakış açısı (radyan); 0 = tam karşıdan. */
  azimuth?: number
  elevation?: number
  /** Kapak ve çekmeceler açık. */
  open?: boolean
  /** Yanında 180 cm insan figürü. */
  human?: boolean
  width?: number
  height?: number
}

interface Job {
  key: string
  design: Design
  rules: Rules
  opts: ThumbOptions
  resolve: (url: string) => void
}

/**
 * Ürün görselleri için küçük resim üretici. Tek bir ekran dışı WebGL bağlamı kullanır,
 * istekleri sırayla işler ve sonuçları bellekte önbellekler.
 */
class ThumbnailRenderer {
  private renderer: THREE.WebGLRenderer | null = null
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(32, 4 / 3, 0.05, 100)
  private materials = new MaterialLibrary(catalog)
  private cache = new Map<string, string>()
  private queue: Job[] = []
  private busy = false
  private human: THREE.Group | null = null

  render(key: string, design: Design, rules: Rules, opts: ThumbOptions = {}): Promise<string> {
    const hit = this.cache.get(key)
    if (hit) return Promise.resolve(hit)
    return new Promise((resolve) => {
      this.queue.push({ key, design, rules, opts, resolve })
      this.pump()
    })
  }

  cached(key: string) {
    return this.cache.get(key)
  }

  private init() {
    if (this.renderer) return this.renderer
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    r.setPixelRatio(1)
    setupRenderer(r)
    lightStage(this.scene, r)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.16 }))
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)
    this.renderer = r
    return r
  }

  private pump() {
    if (this.busy) return
    const job = this.queue.shift()
    if (!job) return
    this.busy = true
    const run = () => {
      try {
        const url = this.cache.get(job.key) ?? this.draw(job)
        this.cache.set(job.key, url)
        job.resolve(url)
      } finally {
        this.busy = false
        this.pump()
      }
    }
    // requestIdleCallback arka plandaki sekmelerde hiç tetiklenmeyebiliyor; kısa bir zamanlayıcı yeterli.
    setTimeout(run, 8)
  }

  private draw({ design, rules, opts }: Job): string {
    const r = this.init()
    const w = opts.width ?? 640
    const h = opts.height ?? 480
    r.setSize(w, h, false)
    this.camera.aspect = w / h
    const d = normalizeDesign(design, rules).design
    const group = buildFurniture(buildPanels(d, rules), this.materials)
    if (opts.open) applyOpen(group, 1)
    const box = new THREE.Box3().setFromObject(group)
    group.position.x = -(box.min.x + box.max.x) / 2
    group.position.z = -(box.min.z + box.max.z) / 2
    // Duvara monte ürünleri insan figürü yoksa yere indir; figürle birlikte gerçek yüksekliğinde kalsın.
    group.position.y = opts.human ? 0 : -box.min.y
    this.scene.add(group)

    const frameTarget = new THREE.Box3().setFromObject(group)
    if (opts.human) {
      this.human ??= createHuman()
      this.human.position.set(frameTarget.min.x - 0.45, 0, frameTarget.max.z - 0.25)
      this.human.rotation.y = 0.35
      this.scene.add(this.human)
      frameTarget.expandByObject(this.human)
      frameTarget.min.y = 0
    }
    frameBox(this.camera, frameTarget, 1.08, opts.azimuth ?? 0.55, opts.elevation ?? 0.32)
    r.render(this.scene, this.camera)
    const url = r.domElement.toDataURL('image/webp', 0.88)
    if (this.human) this.scene.remove(this.human)
    disposeFurniture(group)
    return url
  }
}

export const thumbnails = new ThumbnailRenderer()
