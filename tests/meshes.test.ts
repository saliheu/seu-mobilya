import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { buildPanels, panelBox } from '../src/core/panels'
import { normalizeDesign } from '../src/core/rules'
import { products, rulesFor } from '../src/data/products'
import { buildFurniture } from '../src/three/meshes'
import type { MaterialSource } from '../src/three/materials'

// Tarayıcı gerektirmeyen basit malzeme kaynağı.
const stub: MaterialSource = {
  face: () => new THREE.MeshBasicMaterial(),
  edge: () => new THREE.MeshBasicMaterial(),
}

describe('buildFurniture', () => {
  for (const type of ['wardrobe', 'executive-desk', 'sofa', 'beds', 'dining-table', 'mirror', 'circle']) {
    it(`${type}: mesh sınır kutuları panel kutularıyla örtüşür`, () => {
      const p = products.find((x) => x.type === type)!
      const rules = rulesFor(p.ruleSet)
      const panels = buildPanels(normalizeDesign(p.design, rules).design, rules)
      const group = buildFurniture(panels, stub)
      group.updateMatrixWorld(true)
      let meshes = 0
      group.traverse((o) => (o instanceof THREE.Mesh ? meshes++ : 0))
      expect(meshes).toBe(panels.length)

      for (const panel of panels.filter((x) => !x.rotY && !x.soft && x.outline?.kind !== 'polygon')) {
        const box = new THREE.Box3().setFromObject(group.getObjectByName(panel.id)!)
        const b = panelBox(panel)
        const min = new THREE.Vector3(b.x, b.y, b.z).multiplyScalar(0.001)
        const max = new THREE.Vector3(b.x + b.sx, b.y + b.sy, b.z + b.sz).multiplyScalar(0.001)
        expect(box.min.distanceTo(min), `${panel.id} min`).toBeLessThan(1e-4)
        expect(box.max.distanceTo(max), `${panel.id} max`).toBeLessThan(1e-4)
      }
    })
  }
})
