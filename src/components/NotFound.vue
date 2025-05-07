<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h1 class="error-code">404</h1>
      <h2 class="error-title">Sayfa Bulunamadı</h2>
      <p class="error-message">
        Aradığınız sayfa bulunamadı veya taşınmış olabilir.
      </p>
      <router-link to="/" class="btn btn-primary mt-3">
        <i class="bi bi-house-door me-2"></i>Ana Sayfaya Dön
      </router-link>
    </div>
  </div>
</template>

<script setup>
// 404 sayfası için mantık buraya gelecek
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  text-align: center;
  padding: 2rem;
}

.not-found-content {
  max-width: 500px;
}

.error-code {
  font-size: 8rem;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 0;
  line-height: 1;
}

.error-title {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.error-message {
  font-size: 1.1rem;
  color: #6b7280;
  margin-bottom: 2rem;
}
</style>