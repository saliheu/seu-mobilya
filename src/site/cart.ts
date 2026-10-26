import { computed, reactive, watch } from 'vue'
import { cloneDesign } from '../core/rules'
import type { Design } from '../core/types'

export interface CartItem {
  key: string
  productId: string
  name: string
  ruleSet: string
  design: Design
  price: number
  quantity: number
}

export interface SavedDesign {
  key: string
  productId: string
  name: string
  ruleSet: string
  design: Design
  price: number
  savedAt: number
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Gizli sekme veya kota dolu: sepet yalnız bu oturumda kalır.
  }
}

const state = reactive({
  items: load<CartItem[]>('seu.cart', []),
  saved: load<SavedDesign[]>('seu.saved', []),
  toast: '' as string,
})

watch(() => state.items, (v) => persist('seu.cart', v), { deep: true })
watch(() => state.saved, (v) => persist('seu.saved', v), { deep: true })

let toastTimer = 0
export function toast(message: string) {
  state.toast = message
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (state.toast = ''), 2600)
}

const uid = () => Math.random().toString(36).slice(2, 10)

export const cart = {
  state,
  count: computed(() => state.items.reduce((s, i) => s + i.quantity, 0)),
  total: computed(() => state.items.reduce((s, i) => s + i.price * i.quantity, 0)),
  add(item: Omit<CartItem, 'key' | 'quantity'>) {
    state.items.push({ ...cloneDesign(item), key: uid(), quantity: 1 })
    toast('Sepete eklendi')
  },
  setQuantity(key: string, quantity: number) {
    const it = state.items.find((i) => i.key === key)
    if (it) it.quantity = Math.max(1, Math.min(20, quantity))
  },
  remove(key: string) {
    state.items = state.items.filter((i) => i.key !== key)
  },
  clear() {
    state.items = []
  },
  save(item: Omit<SavedDesign, 'key' | 'savedAt'>) {
    state.saved.unshift({ ...cloneDesign(item), key: uid(), savedAt: Date.now() })
    state.saved = state.saved.slice(0, 30)
    toast('Tasarım kaydedildi')
  },
  unsave(key: string) {
    state.saved = state.saved.filter((s) => s.key !== key)
  },
}

/** Tasarımı paylaşım bağlantısına gömülebilir kısa metne çevirir. */
export function encodeDesign(d: Design): string {
  const bytes = new TextEncoder().encode(JSON.stringify(d))
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeDesign(s: string): Design | null {
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes)) as Design
  } catch {
    return null
  }
}

export const tl = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' ₺'
