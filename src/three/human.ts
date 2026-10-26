import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

/** Ölçek referansı: 180 cm (birim: metre). */
export const HUMAN_HEIGHT = 1.8

/**
 * İsteğe bağlı gerçekçi model: public/models/insan.glb konursa otomatik yüklenir
 * ve 180 cm'ye ölçeklenir. Dosya yoksa çizilmiş insan silueti kullanılır.
 */
export const HUMAN_MODEL_URL = '/models/insan.glb'

/** 180 cm insan figürü: önce silüet, varsa GLB modeli yüklenince onunla değiştirilir. */
export function createHuman(onChange: () => void = () => {}): THREE.Group {
  const group = new THREE.Group()
  group.name = 'human'
  const figure = createSilhouette()
  group.add(figure, contactShadow(0.36), heightLabel())

  loadModel()
    .then((model) => {
      if (!model) return
      group.remove(figure)
      group.add(model)
      group.userData.model = true
      onChange()
    })
    .catch(() => {})
  return group
}

// ---------------------------------------------------------------------------
// Silüet: 1 px = 1 mm. Ön görünüş, rahat duruş. (x: merkezden sağa, y: yerden yukarı)
// ---------------------------------------------------------------------------

const W = 640
const H = 1860
const BOTTOM = 30 // tuvalin altında bırakılan pay (mm)

type Pt = [number, number]
const X = (x: number) => W / 2 + x
const Y = (y: number) => H - BOTTOM - y

function path(ctx: CanvasRenderingContext2D, start: Pt, segs: (Pt | [Pt, Pt] | [Pt, Pt, Pt])[]) {
  ctx.beginPath()
  ctx.moveTo(X(start[0]), Y(start[1]))
  for (const s of segs) {
    if (typeof s[0] === 'number') ctx.lineTo(X(s[0]), Y(s[1] as number))
    else if (s.length === 2) {
      const [c, p] = s as [Pt, Pt]
      ctx.quadraticCurveTo(X(c[0]), Y(c[1]), X(p[0]), Y(p[1]))
    } else {
      const [c1, c2, p] = s as [Pt, Pt, Pt]
      ctx.bezierCurveTo(X(c1[0]), Y(c1[1]), X(c2[0]), Y(c2[1]), X(p[0]), Y(p[1]))
    }
  }
  ctx.closePath()
}

/** Sağ yarı için tanımlanan parçayı x'e göre aynalar (sol taraf hafif farklı olabilir). */
const mirror = (pts: Pt): Pt => [-pts[0], pts[1]]

function fill(ctx: CanvasRenderingContext2D, color: string, edge = 'rgba(0,0,0,0.18)') {
  ctx.fillStyle = color
  ctx.fill()
  ctx.lineWidth = 2.2
  ctx.strokeStyle = edge
  ctx.stroke()
}

function drawPerson(ctx: CanvasRenderingContext2D) {
  const skin = '#c9a487'
  const hair = '#3a2f27'
  const shirt = '#e9e3d9'
  const pants = '#46505a'
  const shoe = '#2a2826'

  // Pantolon: iki bacak tek parça, ağ (crotch) 830 mm.
  const leg = (s: 1 | -1, spread: number): Pt[] => {
    const m = (p: Pt): Pt => [s * p[0] + s * spread * (1 - p[1] / 990), p[1]]
    return [m([16, 760]), m([38, 520]), m([44, 330]), m([50, 92]), m([118, 92]), m([140, 330]), m([136, 520]), m([176, 760]), m([178, 930]), m([160, 990])]
  }
  const r = leg(1, 6)
  const l = leg(-1, 14)
  path(ctx, [0, 990], [
    [158, 990],
    [[176, 960], r[8]!],
    [[176, 860], r[7]!],
    [[140, 640], r[6]!],
    [[118, 430], r[5]!],
    [[126, 180], r[4]!],
    r[3]!,
    [[44, 180], r[2]!],
    [[36, 430], r[1]!],
    [[30, 640], r[0]!],
    [[10, 820], [0, 838]],
    [[-10, 820], l[0]!],
    [[-34, 640], l[1]!],
    [[-40, 430], l[2]!],
    [[-48, 180], l[3]!],
    l[4]!,
    [[-134, 180], l[5]!],
    [[-124, 430], l[6]!],
    [[-148, 640], l[7]!],
    [[-180, 860], l[8]!],
    [[-178, 960], [-158, 990]],
  ])
  fill(ctx, pants)
  // Pantolon ortası ve cep çizgileri.
  ctx.strokeStyle = 'rgba(0,0,0,0.22)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(X(0), Y(985))
  ctx.lineTo(X(0), Y(880))
  ctx.moveTo(X(150), Y(975))
  ctx.quadraticCurveTo(X(118), Y(930), X(120), Y(880))
  ctx.moveTo(X(-150), Y(975))
  ctx.quadraticCurveTo(X(-118), Y(930), X(-120), Y(880))
  ctx.stroke()

  // Ayakkabılar (önden: burun genişler, beyaz taban).
  for (const [s, dx] of [
    [1, 4],
    [-1, 12],
  ] as const) {
    const sx = (x: number) => s * (x + dx)
    path(ctx, [sx(50), 100], [
      [sx(116), 100],
      [[sx(140), 70], [sx(136), 24]],
      [sx(36), 24],
      [[sx(30), 70], [sx(50), 100]],
    ])
    fill(ctx, shoe, 'rgba(0,0,0,0.35)')
    path(ctx, [sx(36), 26], [[sx(136), 26], [sx(138), 6], [sx(34), 6]])
    fill(ctx, '#e6e1d8', 'rgba(0,0,0,0.2)')
  }

  // Boyun (yakanın altında kalır).
  path(ctx, [-36, 1600], [[-40, 1505], [40, 1505], [36, 1600]])
  fill(ctx, skin)
  // Boyun gölgesi.
  path(ctx, [-36, 1560], [[[0, 1540], [36, 1560]], [40, 1505], [-40, 1505]])
  ctx.fillStyle = 'rgba(80,50,30,0.22)'
  ctx.fill()

  // Gömlek/tişört gövdesi, bisiklet yaka.
  path(ctx, [-48, 1530], [
    [[0, 1490], [48, 1530]],
    [[120, 1515], [196, 1478]],
    [[224, 1462], [228, 1420]],
    [[214, 1380], [174, 1362]],
    [[164, 1300], [166, 1240]],
    [[150, 1150], [146, 1090]],
    [[150, 1030], [160, 978]],
    [[0, 966], [-160, 978]],
    [[-150, 1030], [-146, 1090]],
    [[-150, 1150], [-166, 1240]],
    [[-164, 1300], [-174, 1362]],
    [[-214, 1380], [-228, 1420]],
    [[-224, 1462], [-196, 1478]],
    [[-120, 1515], [-48, 1530]],
  ])
  fill(ctx, shirt)
  // Yaka ve göğüs gölgesi.
  ctx.strokeStyle = 'rgba(0,0,0,0.16)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(X(-54), Y(1532))
  ctx.quadraticCurveTo(X(0), Y(1482), X(54), Y(1532))
  ctx.stroke()

  // Kollar: hafif bükük, gövdeden ayrık; kısa kollu tişört + çıplak kol.
  for (const s of [1, -1] as const) {
    const m = (p: Pt): Pt => (s === 1 ? p : mirror(p))
    // Kol (deri): pazu, dirsek ve ön kol kalınlıkları gerçek oranlarda.
    path(ctx, m([222, 1440]), [
      [m([254, 1380]), m([254, 1300])],
      [m([258, 1220]), m([262, 1150])],
      [m([274, 1080]), m([272, 1030])],
      [m([270, 960]), m([266, 905])],
      m([220, 902]),
      [m([212, 970]), m([212, 1040])],
      [m([200, 1110]), m([200, 1150])],
      [m([180, 1230]), m([178, 1290])],
      [m([170, 1340]), m([172, 1370])],
    ])
    fill(ctx, skin)
    // Kısa kol (tişört kolu).
    path(ctx, m([194, 1484]), [
      [m([246, 1474]), m([260, 1400])],
      [m([268, 1340]), m([268, 1296])],
      [m([224, 1282]), m([178, 1294])],
      [m([168, 1340]), m([170, 1372])],
    ])
    fill(ctx, shirt)
    ctx.strokeStyle = 'rgba(0,0,0,0.14)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(X(m([180, 1306])[0]), Y(1306))
    ctx.quadraticCurveTo(X(m([224, 1296])[0]), Y(1296), X(m([264, 1308])[0]), Y(1308))
    ctx.stroke()
    // El: avuç + parmaklar tek parça, başparmak öne dönük.
    path(ctx, m([220, 905]), [
      m([268, 905]),
      [m([286, 850]), m([280, 800])],
      [m([272, 756]), m([246, 752])],
      [m([222, 756]), m([216, 800])],
      [m([210, 860]), m([220, 905])],
    ])
    fill(ctx, skin)
    ctx.strokeStyle = 'rgba(90,55,35,0.22)'
    ctx.beginPath()
    ctx.moveTo(X(m([226, 860])[0]), Y(860))
    ctx.quadraticCurveTo(X(m([228, 820])[0]), Y(820), X(m([238, 800])[0]), Y(800))
    ctx.stroke()
  }

  // Baş: hafif oval, çene daralır.
  path(ctx, [0, 1778], [
    [[60, 1778], [74, 1700]],
    [[80, 1640], [62, 1600]],
    [[40, 1560], [0, 1556]],
    [[-40, 1560], [-62, 1600]],
    [[-80, 1640], [-74, 1700]],
    [[-60, 1778], [0, 1778]],
  ])
  fill(ctx, skin)
  // Kulaklar.
  for (const s of [1, -1]) {
    ctx.beginPath()
    ctx.ellipse(X(s * 76), Y(1668), 11, 25, 0, 0, Math.PI * 2)
    fill(ctx, skin)
  }
  // Yüz gölgeleri: göz çukuru, burun, dudak, çene altı (çok hafif).
  ctx.fillStyle = 'rgba(90,55,35,0.16)'
  for (const s of [1, -1]) {
    ctx.beginPath()
    ctx.ellipse(X(s * 28), Y(1680), 16, 7, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.beginPath()
  ctx.moveTo(X(-4), Y(1668))
  ctx.quadraticCurveTo(X(6), Y(1636), X(10), Y(1628))
  ctx.lineTo(X(-6), Y(1626))
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(X(0), Y(1600), 16, 4, 0, 0, Math.PI * 2)
  ctx.fill()

  // Saç: hacimli kısa kesim, soldan ayrım, favoriler kulak hizasında.
  path(ctx, [-76, 1640], [
    [[-92, 1700], [-86, 1750]],
    [[-76, 1808], [-10, 1814]],
    [[64, 1818], [86, 1764]],
    [[94, 1720], [78, 1640]],
    [[74, 1672], [70, 1700]],
    [[60, 1734], [26, 1740]],
    [[-6, 1744], [-28, 1752]],
    [[-40, 1730], [-62, 1716]],
    [[-72, 1700], [-72, 1672]],
  ])
  fill(ctx, hair, 'rgba(0,0,0,0.3)')
  // Saç parlaklığı ve ayrım çizgisi.
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(X(-20), Y(1796))
  ctx.quadraticCurveTo(X(30), Y(1806), X(66), Y(1770))
  ctx.stroke()
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(X(-34), Y(1754))
  ctx.quadraticCurveTo(X(-40), Y(1786), X(-30), Y(1808))
  ctx.stroke()
}

function createSilhouette(): THREE.Mesh {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.lineJoin = 'round'
  drawPerson(ctx)
  // Soldan gelen ışık: hacim hissi için yumuşak yatay geçiş (yalnız boyalı alanlarda).
  ctx.globalCompositeOperation = 'source-atop'
  const g = ctx.createLinearGradient(X(-280), 0, X(280), 0)
  g.addColorStop(0, 'rgba(255,255,255,0.16)')
  g.addColorStop(0.45, 'rgba(255,255,255,0)')
  g.addColorStop(1, 'rgba(0,0,0,0.2)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  ctx.globalCompositeOperation = 'source-over'

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, toneMapped: false })
  const geo = new THREE.PlaneGeometry(W / 1000, H / 1000)
  geo.translate(0, H / 2000 - BOTTOM / 1000, 0)
  const mesh = new THREE.Mesh(geo, mat)
  mesh.name = 'human-silhouette'
  // Silindirik billboard: yalnız dikey eksende kameraya döner, eğilmez.
  mesh.onBeforeRender = (_r, _s, camera) => {
    const p = new THREE.Vector3()
    mesh.getWorldPosition(p)
    const parentRot = mesh.parent ? mesh.parent.rotation.y : 0
    mesh.rotation.y = Math.atan2(camera.position.x - p.x, camera.position.z - p.z) - parentRot
  }
  return mesh
}

/** Ayakların altında yumuşak temas gölgesi. */
function contactShadow(radius: number): THREE.Mesh {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64)
  g.addColorStop(0, 'rgba(0,0,0,0.38)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  const tex = new THREE.CanvasTexture(c)
  const m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 1.2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }))
  m.rotation.x = -Math.PI / 2
  m.position.y = 0.002
  m.renderOrder = 1
  return m
}

/** Başın üstünde "180 cm" etiketi. */
function heightLabel(): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 96
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(29,26,22,0.85)'
  ctx.beginPath()
  ctx.roundRect(8, 16, 240, 64, 32)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = '600 36px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('180 cm', 128, 50)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }))
  sprite.scale.set(0.3, 0.1125, 1)
  sprite.position.set(0, HUMAN_HEIGHT + 0.14, 0)
  sprite.renderOrder = 10
  return sprite
}

/** public/models/insan.glb varsa yükler, ayakları zemine, boyu 1,80 m olacak şekilde ölçekler. */
async function loadModel(): Promise<THREE.Object3D | null> {
  const res = await fetch(HUMAN_MODEL_URL)
  if (!res.ok) return null
  const buf = await res.arrayBuffer()
  // Geliştirme sunucusu olmayan dosyalar için index.html döndürebilir: glTF imzasını kontrol et.
  if (buf.byteLength < 12 || new TextDecoder().decode(buf.slice(0, 4)) !== 'glTF') return null
  const gltf = await new GLTFLoader().parseAsync(buf, '/models/')
  const model = gltf.scene
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const s = HUMAN_HEIGHT / size.y
  model.scale.setScalar(s)
  const b = new THREE.Box3().setFromObject(model)
  model.position.set(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2)
  model.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true
      o.receiveShadow = true
    }
  })
  return model
}
