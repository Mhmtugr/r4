<template>
  <div class="purchasing-container p-4">
    <h2>Satın Alma ve Tedarikçi Yönetimi</h2>

    <!-- TODO: Filtreleme ve Arama Alanı Eklenecek -->
    <div class="mb-4">
      <p>Filtreleme/Arama bileşeni buraya gelecek.</p>
    </div>

    <div class="row">
      <!-- Sol Taraf: Eksik Malzeme / Sipariş Kuyruğu -->
      <div class="col-md-5">
        <h4>Eksik Malzeme / Sipariş Kuyruğu</h4>
        <div id="order-queue-container">
          <!-- TODO: Sipariş Kuyruğu Bileşeni (OrderQueue.vue) buraya gelecek -->
          <p>Sipariş kuyruğu verisi yükleniyor...</p>
        </div>
      </div>

      <!-- Sağ Taraf: Tedarikçi Listesi -->
      <div class="col-md-7">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4>Tedarikçi Listesi</h4>
          <button class="btn btn-success">
             <i class="bi bi-plus-circle"></i> Yeni Tedarikçi Ekle
          </button>
        </div>
        <div id="suppliers-table-container">
          <!-- TODO: Tedarikçi Tablosu Bileşeni (SuppliersTable.vue) buraya gelecek -->
           <p>Tedarikçi verisi yükleniyor...</p>
        </div>
      </div>
    </div>

    <!-- TODO: Modallar (Yeni Tedarikçi, Tedarikçi Detay/Düzenle, Talep Gönder vb.) -->

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// TODO: Composable fonksiyonları import et (useSupplierManagement, usePurchasingRequests)
// TODO: Alt bileşenleri import et (OrderQueue, SuppliersTable, Modals...)

console.log('PurchasingView bileşeni oluşturuldu.');

// Örnek state ve lifecycle hook
const isLoading = ref(true);

onMounted(() => {
  console.log('PurchasingView onMounted');
  // TODO: Veri yükleme işlemleri burada çağrılacak
  // loadSupplierData();
  // loadOrderQueueData();
  isLoading.value = false;
});

</script>

<style scoped>
/* purchasing/styles içindeki stiller buraya taşınabilir */
.purchasing-container {
  /* Örnek stil */
}
</style>