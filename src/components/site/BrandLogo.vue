<script setup lang="ts">
defineProps<{ light?: boolean }>()
</script>

<template>
  <span class="logo" :class="{ light }">
    <svg class="mark" viewBox="0 0 40 40" aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="11" fill="currentColor" />
      <path d="M11 13h18M11 20h18M11 27h18" stroke="var(--logo-bg)" stroke-width="2.4" stroke-linecap="round" />
      <path d="M20 13v14" stroke="var(--logo-bg)" stroke-width="2.4" stroke-linecap="round" />
    </svg>
    <span class="text">
      <b>Salih Enes Ünal</b>
      <small>Mobilya Atölyesi</small>
    </span>
  </span>
</template>

<style scoped>
.logo {
  --logo-bg: #fff;
  display: inline-flex;
  align-items: center;
  gap: 11px;
  color: var(--ink);
}
.mark {
  width: 40px;
  height: 40px;
  color: var(--accent);
  flex: none;
}
.text {
  display: grid;
  line-height: 1.05;
}
.text b {
  font-family: var(--serif);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.text small {
  margin-top: 3px;
  font-size: 10.5px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--muted);
}
.light {
  color: #fff;
}
.light .text small {
  color: #b9b0a4;
}
</style>
