<template>
  <transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="prediction-modal">
        <div class="prediction-header">
          <h5>{{ predictionType }} Tahmin Sonuçları</h5>
          <div class="prediction-actions">
            <button @click="toggleChartView" class="btn btn-sm btn-outline-secondary mx-2" :title="isChartView ? 'Tablo Görünümü' : 'Grafik Görünümü'">
              <i class="bi" :class="isChartView ? 'bi-table' : 'bi-bar-chart'"></i>
            </button>
            <button @click="exportResults" class="btn btn-sm btn-outline-secondary" title="Dışa Aktar">
              <i class="bi bi-download"></i>
            </button>
            <button @click="handleClose" class="btn btn-sm btn-outline-danger" title="Kapat">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <div class="prediction-content">
          <div class="prediction-summary">
            <div class="prediction-confidence">
              <div class="confidence-value">{{ formatConfidence(confidence) }}</div>
              <div class="confidence-label">Güven Oranı</div>
            </div>
            
            <div class="prediction-stats">
              <div class="stat-item" v-if="getPredictionCount('high')">
                <div class="stat-value text-danger">{{ getPredictionCount('high') }}</div>
                <div class="stat-label">
                  <i class="bi bi-exclamation-triangle-fill me-1"></i>
                  Yüksek Öncelik
                </div>
              </div>
              <div class="stat-item" v-if="getPredictionCount('medium')">
                <div class="stat-value text-warning">{{ getPredictionCount('medium') }}</div>
                <div class="stat-label">
                  <i class="bi bi-exclamation-circle-fill me-1"></i>
                  Orta Öncelik
                </div>
              </div>
              <div class="stat-item" v-if="getPredictionCount('low')">
                <div class="stat-value text-primary">{{ getPredictionCount('low') }}</div>
                <div class="stat-label">
                  <i class="bi bi-info-circle-fill me-1"></i>
                  Düşük Öncelik
                </div>
              </div>
            </div>
          </div>

          <!-- Tablo Görünümü -->
          <div class="prediction-table-view" v-if="!isChartView">
            <div class="prediction-filters mb-3">
              <div class="row g-2">
                <div class="col-md-4">
                  <div class="input-group input-group-sm">
                    <span class="input-group-text">Ara</span>
                    <input type="text" class="form-control" v-model="searchQuery" placeholder="Tahmin ara...">
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="input-group input-group-sm">
                    <span class="input-group-text">Önem</span>
                    <select class="form-select" v-model="priorityFilter">
                      <option value="">Tümü</option>
                      <option value="high">Yüksek</option>
                      <option value="medium">Orta</option>
                      <option value="low">Düşük</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="input-group input-group-sm">
                    <span class="input-group-text">Sırala</span>
                    <select class="form-select" v-model="sortOption">
                      <option value="priority">Önceliğe Göre</option>
                      <option value="value">Değere Göre</option>
                      <option value="trend">Eğilime Göre</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div class="prediction-table-container">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Tahmin</th>
                    <th>Değer</th>
                    <th>Eğilim</th>
                    <th>Öncelik</th>
                    <th>Detay</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(pred, index) in filteredPredictions" :key="index">
                    <td class="prediction-title">{{ pred.title || pred.name }}</td>
                    <td class="prediction-value">{{ pred.value }}</td>
                    <td class="prediction-trend" :class="getTrendClass(pred.trend)">
                      <i class="bi me-1" :class="getTrendIcon(pred.trend)"></i>
                      {{ pred.trendValue || '' }}
                    </td>
                    <td class="prediction-priority">
                      <span class="priority-badge" :class="'priority-' + (pred.priority || 'medium')">
                        {{ getPriorityText(pred.priority) }}
                      </span>
                    </td>
                    <td class="prediction-detail">
                      <button class="btn btn-sm btn-link" @click="showDetails(pred)">
                        <i class="bi bi-info-circle"></i>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="filteredPredictions.length === 0">
                    <td colspan="5" class="text-center py-3">
                      <div class="alert alert-info m-0">Filtrelere uygun tahmin bulunamadı.</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Grafik Görünümü -->
          <div class="prediction-chart-view" v-else>
            <div class="chart-type-selector mb-3">
              <div class="btn-group btn-group-sm">
                <button 
                  v-for="(type, index) in chartTypes" 
                  :key="index"
                  class="btn" 
                  :class="selectedChartType === type.value ? 'btn-primary' : 'btn-outline-primary'"
                  @click="selectedChartType = type.value"
                >
                  <i class="bi me-1" :class="type.icon"></i>
                  {{ type.label }}
                </button>
              </div>
            </div>
            <div class="chart-container">
              <div v-if="isLoading" class="chart-loading">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Yükleniyor...</span>
                </div>
                <div class="mt-2">Grafik yükleniyor...</div>
              </div>
              <canvas ref="chartCanvas" :style="{ display: isLoading ? 'none' : 'block' }"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Detay Modali -->
      <div v-if="selectedPrediction" class="prediction-detail-overlay" @click.self="selectedPrediction = null">
        <div class="prediction-detail-modal">
          <div class="prediction-detail-header">
            <h6>{{ selectedPrediction.title || selectedPrediction.name }}</h6>
            <button class="btn-close btn-sm" @click="selectedPrediction = null"></button>
          </div>
          <div class="prediction-detail-content">
            <div class="row">
              <div class="col-md-6">
                <div class="prediction-detail-item">
                  <div class="detail-label">Değer:</div>
                  <div class="detail-value">{{ selectedPrediction.value }}</div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="prediction-detail-item">
                  <div class="detail-label">Öncelik:</div>
                  <div class="detail-value">
                    <span class="priority-badge" :class="'priority-' + (selectedPrediction.priority || 'medium')">
                      {{ getPriorityText(selectedPrediction.priority) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="selectedPrediction.description" class="mt-3">
              <div class="detail-label">Açıklama:</div>
              <div class="detail-description">{{ selectedPrediction.description }}</div>
            </div>
            
            <div v-if="selectedPrediction.details" class="mt-3">
              <div class="detail-label">Detaylar:</div>
              <div class="prediction-detail-properties">
                <div 
                  v-for="(value, key) in selectedPrediction.details" 
                  :key="key"
                  class="prediction-property"
                >
                  <div class="property-name">{{ formatPropertyName(key) }}:</div>
                  <div class="property-value">{{ value }}</div>
                </div>
              </div>
            </div>
            
            <div v-if="selectedPrediction.recommendations && selectedPrediction.recommendations.length > 0" class="mt-3">
              <div class="detail-label">Öneriler:</div>
              <ul class="recommendation-list">
                <li v-for="(rec, idx) in selectedPrediction.recommendations" :key="idx">
                  {{ rec }}
                </li>
              </ul>
            </div>
            
            <div v-if="selectedPrediction.trend" class="mt-4 pt-2 border-top">
              <div class="detail-label">Eğilim Analizi:</div>
              <div class="trend-analysis">
                <div class="trend-direction" :class="getTrendClass(selectedPrediction.trend)">
                  <i class="bi me-1" :class="getTrendIcon(selectedPrediction.trend)"></i>
                  {{ getTrendText(selectedPrediction.trend) }}
                  <span v-if="selectedPrediction.trendValue" class="ms-2">
                    {{ selectedPrediction.trendValue }}
                  </span>
                </div>
                <div class="trend-description mt-2">
                  {{ selectedPrediction.trendDescription || 'Eğilim detayları bulunmuyor.' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import Chart from 'chart.js/auto';

// Props
const props = defineProps({
  predictions: {
    type: Array,
    required: true
  },
  predictionType: {
    type: String,
    default: 'Genel'
  },
  confidence: {
    type: Number,
    default: 0.8
  },
  show: {
    type: Boolean,
    default: false
  }
});

// Emit
const emit = defineEmits(['close']);

// State
const searchQuery = ref('');
const priorityFilter = ref('');
const sortOption = ref('priority');
const isChartView = ref(false);
const selectedChartType = ref('bar');
const isLoading = ref(false);
const selectedPrediction = ref(null);
const chartCanvas = ref(null);
let chart = null;

// Chart types
const chartTypes = [
  { label: 'Bar', value: 'bar', icon: 'bi-bar-chart' },
  { label: 'Çizgi', value: 'line', icon: 'bi-graph-up' },
  { label: 'Pasta', value: 'pie', icon: 'bi-pie-chart' },
  { label: 'Kutu', value: 'polarArea', icon: 'bi-box' }
];

// Fonksiyonlar
const handleClose = () => {
  emit('close');
};

const showDetails = (prediction) => {
  selectedPrediction.value = prediction;
};

// Belirli önem seviyesindeki tahmin sayısı
const getPredictionCount = (priority) => {
  return props.predictions.filter(p => (p.priority || 'medium') === priority).length;
};

// Filtrelenmiş ve sıralanmış tahminler
const filteredPredictions = computed(() => {
  let result = [...props.predictions];
  
  // Arama filtresi
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(p => 
      (p.title || p.name || '').toLowerCase().includes(query) ||
      String(p.value).toLowerCase().includes(query)
    );
  }
  
  // Öncelik filtresi
  if (priorityFilter.value) {
    result = result.filter(p => (p.priority || 'medium') === priorityFilter.value);
  }
  
  // Sıralama
  result.sort((a, b) => {
    if (sortOption.value === 'priority') {
      const priorityRank = { high: 3, medium: 2, low: 1 };
      return priorityRank[b.priority || 'medium'] - priorityRank[a.priority || 'medium'];
    } else if (sortOption.value === 'value') {
      return parseFloat(String(b.value).replace(/[^0-9.-]+/g, '') || 0) - 
             parseFloat(String(a.value).replace(/[^0-9.-]+/g, '') || 0);
    } else if (sortOption.value === 'trend') {
      return (b.trend || 0) - (a.trend || 0);
    }
    return 0;
  });
  
  return result;
});

// Eğilim simgesi
const getTrendIcon = (trend) => {
  if (!trend) return 'bi-dash';
  return trend > 0 ? 'bi-arrow-up-right' : 'bi-arrow-down-right';
};

// Eğilim sınıfı
const getTrendClass = (trend) => {
  if (!trend) return 'trend-neutral';
  return trend > 0 ? 'trend-up' : 'trend-down';
};

// Eğilim metni
const getTrendText = (trend) => {
  if (!trend) return 'Değişim Yok';
  return trend > 0 ? 'Artış Eğilimi' : 'Azalma Eğilimi';
};

// Öncelik metni
const getPriorityText = (priority) => {
  switch (priority) {
    case 'high': return 'Yüksek';
    case 'medium': return 'Orta';
    case 'low': return 'Düşük';
    default: return 'Orta';
  }
};

// Detay özellik adını formatla
const formatPropertyName = (name) => {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
};

// Güven oranını formatla
const formatConfidence = (confidence) => {
  const value = Number(confidence);
  if (isNaN(value)) return '?';
  return `%${(value * 100).toFixed(0)}`;
};

// Grafik veya tablo görünümü arasında geçiş
const toggleChartView = () => {
  isChartView.value = !isChartView.value;
  
  if (isChartView.value) {
    nextTick(() => {
      createChart();
    });
  } else {
    if (chart) {
      chart.destroy();
      chart = null;
    }
  }
};

// Grafik oluştur
const createChart = async () => {
  if (!chartCanvas.value) return;
  
  isLoading.value = true;
  
  try {
    if (chart) {
      chart.destroy();
    }
    
    // Data hazırlama
    const data = prepareChartData();
    
    // Grafik oluşturma
    chart = new Chart(chartCanvas.value, {
      type: selectedChartType.value,
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: `${props.predictionType} Tahmin Analizi`
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const item = props.predictions[context.dataIndex];
                let label = item.title || item.name || '';
                label += `: ${item.value}`;
                if (item.trendValue) {
                  label += ` (${item.trendValue})`;
                }
                return label;
              }
            }
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Grafik oluşturma hatası:', error);
  } finally {
    isLoading.value = false;
  }
};

// Grafik verisini hazırla
const prepareChartData = () => {
  const predictions = filteredPredictions.value.slice(0, 10); // En fazla 10 tahmin göster
  
  const labels = predictions.map(p => p.title || p.name || 'İsimsiz');
  const values = predictions.map(p => parseFloat(String(p.value).replace(/[^0-9.-]+/g, '') || 0));
  
  // Grafik tipine göre veri formatı
  if (selectedChartType.value === 'pie' || selectedChartType.value === 'polarArea') {
    const backgroundColors = predictions.map(p => {
      const priority = p.priority || 'medium';
      if (priority === 'high') return 'rgba(220, 53, 69, 0.7)';  // danger
      if (priority === 'medium') return 'rgba(255, 193, 7, 0.7)'; // warning
      return 'rgba(13, 110, 253, 0.7)'; // primary
    });
    
    return {
      labels: labels,
      datasets: [
        {
          label: props.predictionType,
          data: values,
          backgroundColor: backgroundColors
        }
      ]
    };
  } else {
    // Bar veya Line grafik için
    return {
      labels: labels,
      datasets: [
        {
          label: props.predictionType,
          data: values,
          backgroundColor: 'rgba(13, 110, 253, 0.5)',
          borderColor: 'rgba(13, 110, 253, 1)',
          borderWidth: 1
        }
      ]
    };
  }
};

// Sonuçları dışa aktar
const exportResults = () => {
  const filename = `${props.predictionType.toLowerCase()}-tahminler-${new Date().toISOString().slice(0,10)}.csv`;
  
  // CSV başlıkları
  const headers = ['Tahmin', 'Değer', 'Eğilim', 'Öncelik', 'Açıklama'];
  
  // Verileri hazırla
  const rows = props.predictions.map(p => [
    p.title || p.name || '',
    p.value || '',
    p.trendValue || '',
    getPriorityText(p.priority),
    p.description || ''
  ]);
  
  // CSV içeriği oluştur
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  // CSV dosyasını indir
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Grafik tipini izle
watch(selectedChartType, () => {
  if (isChartView.value) {
    nextTick(() => {
      createChart();
    });
  }
});

// Component yüklendi
onMounted(() => {
  if (isChartView.value) {
    nextTick(() => {
      createChart();
    });
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.prediction-modal {
  width: 900px;
  max-width: 90vw;
  height: 80vh;
  background-color: var(--bg-color, #ffffff);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.prediction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: var(--primary-color, #0d6efd);
  color: white;
}

.prediction-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.prediction-summary {
  display: flex;
  margin-bottom: 20px;
  gap: 20px;
  padding: 15px;
  background-color: var(--light-color, #f8f9fa);
  border-radius: 8px;
}

.prediction-confidence {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 15px;
  border-radius: 6px;
  background-color: var(--primary-color, #0d6efd);
  color: white;
  width: 100px;
}

.confidence-value {
  font-size: 1.5rem;
  font-weight: 600;
}

.confidence-label {
  font-size: 0.8rem;
  opacity: 0.8;
}

.prediction-stats {
  display: flex;
  flex: 1;
  gap: 15px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border-radius: 6px;
  flex: 1;
  border: 1px solid var(--border-color, #dee2e6);
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 600;
}

.stat-label {
  font-size: 0.8rem;
  display: flex;
  align-items: center;
}

.prediction-table-container {
  overflow-y: auto;
  max-height: 500px;
}

.prediction-title {
  font-weight: 500;
}

.prediction-value {
  font-weight: 600;
}

.prediction-trend {
  white-space: nowrap;
}

.trend-up {
  color: var(--success-color, #198754);
}

.trend-down {
  color: var(--danger-color, #dc3545);
}

.trend-neutral {
  color: var(--secondary-color, #6c757d);
}

.priority-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.priority-high {
  background-color: #dc354530;
  color: var(--danger-color, #dc3545);
}

.priority-medium {
  background-color: #ffc10730;
  color: var(--warning-color, #ffc107);
}

.priority-low {
  background-color: #0d6efd30;
  color: var(--primary-color, #0d6efd);
}

.chart-container {
  height: 450px;
  position: relative;
}

.chart-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* Detay Modal */
.prediction-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1200;
}

.prediction-detail-modal {
  width: 600px;
  max-width: 90vw;
  max-height: 90vh;
  background-color: var(--bg-color, #ffffff);
  border-radius: 8px;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.prediction-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background-color: var(--primary-color, #0d6efd);
  color: white;
}

.prediction-detail-content {
  padding: 20px;
}

.prediction-detail-item {
  margin-bottom: 10px;
}

.detail-label {
  font-weight: 600;
  margin-bottom: 5px;
}

.detail-description {
  background-color: var(--light-color, #f8f9fa);
  padding: 10px;
  border-radius: 6px;
  line-height: 1.5;
}

.prediction-detail-properties {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prediction-property {
  display: flex;
  padding: 8px;
  background-color: var(--light-color, #f8f9fa);
  border-radius: 4px;
}

.property-name {
  flex: 1;
  font-weight: 500;
}

.property-value {
  flex: 2;
}

.recommendation-list {
  padding-left: 20px;
  margin-top: 10px;
  margin-bottom: 0;
}

.recommendation-list li {
  margin-bottom: 5px;
}

.trend-analysis {
  padding: 10px;
  background-color: var(--light-color, #f8f9fa);
  border-radius: 6px;
}

.trend-direction {
  font-weight: 600;
  display: flex;
  align-items: center;
}

.trend-description {
  font-size: 0.9rem;
  line-height: 1.5;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Koyu mod desteği */
@media (prefers-color-scheme: dark) {
  .prediction-modal {
    --bg-color: #212529;
    --border-color: #495057;
    --light-color: #343a40;
  }
  
  .prediction-summary {
    background-color: #343a40;
  }
  
  .stat-item {
    border-color: #495057;
  }
  
  .detail-description,
  .prediction-property,
  .trend-analysis {
    background-color: #343a40;
  }
  
  .prediction-detail-modal {
    --bg-color: #212529;
  }
  
  .table {
    --bs-table-bg: transparent;
    --bs-table-color: #f8f9fa;
  }
}
</style>