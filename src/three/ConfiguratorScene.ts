import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { Catalog } from '../catalog/catalog'
import type { Cell, Panel } from '../core/types'
import { createDimensions, disposeGroup, type DimensionValues } from './dimensions'
import { createHuman } from './human'
import { MaterialLibrary } from './materials'
import { applyOpen, buildFurniture, disposeFurniture, type PanelUserData } from './meshes'
import { frameBox, lightStage, setupRenderer } from './stage'

export type ViewMode = '3d' | 'front' | 'side' | 'top'

export interface CellRef {
  section: number
  compartment: number
}

export interface SceneOptions {
  /** Kamerayı yavaşça döndür (ana sayfa vitrini). */
  autoRotate?: boolean
  /** Duvar ve zemin göster. */
  room?: boolean
  /** Ölçek için 180 cm insan figürü göster. */
  human?: boolean
  onPick?: (data: PanelUserData | null, opts: { shift: boolean }) => void
}

const MM = 0.001
const ACCENT = new THREE.Color('#a8582a')

/**
 * Sahne, kamera, ışık ve kontrolleri yönetir. Çizim talep üzerine yapılır
 * (kamera hareketi, animasyon veya tasarım değişikliği olduğunda).
 */
export class ConfiguratorScene {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(40, 1, 0.05, 100)
  private ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100)
  readonly controls: OrbitControls
  private materials: MaterialLibrary
  private furniture: THREE.Group | null = null
  private cells: THREE.Group | null = null
  private dims: THREE.Group | null = null
  private dimValues: DimensionValues | null = null
  private showDims = false
  private view: ViewMode = '3d'
  private wall: THREE.Mesh | null = null
  private framed = false
  private frame = 0
  private resizeObserver: ResizeObserver
  private raycaster = new THREE.Raycaster()
  private down = { x: 0, y: 0, active: false }
  private human: THREE.Group | null = null
  private openT = 0
  private openTarget = 0
  private selected: CellRef[] = []
  private hovered: CellRef | null = null

  constructor(
    private container: HTMLElement,
    catalog: Catalog,
    private options: SceneOptions = {},
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !options.room })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    setupRenderer(this.renderer)
    container.appendChild(this.renderer.domElement)

    this.materials = new MaterialLibrary(catalog)
    lightStage(this.scene, this.renderer)
    if (options.room !== false) {
      this.scene.background = new THREE.Color('#ebe7e1')
      this.addRoom()
    } else {
      this.addShadowCatcher()
    }

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.12
    this.controls.autoRotate = !!options.autoRotate
    this.controls.autoRotateSpeed = 0.8
    if (options.autoRotate) this.controls.enableZoom = false
    this.controls.addEventListener('change', () => this.requestRender())

    const el = this.renderer.domElement
    el.addEventListener('pointerdown', this.handleDown)
    el.addEventListener('pointerup', this.handleUp)
    el.addEventListener('pointermove', this.handleMove)
    el.addEventListener('pointerleave', this.handleLeave)
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.resize()
  }

  private get active(): THREE.Camera {
    return this.view === '3d' ? this.camera : this.ortho
  }

  /** Tasarım değiştiğinde tüm mobilya panel listesinden yeniden kurulur. */
  setPanels(panels: Panel[], reframe = false, cells: Cell[] = []) {
    if (this.furniture) {
      this.removeEdges()
      disposeFurniture(this.furniture)
    }
    this.furniture = buildFurniture(panels, this.materials)
    applyOpen(this.furniture, this.openT)
    this.buildCells(cells)
    this.scene.add(this.furniture)
    // Mobilyayı duvar ortasına hizala.
    const box = new THREE.Box3().setFromObject(this.furniture)
    this.furniture.position.x = -(box.min.x + box.max.x) / 2
    this.placeHuman((box.max.x - box.min.x) / 2)
    if (this.view !== '3d') this.addEdges()
    this.updateDims()
    if (!this.framed || reframe) {
      this.frameCamera()
      this.framed = true
    } else if (this.view !== '3d') {
      this.frameOrtho()
    }
    this.requestRender()
  }

  /** İnsan figürünü aç/kapat; kadraj figürü de kapsayacak şekilde yenilenir. */
  setHumanVisible(visible: boolean) {
    this.options.human = visible
    if (this.human) this.human.visible = visible
    this.frameCamera()
  }

  /** Ölçü çizgilerini göster/gizle; değerler tasarımın dış ölçüleridir. */
  setDimensions(visible: boolean, values: DimensionValues) {
    this.showDims = visible
    this.dimValues = values
    this.updateDims()
    this.requestRender()
  }

  /** Kapakları/çekmeceleri aç veya kapat (animasyonlu). */
  setOpen(open: boolean) {
    this.openTarget = open ? 1 : 0
    const start = performance.now()
    const from = this.openT
    const step = () => {
      if (this.frame === -1 || !this.furniture) return
      const k = Math.min(1, (performance.now() - start) / 650)
      this.openT = from + (this.openTarget - from) * k
      applyOpen(this.furniture, this.openT)
      this.renderNow()
      if (k < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  /** 3D veya 2D teknik görünüş (ön, yan, üst). */
  setView(view: ViewMode) {
    if (view === this.view) return
    this.view = view
    this.controls.object = this.active
    this.controls.enableRotate = view === '3d'
    this.controls.enablePan = true
    if (this.wall) this.wall.visible = view === '3d' || view === 'front'
    this.scene.background = new THREE.Color(view === '3d' ? '#ebe7e1' : '#f7f5f1')
    if (view === '3d') this.removeEdges()
    else this.addEdges()
    this.frameCamera()
  }

  /** Seçili bölmeler (vurgulanır). */
  setSelection(refs: CellRef[]) {
    this.selected = refs
    this.paintCells()
  }

  frameCamera() {
    if (!this.furniture) return
    if (this.view !== '3d') return this.frameOrtho()
    const box = this.furnitureBox()
    if (this.human?.visible) box.expandByObject(this.human)
    if (this.dims) box.expandByObject(this.dims)
    // Zemine kadar kadraja al ki duvara asılı ürünler havada görünmesin.
    box.min.y = Math.min(box.min.y, 0)
    const { center, dist } = frameBox(this.camera, box, this.options.autoRotate ? 1.15 : 1.3)
    this.controls.target.copy(center)
    this.controls.maxDistance = dist * 3
    this.controls.minDistance = Math.max(0.3, dist * 0.25)
    this.controls.update()
    this.requestRender()
  }

  requestRender() {
    if (this.frame) return
    this.frame = requestAnimationFrame(() => {
      this.frame = 0
      const moving = this.controls.update()
      this.renderer.render(this.scene, this.active)
      if (moving || this.controls.autoRotate) this.requestRender()
    })
  }

  dispose() {
    cancelAnimationFrame(this.frame)
    this.frame = -1
    this.resizeObserver.disconnect()
    const el = this.renderer.domElement
    el.removeEventListener('pointerdown', this.handleDown)
    el.removeEventListener('pointerup', this.handleUp)
    el.removeEventListener('pointermove', this.handleMove)
    el.removeEventListener('pointerleave', this.handleLeave)
    this.controls.dispose()
    if (this.furniture) {
      this.removeEdges()
      disposeFurniture(this.furniture)
    }
    if (this.dims) disposeGroup(this.dims)
    this.materials.dispose()
    this.renderer.dispose()
    el.remove()
  }

  // ---------------------------------------------------------------------------

  private renderNow() {
    this.renderer.render(this.scene, this.active)
  }

  /** Mobilyanın sınır kutusu (seçim kutuları hariç). */
  private furnitureBox(): THREE.Box3 {
    const box = new THREE.Box3()
    if (!this.furniture) return box
    this.furniture.updateMatrixWorld(true)
    this.furniture.traverse((o) => {
      if (o instanceof THREE.Mesh && !o.userData.cell) box.expandByObject(o, false)
    })
    return box
  }

  private frameOrtho() {
    if (!this.furniture) return
    const box = this.furnitureBox()
    if (this.human?.visible && this.view === 'front') box.expandByObject(this.human)
    if (this.dims) box.expandByObject(this.dims)
    box.min.y = Math.min(box.min.y, 0)
    const size = box.getSize(new THREE.Vector3())
    const c = box.getCenter(new THREE.Vector3())
    const cam = this.ortho
    let w = size.x
    let h = size.y
    cam.up.set(0, 1, 0)
    if (this.view === 'front') cam.position.set(c.x, c.y, box.max.z + 10)
    else if (this.view === 'side') {
      w = size.z
      cam.position.set(box.max.x + 10, c.y, c.z)
    } else {
      h = size.z
      cam.up.set(0, 0, -1)
      cam.position.set(c.x, box.max.y + 10, c.z)
    }
    const { clientWidth: vw, clientHeight: vh } = this.container
    const aspect = vw && vh ? vw / vh : 1
    const half = (Math.max(h, w / aspect) / 2) * 1.25
    cam.left = -half * aspect
    cam.right = half * aspect
    cam.top = half
    cam.bottom = -half
    cam.zoom = 1
    cam.near = 0.01
    cam.far = 40
    cam.lookAt(c)
    cam.updateProjectionMatrix()
    this.controls.target.copy(c)
    this.controls.update()
    this.requestRender()
  }

  private updateDims() {
    if (this.dims) {
      disposeGroup(this.dims)
      this.dims = null
    }
    if (!this.showDims || !this.furniture || !this.dimValues) return
    this.dims = createDimensions(this.furnitureBox(), this.dimValues)
    this.scene.add(this.dims)
  }

  /** 2D görünüşte parçaların kenar çizgileri (teknik çizim görünümü). */
  private addEdges() {
    if (!this.furniture) return
    this.removeEdges()
    const mat = new THREE.LineBasicMaterial({ color: '#2b2621', transparent: true, opacity: 0.55 })
    const meshes: THREE.Mesh[] = []
    this.furniture.traverse((o) => {
      if (o instanceof THREE.Mesh && !o.userData.cell) meshes.push(o)
    })
    for (const m of meshes) {
      const lines = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 25), mat)
      lines.userData.edges = true
      m.add(lines)
    }
  }

  private removeEdges() {
    if (!this.furniture) return
    const found: THREE.LineSegments[] = []
    this.furniture.traverse((o) => {
      if (o instanceof THREE.LineSegments && o.userData.edges) found.push(o)
    })
    for (const l of found) {
      l.geometry.dispose()
      l.removeFromParent()
    }
  }

  /** Bölme boşluklarına görünmez seçim kutuları; seçili/üzerine gelinen vurgulanır. */
  private buildCells(cells: Cell[]) {
    this.cells = null
    if (!this.furniture || cells.length === 0) return
    const g = new THREE.Group()
    g.name = 'cells'
    for (const c of cells) {
      const geo = new THREE.BoxGeometry((c.width - 4) * MM, (c.height - 4) * MM, (c.depth - 30) * MM)
      const mat = new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0, depthWrite: false })
      const m = new THREE.Mesh(geo, mat)
      m.position.set((c.x + c.width / 2) * MM, (c.y + c.height / 2) * MM, (c.z + c.depth / 2 + 10) * MM)
      m.userData = { cell: true, section: c.section, compartment: c.compartment }
      m.renderOrder = 5
      g.add(m)
    }
    this.furniture.add(g)
    this.cells = g
    this.paintCells()
  }

  private paintCells() {
    if (!this.cells) return
    const is = (a: CellRef | null, b: { section: number; compartment: number }) => !!a && a.section === b.section && a.compartment === b.compartment
    for (const o of this.cells.children) {
      const m = o as THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>
      const ref = m.userData as CellRef
      const sel = this.selected.some((s) => is(s, ref))
      m.material.opacity = sel ? 0.28 : is(this.hovered, ref) ? 0.12 : 0
    }
    this.requestRender()
  }

  private placeHuman(halfWidth: number) {
    if (!this.human) {
      this.human = createHuman(() => this.frameCamera())
      this.scene.add(this.human)
    }
    // Mobilyanın soluna, duvardan biraz önde; yüzü hafifçe mobilyaya dönük.
    this.human.position.set(-halfWidth - 0.45, 0, 0.32)
    this.human.rotation.y = 0.35
    this.human.visible = !!this.options.human
  }

  private resize() {
    const { clientWidth: w, clientHeight: h } = this.container
    if (!w || !h) return
    this.renderer.setSize(w, h)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    if (this.view !== '3d') this.frameOrtho()
    this.requestRender()
  }

  private hit(e: PointerEvent): THREE.Intersection | undefined {
    if (!this.furniture) return undefined
    const rect = this.renderer.domElement.getBoundingClientRect()
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
    this.raycaster.setFromCamera(ndc, this.active)
    return this.raycaster.intersectObject(this.furniture, true).find((i) => !(i.object instanceof THREE.LineSegments))
  }

  private handleDown = (e: PointerEvent) => {
    this.down = { x: e.clientX, y: e.clientY, active: true }
  }

  /** Sürükleme değil tıklamaysa altındaki bölmeyi/paneli seç. */
  private handleUp = (e: PointerEvent) => {
    this.down.active = false
    if (!this.options.onPick) return
    if (Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > 5) return
    const h = this.hit(e)
    this.options.onPick(h ? (h.object.userData as PanelUserData) : null, { shift: e.shiftKey })
  }

  private moveQueued = false
  private handleMove = (e: PointerEvent) => {
    if (!this.cells || this.down.active || this.moveQueued) return
    this.moveQueued = true
    requestAnimationFrame(() => {
      this.moveQueued = false
      const h = this.hit(e)
      const ud = h?.object.userData as Partial<CellRef> | undefined
      const next = ud && ud.section !== undefined && ud.compartment !== undefined ? { section: ud.section, compartment: ud.compartment } : null
      this.renderer.domElement.style.cursor = next ? 'pointer' : ''
      if (next?.section !== this.hovered?.section || next?.compartment !== this.hovered?.compartment) {
        this.hovered = next
        this.paintCells()
      }
    })
  }

  private handleLeave = () => {
    if (this.hovered) {
      this.hovered = null
      this.paintCells()
    }
  }

  private addRoom() {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ color: '#d6cfc4', roughness: 0.9 }))
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 7), new THREE.MeshStandardMaterial({ color: '#dcd6cc', roughness: 1 }))
    wall.position.set(0, 3.5, -0.002)
    wall.receiveShadow = true
    this.scene.add(wall)
    this.wall = wall
  }

  private addShadowCatcher() {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.18 }))
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)
  }
}
