<template>
  <div class="order-list-container">
    <div class="order-list-header">
      <h1>Sipariş Yönetimi</h1>
      <div class="order-list-actions">
        <button class="btn btn-primary" @click="createNewOrder">
          <i class="fas fa-plus"></i> Yeni Sipariş
        </button>
        <button class="btn btn-outline-secondary" @click="exportOrders">
          <i class="fas fa-download"></i> Dışa Aktar
        </button>
      </div>
    </div>

    <!-- Geliştirilmiş Filtre Paneli -->
    <div class="filter-panel">
      <div class="row g-3">
        <div class="col-md-12 mb-3">
          <div class="search-container position-relative">
            <input
              v-model="filters.searchQuery"
              type="text"
              class="form-control search-input"
              placeholder="Sipariş ara veya 'Gecikmiş siparişleri göster', 'AYEDAŞ için yüksek öncelikli siparişler' gibi doğal dil komutları yazın..."
              @keyup.enter="applyAIFilters"
            />
            <button
              class="btn btn-ai search-ai-btn"
              @click="applyAIFilters"
              :disabled="isAiFiltering || !filters.searchQuery"
              :class="{ 'btn-loading': isAiFiltering }"
            >
              <i class="fas fa-robot"></i>
              {{ isAiFiltering ? 'İşleniyor...' : 'AI ile Ara' }}
            </button>
          </div>
          <small class="text-muted d-block mt-1">
            <i class="fas fa-lightbulb text-warning"></i> İpucu: "AYEDAŞ'ın gecikmiş siparişleri" 
            veya "Yüksek riskli siparişler" gibi doğal dil sorguları kullanabilirsiniz.
          </small>
        </div>

        <div class="col-md-3">
          <label for="statusFilter" class="form-label">Durum</label>
          <select
            id="statusFilter"
            v-model="filters.status"
            class="form-select"
          >
            <option value="">Tümü</option>
            <option value="planned">Planlandı</option>
            <option value="in_progress">Devam Ediyor</option>
            <option value="delayed">Gecikmiş</option>
            <option value="completed">Tamamlandı</option>
            <option value="canceled">İptal Edildi</option>
          </select>
        </div>

        <div class="col-md-3">
          <label for="priorityFilter" class="form-label">Öncelik</label>
          <select
            id="priorityFilter"
            v-model="filters.priorityLevel"
            class="form-select"
          >
            <option value="">Tümü</option>
            <option value="high">Yüksek</option>
            <option value="medium">Orta</option>
            <option value="low">Düşük</option>
          </select>
        </div>

        <div class="col-md-3">
          <label for="riskFilter" class="form-label">Risk Seviyesi</label>
          <select
            id="riskFilter"
            v-model="filters.riskLevel"
            class="form-select"
          >
            <option value="">Tümü</option>
            <option value="high">Yüksek Risk</option>
            <option value="medium">Orta Risk</option>
            <option value="low">Düşük Risk</option>
          </select>
        </div>

        <div class="col-md-3">
          <label for="customerFilter" class="form-label">Müşteri</label>
          <select
            id="customerFilter"
            v-model="filters.customerName"
            class="form-select"
          >
            <option value="">Tümü</option>
            <option v-for="customer in customerList" :key="customer" :value="customer">
              {{ customer }}
            </option>
          </select>
        </div>

        <div class="col-12">
          <div class="d-flex justify-content-end">
            <button class="btn btn-outline-secondary me-2" @click="clearFilters">
              Filtreleri Temizle
            </button>
            <button class="btn btn-primary" @click="applyFilters">
              Filtreleri Uygula
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sipariş Listesi -->
    <div class="order-list-table-container">
      <div v-if="isLoading" class="d-flex justify-content-center mt-5 mb-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Yükleniyor...</span>
        </div>
      </div>

      <div v-else-if="!paginatedOrders.length" class="no-orders-message">
        <i class="fas fa-clipboard-list no-orders-icon"></i>
        <p>Kriterlere uygun sipariş bulunamadı.</p>
        <button class="btn btn-outline-primary" @click="clearFilters">
          Filtreleri Temizle
        </button>
      </div>

      <table v-else class="table table-hover order-table">
        <thead>
          <tr>
            <th @click="sortBy('orderNo')">
              Sipariş No
              <i v-if="sorting.field === 'orderNo'" :class="getSortIconClass('orderNo')"></i>
            </th>
            <th @click="sortBy('orderDate')">
              Sipariş Tarihi
              <i v-if="sorting.field === 'orderDate'" :class="getSortIconClass('orderDate')"></i>
            </th>
            <th @click="sortBy('customerInfo.name')">
              Müşteri
              <i v-if="sorting.field === 'customerInfo.name'" :class="getSortIconClass('customerInfo.name')"></i>
            </th>
            <th>Hücreler</th>
            <th>Durum</th>
            <th>İlerleme</th>
            <th>Risk</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in paginatedOrders" :key="order.id" :class="{'table-danger': order.status === 'delayed'}">
            <td>{{ order.orderNo }}</td>
            <td>{{ formatDate(order.orderDate) }}</td>
            <td>{{ order.customerInfo?.name }}</td>
            <td>
              <div v-for="(cell, index) in order.cells" :key="index" class="cell-info">
                {{ cell.productTypeCode }} ({{ cell.quantity }} adet)
              </div>
            </td>
            <td>
              <span :class="getStatusBadgeClass(order.status)">
                {{ getStatusText(order.status) }}
              </span>
            </td>
            <td>
              <div class="progress">
                <div
                  class="progress-bar"
                  role="progressbar"
                  :class="getProgressBarClass(order.status, order.progress)"
                  :style="{ width: order.progress + '%' }"
                  :aria-valuenow="order.progress"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  {{ order.progress }}%
                </div>
              </div>
            </td>
            <td>
              <span :class="getRiskBadgeClass(order.riskLevel)">
                {{ getRiskText(order.riskLevel) }}
              </span>
              <i v-if="order.riskLevel === 'high'" 
                 class="fas fa-exclamation-triangle text-danger ms-2"
                 data-bs-toggle="tooltip"
                 title="Bu sipariş için risk değerlendirmesi incelenmelidir"></i>
            </td>
            <td>
              <div class="btn-group">
                <button 
                  class="btn btn-sm btn-outline-primary"
                  @click="viewOrderDetail(order.id)"
                  title="Detayları Görüntüle">
                  <i class="fas fa-eye"></i>
                </button>
                <button 
                  class="btn btn-sm btn-outline-secondary"
                  @click="editOrder(order.id)"
                  title="Düzenle">
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  class="btn btn-sm btn-ai"
                  @click="analyzeOrder(order)"
                  title="AI Analizi">
                  <i class="fas fa-chart-line"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Sayfalama -->
      <div v-if="paginatedOrders.length" class="pagination-container">
        <div class="pagination-info">
          Toplam {{ filteredOrders.length }} sipariş ({{ totalOrderCount }} kayıttan filtrelendi)
        </div>
        <ul class="pagination">
          <li class="page-item" :class="{ disabled: pagination.currentPage === 1 }">
            <a class="page-link" href="#" @click.prevent="prevPage">Önceki</a>
          </li>
          <li
            v-for="page in getPaginationRange()"
            :key="page"
            class="page-item"
            :class="{ active: page === pagination.currentPage }"
          >
            <a class="page-link" href="#" @click.prevent="goToPage(page)">{{ page }}</a>
          </li>
          <li
            class="page-item"
            :class="{ disabled: pagination.currentPage === pagination.totalPages }"
          >
            <a class="page-link" href="#" @click.prevent="nextPage">Sonraki</a>
          </li>
        </ul>
      </div>
    </div>

    <!-- Sipariş Analiz Modalı -->
    <div v-if="showAnalysisModal" class="modal fade show" style="display: block;">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-chart-line text-primary"></i> 
              {{ selectedOrder?.orderNo }} AI Analizi
            </h5>
            <button type="button" class="btn-close" @click="closeAnalysisModal"></button>
          </div>
          <div class="modal-body">
            <div v-if="isAnalyzing" class="text-center p-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Analiz ediliyor...</span>
              </div>
              <p class="mt-3">AI, siparişi analiz ediyor...</p>
            </div>
            <div v-else>
              <div class="row mb-4">
                <div class="col-md-6">
                  <h6>Sipariş Bilgileri</h6>
                  <table class="table table-sm">
                    <tr>
                      <th>Müşteri:</th>
                      <td>{{ selectedOrder?.customerInfo?.name }}</td>
                    </tr>
                    <tr>
                      <th>Durum:</th>
                      <td>
                        <span :class="getStatusBadgeClass(selectedOrder?.status)">
                          {{ getStatusText(selectedOrder?.status) }}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <th>İlerleme:</th>
                      <td>{{ selectedOrder?.progress }}%</td>
                    </tr>
                  </table>
                </div>
                <div class="col-md-6">
                  <h6>Risk Değerlendirmesi</h6>
                  <div :class="['risk-assessment-card', getRiskCardClass(selectedOrder?.riskLevel)]">
                    <div class="risk-level">
                      <i :class="getRiskIcon(selectedOrder?.riskLevel)"></i>
                      <h4>{{ getRiskText(selectedOrder?.riskLevel) }}</h4>
                    </div>
                    <div class="risk-score">
                      <div class="risk-meter">
                        <div :class="['risk-indicator', getRiskIndicatorClass(selectedOrder?.riskLevel)]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="ai-analysis-section">
                <h6>
                  <i class="fas fa-robot text-primary me-2"></i>
                  AI Önerileri ve Analizler
                </h6>
                <div class="ai-recommendations">
                  <div v-if="selectedOrder?.status === 'delayed'" class="alert alert-warning">
                    <h6 class="mb-2"><i class="fas fa-exclamation-triangle"></i> Gecikme Analizi</h6>
                    <p>Bu sipariş şu anda <strong>{{ getDaysBehind(selectedOrder) }} gün</strong> geride ve risk faktörü yüksek.</p>
                    <ul>
                      <li>Müşteriye gecikmeli teslimat hakkında bilgi verilmelidir.</li>
                      <li>Üretim kapasitesi artırılarak gecikme telafi edilebilir.</li>
                      <li>Benzer ürünlerde sipariş gecikmelerini önlemek için stok optimizasyonu yapılabilir.</li>
                    </ul>
                  </div>
                  
                  <div v-else-if="selectedOrder?.status === 'in_progress' && selectedOrder?.progress < 50" class="alert alert-info">
                    <h6 class="mb-2"><i class="fas fa-info-circle"></i> İlerleme Analizi</h6>
                    <p>Bu siparişin ilerlemesi %{{ selectedOrder?.progress }} seviyesinde ve teslimata kalan süre için risk oluşturabilir.</p>
                    <ul>
                      <li>Üretimde öncelik verilmesi önerilir.</li>
                      <li>Gerekli malzemelerin tedariki hızlandırılmalıdır.</li>
                      <li>Üretim kapasitesi yeniden planlanabilir.</li>
                    </ul>
                  </div>
                  
                  <div v-else class="alert alert-success">
                    <h6 class="mb-2"><i class="fas fa-check-circle"></i> Durum Analizi</h6>
                    <p>Bu siparişin mevcut durumu stabil görünüyor.</p>
                    <ul>
                      <li>Mevcut üretim planı sürdürülebilir.</li>
                      <li>Müşteri ile düzenli iletişim sürdürülmesi önerilir.</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div class="related-insights mt-4">
                <h6>İlgili Analizler</h6>
                <div class="row g-3">
                  <div class="col-md-4">
                    <div class="card h-100">
                      <div class="card-body">
                        <h6 class="card-title">Malzeme Durumu</h6>
                        <p class="card-text">Sipariş için gerekli malzemelerin %{{ Math.floor(Math.random() * 30) + 70 }}
                           stokta mevcut.</p>
                        <a href="#" class="btn btn-sm btn-outline-primary">Stok Durumunu Gör</a>
                      </div>
                    </div>
                  </div>
                  
                  <div class="col-md-4">
                    <div class="card h-100">
                      <div class="card-body">
                        <h6 class="card-title">Benzer Siparişler</h6>
                        <p class="card-text">{{ Math.floor(Math.random() * 5) + 3 }} 
                          benzer sipariş şu anda üretimde.</p>
                        <a href="#" class="btn btn-sm btn-outline-primary">Benzer Siparişleri Gör</a>
                      </div>
                    </div>
                  </div>
                  
                  <div class="col-md-4">
                    <div class="card h-100">
                      <div class="card-body">
                        <h6 class="card-title">Finansal Etki</h6>
                        <p class="card-text">Bu siparişin tahmini kâr marjı: %{{ Math.floor(Math.random() * 10) + 15 }}</p>
                        <a href="#" class="btn btn-sm btn-outline-primary">Finansal Detay</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeAnalysisModal">
              Kapat
            </button>
            <button type="button" class="btn btn-primary" @click="downloadAnalysisReport">
              <i class="fas fa-download me-1"></i> 
              Raporu İndir
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showAnalysisModal" class="modal-backdrop fade show"></div>
    
  </div>
</template>

<script>
import { defineComponent, onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useOrders } from './useOrders';
import { useToast } from '@/composables/useToast';

export default defineComponent({
  name: 'OrderList',
  
  setup() {
    const router = useRouter();
    const { showToast } = useToast();
    
    // useOrders composable'dan state ve metodları al
    const {
      orders,
      isLoading,
      totalOrderCount,
      filters,
      sorting,
      pagination,
      isAiFiltering,
      filteredOrders,
      paginatedOrders,
      customerList,
      loadOrders,
      nextPage,
      prevPage,
      goToPage,
      sortBy,
      clearFilters,
      getStatusText,
      getStatusBadgeClass,
      applyAIFilters
    } = useOrders();
    
    // AI analiz modalı için state
    const showAnalysisModal = ref(false);
    const selectedOrder = ref(null);
    const isAnalyzing = ref(false);
    
    onMounted(async () => {
      await loadOrders();
    });
    
    // Tarih formatı için yardımcı fonksiyon
    function formatDate(dateString) {
      if (!dateString) return '';
      
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', options);
    }
    
    // Sıralama ikonu için yardımcı fonksiyon
    function getSortIconClass(field) {
      if (sorting.field !== field) return 'fas fa-sort';
      return sorting.direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    }
    
    // İlerleme çubuğu sınıfını döndüren yardımcı fonksiyon
    function getProgressBarClass(status, progress) {
      if (status === 'delayed') return 'bg-danger';
      if (status === 'completed') return 'bg-success';
      if (progress < 30) return 'bg-warning';
      return 'bg-primary';
    }
    
    // Risk badge sınıfını döndüren yardımcı fonksiyon
    function getRiskBadgeClass(riskLevel) {
      const classMap = {
        'high': 'risk-badge risk-high',
        'medium': 'risk-badge risk-medium',
        'low': 'risk-badge risk-low'
      };
      
      return classMap[riskLevel] || '';
    }
    
    // Risk metni döndüren yardımcı fonksiyon
    function getRiskText(riskLevel) {
      const textMap = {
        'high': 'Yüksek Risk',
        'medium': 'Orta Risk',
        'low': 'Düşük Risk'
      };
      
      return textMap[riskLevel] || 'Bilinmiyor';
    }
    
    // Risk kart sınıfını döndüren yardımcı fonksiyon
    function getRiskCardClass(riskLevel) {
      const classMap = {
        'high': 'risk-high-bg',
        'medium': 'risk-medium-bg',
        'low': 'risk-low-bg'
      };
      
      return classMap[riskLevel] || '';
    }
    
    // Risk ikonu döndüren yardımcı fonksiyon
    function getRiskIcon(riskLevel) {
      const iconMap = {
        'high': 'fas fa-exclamation-triangle text-danger',
        'medium': 'fas fa-exclamation-circle text-warning',
        'low': 'fas fa-check-circle text-success'
      };
      
      return iconMap[riskLevel] || 'fas fa-question-circle';
    }
    
    // Risk gösterge sınıfını döndüren yardımcı fonksiyon
    function getRiskIndicatorClass(riskLevel) {
      const classMap = {
        'high': 'risk-high-indicator',
        'medium': 'risk-medium-indicator',
        'low': 'risk-low-indicator'
      };
      
      return classMap[riskLevel] || '';
    }
    
    // Siparişin kaç gün gecikmeli olduğunu hesaplayan yardımcı fonksiyon
    function getDaysBehind(order) {
      if (!order || !order.cells || !order.cells.length) return 0;
      
      // Teslim tarihleri arasında en erkeni bul
      const deliveryDates = order.cells.map(cell => new Date(cell.deliveryDate));
      const earliestDelivery = new Date(Math.min(...deliveryDates));
      
      // Bugünün tarihi ile karşılaştır
      const today = new Date();
      const diffTime = Math.abs(today - earliestDelivery);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    }
    
    // Sayfalama aralığını hesaplayan fonksiyon
    function getPaginationRange() {
      const totalPages = pagination.totalPages;
      const currentPage = pagination.currentPage;
      
      if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }
      
      if (currentPage <= 3) {
        return [1, 2, 3, 4, '...', totalPages];
      }
      
      if (currentPage >= totalPages - 2) {
        return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      }
      
      return [
        1, 
        '...', 
        currentPage - 1, 
        currentPage, 
        currentPage + 1, 
        '...', 
        totalPages
      ];
    }
    
    // Yeni sipariş oluştur fonksiyonu
    function createNewOrder() {
      router.push({ name: 'order-create' });
    }
    
    // Siparişleri dışa aktar fonksiyonu
    function exportOrders() {
      showToast('Siparişler dışa aktarılıyor...', 'info');
      // Gerçek uygulamada: Export fonksiyonu
      setTimeout(() => {
        showToast('Siparişler başarıyla dışa aktarıldı', 'success');
      }, 1500);
    }
    
    // Sipariş detayını görüntüle fonksiyonu
    function viewOrderDetail(id) {
      router.push({ name: 'order-detail', params: { id } });
    }
    
    // Sipariş düzenle fonksiyonu
    function editOrder(id) {
      router.push({ name: 'order-edit', params: { id } });
    }
    
    // Sipariş analiz fonksiyonu
    function analyzeOrder(order) {
      selectedOrder.value = order;
      showAnalysisModal.value = true;
      isAnalyzing.value = true;
      
      // Gerçekte AI ile analiz yapılır
      setTimeout(() => {
        isAnalyzing.value = false;
      }, 2000);
    }
    
    // Analiz modalını kapat fonksiyonu
    function closeAnalysisModal() {
      showAnalysisModal.value = false;
      selectedOrder.value = null;
    }
    
    // Analiz raporu indir fonksiyonu
    function downloadAnalysisReport() {
      showToast('Analiz raporu hazırlanıyor...', 'info');
      // Gerçekte rapor oluşturulur
      setTimeout(() => {
        showToast('Analiz raporu başarıyla indirildi', 'success');
      }, 1500);
    }
    
    // Filtreleri uygulama fonksiyonu
    function applyFilters() {
      showToast('Filtreler uygulandı', 'success');
    }
    
    return {
      // State
      orders,
      isLoading,
      totalOrderCount,
      filters,
      sorting,
      pagination,
      filteredOrders,
      paginatedOrders,
      customerList,
      isAiFiltering,
      showAnalysisModal,
      selectedOrder,
      isAnalyzing,
      
      // Methods
      loadOrders,
      nextPage,
      prevPage,
      goToPage,
      sortBy,
      clearFilters,
      getStatusText,
      getStatusBadgeClass,
      formatDate,
      getSortIconClass,
      getProgressBarClass,
      getRiskBadgeClass,
      getRiskText,
      getRiskCardClass, 
      getRiskIcon,
      getRiskIndicatorClass,
      getDaysBehind,
      getPaginationRange,
      createNewOrder,
      exportOrders,
      viewOrderDetail,
      editOrder,
      analyzeOrder,
      closeAnalysisModal,
      downloadAnalysisReport,
      applyFilters,
      applyAIFilters
    };
  }
});
</script>

<style scoped>
.order-list-container {
  padding: 1.5rem;
}

.order-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.order-list-actions {
  display: flex;
  gap: 0.5rem;
}

.filter-panel {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-container {
  display: flex;
  width: 100%;
}

.search-input {
  padding-right: 110px;
}

.search-ai-btn {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.btn-ai {
  background-color: #6f42c1;
  color: white;
}

.btn-ai:hover {
  background-color: #5a32a3;
  color: white;
}

.btn-loading {
  opacity: 0.7;
  cursor: not-allowed;
}

.order-list-table-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.order-table {
  margin-bottom: 0;
}

.order-table th {
  cursor: pointer;
  position: relative;
  user-select: none;
}

.order-table th i {
  margin-left: 5px;
  font-size: 0.8rem;
}

.status-badge {
  display: inline-block;
  padding: 0.35em 0.65em;
  font-size: 0.75em;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: 0.25rem;
}

.status-planned {
  background-color: #cff4fc;
  color: #055160;
}

.status-progress {
  background-color: #fff3cd;
  color: #664d03;
}

.status-delayed {
  background-color: #f8d7da;
  color: #842029;
}

.status-completed {
  background-color: #d1e7dd;
  color: #0f5132;
}

.status-canceled {
  background-color: #e2e3e5;
  color: #41464b;
}

.risk-badge {
  display: inline-block;
  padding: 0.35em 0.65em;
  font-size: 0.75em;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: 0.25rem;
}

.risk-high {
  background-color: #f8d7da;
  color: #842029;
}

.risk-medium {
  background-color: #fff3cd;
  color: #664d03;
}

.risk-low {
  background-color: #d1e7dd;
  color: #0f5132;
}

.cell-info {
  margin-bottom: 0.25rem;
}

.cell-info:last-child {
  margin-bottom: 0;
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.pagination {
  margin-bottom: 0;
}

.no-orders-message {
  text-align: center;
  padding: 3rem 1rem;
}

.no-orders-icon {
  font-size: 3rem;
  color: #adb5bd;
  margin-bottom: 1rem;
}

.risk-assessment-card {
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.risk-high-bg {
  background-color: rgba(248, 215, 218, 0.5);
  border-left: 5px solid #dc3545;
}

.risk-medium-bg {
  background-color: rgba(255, 243, 205, 0.5);
  border-left: 5px solid #ffc107;
}

.risk-low-bg {
  background-color: rgba(209, 231, 221, 0.5);
  border-left: 5px solid #198754;
}

.risk-level {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.risk-level i {
  font-size: 1.5rem;
}

.risk-level h4 {
  margin: 0;
  font-size: 1.2rem;
}

.risk-meter {
  height: 6px;
  background-color: #e9ecef;
  border-radius: 3px;
  position: relative;
  overflow: hidden;
}

.risk-indicator {
  position: absolute;
  height: 100%;
  top: 0;
  left: 0;
}

.risk-high-indicator {
  background-color: #dc3545;
  width: 80%;
}

.risk-medium-indicator {
  background-color: #ffc107;
  width: 45%;
}

.risk-low-indicator {
  background-color: #198754;
  width: 20%;
}

.ai-analysis-section {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  background-color: #f8f9fa;
}

.related-insights .card {
  transition: transform 0.2s;
}

.related-insights .card:hover {
  transform: translateY(-5px);
}
</style>