<script setup lang="ts">
import { MapPin } from 'lucide-vue-next'
import { ref } from 'vue'
import { brand } from '../site/brand'

const sent = ref(false)
function submit(e: Event) {
  // Demo: form hiçbir yere gönderilmez.
  ;(e.target as HTMLFormElement).reset()
  sent.value = true
}
</script>

<template>
  <div class="container">
    <header class="page-head">
      <span class="eyebrow">İletişim</span>
      <h1>Size nasıl yardımcı olabiliriz?</h1>
      <p class="muted">Ölçü, malzeme, numune ya da sipariş durumu — her konuda yazabilirsiniz.</p>
    </header>
    <div class="grid">
      <form class="form" @submit.prevent="submit">
        <div class="two">
          <label>Ad soyad<input class="input" required /></label>
          <label>Telefon<input class="input" type="tel" /></label>
        </div>
        <label>E-posta<input class="input" type="email" required /></label>
        <label>
          Konu
          <select class="input">
            <option>Tasarım desteği</option>
            <option>Ücretsiz numune talebi</option>
            <option>Sipariş durumu</option>
            <option>Montaj hizmeti</option>
            <option>Diğer</option>
          </select>
        </label>
        <label>Mesajınız<textarea class="input" rows="5" required /></label>
        <button class="btn">Gönder</button>
        <p v-if="sent" class="ok">Teşekkürler! Bu bir demo site olduğu için mesajınız kaydedilmedi.</p>
      </form>
      <aside class="info">
        <div><b>Telefon</b><span>{{ brand.phone }}</span></div>
        <div><b>WhatsApp</b><span>{{ brand.whatsapp }}</span></div>
        <div><b>E-posta</b><span>{{ brand.email }}</span></div>
        <div><b>Atölye ve showroom</b><span>{{ brand.address }}</span></div>
        <div><b>Çalışma saatleri</b><span>{{ brand.hours }}</span></div>
        <div class="map" aria-hidden="true"><MapPin :size="34" /></div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 28px;
}
.form {
  display: grid;
  gap: 14px;
  padding: 24px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--line);
}
.form label {
  display: grid;
  gap: 6px;
  font-size: 14px;
}
.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.form .btn {
  justify-self: start;
}
.ok {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #e6f3ee;
  color: var(--green);
}
.info {
  display: grid;
  gap: 16px;
  align-content: start;
}
.info div {
  display: grid;
}
.map {
  display: grid !important;
  place-items: center;
  height: 180px;
  border-radius: var(--radius);
  background: repeating-linear-gradient(45deg, var(--surface-2) 0 12px, var(--surface) 12px 24px);
  font-size: 40px;
}
@media (max-width: 860px) {
  .grid,
  .two {
    grid-template-columns: 1fr;
  }
}
</style>
