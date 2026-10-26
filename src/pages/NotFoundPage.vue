<template>
  <div class="container nf">
    <h1>404</h1>
    <p class="muted">Aradığınız sayfa bulunamadı. Belki bir dolabın arkasına düşmüştür.</p>
    <RouterLink to="/" class="btn">Ana sayfaya dön</RouterLink>
  </div>
</template>

<style scoped>
.nf {
  padding: 100px 0;
  text-align: center;
}
.nf h1 {
  font-size: 96px;
  color: var(--accent);
}
</style>
