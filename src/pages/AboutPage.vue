<script setup lang="ts">
import { brand } from '../site/brand'

const stats = [
  { v: '12', l: 'yıllık atölye tecrübesi' },
  { v: '2.400+', l: 'teslim edilen sipariş' },
  { v: '54', l: 'mobilya tipi' },
  { v: '%98', l: 'memnuniyet oranı' },
]
const quality = [
  { t: 'E1 sınıfı levhalar', d: 'Düşük formaldehit salınımlı, sertifikalı MDF ve yonga levhalar kullanıyoruz.' },
  { t: '2 mm ABS kenar bandı', d: 'Görünen tüm kenarlar darbeye ve neme dayanıklı ABS bantla kaplanır.' },
  { t: 'Frenli menteşe ve raylar', d: 'Kapaklarda frenli menteşe, çekmecelerde tam açılım frenli ray standarttır.' },
  { t: 'CNC hassasiyeti', d: 'Kesim ve delim 0,1 mm hassasiyetli CNC tezgâhlarda yapılır.' },
  { t: 'Su bazlı lake', d: 'Lake ürünlerde çevre dostu, kokusuz su bazlı boyalar kullanırız.' },
  { t: '10 yıl garanti', d: 'Üretim kaynaklı tüm sorunlarda parça değişimini ücretsiz yaparız.' },
]
</script>

<template>
  <div class="container">
    <header class="page-head">
      <span class="eyebrow">Hakkımızda</span>
      <h1>{{ brand.founded }}’ten beri ölçüye göre mobilya</h1>
      <p class="muted lead">
        {{ brand.name }}, küçük bir marangoz atölyesinde başladı. Bugün ölçüye özel mobilyayı herkes için erişilebilir kılmak
        için tasarım aracımızı ve CNC atölyemizi aynı çatı altında buluşturuyoruz. Her sipariş, sizin girdiğiniz ölçülerle
        tek tek kesilir; stok yok, israf yok.
      </p>
    </header>
    <div class="stats">
      <div v-for="s in stats" :key="s.l" class="stat">
        <b>{{ s.v }}</b>
        <span class="muted">{{ s.l }}</span>
      </div>
    </div>
    <section class="section">
      <span class="eyebrow">Kalite</span>
      <h2>Görünmeyen yerlerde bile özen</h2>
      <div class="quality">
        <div v-for="q in quality" :key="q.t" class="q">
          <b>{{ q.t }}</b>
          <p class="muted">{{ q.d }}</p>
        </div>
      </div>
    </section>
    <section class="story">
      <div>
        <h2>Atölyemizi ziyaret edin</h2>
        <p class="muted">{{ brand.address }} adresindeki showroomumuzda malzeme numunelerini görebilir, tasarımınızı ekibimizle birlikte planlayabilirsiniz.</p>
        <RouterLink to="/iletisim" class="btn">Randevu al</RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.lead {
  max-width: 760px;
  font-size: 17px;
}
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.stat {
  display: grid;
  padding: 22px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--line);
}
.stat b {
  font-size: 34px;
  color: var(--accent);
}
.quality {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 20px;
}
.q {
  padding: 20px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--line);
}
.q p {
  margin: 6px 0 0;
}
.story {
  padding: 36px;
  border-radius: 28px;
  background: var(--ink);
  color: #fff;
}
.story .muted {
  color: #bdb5a9;
  max-width: 620px;
}
@media (max-width: 860px) {
  .stats {
    grid-template-columns: 1fr 1fr;
  }
  .quality {
    grid-template-columns: 1fr;
  }
}
</style>
