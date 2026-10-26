<script setup lang="ts">
import { ArrowRight, Clock, Facebook, Instagram, Mail, MapPin, MessageCircle, Phone, Youtube } from 'lucide-vue-next'
import { rooms } from '../../data/products'
import { brand } from '../../site/brand'
import { toast } from '../../site/cart'
import BrandLogo from './BrandLogo.vue'

const year = new Date().getFullYear()

function subscribe(e: Event) {
  ;(e.target as HTMLFormElement).reset()
  toast('Teşekkürler! (Demo: e-posta kaydedilmedi)')
}

const socials = [
  { icon: Instagram, label: 'Instagram' },
  { icon: Youtube, label: 'YouTube' },
  { icon: Facebook, label: 'Facebook' },
  { icon: MessageCircle, label: 'WhatsApp' },
]
</script>

<template>
  <footer class="footer">
    <div class="container news">
      <div>
        <h3>Yeni tasarımlardan ilk siz haberdar olun</h3>
        <p>Ayda bir e-posta: yeni koleksiyonlar, dekorasyon fikirleri ve size özel indirimler.</p>
      </div>
      <form class="newsletter" @submit.prevent="subscribe">
        <input type="email" required placeholder="E-posta adresiniz" aria-label="E-posta" />
        <button class="btn accent">Abone ol <ArrowRight :size="16" /></button>
      </form>
    </div>

    <div class="container grid">
      <div class="col brand-col">
        <BrandLogo light />
        <p class="muted">{{ brand.tagline }} {{ brand.founded }}’ten beri İstanbul’daki atölyemizde üretiyoruz.</p>
        <div class="social">
          <a v-for="s in socials" :key="s.label" href="#" :aria-label="s.label" @click.prevent><component :is="s.icon" :size="18" /></a>
        </div>
      </div>
      <div class="col">
        <b>Odalar</b>
        <RouterLink v-for="r in rooms" :key="r.slug" :to="`/tasarimlar/${r.slug}`">{{ r.title }}</RouterLink>
      </div>
      <div class="col">
        <b>Kurumsal</b>
        <RouterLink to="/hakkimizda">Hakkımızda ve kalite</RouterLink>
        <RouterLink to="/nasil-calisir">Nasıl çalışır</RouterLink>
        <RouterLink to="/galeri">Galeri</RouterLink>
        <RouterLink to="/yorumlar">Müşteri yorumları</RouterLink>
        <RouterLink to="/sss">Sık sorulan sorular</RouterLink>
        <RouterLink to="/yasal">Yasal bilgiler</RouterLink>
      </div>
      <div class="col contact">
        <b>İletişim</b>
        <span><Phone :size="15" /> {{ brand.phone }}</span>
        <span><MessageCircle :size="15" /> {{ brand.whatsapp }}</span>
        <span><Mail :size="15" /> {{ brand.email }}</span>
        <span><MapPin :size="15" /> {{ brand.address }}</span>
        <span class="muted"><Clock :size="15" /> {{ brand.hours }}</span>
      </div>
    </div>

    <div class="container bottom">
      <small>© {{ year }} {{ brand.name }} · Demo amaçlı bir sitedir; gerçek satış yapılmaz.</small>
      <div class="pay">
        <span>VISA</span><span>Mastercard</span><span>Troy</span><span>Havale / EFT</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: 96px;
  background: var(--ink);
  color: #e9e4dc;
  padding: 0 0 28px;
}
.news {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 32px;
  align-items: center;
  padding: 48px 0;
  border-bottom: 1px solid #36302a;
}
.news h3 {
  color: #fff;
  font-size: 26px;
  margin-bottom: 6px;
}
.news p {
  color: #b9b0a4;
  margin: 0;
}
.newsletter {
  display: flex;
  gap: 8px;
  padding: 6px;
  border-radius: 999px;
  background: #2b2621;
  border: 1px solid #3d362f;
}
.newsletter input {
  flex: 1;
  min-width: 0;
  padding: 10px 16px;
  border: 0;
  background: transparent;
  color: #fff;
  font: inherit;
}
.newsletter input:focus {
  outline: none;
}
.grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1.3fr;
  gap: 36px;
  padding-top: 52px;
}
.col {
  display: grid;
  align-content: start;
  gap: 10px;
  font-size: 14px;
}
.col b {
  color: #fff;
  margin-bottom: 4px;
  font-weight: 600;
}
.col a {
  color: #cfc7bb;
  text-decoration: none;
  transition: color 0.15s;
}
.col a:hover {
  color: #fff;
}
.contact span {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  color: #cfc7bb;
}
.contact svg {
  margin-top: 3px;
  color: #e8b48c;
}
.muted {
  color: #9d9488 !important;
}
.brand-col p {
  max-width: 340px;
}
.social {
  display: flex;
  gap: 8px;
}
.social a {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid #3d362f;
  color: #e9e4dc;
}
.social a:hover {
  background: var(--accent);
  border-color: var(--accent);
}
.bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 48px;
  padding-top: 22px;
  border-top: 1px solid #36302a;
  color: #9d9488;
}
.pay {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.pay span {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #3d362f;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #cfc7bb;
}
@media (max-width: 900px) {
  .news,
  .grid {
    grid-template-columns: 1fr 1fr;
  }
  .news > div,
  .brand-col {
    grid-column: 1 / -1;
  }
  .newsletter {
    grid-column: 1 / -1;
  }
}
@media (max-width: 520px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
