import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage, meta: { title: 'Ölçünüze göre mobilya' } },
    { path: '/tasarimlar/:room?', component: () => import('./pages/BrowsePage.vue'), meta: { title: 'Tasarımlar' } },
    { path: '/odaya-gore/:room?', component: () => import('./pages/StartPage.vue'), meta: { title: 'Sıfırdan tasarla' } },
    { path: '/urun/:id', component: () => import('./pages/ProductPage.vue'), meta: { title: 'Ürün' } },
    { path: '/tasarimlarim', component: () => import('./pages/SavedPage.vue'), meta: { title: 'Tasarımlarım' } },
    { path: '/tasarla/:id', component: () => import('./pages/ConfiguratorPage.vue'), meta: { title: 'Tasarla', bare: true } },
    { path: '/nasil-calisir', component: () => import('./pages/HowPage.vue'), meta: { title: 'Nasıl çalışır' } },
    { path: '/galeri', component: () => import('./pages/GalleryPage.vue'), meta: { title: 'Galeri' } },
    { path: '/yorumlar', component: () => import('./pages/ReviewsPage.vue'), meta: { title: 'Yorumlar' } },
    { path: '/sss', component: () => import('./pages/FaqPage.vue'), meta: { title: 'Sık sorulan sorular' } },
    { path: '/hakkimizda', component: () => import('./pages/AboutPage.vue'), meta: { title: 'Hakkımızda' } },
    { path: '/iletisim', component: () => import('./pages/ContactPage.vue'), meta: { title: 'İletişim' } },
    { path: '/sepet', component: () => import('./pages/CartPage.vue'), meta: { title: 'Sepet' } },
    { path: '/yasal', component: () => import('./pages/LegalPage.vue'), meta: { title: 'Yasal bilgiler' } },
    { path: '/:pathMatch(.*)*', component: () => import('./pages/NotFoundPage.vue'), meta: { title: 'Sayfa bulunamadı' } },
  ],
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
})

router.afterEach((to) => {
  document.title = `${to.meta.title ?? ''} | Salih Enes Ünal Mobilya`
})
