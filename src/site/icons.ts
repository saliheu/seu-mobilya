import {
  Bath,
  BedDouble,
  Briefcase,
  CookingPot,
  DoorOpen,
  Frame,
  GraduationCap,
  Ruler,
  Shapes,
  ShieldCheck,
  Sofa,
  Timer,
  Truck,
  UtensilsCrossed,
} from 'lucide-vue-next'
import type { Component } from 'vue'

export const roomIcon: Record<string, Component> = {
  'living-room': Sofa,
  'dining-room': UtensilsCrossed,
  entryway: DoorOpen,
  bedroom: BedDouble,
  bathroom: Bath,
  kitchen: CookingPot,
  'teen-room': GraduationCap,
  office: Briefcase,
  decor: Frame,
  'simple-shapes': Shapes,
}

export const uspIcon: Record<string, Component> = {
  truck: Truck,
  shield: ShieldCheck,
  timer: Timer,
  ruler: Ruler,
}
