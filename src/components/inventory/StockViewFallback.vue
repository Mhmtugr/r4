<template>
  <div class="stock-view-fallback">
    <h1>Stok Yönetimi</h1>
    <p>Stok yönetimi görünümü yükleniyor veya kullanılamıyor.</p>
    <p>Lütfen daha sonra tekrar deneyin veya sistem yöneticisi ile iletişime geçin.</p>
  </div>
</template>

<script>
export default {
  name: 'StockViewFallback',
  mounted() {
    console.warn('StockViewFallback component loaded instead of original StockView');
  }
}
</script>

<style scoped>
.stock-view-fallback {
  padding: 20px;
  text-align: center;
}
</style>