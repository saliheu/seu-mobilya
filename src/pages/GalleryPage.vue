<script setup lang="ts">
import ProductThumb from '../components/site/ProductThumb.vue'
import { productsOfType, roomBySlug } from '../data/products'
import { gallery } from '../site/brand'

const items = gallery.map((g, i) => {
  const list = productsOfType(g.type)
  return { ...g, product: list[i % list.length] ?? list[0]! }
})
</script>

<template>
  <div class="container">
    <header class="page-head">
      <span class="eyebrow">Galeri</span>
      <h1>Müşterilerimizin evlerinden</h1>
      <p class="muted">Kullanıcılarımızın tasarlayıp evlerine yerleştirdiği mobilyalardan seçkiler. Beğendiğinizi açıp kendi ölçünüze uyarlayın.</p>
    </header>
    <div class="masonry">
      <RouterLink v-for="(g, i) in items" :key="i" :to="`/tasarla/${g.product.id}`" class="tile" :class="{ tall: i % 3 === 0 }">
        <ProductThumb :thumb-key="g.product.id" :design="g.product.design" :rule-set="g.product.ruleSet" :alt="g.title" />
        <div class="cap">
          <b>{{ g.title }}</b>
          <small>{{ roomBySlug(g.room)?.title }} · {{ g.product.name }}</small>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.masonry {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.tile {
  position: relative;
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line);
  color: inherit;
  text-decoration: none;
}
.tile.tall {
  grid-row: span 2;
}
.tile.tall :deep(.thumb) {
  aspect-ratio: auto;
  height: calc(100% - 64px);
}
.cap {
  display: grid;
  padding: 12px 14px;
}
.cap small {
  color: var(--muted);
}
@media (max-width: 860px) {
  .masonry {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 520px) {
  .masonry {
    grid-template-columns: 1fr;
  }
  .tile.tall {
    grid-row: auto;
  }
}
</style>
