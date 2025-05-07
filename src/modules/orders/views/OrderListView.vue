<template>
  <div class="order-list-view">
    <div class="card border-0">
      <div class="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Sipariş Yönetimi</h5>
        <button class="btn btn-primary" @click="openNewOrderModal">
          <i class="bi bi-plus"></i> Yeni Sipariş Ekle
        </button>
      </div>
      <div class="card-body">
        <!-- Filtreleme Bölümü -->
        <div class="mb-3">
          <div class="row g-2">
            <div class="col-md-4">
              <input type="text" class="form-control" placeholder="Sipariş No Ara..." v-model="filters.orderNumber">
            </div>
            <div class="col-md-3">
              <select class="form-select" v-model="filters.cellType">
                <option value="">Hücre Tipi Seçin</option>
                <option>RM 36 CB</option>
                <option>RM 36 LB</option>
                <option>RM 36 FL</option>
                <option>RMU</option>
              </select>
            </div>
            <div class="col-md-3">
              <select class="form-select" v-model="filters.status">
                <option value="">Durum Seçin</option>
                <option>Planlandı</option>
                <option>Devam Ediyor</option>
                <option>Gecikmiş</option>
                <option>Tamamlandı</option>
              </select>
            </div>
            <div class="col-md-2">
              <button class="btn btn-outline-secondary w-100" @click="applyFilters">Filtrele</button>
            </div>
          </div>
        </div>

        <!-- Sipariş Tablosu -->
        <div class="table-responsive">
          <table class="table table-hover custom-table">
            <thead>
              <tr>
                <th>Sipariş No</th>
                <th>Müşteri</th>
                <th>Hücre Tipi</th>
                <th>Miktar</th>
                <th>Planlanan Teslim</th>
                <th>Durum</th>
                <th>İlerleme</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              <!-- Dinamik Veri (v-for ile döngüye alınacak) -->
              <tr v-for="order in filteredOrders" :key="order.id" :class="getPriorityClass(order)">
                <td>{{ order.id }}</td>
                <td>{{ order.customer }}</td>
                <td>{{ order.cellType }}</td>
                <td>{{ order.quantity }}</td>
                <td>{{ order.deliveryDate }}</td>
                <td><span :class="getStatusBadgeClass(order.status)">{{ order.status }}</span></td>
                <td>
                  <div class="progress progress-thin">
                    <div :class="getProgressBarClass(order.status)" role="progressbar" :style="{ width: order.progress + '%' }"></div>
                  </div>
                </td>
                <td>
                  <router-link :to="{ name: 'OrderDetail', params: { id: order.id } }" class="btn btn-sm btn-outline-primary me-1"><i class="bi bi-eye"></i></router-link>
                  <button class="btn btn-sm btn-outline-secondary" @click="editOrder(order)"><i class="bi bi-pencil"></i></button>
                </td>
              </tr>
              <tr v-if="filteredOrders.length === 0">
                 <td colspan="8" class="text-center">Gösterilecek sipariş bulunamadı.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Sayfalama -->
        <nav aria-label="Page navigation" v-if="totalPages > 1">
          <ul class="pagination justify-content-center">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">Önceki</a>
            </li>
            <li class="page-item" v-for="page in totalPages" :key="page" :class="{ active: currentPage === page }">
              <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
            </li>
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">Sonraki</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useOrders } from '@/modules/orders/useOrders';

// Router
const router = useRouter();

// Composable'dan state ve metodları al
const { 
  orders, 
  filters, 
  currentPage, 
  itemsPerPage, 
  filteredOrders, 
  totalPages,
  applyFilters,
  changePage,
  getPriorityClass
} = useOrders();

// Status sınıfları - ornekindex.html'e uyarlandı
const getStatusBadgeClass = (status) => {
  switch(status) {
    case 'Planlandı': return 'status-badge status-planned';
    case 'Devam Ediyor': return 'status-badge status-in-progress';
    case 'Gecikmiş': return 'status-badge status-delayed';
    case 'Tamamlandı': return 'status-badge status-completed';
    default: return 'status-badge';
  }
};

// İlerleme çubuğu sınıfları
const getProgressBarClass = (status) => {
  switch(status) {
    case 'Planlandı': return 'progress-bar bg-info';
    case 'Devam Ediyor': return 'progress-bar bg-warning';
    case 'Gecikmiş': return 'progress-bar bg-danger';
    case 'Tamamlandı': return 'progress-bar bg-success';
    default: return 'progress-bar';
  }
};

// Metodlar
const openNewOrderModal = () => {
  // Yeni sipariş oluşturma sayfasına yönlendir
  router.push({ name: 'OrderCreate' });
};

const editOrder = (order) => {
  console.log('Edit order:', order);
  // Düzenleme sayfasına yönlendir
  router.push({ 
    name: 'OrderDetail', 
    params: { id: order.id }, 
    query: { edit: true } 
  });
};
</script>

<style lang="scss" scoped>
/* Sipariş listesi özel stilleri - ornekindex.html'den alındı */
.table th {
  background-color: var(--bs-light); 
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.status-planned {
  background-color: #e3f2fd;
  color: #1976d2;
}

.status-in-progress {
  background-color: #fff8e1;
  color: #ff8f00;
}

.status-delayed {
  background-color: #ffebee;
  color: #d32f2f;
}

.status-completed {
  background-color: #e8f5e9;
  color: #388e3c;
}

.progress-thin {
  height: 6px;
  border-radius: 3px;
}

/* Öncelik renkleri */
.priority-high {
  border-left: 4px solid var(--danger-color, #e74c3c);
}

.priority-medium {
  border-left: 4px solid var(--warning-color, #f39c12);
}

.priority-low {
  border-left: 4px solid var(--success-color, #27ae60);
}

/* Kart stilleri */
.card {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
  border-radius: 10px;
}

.card:hover {
  transform: translateY(-5px);
}

.card-header {
  font-weight: 600;
}

.custom-table {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .status-badge {
    padding: 3px 6px;
    font-size: 10px;
  }
}
</style>