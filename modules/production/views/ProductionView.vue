<template>
  <div class="production-container p-4">
    <!-- Üst Başlık ve Butonlar -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Üretim Yönetimi</h2>
      <div class="action-buttons">
        <button @click="openUpdatePlanModal" class="btn btn-primary me-2">
          <i class="bi bi-calendar-plus"></i> Plan Güncelle
        </button>
        <button @click="openAddReportModal" class="btn btn-success">
          <i class="bi bi-file-earmark-plus"></i> Rapor Ekle
        </button>
      </div>
    </div>

    <!-- Yükleniyor Göstergesi -->
    <div v-if="isLoading" class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Yükleniyor...</span>
      </div>
    </div>

    <!-- Hata Mesajı -->
    <div v-else-if="error" class="alert alert-danger">
      Üretim verileri yüklenirken bir hata oluştu: {{ error.message }}
    </div>

    <!-- İçerik Alanı -->
    <div v-else-if="productionData">
      <!-- Üretim Durumu Kartı -->
      <div class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">Üretim Durumu</h5>
          <div class="progress mb-3" style="height: 25px;">
            <div class="progress-bar" role="progressbar" :style="{ width: productionData.progress + '%' }" :aria-valuenow="productionData.progress" aria-valuemin="0" aria-valuemax="100">
              {{ productionData.progress }}%
            </div>
          </div>
          <p class="card-text">
            <strong>Aktif Siparişler:</strong> {{ productionData.activeOrders }}<br>
            <strong>Tamamlanan:</strong> {{ productionData.completedOrders }}<br>
            <strong>Geciken:</strong> {{ productionData.delayedOrders }}
          </p>
        </div>
      </div>

      <!-- Üretim Planı Tablosu -->
      <div class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">Üretim Planı</h5>
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Sipariş No</th>
                  <th>Müşteri</th>
                  <th>Ürün</th>
                  <th>Miktar</th>
                  <th>Başlangıç</th>
                  <th>Bitiş</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="productionData.plan.length === 0">
                  <td colspan="7" class="text-center">Gösterilecek üretim planı bulunamadı.</td>
                </tr>
                <tr v-for="item in productionData.plan" :key="item.orderNumber">
                  <td>{{ item.orderNumber }}</td>
                  <td>{{ item.customer }}</td>
                  <td>{{ item.product }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ formatDate(item.startDate) }}</td>
                  <td>{{ formatDate(item.endDate) }}</td>
                  <td><span class="badge" :class="getStatusClass(item.status)">{{ item.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Üretim Raporları Tablosu -->
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Üretim Raporları</h5>
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Verimlilik</th>
                  <th>Hedef</th>
                  <th>Gerçekleşen</th>
                  <th>Fark</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="productionData.reports.length === 0">
                  <td colspan="5" class="text-center">Gösterilecek üretim raporu bulunamadı.</td>
                </tr>
                <tr v-for="report in productionData.reports" :key="report.date">
                  <td>{{ formatDate(report.date) }}</td>
                  <td>{{ report.efficiency }}%</td>
                  <td>{{ report.target }}</td>
                  <td>{{ report.actual }}</td>
                  <td :class="report.difference >= 0 ? 'text-success' : 'text-danger'">
                    {{ report.difference >= 0 ? '+' : '' }}{{ report.difference }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- TODO: Modalları ekle (UpdatePlanModal, AddReportModal) -->
    <!-- Örnek: <UpdatePlanModal v-model:visible="isUpdatePlanModalVisible" @plan-updated="refreshData" /> -->

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
// TODO: Gerçek API servisini import et
// import { getProductionData } from '@/services/productionApiService'; 
// Geçici Mock Data
const mockApiService = {
  getProductionData: async () => {
    // Simulating API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    // Mock data structure based on R3/modules/production/production.js
    return {
      progress: 75,
      activeOrders: 12,
      completedOrders: 45,
      delayedOrders: 3,
      plan: [
        { orderNumber: 'ORD-001', customer: 'Müşteri A', product: 'RM 36 CB', quantity: 5, startDate: '2023-10-01', endDate: '2023-10-15', status: 'Devam Ediyor' },
        { orderNumber: 'ORD-002', customer: 'Müşteri B', product: 'RM 36 LB', quantity: 10, startDate: '2023-10-05', endDate: '2023-10-25', status: 'Planlandı' },
        { orderNumber: 'ORD-003', customer: 'Müşteri C', product: 'RMU', quantity: 2, startDate: '2023-09-20', endDate: '2023-10-05', status: 'Tamamlandı' },
      ],
      reports: [
        { date: '2023-10-05', efficiency: 95, target: 100, actual: 95, difference: -5 },
        { date: '2023-10-04', efficiency: 102, target: 100, actual: 102, difference: 2 },
        { date: '2023-10-03', efficiency: 98, target: 100, actual: 98, difference: -2 },
      ]
    };
  }
};

const productionData = ref(null);
const isLoading = ref(true);
const error = ref(null);

// TODO: Modal görünürlük durumları
// const isUpdatePlanModalVisible = ref(false);
// const isAddReportModalVisible = ref(false);

const loadData = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    // productionData.value = await getProductionData(); // Gerçek API çağrısı
    productionData.value = await mockApiService.getProductionData(); // Mock API çağrısı
  } catch (err) {
    console.error('Üretim verileri yüklenirken hata:', err);
    error.value = err;
  } finally {
    isLoading.value = false;
  }
};

const refreshData = () => {
  loadData();
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('tr-TR');
  } catch (e) {
    console.warn(`Invalid date format: ${dateString}`);
    return dateString; // Return original string if formatting fails
  }
};

const getStatusClass = (status) => {
  const statusClasses = {
    'Planlandı': 'bg-primary',
    'Devam Ediyor': 'bg-warning text-dark', // Dark text for better contrast on yellow
    'Tamamlandı': 'bg-success',
    'Gecikti': 'bg-danger'
  };
  return statusClasses[status] || 'bg-secondary';
};

const openUpdatePlanModal = () => {
  console.log('Plan güncelleme modalı açılacak');
  // isUpdatePlanModalVisible.value = true;
  // TODO: Implement modal opening logic
};

const openAddReportModal = () => {
  console.log('Rapor ekleme modalı açılacak');
  // isAddReportModalVisible.value = true;
  // TODO: Implement modal opening logic
};

onMounted(() => {
  loadData();
});

</script>

<style scoped>
/* R3/modules/production/production.html <style> bloğundaki stiller buraya taşınabilir */
.table th {
  background-color: #f8f9fa;
  font-weight: 600;
}

/* Action button aralığı için */
.action-buttons > .btn {
  margin-left: 0.5rem; /* veya me-2 yerine */
}
.action-buttons > .btn:first-child {
  margin-left: 0;
}

.badge {
  font-size: 0.85em;
  padding: 0.4em 0.7em;
}
</style>