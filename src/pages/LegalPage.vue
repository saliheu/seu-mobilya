<script setup lang="ts">
import { brand } from '../site/brand'
</script>

<template>
  <div class="container narrow">
    <header class="page-head">
      <span class="eyebrow">Yasal bilgiler</span>
      <h1>Kullanım koşulları ve gizlilik</h1>
    </header>
    <div class="note">Bu site bir <b>tasarım demosudur</b>. {{ brand.name }} kurgusal bir markadır; ürünler satılmaz, ödeme alınmaz, formlar hiçbir yere gönderilmez.</div>
    <h2>Kullanım koşulları</h2>
    <p class="muted">Yapılandırıcıda gösterilen fiyatlar örnek amaçlıdır ve bağlayıcı değildir. Görseller bilgisayar ortamında üretilmiştir; gerçek renk ve doku farklılık gösterebilir.</p>
    <h2>Gizlilik</h2>
    <p class="muted">Sepetiniz ve kaydettiğiniz tasarımlar yalnızca tarayıcınızın yerel depolamasında saklanır; sunucuya gönderilmez. Tarayıcı verilerini temizlediğinizde silinir.</p>
    <h2>Çerezler</h2>
    <p class="muted">Bu demo site izleme veya reklam çerezi kullanmaz.</p>
  </div>
</template>

<style scoped>
.narrow {
  max-width: 820px;
}
.note {
  margin-bottom: 24px;
  padding: 16px 20px;
  border-radius: 14px;
  background: var(--accent-soft);
}
h2 {
  font-size: 22px;
  margin-top: 24px;
}
</style>
