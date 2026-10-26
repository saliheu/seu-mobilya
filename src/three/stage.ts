import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

/** Sahne ışıkları ve ortam yansıması (yapılandırıcı ve küçük resimlerde ortak). */
export function lightStage(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.4
  pmrem.dispose()

  scene.add(new THREE.HemisphereLight('#ffffff', '#b9b2a6', 0.55))
  scene.add(new THREE.AmbientLight('#ffffff', 0.2))
  const sun = new THREE.DirectionalLight('#fffaf0', 1.6)
  sun.position.set(2.5, 4.5, 4)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.02
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -1, near: 0.5, far: 14 })
  scene.add(sun)
}

export function setupRenderer(renderer: THREE.WebGLRenderer) {
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.9
}

/**
 * Kamerayı nesnenin sınır kutusuna göre 3/4 açıdan konumlandırır.
 * Hem dikey hem yatay sığacak uzaklığı seçer (dar ekranlarda yatay belirleyici olur).
 */
export function frameBox(camera: THREE.PerspectiveCamera, box: THREE.Box3, margin = 1.3, azimuth = 0.42, elevation = 0.28) {
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
  const radius = Math.max(size.x, size.z) / 2
  const fitH = size.y / 2 / tan
  const fitW = Math.max(size.x, size.z * 0.7) / 2 / (tan * camera.aspect)
  const dist = Math.max(fitH, fitW) * margin + radius
  const dir = new THREE.Vector3(Math.sin(azimuth), Math.sin(elevation), Math.cos(azimuth)).normalize()
  camera.position.copy(center).addScaledVector(dir, dist)
  camera.near = Math.max(0.01, dist / 100)
  camera.far = dist * 20
  camera.updateProjectionMatrix()
  camera.lookAt(center)
  return { center, dist }
}
