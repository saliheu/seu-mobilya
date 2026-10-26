<script setup lang="ts">
import { Pencil, ShoppingBag, Trash2 } from 'lucide-vue-next'
import Breadcrumbs from '../components/site/Breadcrumbs.vue'
import ProductThumb from '../components/site/ProductThumb.vue'
import { cart, encodeDesign, tl, type SavedDesign } from '../site/cart'
import { sizeLabel } from '../site/pricing'

const date = (t: number) => new Date(t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
const addToCart = (s: SavedDesign) => cart.add({ productId: s.productId, name: s.name, ruleSet: s.ruleSet, design: s.design, price: s.price })
</script>

<template>
  <div class="container">
    <Breadcrumbs :items="[{ label: 'Ana sayfa', to: '/' }, { label: 'Tasarımlarım' }]" />
    <header class="page-head">
      <span class="eyebrow">Kayıtlı tasarımlar</span>
      <h1>Tasarımlarım</h1>
      <p class="muted">Yapılandırıcıda “Kaydet” dediğiniz tasarımlar bu cihazda saklanır. Kaldığınız yerden devam edin.</p>
    </header>

    <div v-if="!cart.state.saved.length" class="empty">
      <b>Henüz kayıtlı tasarımınız yok</b>
      <p class="muted">Bir tasarımı özelleştirirken üst çubuktaki yer imi düğmesiyle kaydedebilirsiniz.</p>
      <RouterLink to="/tasarimlar" class="btn accent">Tasarımları keşfet</RouterLink>
    </div>

    <div v-else class="grid-cards">
      <article v-for="s in cart.state.saved" :key="s.key" class="saved">
        <RouterLink :to="`/tasarla/${s.productId}?d=${encodeDesign(s.design)}`">
          <ProductThumb :thumb-key="`saved-${s.key}`" :design="s.design" :rule-set="s.ruleSet" :alt="s.name" />
        </RouterLink>
        <div class="body">
          <small class="muted">{{ date(s.savedAt) }}</small>
          <b>{{ s.name }}</b>
          <small class="muted">{{ sizeLabel(s.design) }}</small>
          <span class="price">{{ tl(s.price) }}</span>
          <div class="acts">
            <RouterLink :to="`/tasarla/${s.productId}?d=${encodeDesign(s.design)}`" class="btn small"><Pencil :size="15" /> Düzenle</RouterLink>
            <button class="icon-btn" title="Sepete ekle" aria-label="Sepete ekle" @click="addToCart(s)"><ShoppingBag :size="16" /></button>
            <button class="icon-btn" title="Sil" aria-label="Sil" @click="cart.unsave(s.key)"><Trash2 :size="16" /></button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.empty {
  display: grid;
  justify-items: start;
  gap: 8px;
  padding: 32px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--line);
}
.saved {
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--line);
  overflow: hidden;
}
.body {
  display: grid;
  gap: 2px;
  padding: 14px 16px 16px;
}
.body b {
  font-family: var(--serif);
  font-size: 17px;
}
.price {
  margin-top: 6px;
  font-weight: 700;
}
.acts {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.btn.small {
  flex: 1;
  padding: 9px 14px;
  font-size: 13.5px;
}
.acts .icon-btn {
  width: 38px;
  height: 38px;
}
</style>
