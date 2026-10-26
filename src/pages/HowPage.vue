<script setup lang="ts">
import { steps, usps } from '../site/brand'

const details = [
  { title: '1. Başlangıç noktanızı seçin', text: 'Odaya göre hazır tasarımları inceleyin ya da “Sıfırdan tasarla” ile bir mobilya tipinin temel şablonunu açın.' },
  { title: '2. Ölçüyü girin', text: 'Genişlik, yükseklik ve derinliği milimetre hassasiyetinde girin. Yapılandırıcı, üretim kurallarımıza uymayan ölçüleri otomatik olarak sınırlar.' },
  { title: '3. Bölmeleri ve kapakları kurun', text: 'Sütun ve raf sayısını belirleyin; her bölmeye kapak, cam kapak, çekmece, askı borusu veya dikey bölücü ekleyin.' },
  { title: '4. Malzeme ve renk seçin', text: 'Gövde, kapak, tabla ve ayaklar için ayrı ayrı malzeme seçebilirsiniz. Lake seçeneğinde 200’den fazla RAL tonu var.' },
  { title: '5. Fiyatı anında görün', text: 'Her değişiklikte kesim listesi yeniden çıkarılır ve fiyat güncellenir. Özet sekmesinde tüm parçaları görebilirsiniz.' },
  { title: '6. Üretim ve teslimat', text: 'Siparişiniz 15 iş gününde CNC atölyemizde kesilir, kenar bantlanır, delinir ve numaralı paketlerle gönderilir.' },
]
</script>

<template>
  <div class="container">
    <header class="page-head">
      <span class="eyebrow">Nasıl çalışır</span>
      <h1>Hayalinizdeki mobilyaya 6 adımda ulaşın</h1>
      <p class="muted lead">Tasarım aracımız mobilyanızı parça parça hesaplar: girdiğiniz her ölçü doğrudan kesim listesine dönüşür.</p>
    </header>

    <div class="summary">
      <div v-for="(s, i) in steps" :key="s.title" class="sum">
        <span class="n">{{ i + 1 }}</span>
        <b>{{ s.title }}</b>
        <p class="muted">{{ s.text }}</p>
      </div>
    </div>

    <section class="section timeline">
      <div v-for="d in details" :key="d.title" class="item">
        <h3>{{ d.title }}</h3>
        <p class="muted">{{ d.text }}</p>
      </div>
    </section>

    <section class="usps">
      <div v-for="u in usps" :key="u.title" class="usp">
        <span>{{ u.icon }}</span>
        <b>{{ u.title }}</b>
        <small class="muted">{{ u.text }}</small>
      </div>
    </section>

    <div class="cta">
      <RouterLink to="/odaya-gore" class="btn">Tasarlamaya başla</RouterLink>
      <RouterLink to="/tasarimlar" class="btn ghost">Hazır tasarımlar</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.lead {
  max-width: 640px;
  font-size: 17px;
}
.summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.sum {
  padding: 22px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--line);
}
.n {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  margin-bottom: 10px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
}
.timeline {
  display: grid;
  gap: 14px;
  max-width: 760px;
}
.item {
  padding-left: 18px;
  border-left: 3px solid var(--accent-soft);
}
.item h3 {
  font-size: 18px;
  margin-bottom: 4px;
}
.usps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.usp {
  display: grid;
  gap: 4px;
  padding: 18px;
  border-radius: var(--radius);
  background: var(--surface-2);
}
.usp span {
  font-size: 24px;
}
.cta {
  display: flex;
  gap: 10px;
  margin-top: 32px;
}
@media (max-width: 860px) {
  .summary,
  .usps {
    grid-template-columns: 1fr;
  }
}
</style>
