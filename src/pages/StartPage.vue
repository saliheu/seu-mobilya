<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ProductThumb from '../components/site/ProductThumb.vue'
import { familyLabel, rooms, templateFor, types } from '../data/products'
import { roomIcon } from '../site/icons'

const route = useRoute()
const room = computed(() => (route.params.room as string | undefined) ?? '')
const list = computed(() => types.filter((t) => !room.value || t.rooms.includes(room.value)).map((t) => ({ t, tpl: templateFor(t.slug)! })))
</script>

<template>
  <div class="container">
    <header class="page-head">
      <span class="eyebrow">Sıfırdan tasarla</span>
      <h1>Ne tasarlamak istersiniz?</h1>
      <p class="muted">Bir mobilya tipi seçin; temel bir şablonla açılır, gerisini 3D yapılandırıcıda siz belirlersiniz.</p>
    </header>

    <div class="rooms-bar">
      <RouterLink to="/odaya-gore" class="chip" :class="{ active: !room }">Tüm tipler</RouterLink>
      <RouterLink v-for="r in rooms" :key="r.slug" :to="`/odaya-gore/${r.slug}`" class="chip"><component :is="roomIcon[r.slug]" :size="16" :stroke-width="1.8" /> {{ r.title }}</RouterLink>
    </div>

    <div class="grid-cards types">
      <RouterLink v-for="{ t, tpl } in list" :key="t.slug" :to="`/tasarla/${tpl.id}?yeni=1`" class="type">
        <ProductThumb :thumb-key="tpl.id" :design="tpl.design" :rule-set="tpl.ruleSet" :alt="t.title" />
        <div class="body">
          <b>{{ t.title }}</b>
          <small class="muted">{{ familyLabel[t.family] }}</small>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.rooms-bar {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 6px;
}
.types {
  margin-top: 20px;
}
.type {
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--line);
  overflow: hidden;
  color: inherit;
  text-decoration: none;
  transition: transform 0.2s;
}
.type:hover {
  transform: translateY(-3px);
}
.body {
  display: grid;
  padding: 10px 14px 14px;
}
</style>
