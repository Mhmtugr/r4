<template>
  <div class="ai-insights-dashboard">
    <div class="ai-insights-header">
      <h4 class="ai-insights-title">
        <i class="bi bi-cpu"></i>
        Yapay Zeka İçgörüleri
      </h4>
      <div class="ai-insights-controls">
        <button class="btn btn-sm btn-outline-secondary" @click="refreshInsights">
          <i class="bi bi-arrow-clockwise"></i>
          <span class="d-none d-md-inline ms-1">Yenile</span>
        </button>
        <button class="btn btn-sm btn-outline-secondary ms-2" @click="toggleFilter">
          <i class="bi" :class="showFilter ? 'bi-funnel-fill' : 'bi-funnel'"></i>
          <span class="d-none d-md-inline ms-1">Filtrele</span>
        </button>
      </div>
    </div>
    
    <!-- Filtreler -->
    <div class="ai-insights-filter mb-3" v-if="showFilter">
      <div class="row g-2">
        <div class="col-md-4">
          <div class="form-group">
            <label class="form-label">Departman</label>
            <select class="form-select" v-model="filter.department">
              <option value="">Tümü</option>
              <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
            </select>
          </div>
        </div>
        <div class="col-md-4">
          <div class="form-group">
            <label class="form-label">Kategori</label>
            <select class="form-select" v-model="filter.category">
              <option value="">Tümü</option>
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
        </div>
        <div class="col-md-4">
          <div class="form-group">
            <label class="form-label">Önem</label>
            <select class="form-select" v-model="filter.importance">
              <option value="">Tümü</option>
              <option value="high">Yüksek</option>
              <option value="medium">Orta</option>
              <option value="low">Düşük</option>
            </select>
          </div>
        </div>
        <div class="col-12">
          <div class="d-flex justify-content-end">
            <button class="btn btn-sm btn-secondary" @click="resetFilter">
              <i class="bi bi-x-circle me-1"></i>
              Sıfırla
            </button>
            <button class="btn btn-sm btn-primary ms-2" @click="applyFilter">
              <i class="bi bi-check-circle me-1"></i>
              Uygula
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- İçgörüler listesi -->
    <div class="ai-insights-content">
      <div v-if="isLoading" class="ai-insights-loading">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Yükleniyor...</span>
        </div>
        <span class="mt-2">İçgörüler yükleniyor...</span>
      </div>
      
      <div v-else-if="filteredInsights.length === 0" class="ai-insights-empty">
        <i class="bi bi-search"></i>
        <p>İçgörü bulunamadı.</p>
      </div>
      
      <div v-else class="ai-insights-grid">
        <div v-for="insight in filteredInsights" :key="insight.id" class="ai-insight-card">
          <div class="ai-insight-card-header">
            <div class="ai-insight-card-title">
              <i :class="getInsightIcon(insight)"></i>
              <h6 class="m-0 ms-2">{{ insight.title }}</h6>
            </div>
            <div class="ai-insight-card-badges">
              <span class="badge" :class="getImportanceBadge(insight.importance)">
                {{ getImportanceLabel(insight.importance) }}
              </span>
            </div>
          </div>
          
          <div class="ai-insight-card-content">
            <p class="mb-2">{{ insight.description }}</p>
            
            <!-- Tahmin sonuçları varsa -->
            <div v-if="insight.predictions && insight.predictions.length > 0" class="mt-3">
              <PredictionResults 
                :predictions="insight.predictions" 
                :confidence="insight.confidence || 0.7"
              />
            </div>
            
            <!-- CAD model önizlemesi varsa -->
            <div v-if="insight.modelId" class="mt-3">
              <ModelPreview 
                :modelId="insight.modelId"
                :name="insight.modelName"
              />
            </div>
            
            <!-- İlgili dokümanlar varsa -->
            <div v-if="insight.relatedDocuments && insight.relatedDocuments.length > 0" class="mt-3">
              <RelatedDocuments 
                :documents="insight.relatedDocuments"
                @view="viewDocument"
              />
            </div>
          </div>
          
          <div class="ai-insight-card-footer">
            <div class="ai-insight-card-meta">
              <span class="ai-insight-card-department">{{ insight.department }}</span>
              <span class="ai-insight-card-date">
                <i class="bi bi-clock me-1"></i>
                {{ formatDate(insight.date) }}
              </span>
            </div>
            <div class="ai-insight-card-actions">
              <button 
                v-if="insight.actions && insight.actions.includes('analyze')" 
                class="btn btn-sm btn-outline-primary"
                @click="analyzeInsight(insight)"
              >
                <i class="bi bi-graph-up me-1"></i>
                Analiz Et
              </button>
              <button 
                v-if="insight.actions && insight.actions.includes('view3d')" 
                class="btn btn-sm btn-outline-info ms-1"
                @click="viewModel(insight.modelId)"
              >
                <i class="bi bi-box me-1"></i>
                3D Görünüm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Analizler için ML Panel -->
    <MachineLearningPanel 
      v-if="showMlPanel" 
      @close="showMlPanel = false"
      @run-prediction="runPrediction"
    />
    
    <!-- 3D Model Görüntüleme -->
    <CADViewerModal
      v-if="selectedModelId"
      :modelId="selectedModelId"
      @close="selectedModelId = null"
    />
    
    <!-- ML Çalıştırma Sonucu -->
    <div v-if="mlResult" class="ml-result-modal" @click="closeMlResult">
      <div class="ml-result-content" @click.stop>
        <div class="ml-result-header">
          <h5>Analiz Sonucu</h5>
          <button class="btn-close" @click="closeMlResult"></button>
        </div>
        <div class="ml-result-body">
          <PredictionResults 
            :predictions="mlResult.predictions"
            :confidence="mlResult.confidence"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAiService } from '@/services/ai-service'
import PredictionResults from './PredictionResults.vue'
import MachineLearningPanel from './MachineLearningPanel.vue'
import ModelPreview from './ModelPreview.vue'
import RelatedDocuments from './RelatedDocuments.vue'
import CADViewerModal from './CADViewerModal.vue'

// State
const insights = ref([])
const isLoading = ref(true)
const showFilter = ref(false)
const filter = reactive({
  department: '',
  category: '',
  importance: ''
})
const showMlPanel = ref(false)
const selectedModelId = ref(null)
const mlResult = ref(null)

// AI servisi
const aiService = useAiService()

// Filtrelenmiş içgörüler
const filteredInsights = computed(() => {
  let result = [...insights.value]
  
  if (filter.department) {
    result = result.filter(insight => insight.department === filter.department)
  }
  
  if (filter.category) {
    result = result.filter(insight => insight.category === filter.category)
  }
  
  if (filter.importance) {
    result = result.filter(insight => insight.importance === filter.importance)
  }
  
  return result
})

// Departman listesi
const departments = computed(() => {
  const depts = new Set()
  insights.value.forEach(insight => {
    if (insight.department) {
      depts.add(insight.department)
    }
  })
  return [...depts]
})

// Kategori listesi
const categories = computed(() => {
  const cats = new Set()
  insights.value.forEach(insight => {
    if (insight.category) {
      cats.add(insight.category)
    }
  })
  return [...cats]
})

// İçgörü tipine göre ikon al
const getInsightIcon = (insight) => {
  const category = insight.category ? insight.category.toLowerCase() : ''
  
  switch (category) {
    case 'üretim':
    case 'production':
      return 'bi bi-gear-fill'
    case 'stok':
    case 'inventory':
      return 'bi bi-box-seam-fill'
    case 'kalite':
    case 'quality':
      return 'bi bi-check-circle-fill'
    case 'analiz':
    case 'analysis':
      return 'bi bi-graph-up'
    case 'bakım':
    case 'maintenance':
      return 'bi bi-tools'
    case 'planlama':
    case 'planning':
      return 'bi bi-calendar-event'
    default:
      return 'bi bi-lightbulb-fill'
  }
}

// Önem derecesine göre sınıf
const getImportanceBadge = (importance) => {
  switch (importance) {
    case 'high':
      return 'bg-danger'
    case 'medium':
      return 'bg-warning'
    case 'low':
      return 'bg-info'
    default:
      return 'bg-secondary'
  }
}

// Önem derecesi etiketi
const getImportanceLabel = (importance) => {
  switch (importance) {
    case 'high':
      return 'Yüksek'
    case 'medium':
      return 'Orta'
    case 'low':
      return 'Düşük'
    default:
      return 'Normal'
  }
}

// Tarihi formatla
const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

// İçgörüleri yükle
const loadInsights = async () => {
  try {
    isLoading.value = true
    const data = await aiService.getInsights()
    insights.value = data || []
  } catch (error) {
    console.error('İçgörüler yüklenirken hata:', error)
  } finally {
    isLoading.value = false
  }
}

// İçgörüleri yenile
const refreshInsights = () => {
  loadInsights()
}

// Filtre panelini göster/gizle
const toggleFilter = () => {
  showFilter.value = !showFilter.value
}

// Filtre uygula
const applyFilter = () => {
  showFilter.value = false
  // Filtreleme computed property üzerinden otomatik yapılıyor
}

// Filtreyi sıfırla
const resetFilter = () => {
  filter.department = ''
  filter.category = ''
  filter.importance = ''
}

// İçgörü analizi yap
const analyzeInsight = (insight) => {
  showMlPanel.value = true
}

// 3D Modeli görüntüle
const viewModel = (modelId) => {
  selectedModelId.value = modelId
}

// Dokümanı görüntüle
const viewDocument = (document) => {
  const url = document.url || document.path
  if (url) {
    window.open(url, '_blank')
  } else {
    alert('Doküman bulunamadı')
  }
}

// ML tahmin çalıştır
const runPrediction = async (analysisType, options) => {
  try {
    const result = await aiService.runPrediction(analysisType, options)
    mlResult.value = result
    showMlPanel.value = false
  } catch (error) {
    console.error('Tahmin çalıştırılırken hata:', error)
    alert('Tahmin çalıştırılırken bir hata oluştu')
  }
}

// ML sonuçlarını kapat
const closeMlResult = () => {
  mlResult.value = null
}

// Component oluşturulduğunda
onMounted(() => {
  loadInsights()
})
</script>

<style scoped>
.ai-insights-dashboard {
  padding: 20px;
}

.ai-insights-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.ai-insights-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-insights-filter {
  background-color: var(--bg-light, #f8f9fa);
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 8px;
  padding: 15px;
}

.ai-insights-loading,
.ai-insights-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: var(--text-muted, #6c757d);
}

.ai-insights-empty i {
  font-size: 32px;
  margin-bottom: 12px;
}

.ai-insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.ai-insight-card {
  background-color: var(--bg-color, #ffffff);
  border-radius: 8px;
  border: 1px solid var(--border-color, #dee2e6);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.ai-insight-card-header {
  padding: 15px;
  border-bottom: 1px solid var(--border-color, #dee2e6);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-insight-card-title {
  display: flex;
  align-items: center;
}

.ai-insight-card-title i {
  font-size: 18px;
  color: var(--primary-color, #0d6efd);
}

.ai-insight-card-content {
  padding: 15px;
  flex: 1;
}

.ai-insight-card-footer {
  padding: 10px 15px;
  border-top: 1px solid var(--border-color, #dee2e6);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--bg-light, #f8f9fa);
}

.ai-insight-card-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 12px;
  color: var(--text-muted, #6c757d);
}

.ai-insight-card-department {
  font-weight: 500;
}

/* ML sonuç modalı */
.ml-result-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 20px;
}

.ml-result-content {
  background-color: var(--bg-color, #ffffff);
  border-radius: 8px;
  width: 100%;
  max-width: 800px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.ml-result-header {
  padding: 15px;
  border-bottom: 1px solid var(--border-color, #dee2e6);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ml-result-body {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

/* Koyu tema desteği */
@media (prefers-color-scheme: dark) {
  .ai-insights-dashboard {
    color: #f8f9fa;
  }
  
  .ai-insights-filter,
  .ai-insight-card {
    background-color: var(--dark-bg, #212529);
    border-color: var(--dark-border-color, #495057);
  }
  
  .ai-insight-card-header,
  .ai-insight-card-footer {
    border-color: var(--dark-border-color, #495057);
  }
  
  .ai-insight-card-footer {
    background-color: var(--dark-bg-light, #2c3034);
  }
  
  .ai-insights-loading,
  .ai-insights-empty,
  .ai-insight-card-meta {
    color: #adb5bd;
  }
  
  .ml-result-content {
    background-color: var(--dark-bg, #212529);
    color: #f8f9fa;
  }
  
  .ml-result-header {
    border-color: var(--dark-border-color, #495057);
  }
}

/* Responsive */
@media (max-width: 576px) {
  .ai-insights-dashboard {
    padding: 10px;
  }
  
  .ai-insights-grid {
    grid-template-columns: 1fr;
  }
}
</style>