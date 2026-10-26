<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
import { computed } from 'vue'
import { catalog, findMaterial } from '../../catalog/catalog'
import { typeBySlug, type Product } from '../../data/products'
import { tl } from '../../site/cart'
import { productPrice, sizeLabel } from '../../site/pricing'
import ProductThumb from './ProductThumb.vue'

const props = defineProps<{ product: Product }>()
const price = computed(() => productPrice(props.product))
const type = computed(() => typeBySlug(props.product.type))
// Kartta gösterilecek ana renkler (gövde, ön yüz, tabla).
const colors = computed(() => {
  const f = props.product.design.finish
  const list = [f.carcass, f.front, f.top].map((x) => x.color ?? findMaterial(catalog, x.material)?.color ?? '#ccc')
  return [...new Set(list)]
})
</script>

<template>
  <RouterLink :to="`/urun/${product.id}`" class="card">
    <div class="media">
      <ProductThumb :thumb-key="product.id" :design="product.design" :rule-set="product.ruleSet" :alt="product.name" />
      <span v-if="product.premium" class="badge">Premium</span>
      <span class="go" aria-hidden="true"><ArrowUpRight :size="18" /></span>
    </div>
    <div class="body">
      <div class="top">
        <small>{{ type?.title }}</small>
        <span class="dots">
          <span v-for="c in colors" :key="c" :style="{ background: c }" />
        </span>
      </div>
      <b class="name">{{ product.name }}</b>
      <span class="size">{{ sizeLabel(product.design) }}</span>
      <span class="price">{{ tl(price) }}</span>
    </div>
  </RouterLink>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--line);
  overflow: hidden;
  color: inherit;
  text-decoration: none;
  transition:
    transform 0.25s,
    box-shadow 0.25s,
    border-color 0.25s;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
  border-color: transparent;
}
.media {
  position: relative;
}
.badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--ink);
  color: #f3d9a4;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.go {
  position: absolute;
  top: 12px;
  right: 12px;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  opacity: 0;
  transform: scale(0.8);
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.card:hover .go {
  opacity: 1;
  transform: scale(1);
}
.body {
  display: grid;
  gap: 2px;
  padding: 14px 16px 16px;
}
.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.top small {
  color: var(--muted);
  font-size: 12px;
}
.dots {
  display: flex;
  gap: 4px;
}
.dots span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.12);
}
.name {
  font-family: var(--serif);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.size {
  font-size: 12.5px;
  color: var(--muted);
}
.price {
  margin-top: 8px;
  font-weight: 700;
  font-size: 16px;
}
</style>
