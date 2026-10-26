<script setup lang="ts">
import { brand, faqs } from '../site/brand'
</script>

<template>
  <div class="container narrow">
    <header class="page-head">
      <span class="eyebrow">Sık sorulan sorular</span>
      <h1>Merak ettikleriniz</h1>
    </header>
    <details v-for="f in faqs" :key="f.q" class="faq">
      <summary>{{ f.q }}</summary>
      <p class="muted">{{ f.a }}</p>
    </details>
    <div class="more">
      <b>Sorunuzun cevabını bulamadınız mı?</b>
      <p class="muted">{{ brand.hours }} arasında {{ brand.phone }} numarasından ya da WhatsApp’tan bize ulaşın.</p>
      <RouterLink to="/iletisim" class="btn">İletişime geç</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.narrow {
  max-width: 820px;
}
.faq {
  margin-bottom: 10px;
  padding: 16px 20px;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--line);
}
summary {
  cursor: pointer;
  font-weight: 600;
}
.faq p {
  margin: 10px 0 0;
}
.more {
  margin-top: 32px;
  padding: 24px;
  border-radius: var(--radius);
  background: var(--accent-soft);
}
</style>
