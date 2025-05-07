<template>
  <div class="ml-panel">
    <div class="ml-panel-header">
      <div class="d-flex justify-content-between align-items-center">
        <h5 class="m-0">
          <i class="bi bi-cpu me-2"></i>
          Makine Öğrenmesi Analizi
        </h5>
        <button class="btn-close" @click="$emit('close')"></button>
      </div>
    </div>
    
    <div class="ml-panel-body">
      <div class="mb-4">
        <h6>Analiz Türünü Seçin</h6>
        <div class="d-flex flex-wrap gap-2">
          <div 
            v-for="analysisType in analysisTypes" 
            :key="analysisType.id"
            class="analysis-card"
            :class="{ active: selectedAnalysisType === analysisType.id }"
            @click="selectAnalysisType(analysisType.id)"
          >
            <div class="analysis-card-icon">
              <i :class="analysisType.icon"></i>
            </div>
            <div class="analysis-card-title">{{ analysisType.name }}</div>
          </div>
        </div>
      </div>
      
      <div v-if="selectedAnalysisType" class="mb-4">
        <h6>Parametreler</h6>
        
        <!-- Üretim Tahmini Parametreleri -->
        <div v-if="selectedAnalysisType === 'production'" class="parameter-form">
          <div class="mb-3">
            <label for="productionTimeframe" class="form-label">Tahmin Dönemi</label>
            <select id="productionTimeframe" class="form-select" v-model="parameters.production.timeframe">
              <option value="day">Günlük</option>
              <option value="week">Haftalık</option>
              <option value="month">Aylık</option>
              <option value="quarter">Üç Aylık</option>
            </select>
          </div>
          
          <div class="mb-3">
            <label for="productionWindowSize" class="form-label">Pencere Genişliği</label>
            <input type="number" class="form-control" id="productionWindowSize" v-model="parameters.production.windowSize">
            <div class="form-text">Tahminde kullanılacak geçmiş veri miktarı.</div>
          </div>
          
          <div class="mb-3 form-check">
            <input type="checkbox" class="form-check-input" id="productionUseSeasonality" v-model="parameters.production.useSeasonality">
            <label class="form-check-label" for="productionUseSeasonality">Mevsimselliği Dikkate Al</label>
          </div>
        </div>
        
        <!-- Envanter Tahmini Parametreleri -->
        <div v-if="selectedAnalysisType === 'inventory'" class="parameter-form">
          <div class="mb-3">
            <label for="inventoryPredictionType" class="form-label">Tahmin Türü</label>
            <select id="inventoryPredictionType" class="form-select" v-model="parameters.inventory.predictionType">
              <option value="demand">Talep Tahmini</option>
              <option value="shortage">Stok Eksikliği Riski</option>
              <option value="optimization">Stok Optimizasyonu</option>
            </select>
          </div>
          
          <div class="mb-3">
            <label for="inventoryTimeframe" class="form-label">Tahmin Dönemi</label>
            <select id="inventoryTimeframe" class="form-select" v-model="parameters.inventory.timeframe">
              <option value="week">Haftalık</option>
              <option value="month">Aylık</option>
              <option value="quarter">Üç Aylık</option>
            </select>
          </div>
          
          <div class="mb-3 form-check">
            <input type="checkbox" class="form-check-input" id="inventoryIncludeAllMaterials" v-model="parameters.inventory.includeAllMaterials">
            <label class="form-check-label" for="inventoryIncludeAllMaterials">Tüm Malzemeleri Dahil Et</label>
          </div>
        </div>
        
        <!-- Hata Tahmini Parametreleri -->
        <div v-if="selectedAnalysisType === 'defects'" class="parameter-form">
          <div class="mb-3">
            <label for="defectMaterialCode" class="form-label">Malzeme Kodu</label>
            <select id="defectMaterialCode" class="form-select" v-model="parameters.defects.materialCode">
              <option v-for="material in materials" :key="material.code" :value="material.code">
                {{ material.name }} ({{ material.code }})
              </option>
            </select>
          </div>
          
          <div class="mb-3">
            <label for="defectAnalysisType" class="form-label">Analiz Türü</label>
            <select id="defectAnalysisType" class="form-select" v-model="parameters.defects.analysisType">
              <option value="prediction">Hata Oranı Tahmini</option>
              <option value="causes">Hata Nedenleri Analizi</option>
              <option value="prevention">Önleme Stratejisi</option>
            </select>
          </div>
          
          <div class="mb-3">
            <label for="defectDataPoints" class="form-label">Veri Noktaları</label>
            <input type="number" class="form-control" id="defectDataPoints" v-model="parameters.defects.dataPoints">
            <div class="form-text">Analizde kullanılacak örneklem boyutu.</div>
          </div>
        </div>
      </div>
      
      <div class="d-flex justify-content-between mt-4">
        <button class="btn btn-outline-secondary" @click="$emit('close')">
          <i class="bi bi-x-lg me-1"></i>
          Kapat
        </button>
        
        <button 
          class="btn btn-primary"
          :disabled="!selectedAnalysisType || isRunning"
          @click="runAnalysis"
        >
          <i class="bi" :class="isRunning ? 'bi-hourglass-split' : 'bi-play-fill'"></i>
          {{ isRunning ? 'Çalıştırılıyor...' : 'Analizi Başlat' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useMaterialService } from '@/services/material-service'

const emit = defineEmits(['close', 'run-prediction'])

// State
const selectedAnalysisType = ref('')
const isRunning = ref(false)
const materials = ref([])
const parameters = reactive({
  production: {
    timeframe: 'month',
    windowSize: 12,
    useSeasonality: true
  },
  inventory: {
    predictionType: 'demand',
    timeframe: 'month',
    includeAllMaterials: true
  },
  defects: {
    materialCode: '',
    analysisType: 'prediction',
    dataPoints: 100
  }
})

// Analiz türleri
const analysisTypes = [
  {
    id: 'production',
    name: 'Üretim Tahmini',
    icon: 'bi bi-graph-up-arrow',
    description: 'Gelecek dönemdeki üretim miktarlarını tahmin eder'
  },
  {
    id: 'inventory',
    name: 'Envanter Analizi',
    icon: 'bi bi-box-seam',
    description: 'Stok ihtiyaçlarını ve optimizasyon fırsatlarını belirler'
  },
  {
    id: 'defects',
    name: 'Hata Analizi',
    icon: 'bi bi-exclamation-triangle',
    description: 'Üretim hatalarını tahmin eder ve önleme stratejileri önerir'
  }
]

// Analiz türü seç
const selectAnalysisType = (typeId) => {
  selectedAnalysisType.value = typeId
}

// Malzeme servisini yükle
const materialService = useMaterialService()

// Analizi çalıştır
const runAnalysis = () => {
  isRunning.value = true
  
  // Seçili analiz türüne göre parametreleri hazırla
  let predictionOptions = {}
  
  switch (selectedAnalysisType.value) {
    case 'production':
      predictionOptions = {
        timeframe: parameters.production.timeframe,
        windowSize: parameters.production.windowSize,
        useSeasonality: parameters.production.useSeasonality
      }
      break
      
    case 'inventory':
      predictionOptions = {
        predictionType: parameters.inventory.predictionType,
        timeframe: parameters.inventory.timeframe,
        includeAllMaterials: parameters.inventory.includeAllMaterials
      }
      break
      
    case 'defects':
      predictionOptions = {
        materialCode: parameters.defects.materialCode,
        analysisType: parameters.defects.analysisType,
        dataPoints: parameters.defects.dataPoints
      }
      break
  }
  
  // Emit event to parent component
  emit('run-prediction', selectedAnalysisType.value, predictionOptions)
  
  // Durumu sıfırla
  setTimeout(() => {
    isRunning.value = false
  }, 1500)
}

// Component oluşturulduğunda malzemeleri yükle
onMounted(async () => {
  try {
    const materialList = await materialService.getMaterials()
    materials.value = materialList
    
    // İlk malzeme kodunu varsayılan olarak ayarla
    if (materialList.length > 0) {
      parameters.defects.materialCode = materialList[0].code
    }
  } catch (error) {
    console.error('Malzeme listesi yüklenirken hata:', error)
  }
})
</script>

<style scoped>
.ml-panel {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 380px;
  background-color: var(--bg-color, #ffffff);
  border-radius: 12px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
  z-index: 1001;
  overflow: hidden;
}

.ml-panel-header {
  padding: 15px;
  background-color: var(--primary-color, #0d6efd);
  color: white;
}

.ml-panel-body {
  padding: 15px;
  max-height: 500px;
  overflow-y: auto;
}

.analysis-card {
  width: 105px;
  height: 90px;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 8px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.analysis-card:hover {
  background-color: rgba(13, 110, 253, 0.05);
  border-color: var(--primary-color, #0d6efd);
}

.analysis-card.active {
  background-color: rgba(13, 110, 253, 0.1);
  border-color: var(--primary-color, #0d6efd);
  font-weight: 500;
}

.analysis-card-icon {
  font-size: 24px;
  margin-bottom: 8px;
  color: var(--primary-color, #0d6efd);
}

.analysis-card-title {
  font-size: 12px;
  text-align: center;
}

/* Koyu tema desteği */
@media (prefers-color-scheme: dark) {
  .ml-panel {
    --bg-color: #212529;
    --border-color: #495057;
  }
  
  .analysis-card {
    background-color: #2c3034;
    border-color: #495057;
    color: #f8f9fa;
  }
  
  .analysis-card:hover {
    background-color: rgba(13, 110, 253, 0.15);
  }
  
  .analysis-card.active {
    background-color: rgba(13, 110, 253, 0.2);
  }
}

/* Responsive */
@media (max-width: 576px) {
  .ml-panel {
    width: 300px;
    bottom: 70px;
    right: 10px;
  }
  
  .analysis-card {
    width: 85px;
    height: 80px;
  }
}
</style>