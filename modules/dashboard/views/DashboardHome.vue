<template>
  <div class="dashboard-home">
    <h1>Gösterge Paneli</h1>
    <p>Mehmet Endüstriyel Takip Uygulamasına hoş geldiniz. Bu alan, siparişler, üretim, stok ve raporlar hakkında genel bir bakış sunacaktır.</p>
    <!-- Buraya grafikler, özet kartları ve hızlı eylemler eklenecek -->
    <div class="row mt-4">
      <div class="col-md-6">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Aktif Siparişler</h5>
            <p class="card-text">Şu anda X aktif sipariş bulunmaktadır.</p>
            <router-link to="/orders" class="btn btn-primary">Siparişleri Gör</router-link>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Stok Durumu Özeti</h5>
            <p class="card-text">Kritik seviyedeki malzeme sayısı: Y</p>
            <router-link to="/inventory" class="btn btn-info">Stok Detayları</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// İleride buraya gösterge paneli için gerekli veri çekme ve işleme mantığı eklenecek.
import { ref, onMounted } from 'vue';

const activeOrdersCount = ref(0); // Örnek veri
const criticalStockCount = ref(0); // Örnek veri

// onMounted(async () => {
//   // API'dan veri çekme işlemleri burada yapılacak
//   // activeOrdersCount.value = await fetchActiveOrders();
//   // criticalStockCount.value = await fetchCriticalStock();
// });
</script>

<style scoped>
.dashboard-home {
  padding: 1rem;
}
.card {
  margin-bottom: 1rem;
}
</style>