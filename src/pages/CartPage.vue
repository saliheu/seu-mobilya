<script setup lang="ts">
import { CircleCheck, Minus, Plus, Trash2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import ProductThumb from '../components/site/ProductThumb.vue'
import { cart, encodeDesign, tl } from '../site/cart'
import { sizeLabel } from '../site/pricing'

const ordered = ref<string | null>(null)
const items = computed(() => cart.state.items)
const shipping = 0

function checkout() {
  // Demo: ödeme alınmaz, sipariş numarası uydurulur.
  ordered.value = `SEU-${Math.floor(100000 + Math.random() * 900000)}`
  cart.clear()
}
const thumbKey = (key: string, design: unknown) => `cart-${key}-${JSON.stringify(design).length}`
</script>

<template>
  <div class="container">
    <header class="page-head">
      <h1>Sepetiniz</h1>
    </header>

    <div v-if="ordered" class="done">
      <span class="done-icon"><CircleCheck :size="28" /></span>
      <h2>Siparişiniz alındı</h2>
      <p>Sipariş numaranız <b>{{ ordered }}</b>. Bu bir demo site olduğu için gerçek bir sipariş oluşturulmadı ve ödeme alınmadı.</p>
      <RouterLink to="/tasarimlar" class="btn">Alışverişe devam et</RouterLink>
    </div>

    <div v-else-if="!items.length" class="empty">
      <p class="muted">Sepetiniz boş.</p>
      <RouterLink to="/tasarimlar" class="btn">Tasarımları keşfet</RouterLink>
    </div>

    <div v-else class="grid">
      <div class="list">
        <article v-for="it in items" :key="it.key" class="item">
          <RouterLink :to="`/tasarla/${it.productId}?d=${encodeDesign(it.design)}`" class="thumb-link">
            <ProductThumb :thumb-key="thumbKey(it.key, it.design)" :design="it.design" :rule-set="it.ruleSet" :alt="it.name" />
          </RouterLink>
          <div class="info">
            <b>{{ it.name }}</b>
            <small class="muted">{{ sizeLabel(it.design) }}</small>
            <RouterLink :to="`/tasarla/${it.productId}?d=${encodeDesign(it.design)}`" class="edit">Tasarımı düzenle</RouterLink>
          </div>
          <div class="qty">
            <button aria-label="Azalt" @click="cart.setQuantity(it.key, it.quantity - 1)"><Minus :size="14" /></button>
            <span>{{ it.quantity }}</span>
            <button aria-label="Artır" @click="cart.setQuantity(it.key, it.quantity + 1)"><Plus :size="14" /></button>
          </div>
          <b class="price">{{ tl(it.price * it.quantity) }}</b>
          <button class="remove" aria-label="Kaldır" title="Kaldır" @click="cart.remove(it.key)"><Trash2 :size="16" /></button>
        </article>

        <section v-if="cart.state.saved.length" class="saved">
          <h3>Kaydedilen tasarımlarınız</h3>
          <div class="saved-list">
            <div v-for="s in cart.state.saved" :key="s.key" class="saved-item">
              <RouterLink :to="`/tasarla/${s.productId}?d=${encodeDesign(s.design)}`">{{ s.name }}</RouterLink>
              <small class="muted">{{ sizeLabel(s.design) }} · {{ tl(s.price) }}</small>
              <button class="link" @click="cart.unsave(s.key)">Sil</button>
            </div>
          </div>
        </section>
      </div>

      <aside class="summary">
        <div class="row"><span>Ara toplam</span><span>{{ tl(cart.total.value) }}</span></div>
        <div class="row"><span>Kargo</span><span>{{ shipping ? tl(shipping) : 'Ücretsiz' }}</span></div>
        <div class="row total"><b>Toplam</b><b>{{ tl(cart.total.value + shipping) }}</b></div>
        <small class="muted">KDV dahildir. Tahmini teslim: 15 iş günü üretim + 2–4 gün kargo.</small>
        <button class="btn" @click="checkout">Siparişi tamamla (demo)</button>
        <small class="muted">Demo: ödeme bilgisi istenmez, sipariş oluşturulmaz.</small>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  align-items: start;
}
.list {
  display: grid;
  gap: 12px;
}
.item {
  display: grid;
  grid-template-columns: 120px 1fr auto auto auto;
  gap: 16px;
  align-items: center;
  padding: 12px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--line);
}
.thumb-link {
  border-radius: 10px;
  overflow: hidden;
}
.info {
  display: grid;
  gap: 2px;
}
.edit {
  font-size: 13px;
}
.qty {
  display: flex;
  align-items: center;
  gap: 8px;
}
.qty button,
.remove {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  cursor: pointer;
}
.remove:hover {
  color: #9b1c1c;
  border-color: #e9b4b4;
}
.done-icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin-bottom: 14px;
  border-radius: 50%;
  background: var(--sage-soft);
  color: var(--sage);
}
.price {
  min-width: 100px;
  text-align: right;
}
.summary {
  position: sticky;
  top: 90px;
  display: grid;
  gap: 12px;
  padding: 22px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--line);
}
.total {
  padding-top: 10px;
  border-top: 1px solid var(--line);
  font-size: 18px;
}
.saved {
  margin-top: 20px;
}
.saved h3 {
  font-size: 18px;
}
.saved-list {
  display: grid;
  gap: 6px;
}
.saved-item {
  display: flex;
  gap: 10px;
  align-items: baseline;
  flex-wrap: wrap;
}
.link {
  border: 0;
  background: none;
  color: var(--accent-dark);
  cursor: pointer;
  font-size: 13px;
}
.empty,
.done {
  padding: 32px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--line);
}
@media (max-width: 860px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .item {
    grid-template-columns: 90px 1fr auto;
  }
  .price {
    grid-column: 2;
    text-align: left;
  }
  .summary {
    position: static;
  }
}
</style>
