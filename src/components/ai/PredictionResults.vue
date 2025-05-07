<template>
  <div class="prediction-results">
    <div v-if="!prediction" class="prediction-placeholder">
      <div class="no-data">
        <i class="bi bi-graph-up"></i>
        <h5>Tahmin sonucu bulunamadı</h5>
        <p>Henüz bir analiz yapılmadı veya tahmin sonuçları oluşturulmadı.</p>
      </div>
    </div>
    
    <div v-else class="prediction-data">
      <div class="prediction-header">
        <div class="prediction-title">
          <i class="bi bi-graph-up me-2"></i>
          <h5>{{ prediction.modelType }}</h5>
        </div>
        <div class="prediction-meta">
          <span class="prediction-timestamp">{{ formatDate(prediction.timestamp) }}</span>
          <span v-if="prediction.confidence" class="prediction-confidence ms-2" 
                :class="getConfidenceClass(prediction.confidence)">
            Güven: {{ Math.round(prediction.confidence * 100) }}%
          </span>
          <span v-if="prediction.dataPoints" class="prediction-data-points ms-2">
            {{ prediction.dataPoints.toLocaleString() }} veri noktası
          </span>
        </div>
      </div>
      
      <div class="prediction-body">
        <div class="prediction-values">
          <div v-if="prediction.predictions && prediction.predictions.length" class="prediction-cards">
            <div v-for="(item, index) in prediction.predictions" :key="index"
                 class="prediction-card"
                 :class="{ 'highlighted': index === 0 }">
              <div class="prediction-card-content">
                <div class="prediction-value">{{ item.value || '-' }}</div>
                <div class="prediction-label">{{ item.label }}</div>
                <div v-if="item.probability !== undefined" class="prediction-probability-bar">
                  <div class="probability-bar-track">
                    <div class="probability-bar-fill" 
                         :style="{ width: `${Math.round(item.probability * 100)}%` }"
                         :class="getProbabilityClass(item.probability)"></div>
                  </div>
                  <div class="probability-bar-value">{{ Math.round(item.probability * 100) }}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="chartData" class="prediction-chart">
          <canvas ref="chartCanvas"></canvas>
        </div>
        
        <div v-if="prediction.metrics" class="prediction-metrics">
          <h6>Model Metrikleri</h6>
          <div class="metrics-grid">
            <div v-for="(value, key) in prediction.metrics" :key="key" class="metric-item">
              <div class="metric-name">{{ formatMetricName(key) }}</div>
              <div class="metric-value">{{ formatMetricValue(value) }}</div>
              <div v-if="typeof value === 'number' && value <= 1" class="metric-bar">
                <div class="metric-bar-fill" :style="{ width: `${value * 100}%` }"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="prediction.explanation" class="prediction-explanation">
          <h6>Tahmin Açıklaması</h6>
          <div class="explanation-text">
            {{ prediction.explanation }}
          </div>
        </div>
      </div>
      
      <div v-if="showActions" class="prediction-actions">
        <button class="btn btn-outline-secondary" @click="$emit('close')">
          <i class="bi bi-x"></i> Kapat
        </button>
        <button class="btn btn-primary" @click="exportPrediction">
          <i class="bi bi-download"></i> Dışa Aktar
        </button>
        <button v-if="showAnalytics" class="btn btn-info" @click="openAdvancedAnalytics">
          <i class="bi bi-bar-chart"></i> Detaylı Analiz
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import Chart from 'chart.js/auto';

// Props
const props = defineProps({
  prediction: {
    type: Object,
    required: false,
    default: null
  },
  showActions: {
    type: Boolean,
    default: true
  },
  showAnalytics: {
    type: Boolean,
    default: true
  }
});

// Emits
const emit = defineEmits(['close', 'export', 'view-analytics']);

// Refs
const chartCanvas = ref(null);
let chart = null;

// Computed
const chartData = computed(() => {
  if (!props.prediction || !props.prediction.predictions || !props.prediction.predictions.length) {
    return null;
  }
  
  // Sadece sayısal değer olarak yorumlanabilecek tahminleri kullan
  const numericalPredictions = props.prediction.predictions.filter(p => {
    // Değer varsa ve sayıya çevrilebiliyorsa
    if (p.value) {
      const cleanValue = p.value.toString().replace(/[^0-9.]/g, '');
      return !isNaN(parseFloat(cleanValue));
    }
    // Olasılık varsa
    return p.probability !== undefined;
  });
  
  if (!numericalPredictions.length) {
    return null;
  }
  
  // İlk 5 tahmini kullan (vardiysa)
  const predictions = numericalPredictions.slice(0, 5);
  
  return {
    labels: predictions.map(p => p.label),
    datasets: [
      {
        label: 'Değer',
        // Olasılık değeri ya da sayısal değer
        data: predictions.map(p => {
          if (p.probability !== undefined) {
            return p.probability * 100;
          }
          const cleanValue = p.value.toString().replace(/[^0-9.]/g, '');
          return parseFloat(cleanValue);
        }),
        backgroundColor: predictions.map((p, i) => {
          const colorPalette = [
            'rgba(75, 192, 192, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(153, 102, 255, 0.6)'
          ];
          return colorPalette[i % colorPalette.length];
        }),
        borderColor: predictions.map((p, i) => {
          const colorPalette = [
            'rgba(75, 192, 192, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(153, 102, 255, 1)'
          ];
          return colorPalette[i % colorPalette.length];
        }),
        borderWidth: 1
      }
    ]
  };
});

// Methods
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getConfidenceClass = (confidence) => {
  if (confidence >= 0.9) return 'high-confidence';
  if (confidence >= 0.7) return 'medium-confidence';
  return 'low-confidence';
};

const getProbabilityClass = (probability) => {
  if (probability >= 0.8) return 'high-probability';
  if (probability >= 0.6) return 'medium-probability';
  return 'low-probability';
};

const formatMetricName = (key) => {
  const metricNames = {
    accuracy: 'Doğruluk',
    precision: 'Kesinlik',
    recall: 'Hassasiyet',
    f1: 'F1 Skoru',
    r2: 'R² Skoru',
    rmse: 'RMSE',
    mae: 'MAE',
    mse: 'MSE'
  };
  
  return metricNames[key] || key.charAt(0).toUpperCase() + key.slice(1);
};

const formatMetricValue = (value) => {
  if (typeof value !== 'number') return value;
  
  // 0-1 arası değerleri yüzde olarak göster
  if (value <= 1) {
    return `${(value * 100).toFixed(1)}%`;
  }
  
  // Diğer sayısal değerler için
  return value.toFixed(2);
};

const initChart = () => {
  if (chart) {
    chart.destroy();
  }
  
  if (chartCanvas.value && chartData.value) {
    const ctx = chartCanvas.value.getContext('2d');
    
    chart = new Chart(ctx, {
      type: 'bar',
      data: chartData.value,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toFixed(1);
                }
                return label;
              }
            }
          }
        }
      }
    });
  }
};

const exportPrediction = () => {
  emit('export', props.prediction);
  
  // CSV formatına çevir
  const rows = [
    // Başlık satırı
    ['Tahmin Tipi', 'Oluşturulma Tarihi', 'Güven Skoru', 'Veri Noktaları'],
    [
      props.prediction.modelType,
      formatDate(props.prediction.timestamp),
      props.prediction.confidence ? `${(props.prediction.confidence * 100).toFixed(1)}%` : '',
      props.prediction.dataPoints || ''
    ],
    [], // Boş satır
    ['Tahmin', 'Değer', 'Olasılık']
  ];
  
  // Tahmin detayları
  if (props.prediction.predictions) {
    props.prediction.predictions.forEach(p => {
      rows.push([
        p.label || '',
        p.value || '',
        p.probability !== undefined ? `${(p.probability * 100).toFixed(1)}%` : ''
      ]);
    });
  }
  
  // Metrikler
  if (props.prediction.metrics) {
    rows.push([]);
    rows.push(['Metrik', 'Değer']);
    
    Object.entries(props.prediction.metrics).forEach(([key, value]) => {
      rows.push([formatMetricName(key), formatMetricValue(value)]);
    });
  }
  
  // CSV'ye dönüştür
  let csvContent = rows.map(e => e.join(',')).join('\n');
  
  // Dosya olarak indir
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `tahmin_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const openAdvancedAnalytics = () => {
  emit('view-analytics', props.prediction);
};

// Watchers
watch(() => props.prediction, () => {
  // Tahmin değiştiğinde grafiği güncelle
  nextTick(() => {
    initChart();
  });
}, { deep: true });

// Lifecycle hooks
onMounted(() => {
  nextTick(() => {
    initChart();
  });
});
</script>

<style scoped>
.prediction-results {
  background-color: var(--bg-color, #ffffff);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.prediction-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
}

.no-data {
  text-align: center;
  color: var(--gray, #6c757d);
}

.no-data i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.prediction-data {
  display: flex;
  flex-direction: column;
}

.prediction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: var(--primary-color, #0d6efd);
  color: white;
}

.prediction-title {
  display: flex;
  align-items: center;
}

.prediction-title h5 {
  margin: 0;
}

.prediction-meta {
  font-size: 0.85rem;
  display: flex;
  align-items: center;
}

.prediction-confidence {
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-weight: 500;
}

.high-confidence {
  background-color: rgba(40, 167, 69, 0.9);
}

.medium-confidence {
  background-color: rgba(255, 193, 7, 0.9);
}

.low-confidence {
  background-color: rgba(220, 53, 69, 0.9);
}

.prediction-data-points {
  color: rgba(255, 255, 255, 0.8);
}

.prediction-body {
  padding: 1.5rem;
}

.prediction-values {
  margin-bottom: 1.5rem;
}

.prediction-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.prediction-card {
  background-color: var(--card-bg, #f8f9fa);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s, box-shadow 0.2s;
}

.prediction-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

.prediction-card.highlighted {
  background-color: var(--primary-light, #e6f2ff);
  border-left: 4px solid var(--primary-color, #0d6efd);
}

.prediction-value {
  font-size: 1.6rem;
  font-weight: 600;
  margin-bottom: 0.2rem;
  color: var(--primary-color, #0d6efd);
}

.prediction-label {
  font-size: 0.85rem;
  color: var(--gray, #6c757d);
  margin-bottom: 0.8rem;
}

.prediction-probability-bar {
  display: flex;
  align-items: center;
}

.probability-bar-track {
  flex-grow: 1;
  height: 4px;
  background-color: var(--gray-light, #e9ecef);
  border-radius: 2px;
  overflow: hidden;
  margin-right: 0.5rem;
}

.probability-bar-fill {
  height: 100%;
  border-radius: 2px;
}

.high-probability {
  background-color: var(--success, #28a745);
}

.medium-probability {
  background-color: var(--primary, #0d6efd);
}

.low-probability {
  background-color: var(--warning, #ffc107);
}

.probability-bar-value {
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 3rem;
  text-align: right;
}

.prediction-chart {
  height: 250px;
  margin: 1.5rem 0;
}

.prediction-metrics {
  background-color: var(--card-bg, #f8f9fa);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.prediction-metrics h6 {
  margin-bottom: 1rem;
  color: var(--gray-dark, #343a40);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.metric-item {
  display: flex;
  flex-direction: column;
}

.metric-name {
  font-size: 0.75rem;
  color: var(--gray, #6c757d);
  margin-bottom: 0.2rem;
}

.metric-value {
  font-weight: 600;
  margin-bottom: 0.4rem;
}

.metric-bar {
  height: 4px;
  background-color: var(--gray-light, #e9ecef);
  border-radius: 2px;
  overflow: hidden;
}

.metric-bar-fill {
  height: 100%;
  background-color: var(--primary-color, #0d6efd);
  border-radius: 2px;
}

.prediction-explanation {
  background-color: var(--card-bg, #f8f9fa);
  border-radius: 8px;
  padding: 1rem;
}

.prediction-explanation h6 {
  margin-bottom: 0.8rem;
  color: var(--gray-dark, #343a40);
}

.explanation-text {
  font-size: 0.9rem;
  line-height: 1.6;
}

.prediction-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background-color: var(--bg-color-light, #f8f9fa);
  border-top: 1px solid var(--border-color, #dee2e6);
}

@media (max-width: 768px) {
  .prediction-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .prediction-meta {
    margin-top: 0.5rem;
  }
  
  .prediction-cards {
    grid-template-columns: 1fr;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* Koyu tema desteği */
@media (prefers-color-scheme: dark) {
  .prediction-results {
    --bg-color: #212529;
    --bg-color-light: #2c3034;
    --card-bg: #343a40;
    --border-color: #495057;
    --gray-light: #495057;
  }
  
  .prediction-card {
    background-color: #343a40;
  }
  
  .prediction-card.highlighted {
    background-color: #3a4d63;
  }
  
  .prediction-value {
    color: #8bb9fe;
  }
  
  .prediction-metrics,
  .prediction-explanation {
    background-color: #343a40;
  }
  
  .explanation-text {
    color: #e9ecef;
  }
}
</style>