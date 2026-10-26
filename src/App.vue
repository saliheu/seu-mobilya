<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SiteFooter from './components/site/SiteFooter.vue'
import SiteHeader from './components/site/SiteHeader.vue'
import { cart } from './site/cart'

const route = useRoute()
// Yapılandırıcı tam ekran çalışır; başlık/altbilgi gizlenir.
const bare = computed(() => !!route.meta.bare)
</script>

<template>
  <SiteHeader v-if="!bare" />
  <main :class="{ bare }">
    <!-- Aynı sayfa farklı ürünle açılınca bileşen baştan kurulsun. -->
    <RouterView :key="route.path" />
  </main>
  <SiteFooter v-if="!bare" />
  <Transition name="toast">
    <div v-if="cart.state.toast" class="toast" role="status">{{ cart.state.toast }}</div>
  </Transition>
</template>

<style scoped>
main.bare {
  height: 100dvh;
}
.toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  z-index: 100;
  transform: translateX(-50%);
  padding: 12px 18px;
  border-radius: 12px;
  background: var(--ink);
  color: #fff;
  box-shadow: var(--shadow);
  font-size: 14px;
}
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>
