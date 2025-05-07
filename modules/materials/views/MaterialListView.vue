<template>
  <div class="material-list-view">
    <div class="row">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Malzeme Yönetimi</h5>
            <!-- Filtreleme Butonları -->
            <div class="btn-group">
              <button class="btn btn-sm btn-outline-secondary" :class="{ active: filter === 'all' }" @click="setFilter('all')">Tümü</button>
              <button class="btn btn-sm btn-outline-secondary" :class="{ active: filter === 'inStock' }" @click="setFilter('inStock')">Stokta Olanlar</button>
              <button class="btn btn-sm btn-outline-secondary" :class="{ active: filter === 'critical' }" @click="setFilter('critical')">Kritik Stok</button>
              <button class="btn btn-sm btn-outline-secondary" :class="{ active: filter === 'pending' }" @click="setFilter('pending')">Sipariş Bekleyenler</button>
            </div>
          </div>
          <div class="card-body">
            <!-- Malzeme Tablosu -->
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Malzeme Kodu</th>
                    <th>Malzeme Adı</th>
                    <th>Stok Miktarı</th>
                    <th>Minimum Stok</th>
                    <th>Tedarik Süresi</th>
                    <th>Son Sipariş Tarihi</th>
                    <th>Durum</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Dinamik Veri -->
                  <tr v-for="material in filteredMaterials" :key="material.code" :class="getMaterialStatusClass(material)">
                    <td>{{ material.code }}</td>
                    <td>{{ material.name }}</td>
                    <td>{{ material.stock }}</td>
                    <td>{{ material.minStock }}</td>
                    <td>{{ material.leadTime }}</td>
                    <td>{{ material.lastOrderDate }}</td>
                    <td><span :class="getMaterialBadgeClass(material.status)">{{ material.status }}</span></td>
                    <td>
                      <button v-if="material.status === 'Kritik' || material.status === 'Düşük'" class="btn btn-sm btn-outline-primary">Sipariş Ekle</button>
                      <button v-else class="btn btn-sm btn-outline-secondary">Detay</button>
                    </td>
                  </tr>
                   <tr v-if="filteredMaterials.length === 0">
                      <td colspan="8" class="text-center">Filtreye uygun malzeme bulunamadı.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <!-- Malzeme Tahmin Grafiği Kartı -->
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Malzeme Tahminleri</h5>
          </div>
          <div class="card-body">
            <canvas id="materialForecastChart" height="300"></canvas> <!-- Chart.js bileşeni olacak -->
          </div>
        </div>
        <!-- Son Siparişler Kartı -->
        <div class="card mt-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Son Siparişler</h5>
            <router-link to="/purchasing" class="btn btn-sm btn-outline-primary">Tümü</router-link> <!-- Satın alma modülüne link -->
          </div>
          <div class="card-body">
            <div class="list-group">
              <!-- Dinamik Veri -->
              <a href="#" class="list-group-item list-group-item-action" v-for="order in recentPurchaseOrders" :key="order.id">
                <div class="d-flex w-100 justify-content-between">
                  <h6 class="mb-1">{{ order.id }}</h6>
                  <small class="text-muted">{{ order.dateAgo }}</small>
                </div>
                <p class="mb-1">{{ order.materialName }}</p>
                <small class="text-muted">Miktar: {{ order.quantity }}, Tahmini Teslim: {{ order.estimatedDelivery }}</small>
              </a>
               <p v-if="recentPurchaseOrders.length === 0" class="text-center text-muted">Son malzeme siparişi bulunmamaktadır.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
// import Chart from 'chart.js/auto';
// import apiService from '@/services/api-service';

const filter = ref('all'); // 'all', 'inStock', 'critical', 'pending'
const materials = ref([]);
const recentPurchaseOrders = ref([]);

onMounted(async () => {
  // Veri çekme
  // materials.value = await apiService.getMaterials();
  // recentPurchaseOrders.value = await apiService.getRecentPurchaseOrders();
  // setupForecastChart();

  // Örnek Veriler
  materials.value = [
    { code: '137998%', name: 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC', stock: 2, minStock: 5, leadTime: '15 gün', lastOrderDate: '10.10.2024', status: 'Kritik' },
    { code: '144866%', name: 'KAP-80/190-95 Akım Trafosu', stock: 3, minStock: 5, leadTime: '10 gün', lastOrderDate: '15.10.2024', status: 'Düşük' },
    { code: '120170%', name: 'M480TB/G-027-95.300UN5 Kablo Başlığı', stock: 12, minStock: 15, leadTime: '7 gün', lastOrderDate: '20.10.2024', status: 'Düşük' },
    { code: '109367%', name: '582mm Bara', stock: 25, minStock: 10, leadTime: '5 gün', lastOrderDate: '05.10.2024', status: 'Yeterli' },
    { code: '109363%', name: '432mm Bara', stock: 18, minStock: 10, leadTime: '5 gün', lastOrderDate: '05.10.2024', status: 'Yeterli' },
  ];

  recentPurchaseOrders.value = [
      { id: '#PO-2024-1025', dateAgo: '2 gün önce', materialName: 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC', quantity: 5, estimatedDelivery: '25.11.2024' },
      { id: '#PO-2024-1024', dateAgo: '5 gün önce', materialName: 'KAP-80/190-95 Akım Trafosu', quantity: 3, estimatedDelivery: '20.11.2024' },
      { id: '#PO-2024-1023', dateAgo: '1 hafta önce', materialName: 'M480TB/G-027-95.300UN5 Kablo Başlığı', quantity: 10, estimatedDelivery: '15.11.2024' },
  ];

  // Grafik kurulumu (gerçek uygulamada)
  // setupForecastChart();
});

const filteredMaterials = computed(() => {
  switch (filter.value) {
    case 'inStock':
      return materials.value.filter(m => m.stock > 0);
    case 'critical':
      return materials.value.filter(m => m.status === 'Kritik');
    case 'pending':
      // Sipariş bekleyen mantığı eklenecek (API yanıtına göre)
      return [];
    case 'all':
    default:
      return materials.value;
  }
});

const setFilter = (newFilter) => {
  filter.value = newFilter;
};

const getMaterialStatusClass = (material) => {
  switch (material.status) {
    case 'Kritik': return 'material-critical';
    case 'Düşük': return 'material-required';
    case 'Yeterli': return 'material-available';
    default: return '';
  }
};

const getMaterialBadgeClass = (status) => {
  switch (status) {
    case 'Kritik': return 'badge bg-danger';
    case 'Düşük': return 'badge bg-warning';
    case 'Yeterli': return 'badge bg-success';
    default: return 'badge bg-secondary';
  }
};

// const setupForecastChart = () => {
//   const ctx = document.getElementById('materialForecastChart')?.getContext('2d');
//   if (!ctx) return;
//   new Chart(ctx, {
//       type: 'bar',
//       data: {
//           labels: materials.value.slice(0, 5).map(m => m.name), // İlk 5 malzeme
//           datasets: [
//               { label: 'Mevcut Stok', data: materials.value.slice(0, 5).map(m => m.stock), backgroundColor: 'rgba(52, 152, 219, 0.5)' },
//               { label: 'İhtiyaç (Tahmini)', data: materials.value.slice(0, 5).map(m => m.minStock * 1.5), backgroundColor: 'rgba(231, 76, 60, 0.5)' } // Örnek tahmin
//           ]
//       }
//   });
// };

</script>

<style scoped>
/* Malzeme listesi özel stilleri */
.table th {
    background-color: var(--bs-light);
}

.material-critical td {
  /* background-color: rgba(231, 76, 60, 0.1); */ /* Changed comment format */
  font-weight: bold;
}
.material-required td {
  /* background-color: rgba(243, 156, 18, 0.1); */ /* Changed comment format */
}
</style>