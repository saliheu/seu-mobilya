import type { Design, Family, Rules } from '../core/types'
import data from './products.json'
import rulesData from './rules.json'

export interface Room {
  slug: string
  title: string
}

export interface ProductType {
  slug: string
  title: string
  family: Family
  ruleSet: string
  rooms: string[]
}

export interface Product {
  id: string
  name: string
  type: string
  ruleSet: string
  rooms: string[]
  premium: boolean
  design: Design
}

export const rooms = data.rooms as Room[]
export const types = data.types as ProductType[]
export const products = data.products as unknown as Product[]
export const ruleSets = rulesData as unknown as Record<string, Rules>

export const productById = (id: string) => products.find((p) => p.id === id)
export const typeBySlug = (slug: string) => types.find((t) => t.slug === slug)
export const roomBySlug = (slug: string) => rooms.find((r) => r.slug === slug)
export const rulesFor = (ruleSet: string): Rules => ruleSets[ruleSet] ?? ruleSets.StandardUnitI!
export const productsInRoom = (room: string) => products.filter((p) => p.rooms.includes(room))
export const productsOfType = (type: string) => products.filter((p) => p.type === type)

/** Bir ürün tipinden boş tasarıma başlamak için şablon: o tipin ilk ürünü. */
export function templateFor(type: string): Product | undefined {
  return productsOfType(type)[0]
}

export const familyLabel: Record<Family, string> = {
  cabinet: 'Dolap ve raf',
  desk: 'Masa',
  corner: 'Köşe ünitesi',
  table: 'Masa ve sehpa',
  bed: 'Karyola',
  bench: 'Bank',
  sofa: 'Koltuk',
  mirror: 'Ayna',
  shape: 'Dekoratif',
}
