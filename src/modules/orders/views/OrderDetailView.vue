<template>
  <div class="order-detail">
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Yükleniyor...</span>
      </div>
    </div>
    
    <div v-else-if="!order" class="alert alert-warning">
      Sipariş bulunamadı veya erişim yetkiniz yok.
    </div>
    
    <div v-else>
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1>{{ order.orderNo }}</h1>
          <p class="text-muted">
            Sipariş Tarihi: {{ new Date(order.orderDate).toLocaleDateString('tr-TR') }}
          </p>
        </div>
        
        <div class="d-flex gap-2">
          <button v-if="!isEditing" @click="startEditing" class="btn btn-outline-primary">
            <i class="bi bi-pencil me-1"></i> Düzenle
          </button>
          <button v-if="!isEditing" @click="confirmClone" class="btn btn-outline-secondary">
            <i class="bi bi-copy me-1"></i> Kopyala
          </button>
          <button v-if="!isEditing" @click="confirmDelete" class="btn btn-outline-danger">
            <i class="bi bi-trash me-1"></i> Sil
          </button>
          <router-link :to="{ name: 'Orders' }" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-1"></i> Siparişler
          </router-link>
        </div>
      </div>
      
      <!-- Durum Bilgisi -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row">
            <div class="col-md-3">
              <div class="d-flex align-items-center">
                <span class="me-2">Durum:</span>
                <span class="badge" :class="getStatusBadgeClass(order.status)">
                  {{ getStatusText(order.status) }}
                </span>
              </div>
            </div>
            <div class="col-md-6">
              <div class="d-flex align-items-center">
                <span class="me-2">İlerleme:</span>
                <div class="progress flex-grow-1">
                  <div 
                    class="progress-bar" 
                    role="progressbar" 
                    :style="`width: ${orderProgress}%`"
                    :class="{
                      'bg-success': orderProgress === 100,
                      'bg-info': orderProgress >= 75 && orderProgress < 100,
                      'bg-primary': orderProgress >= 50 && orderProgress < 75,
                      'bg-warning': orderProgress >= 25 && orderProgress < 50,
                      'bg-danger': orderProgress < 25
                    }"
                    :aria-valuenow="orderProgress" 
                    aria-valuemin="0" 
                    aria-valuemax="100">
                    {{ orderProgress }}%
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="d-flex align-items-center">
                <span class="me-2">Öncelik:</span>
                <span class="badge" :class="{
                  'bg-danger': order.priority === 'high',
                  'bg-warning': order.priority === 'medium',
                  'bg-info': order.priority === 'low'
                }">
                  {{ order.priority === 'high' ? 'Yüksek' : 
                     order.priority === 'medium' ? 'Orta' : 
                     order.priority === 'low' ? 'Düşük' : 'Normal' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Analizi ve Öneriler -->
      <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">
            <i class="bi bi-robot me-2"></i>
            Yapay Zeka Analizi
          </h5>
          <button 
            class="btn btn-sm" 
            :class="isAnalyzing ? 'btn-secondary disabled' : 'btn-primary'" 
            @click="performAIAnalysis"
            :disabled="isAnalyzing">
            <span v-if="isAnalyzing" class="spinner-border spinner-border-sm me-1" role="status"></span>
            {{ isAnalyzing ? 'Analiz yapılıyor...' : 'Analizi Yenile' }}
          </button>
        </div>
        <div class="card-body">
          <div v-if="isAnalyzing" class="text-center py-3">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Analiz yapılıyor...</span>
            </div>
            <p class="mt-2 text-muted">Siparişiniz yapay zeka tarafından analiz ediliyor...</p>
          </div>
          
          <div v-else-if="!aiAnalysis && !aiSuggestions.length" class="text-center py-3">
            <i class="bi bi-lightbulb fs-1 text-warning"></i>
            <p class="mt-2">Henüz bir analiz yapılmamış. "Analizi Yenile" butonuna tıklayarak sipariş hakkında yapay zeka değerlendirmesi alabilirsiniz.</p>
          </div>
          
          <div v-else>
            <!-- Analiz Sonuçları -->
            <div v-if="aiAnalysis" class="mb-4">
              <h6>Sipariş Değerlendirmesi:</h6>
              <p class="analysis-text" v-html="formatAnalysisText(aiAnalysis)"></p>
            </div>
            
            <!-- Öneriler -->
            <div v-if="aiSuggestions.length" class="mt-4">
              <h6>Yapay Zeka Önerileri:</h6>
              <div class="row g-3 mt-1">
                <div v-for="suggestion in aiSuggestions" :key="suggestion.action" class="col-md-6 col-lg-4">
                  <div class="card h-100 suggestion-card">
                    <div class="card-body">
                      <p class="card-text">{{ suggestion.text }}</p>
                    </div>
                    <div class="card-footer bg-transparent">
                      <button class="btn btn-sm btn-outline-primary" @click="handleSuggestion(suggestion.action)">
                        <i class="bi bi-lightning me-1"></i>
                        Uygula
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Düzenleme Formu -->
      <div v-if="isEditing" class="card mb-4">
        <!-- ... Form içeriği ... -->
      </div>
      
      <div class="row">
        <!-- Müşteri ve Sipariş Detayları -->
        <div class="col-lg-6">
          <div class="card mb-4">
            <!-- ... Müşteri bilgileri ... -->
          </div>
        </div>
        
        <!-- Hücre Listesi -->
        <div class="col-lg-6">
          <div class="card mb-4">
            <!-- ... Hücre bilgileri ... -->
          </div>
        </div>
      </div>
      
      <!-- Üretim Aşamaları -->
      <div class="card mb-4">
        <!-- ... Üretim aşamaları ... -->
      </div>
      
      <!-- İlgili Dokümanlar -->
      <div class="card mb-4">
        <!-- ... Dokümanlar ... -->
      </div>
      
      <!-- Notlar -->
      <div class="card mb-4">
        <!-- ... Notlar ... -->
      </div>
    </div>
    
    <!-- Silme Onay Modalı -->
    <div v-if="showDeleteModal" class="modal fade show" style="display: block;">
      <!-- ... Modal içeriği ... -->
    </div>
    
    <!-- Kopyalama Onay Modalı -->
    <div v-if="showCloneModal" class="modal fade show" style="display: block;">
      <!-- ... Modal içeriği ... -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useOrderDetail } from '@/modules/orders/useOrderDetail';

const router = useRouter();

// useOrderDetail composable'dan gerekli state ve metotları al
const {
  order,
  isLoading,
  isEditing,
  isAnalyzing,
  aiAnalysis,
  aiSuggestions,
  productionStages,
  documents,
  editForm,
  orderProgress,
  orderCellCount,
  loadOrderDetail,
  performAIAnalysis,
  startEditing,
  cancelEditing,
  saveChanges,
  deleteOrder,
  cloneOrder,
  getStatusText,
  getStatusBadgeClass,
  formatAnalysisText,
  handleSuggestion
} = useOrderDetail();

// Modal state
const showDeleteModal = ref(false);
const showCloneModal = ref(false);
const isActionLoading = ref(false);

// Sipariş silme onayı
function confirmDelete() {
  showDeleteModal.value = true;
}

// Sipariş kopyalama onayı
function confirmClone() {
  showCloneModal.value = true;
}

// Sipariş silme işlemi
async function handleDeleteOrder() {
  try {
    isActionLoading.value = true;
    const result = await deleteOrder();
    
    if (result) {
      // Başarılı silme sonrası liste sayfasına yönlendir
      router.push({ name: 'Orders' });
    }
    
    showDeleteModal.value = false;
  } catch (error) {
    console.error('Sipariş silinirken hata:', error);
  } finally {
    isActionLoading.value = false;
  }
}

// Sipariş kopyalama işlemi
async function handleCloneOrder() {
  try {
    isActionLoading.value = true;
    const result = await cloneOrder();
    
    if (result) {
      // Başarılı kopyalama sonrası yeni siparişe yönlendir
      showCloneModal.value = false;
    }
  } catch (error) {
    console.error('Sipariş kopyalanırken hata:', error);
  } finally {
    isActionLoading.value = false;
  }
}

// Dosya boyutunu biçimlendir
function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Doküman tipi metni
function getDocumentTypeText(type) {
  const types = {
    'contract': 'Sözleşme',
    'technical': 'Teknik Doküman',
    'drawing': 'Teknik Çizim',
    'invoice': 'Fatura',
    'report': 'Rapor'
  };
  
  return types[type] || type || 'Diğer';
}

// Sayfa yüklendiğinde sipariş detaylarını yükle
onMounted(() => {
  loadOrderDetail();
});
</script>

<style scoped>
.badge {
  font-size: 0.9rem;
}

.analysis-text {
  line-height: 1.5;
}

.analysis-text .highlight {
  background-color: rgba(var(--bs-warning-rgb), 0.2);
  padding: 0 0.2rem;
  border-radius: 0.2rem;
}

.analysis-text .success {
  color: var(--bs-success);
  font-weight: 500;
}

.analysis-text .danger {
  color: var(--bs-danger);
  font-weight: 500;
}

.suggestion-card {
  transition: all 0.2s ease-in-out;
  border: 1px solid rgba(0,0,0,0.125);
}

.suggestion-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  border-color: var(--bs-primary);
}
</style>