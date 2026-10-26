<script setup lang="ts">
// Seçenek kartları için çizgi çizimleri (48×48). Mobilya terimlerini görselleştirir.
defineProps<{ name: string }>()
</script>

<template>
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <!-- Gövde çerçevesi (çoğu ikonda ortak) -->
    <rect v-if="!name.startsWith('base') && !name.startsWith('handle')" x="9" y="6" width="30" height="36" rx="2" />

    <template v-if="name === 'open'">
      <path d="M9 24h30" />
      <path d="M14 11h20M14 29h20" opacity=".35" />
    </template>
    <template v-else-if="name === 'door-left'">
      <rect x="11" y="8" width="26" height="32" rx="1" fill="currentColor" fill-opacity=".12" />
      <circle cx="33" cy="24" r="1.4" fill="currentColor" />
      <path d="M11 12v-0M11 36v0" stroke-width="3" />
    </template>
    <template v-else-if="name === 'door-right'">
      <rect x="11" y="8" width="26" height="32" rx="1" fill="currentColor" fill-opacity=".12" />
      <circle cx="15" cy="24" r="1.4" fill="currentColor" />
    </template>
    <template v-else-if="name === 'door-double'">
      <rect x="11" y="8" width="12.5" height="32" rx="1" fill="currentColor" fill-opacity=".12" />
      <rect x="24.5" y="8" width="12.5" height="32" rx="1" fill="currentColor" fill-opacity=".12" />
      <circle cx="21" cy="24" r="1.3" fill="currentColor" />
      <circle cx="27" cy="24" r="1.3" fill="currentColor" />
    </template>
    <template v-else-if="name === 'glass'">
      <rect x="11" y="8" width="26" height="32" rx="1" />
      <rect x="15" y="12" width="18" height="24" rx="1" fill="currentColor" fill-opacity=".08" />
      <path d="M18 18l6-4M18 25l10-7" opacity=".5" />
    </template>
    <template v-else-if="name === 'drawer'">
      <rect x="11" y="8" width="26" height="15" rx="1" fill="currentColor" fill-opacity=".12" />
      <rect x="11" y="25" width="26" height="15" rx="1" fill="currentColor" fill-opacity=".12" />
      <path d="M20 15.5h8M20 32.5h8" />
    </template>
    <template v-else-if="name === 'flap-up'">
      <rect x="11" y="8" width="26" height="32" rx="1" fill="currentColor" fill-opacity=".12" />
      <path d="M24 30v-12M19 22l5-5 5 5" />
    </template>
    <template v-else-if="name === 'flap-down'">
      <rect x="11" y="8" width="26" height="32" rx="1" fill="currentColor" fill-opacity=".12" />
      <path d="M24 18v12M19 26l5 5 5-5" />
    </template>
    <template v-else-if="name === 'hinge-left'">
      <rect x="11" y="8" width="26" height="32" rx="1" fill="currentColor" fill-opacity=".12" />
      <path d="M11 14h3M11 34h3" stroke-width="3" />
      <circle cx="33" cy="24" r="1.4" fill="currentColor" />
    </template>
    <template v-else-if="name === 'hinge-right'">
      <rect x="11" y="8" width="26" height="32" rx="1" fill="currentColor" fill-opacity=".12" />
      <path d="M34 14h3M34 34h3" stroke-width="3" />
      <circle cx="15" cy="24" r="1.4" fill="currentColor" />
    </template>
    <template v-else-if="name === 'back-on'">
      <rect x="12" y="9" width="24" height="30" fill="currentColor" fill-opacity=".22" stroke="none" />
    </template>
    <template v-else-if="name === 'back-off'">
      <path d="M14 34L34 14" opacity=".5" />
    </template>
    <template v-else-if="name === 'light'">
      <path d="M12 10h24" stroke-width="3" />
      <path d="M16 14l-3 8M24 14v9M32 14l3 8" opacity=".55" />
    </template>
    <template v-else-if="name === 'hanger'">
      <path d="M11 13h26" stroke-width="2.6" />
      <path d="M24 13v3a3 3 0 1 1-2 3l-9 7h22l-9-7" />
    </template>
    <template v-else-if="name === 'divider'">
      <path d="M24 6v36" stroke-width="2.4" />
    </template>
    <template v-else-if="name === 'inner-drawer'">
      <rect x="13" y="26" width="22" height="6" rx="1" />
      <rect x="13" y="34" width="22" height="6" rx="1" />
      <path d="M11 8v32" stroke-dasharray="2 3" />
    </template>
    <template v-else-if="name === 'lock'">
      <rect x="18" y="22" width="12" height="10" rx="2" />
      <path d="M20 22v-3a4 4 0 0 1 8 0v3" />
    </template>
    <template v-else-if="name === 'mirror'">
      <rect x="14" y="11" width="20" height="26" rx="1" fill="currentColor" fill-opacity=".08" />
      <path d="M18 20l6-5M18 28l12-10" opacity=".55" />
    </template>
    <template v-else-if="name === 'skirting'">
      <path d="M9 42V34h6v8" fill="currentColor" fill-opacity=".2" />
    </template>

    <!-- Kulplar -->
    <template v-else-if="name === 'handle-none'">
      <rect x="10" y="8" width="28" height="32" rx="2" />
      <path d="M30 22l4 2-4 2" />
      <path d="M22 24h12" opacity=".5" />
    </template>
    <template v-else-if="name === 'handle-knob'">
      <rect x="10" y="8" width="28" height="32" rx="2" />
      <circle cx="31" cy="24" r="3" fill="currentColor" fill-opacity=".3" />
    </template>
    <template v-else-if="name === 'handle-bar'">
      <rect x="10" y="8" width="28" height="32" rx="2" />
      <rect x="30" y="16" width="3" height="16" rx="1.5" fill="currentColor" fill-opacity=".3" />
    </template>

    <!-- Ayak tipleri -->
    <template v-else-if="name === 'base-none'">
      <rect x="8" y="10" width="32" height="30" rx="2" />
      <path d="M4 40h40" opacity=".5" />
    </template>
    <template v-else-if="name === 'base-glides'">
      <rect x="8" y="8" width="32" height="30" rx="2" />
      <path d="M11 40h4M33 40h4" stroke-width="3" />
      <path d="M4 42h40" opacity=".5" />
    </template>
    <template v-else-if="name === 'base-plinth'">
      <rect x="8" y="6" width="32" height="28" rx="2" />
      <rect x="11" y="34" width="26" height="6" fill="currentColor" fill-opacity=".25" />
      <path d="M4 40h40" opacity=".5" />
    </template>
    <template v-else-if="name === 'base-legs'">
      <rect x="8" y="6" width="32" height="26" rx="2" />
      <path d="M12 32l-1 8M36 32l1 8" stroke-width="2.4" />
      <path d="M4 40h40" opacity=".5" />
    </template>
    <template v-else-if="name === 'base-wheels'">
      <rect x="8" y="6" width="32" height="26" rx="2" />
      <circle cx="13" cy="37" r="3" />
      <circle cx="35" cy="37" r="3" />
      <path d="M4 40h40" opacity=".5" />
    </template>
  </svg>
</template>
