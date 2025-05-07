<template>
  <div class="chart-container" :class="sizeClass">
    <div v-if="title || subtitle" class="chart-header">
      <h4 v-if="title" class="chart-title">{{ title }}</h4>
      <p v-if="subtitle" class="chart-subtitle">{{ subtitle }}</p>
    </div>
    
    <div class="chart-wrapper">
      <canvas :id="chartId" ref="chartCanvas"></canvas>
      <div v-if="loading" class="chart-overlay">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Yükleniyor...</span>
        </div>
      </div>
    </div>
    
    <div v-if="showLegend && chartInstance" class="chart-footer">
      <ul class="chart-legend">
        <li v-for="(dataset, index) in chartInstance.data.datasets" :key="index" @click="toggleDatasetVisibility(index)">
          <span 
            class="legend-color" 
            :style="{ backgroundColor: dataset.borderColor || dataset.backgroundColor }"
          ></span>
          <span class="legend-label" :class="{ 'muted': !datasetVisibility[index] }">{{ dataset.label }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watchEffect, watch, computed, defineProps, defineEmits } from 'vue';
import Chart from 'chart.js/auto';

// Benzersiz ID oluşturma için yardımcı fonksiyon
const uniqueId = () => `chart-${Math.random().toString(36).substr(2, 9)}`;

// Props tanımı
const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (value) => ['bar', 'line', 'pie', 'doughnut', 'radar', 'polarArea'].includes(value)
  },
  data: {
    type: Object,
    required: true
  },
  options: {
    type: Object,
    default: () => ({})
  },
  height: {
    type: [String, Number],
    default: null
  },
  width: {
    type: [String, Number],
    default: null
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['sm', 'default', 'lg'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  showLegend: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['chart-click', 'chart-hover', 'ready']);

// Reactivity
const chartId = ref(uniqueId());
const chartCanvas = ref(null);
const chartInstance = ref(null);
const datasetVisibility = ref([]);

// Size sınıfı hesaplaması
const sizeClass = computed(() => {
  return props.size !== 'default' ? `chart-${props.size}` : '';
});

// Grafik oluşturma fonksiyonu
const createChart = () => {
  if (!chartCanvas.value) return;
  
  // Önceki grafik varsa yok et
  if (chartInstance.value) {
    chartInstance.value.destroy();
  }

  // Yeni grafik oluştur
  const ctx = chartCanvas.value.getContext('2d');
  const options = { ...defaultOptions(), ...props.options };
  
  chartInstance.value = new Chart(ctx, {
    type: props.type,
    data: props.data,
    options: options
  });

  // Başlangıç görünürlük durumunu ayarla
  datasetVisibility.value = props.data.datasets.map(() => true);

  // Chart.js oluşturuldu
  emit('ready', chartInstance.value);
};

// Dataset görünürlüğü değiştirme
const toggleDatasetVisibility = (datasetIndex) => {
  // Mevcut veri setinin görünürlük durumunu tersine çevir
  const isVisible = !datasetVisibility.value[datasetIndex];
  datasetVisibility.value[datasetIndex] = isVisible;

  // Chart.js'ye veri setinin görünürlüğünü güncelle
  chartInstance.value.setDatasetVisibility(datasetIndex, isVisible);
  chartInstance.value.update();
};

// Varsayılan seçenekler
const defaultOptions = () => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000
    },
    plugins: {
      legend: {
        display: false // Kendi legend komponentimizi kullanacağız
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        bodyFont: {
          family: 'Roboto, sans-serif',
          size: 13
        },
        titleFont: {
          family: 'Roboto, sans-serif',
          size: 14,
          weight: 'bold'
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    }
  };
};

// Chart.js'deki tıklama olaylarını dinle
const setupEventListeners = () => {
  if (!chartInstance.value) return;

  const canvas = chartCanvas.value;

  // Tıklama olayı
  canvas.onclick = (evt) => {
    const points = chartInstance.value.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false);
    if (points.length) {
      const point = points[0];
      emit('chart-click', {
        dataset: chartInstance.value.data.datasets[point.datasetIndex],
        dataIndex: point.index,
        value: chartInstance.value.data.datasets[point.datasetIndex].data[point.index]
      });
    }
  };

  // Hover olayı
  canvas.onmousemove = (evt) => {
    const points = chartInstance.value.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false);
    if (points.length) {
      const point = points[0];
      emit('chart-hover', {
        dataset: chartInstance.value.data.datasets[point.datasetIndex],
        dataIndex: point.index,
        value: chartInstance.value.data.datasets[point.datasetIndex].data[point.index]
      });
    }
  };
};

// Grafiği güncelle
const updateChart = () => {
  if (!chartInstance.value) return;
  
  // Veri ve seçenekleri güncelle
  chartInstance.value.data = props.data;
  chartInstance.value.options = { ...defaultOptions(), ...props.options };
  
  // Görünürlük durumlarını yeniden ayarla
  if (datasetVisibility.value.length !== props.data.datasets.length) {
    datasetVisibility.value = props.data.datasets.map(() => true);
  }
  
  // Grafiği yeniden çiz
  chartInstance.value.update();
};

// Grafik boyutunu ayarla
watchEffect(() => {
  if (chartCanvas.value) {
    if (props.height) {
      chartCanvas.value.style.height = typeof props.height === 'number' 
        ? `${props.height}px` 
        : props.height;
    }
    
    if (props.width) {
      chartCanvas.value.style.width = typeof props.width === 'number' 
        ? `${props.width}px` 
        : props.width;
    }
  }
});

// Veriler değiştiğinde grafiği güncelle
watch(() => props.data, updateChart, { deep: true });
watch(() => props.options, updateChart, { deep: true });

// Grafik tipi değiştiğinde grafiği yeniden oluştur
watch(() => props.type, createChart);

// Komponent yüklendiğinde grafiği oluştur
onMounted(() => {
  createChart();
  setupEventListeners();
});

// Komponent yok edildiğinde grafiği temizle
onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy();
  }
});
</script>

<style lang="scss" scoped>
// Stil kuralları main.scss içindeki _charts.scss'te bulunmaktadır

.chart-wrapper {
  position: relative;
  width: 100%;
  min-height: 250px; /* Varsayılan minimum yükseklik */
  height: 100%;
}

/* Legend özel stili */
.legend-label.muted {
  opacity: 0.5;
  text-decoration: line-through;
}

.chart-header {
  margin-bottom: 1rem;
}
</style>