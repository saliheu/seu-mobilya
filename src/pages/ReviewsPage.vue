<script setup lang="ts">
import { Star } from 'lucide-vue-next'
import { computed } from 'vue'
import StarRating from '../components/site/StarRating.vue'
import { reviews } from '../site/brand'

const avg = computed(() => (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1).replace('.', ','))
const dist = [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => r.rating === n).length }))
</script>

<template>
  <div class="container">
    <header class="page-head">
      <span class="eyebrow">Yorumlar</span>
      <h1>Müşterilerimiz ne diyor?</h1>
    </header>
    <div class="layout">
      <aside class="score">
        <b class="big">{{ avg }}</b>
        <StarRating :value="5" :size="18" />
        <small class="muted">2.400+ doğrulanmış sipariş</small>
        <div v-for="d in dist" :key="d.n" class="bar">
          <span class="n">{{ d.n }} <Star :size="12" fill="currentColor" /></span>
          <div class="track"><div class="fill" :style="{ width: `${(d.count / reviews.length) * 100}%` }" /></div>
          <span class="muted">{{ d.count }}</span>
        </div>
      </aside>
      <div class="list">
        <figure v-for="r in reviews" :key="r.name" class="review">
          <div class="head">
            <span class="avatar">{{ r.name[0] }}</span>
            <div>
              <b>{{ r.name }}</b>
              <small class="muted">{{ r.city }} · {{ r.product }}</small>
            </div>
            <StarRating class="rating" :value="r.rating" />
          </div>
          <blockquote>{{ r.text }}</blockquote>
        </figure>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 28px;
  align-items: start;
}
.score {
  position: sticky;
  top: 90px;
  display: grid;
  gap: 8px;
  padding: 24px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--line);
}
.big {
  font-size: 56px;
  line-height: 1;
}
.bar {
  display: grid;
  grid-template-columns: 28px 1fr 20px;
  gap: 8px;
  align-items: center;
  font-size: 13px;
}
.track {
  height: 8px;
  border-radius: 4px;
  background: var(--surface-2);
}
.fill {
  height: 100%;
  border-radius: 4px;
  background: #e2a12b;
}
.list {
  display: grid;
  gap: 14px;
}
.review {
  margin: 0;
  padding: 20px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--line);
}
.head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.head div {
  display: grid;
}
.head .rating {
  margin-left: auto;
}
.n {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--gold);
}
.big {
  font-family: var(--serif);
}
blockquote {
  font-family: var(--serif);
  font-size: 17px;
  line-height: 1.5;
}
.avatar {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent-dark);
  font-weight: 700;
}
blockquote {
  margin: 12px 0 0;
}
@media (max-width: 860px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .score {
    position: static;
  }
}
</style>
