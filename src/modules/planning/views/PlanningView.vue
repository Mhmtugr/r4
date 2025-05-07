<template>
  <div class="planning-module">
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Üretim Takvimi</h5>
            <div class="btn-group" role="group">
              <button type="button" 
                      class="btn btn-sm btn-outline-primary"
                      :class="{ active: calendarView === 'dayGridDay' }"
                      @click="changeCalendarView('dayGridDay')">Günlük</button>
              <button type="button" 
                      class="btn btn-sm btn-outline-primary"
                      :class="{ active: calendarView === 'dayGridWeek' }"
                      @click="changeCalendarView('dayGridWeek')">Haftalık</button>
              <button type="button" 
                      class="btn btn-sm btn-outline-primary"
                      :class="{ active: calendarView === 'dayGridMonth' }"
                      @click="changeCalendarView('dayGridMonth')">Aylık</button>
            </div>
          </div>
          <div class="card-body">
            <div class="calendar-container" :class="{ 'loading': loading }">
              <div v-if="loading" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Yükleniyor...</span>
                </div>
                <p class="mt-2">Planlama verileri yükleniyor...</p>
              </div>
              <div v-else id="productionCalendar" ref="calendarEl">
                <!-- FullCalendar Bileşeni Buraya Gelecek -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <!-- Kapasite Yönetimi -->
      <div class="col-md-6 mb-4">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Kapasite Kullanımı</h5>
            <div class="dropdown">
              <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                      type="button" 
                      id="capacityDropdown" 
                      data-bs-toggle="dropdown" 
                      aria-expanded="false">
                {{ selectedUnit ? selectedUnit.name : 'Tüm Birimler' }}
              </button>
              <ul class="dropdown-menu" aria-labelledby="capacityDropdown">
                <li>
                  <a class="dropdown-item" href="#" @click.prevent="selectUnit(null)">
                    Tüm Birimler
                  </a>
                </li>
                <li v-for="unit in productionUnits" :key="unit.id">
                  <a class="dropdown-item" href="#" @click.prevent="selectUnit(unit)">
                    {{ unit.name }}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div class="card-body">
            <div class="chart-container">
              <canvas ref="capacityChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Teslimat Tahminleri -->
      <div class="col-md-6 mb-4">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Teslimat Tahminleri</h5>
            <div class="dropdown">
              <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                      type="button" 
                      id="deliveryDropdown" 
                      data-bs-toggle="dropdown" 
                      aria-expanded="false">
                {{ timePeriodLabel }}
              </button>
              <ul class="dropdown-menu" aria-labelledby="deliveryDropdown">
                <li v-for="(label, period) in timePeriods" :key="period">
                  <a class="dropdown-item" href="#" @click.prevent="selectTimePeriod(period)">
                    {{ label }}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div class="card-body">
            <div class="chart-container">
              <canvas ref="deliveryChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Üretim Görevleri -->
      <div class="col-12 mb-4">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Planlanan Görevler</h5>
            <div class="input-group" style="max-width: 300px;">
              <input type="text" class="form-control form-control-sm" placeholder="Görev ara..." v-model="searchQuery" @input="filterTasks">
              <button class="btn btn-sm btn-outline-secondary"><i class="bi bi-search"></i></button>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th @click="sortBy('taskName')">Görev Adı</th>
                    <th @click="sortBy('unit')">Üretim Birimi</th>
                    <th @click="sortBy('start')">Başlangıç</th>
                    <th @click="sortBy('end')">Bitiş</th>
                    <th @click="sortBy('progress')">İlerleme</th>
                    <th @click="sortBy('status')">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loading">
                    <td colspan="6" class="text-center py-3">Yükleniyor...</td>
                  </tr>
                  <tr v-else-if="filteredTasks.length === 0">
                    <td colspan="6" class="text-center py-3">Görev bulunamadı</td>
                  </tr>
                  <tr v-for="task in filteredTasks" :key="task.id" @click="viewTaskDetail(task)">
                    <td>{{ task.taskName }}</td>
                    <td>{{ task.unit }}</td>
                    <td>{{ formatDate(task.start) }}</td>
                    <td>{{ formatDate(task.end) }}</td>
                    <td>
                      <div class="progress" style="height: 8px;">
                        <div class="progress-bar" role="progressbar" 
                             :style="{width: `${task.progress}%`}" 
                             :class="getProgressClass(task.progress)"></div>
                      </div>
                      <small class="mt-1 d-block">{{ task.progress }}%</small>
                    </td>
                    <td>
                      <span class="badge" :class="getStatusClass(task.status)">{{ task.status }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Detail Modal -->
    <div class="modal fade" id="taskDetailModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Görev Detayı</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="selectedTask">
            <div class="task-details">
              <div class="mb-3">
                <label class="fw-bold">Görev Adı</label>
                <p>{{ selectedTask.taskName }}</p>
              </div>
              <div class="mb-3">
                <label class="fw-bold">Üretim Birimi</label>
                <p>{{ selectedTask.unit }}</p>
              </div>
              <div class="row mb-3">
                <div class="col-6">
                  <label class="fw-bold">Başlangıç</label>
                  <p>{{ formatDate(selectedTask.start) }}</p>
                </div>
                <div class="col-6">
                  <label class="fw-bold">Bitiş</label>
                  <p>{{ formatDate(selectedTask.end) }}</p>
                </div>
              </div>
              <div class="mb-3">
                <label class="fw-bold">İlerleme</label>
                <div class="progress" style="height: 10px;">
                  <div class="progress-bar" role="progressbar" 
                       :style="{width: `${selectedTask.progress}%`}" 
                       :class="getProgressClass(selectedTask.progress)"></div>
                </div>
                <small class="mt-1 d-block">{{ selectedTask.progress }}%</small>
              </div>
              <div class="mb-3">
                <label class="fw-bold">Durum</label>
                <p><span class="badge" :class="getStatusClass(selectedTask.status)">{{ selectedTask.status }}</span></p>
              </div>
              <div class="mb-3">
                <label class="fw-bold">Açıklama</label>
                <p>{{ selectedTask.description || 'Açıklama eklenmemiş' }}</p>
              </div>
              <div class="mb-3">
                <label class="fw-bold">İlgili Sipariş</label>
                <p>{{ selectedTask.orderNumber || '-' }}</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Kapat</button>
            <button type="button" class="btn btn-primary" @click="editTask" v-if="selectedTask">Düzenle</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount, watch } from 'vue';
import { usePlanningService } from '@/modules/planning/usePlanningService';
import Chart from 'chart.js/auto';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Modal } from 'bootstrap';

// Servis ve durum yönetimi
const planningService = usePlanningService();
const loading = ref(true);
const calendarView = ref('dayGridWeek');
const calendarEl = ref(null);
const calendar = ref(null);
const capacityChart = ref(null);
const deliveryChart = ref(null);
let capacityChartInstance = null;
let deliveryChartInstance = null;
let taskDetailModal = null;

// Kapasite Yönetimi
const selectedUnit = ref(null);
const productionUnits = ref([
  { id: 1, name: 'Elektrik Tasarım', capacity: 160 },
  { id: 2, name: 'Mekanik Tasarım', capacity: 160 },
  { id: 3, name: 'Test Birimi', capacity: 160 },
  { id: 4, name: 'İç Montaj', capacity: 200 },
  { id: 5, name: 'Kablaj', capacity: 180 },
  { id: 6, name: 'Genel Montaj', capacity: 220 }
]);

const capacityLoad = ref({
  1: 120,
  2: 150,
  3: 90,
  4: 180,
  5: 170,
  6: 200
});

// Teslimat Tahminleri
const selectedPeriod = ref('30d');
const timePeriods = {
  '7d': 'Son 7 Gün',
  '30d': 'Son 30 Gün',
  '90d': 'Son 90 Gün',
  '1y': 'Bu Yıl'
};

// Görev Yönetimi
const schedule = ref([]);
const tasks = ref([]);
const searchQuery = ref('');
const selectedTask = ref(null);
const sortKey = ref('start');
const sortDirection = ref('asc');

// Mock veri - gerçek API'den gelecek
const mockTasks = [
  {
    id: 1,
    taskName: '#0424-1251 RM 36 CB Hücre Mekanik Üretimi',
    unit: 'Mekanik Üretim',
    start: '2025-04-18T08:00:00',
    end: '2025-04-22T17:00:00',
    progress: 75,
    status: 'Devam Ediyor',
    description: '12 adet RM 36 CB hücrenin mekanik üretim aşaması',
    orderNumber: 'SIP-2025-0042'
  },
  {
    id: 2,
    taskName: '#0424-1245 RMU İç Montaj',
    unit: 'İç Montaj',
    start: '2025-04-20T08:00:00',
    end: '2025-04-24T17:00:00',
    progress: 50,
    status: 'Devam Ediyor',
    description: '5 adet RMU hücrenin iç montaj işlemi',
    orderNumber: 'SIP-2025-0039'
  },
  {
    id: 3,
    taskName: '#0424-1239 RM 36 CB Test',
    unit: 'Test Birimi',
    start: '2025-04-22T13:00:00',
    end: '2025-04-23T17:00:00',
    progress: 0,
    status: 'Beklemede',
    description: '8 adet RM 36 CB hücrenin test işlemi',
    orderNumber: 'SIP-2025-0038'
  },
  {
    id: 4,
    taskName: '#0424-1233 RM 36 VT Kablaj',
    unit: 'Kablaj',
    start: '2025-04-17T08:00:00',
    end: '2025-04-19T12:00:00',
    progress: 100,
    status: 'Tamamlandı',
    description: '3 adet RM 36 VT hücrenin kablaj işlemi',
    orderNumber: 'SIP-2025-0035'
  }
];

const deliveryEstimates = ref([
  { id: 1, orderNumber: 'SIP-2025-0042', estimatedDeliveryDate: '2025-04-25T00:00:00' },
  { id: 2, orderNumber: 'SIP-2025-0039', estimatedDeliveryDate: '2025-04-27T00:00:00' },
  { id: 3, orderNumber: 'SIP-2025-0038', estimatedDeliveryDate: '2025-04-24T00:00:00' },
  { id: 4, orderNumber: 'SIP-2025-0035', estimatedDeliveryDate: '2025-04-20T00:00:00' },
  { id: 5, orderNumber: 'SIP-2025-0033', estimatedDeliveryDate: '2025-04-22T00:00:00' }
]);

// Computed Properties
const timePeriodLabel = computed(() => timePeriods[selectedPeriod.value]);

const filteredTasks = computed(() => {
  let result = [...tasks.value];
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(task => 
      task.taskName.toLowerCase().includes(query) ||
      task.unit.toLowerCase().includes(query) ||
      task.status.toLowerCase().includes(query) ||
      (task.orderNumber && task.orderNumber.toLowerCase().includes(query))
    );
  }
  
  // Sıralama uygula
  result.sort((a, b) => {
    let valA = a[sortKey.value];
    let valB = b[sortKey.value];
    
    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }
    
    if (valA < valB) return sortDirection.value === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection.value === 'asc' ? 1 : -1;
    return 0;
  });
  
  return result;
});

// Methods
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const getProgressClass = (progress) => {
  if (progress >= 100) return 'bg-success';
  if (progress >= 75) return 'bg-info';
  if (progress >= 25) return 'bg-warning';
  return 'bg-danger';
};

const getStatusClass = (status) => {
  switch(status.toLowerCase()) {
    case 'tamamlandı': return 'bg-success';
    case 'devam ediyor': return 'bg-info';
    case 'beklemede': return 'bg-warning';
    case 'gecikti': return 'bg-danger';
    default: return 'bg-secondary';
  }
};

// Kapasite Grafiği
const renderCapacityChart = () => {
  if (!capacityChart.value) return;
  
  nextTick(() => {
    const ctx = capacityChart.value.getContext('2d');
    
    if (capacityChartInstance) {
      capacityChartInstance.destroy();
    }
    
    // Filter units if needed
    const unitsToRender = selectedUnit.value 
      ? [selectedUnit.value] 
      : productionUnits.value;
    
    // Prepare chart data
    const labels = unitsToRender.map(unit => unit.name);
    const data = unitsToRender.map(unit => {
      const load = capacityLoad.value[unit.id] || 0;
      const capacity = unit.capacity || 1;
      return Math.min(100, (load / capacity) * 100);
    });
    
    // Set colors based on load percentage
    const backgroundColors = data.map(percentage => {
      if (percentage > 90) return 'rgba(255, 99, 132, 0.6)'; // Kırmızı (>90%)
      if (percentage > 70) return 'rgba(255, 206, 86, 0.6)'; // Sarı (>70%)
      return 'rgba(75, 192, 192, 0.6)'; // Yeşil/Mavi
    });
    
    const borderColors = backgroundColors.map(color => color.replace('0.6', '1'));
    
    // Create chart
    capacityChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Haftalık Kapasite Kullanım Yüzdesi (%)',
          data: data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Kullanım Oranı (%)'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const unitName = context.label;
                const unit = productionUnits.value.find(u => u.name === unitName);
                const load = capacityLoad.value[unit?.id] || 0;
                
                let label = context.dataset.label || '';
                if (label) label += ': ';
                
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toFixed(1) + '%';
                  if (unit) {
                    label += ` (${load.toFixed(1)} / ${unit.capacity} saat)`;
                  }
                }
                return label;
              }
            }
          }
        }
      }
    });
  });
};

// Teslimat Grafiği
const renderDeliveryChart = () => {
  if (!deliveryChart.value) return;
  
  nextTick(() => {
    const ctx = deliveryChart.value.getContext('2d');
    
    if (deliveryChartInstance) {
      deliveryChartInstance.destroy();
    }
    
    // Prepare time range based on selected period
    const today = new Date();
    const startDate = new Date();
    
    switch (selectedPeriod.value) {
      case '7d':
        startDate.setDate(today.getDate() - 7);
        break;
      case '90d':
        startDate.setDate(today.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default: // 30d
        startDate.setDate(today.getDate() - 30);
    }
    
    // Group data by date
    const countsByDate = {};
    deliveryEstimates.value.forEach(delivery => {
      const deliveryDate = new Date(delivery.estimatedDeliveryDate);
      if (deliveryDate >= startDate && deliveryDate <= today) {
        const dateStr = deliveryDate.toISOString().split('T')[0]; // YYYY-MM-DD
        countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
      }
    });
    
    // Generate labels and data for chart
    const labels = [];
    const data = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      labels.push(dateStr);
      data.push(countsByDate[dateStr] || 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Create chart
    deliveryChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: `Günlük Tahmini Teslimat Sayısı (${timePeriodLabel.value})`,
          data: data,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Teslimat Sayısı'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Tarih'
            }
          }
        }
      }
    });
  });
};

// Takvim Başlatma
const initializeCalendar = () => {
  if (!calendarEl.value) return;
  
  // Create calendar events from tasks
  const events = tasks.value.map(task => {
    const color = task.status === 'Tamamlandı' ? '#28a745' : 
                 task.status === 'Devam Ediyor' ? '#17a2b8' : 
                 task.status === 'Beklemede' ? '#ffc107' : '#dc3545';
                 
    return {
      id: task.id.toString(),
      title: task.taskName,
      start: task.start,
      end: task.end,
      color: color,
      extendedProps: { taskId: task.id }
    };
  });
  
  // Initialize FullCalendar
  calendar.value = new Calendar(calendarEl.value, {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: calendarView.value,
    locale: 'tr',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: '' // Butonlarla kontrol edildiği için kaldırıldı
    },
    events: events,
    eventClick: function(info) {
      const taskId = info.event.extendedProps.taskId;
      const task = tasks.value.find(t => t.id === taskId);
      if (task) viewTaskDetail(task);
    },
    dateClick: function(info) {
      // İsteğe bağlı: Tıklanan tarih için işlemler
      console.log('Tıklanan tarih:', info.dateStr);
    }
  });
  
  calendar.value.render();
};

// Takvim Görünümünü Değiştirme
const changeCalendarView = (view) => {
  calendarView.value = view;
  if (calendar.value) {
    calendar.value.changeView(view);
  }
};

// Birim Seçme
const selectUnit = (unit) => {
  selectedUnit.value = unit;
  renderCapacityChart();
};

// Zaman Aralığı Seçme
const selectTimePeriod = (period) => {
  selectedPeriod.value = period;
  renderDeliveryChart();
};

// Görevleri Filtreleme
const filterTasks = () => {
  // Computed property kullanıldığı için ek bir işleme gerek yok
};

// Görevleri Sıralama
const sortBy = (key) => {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDirection.value = 'asc';
  }
};

// Görev Detayını Görüntüleme
const viewTaskDetail = (task) => {
  selectedTask.value = task;
  if (taskDetailModal) {
    taskDetailModal.show();
  }
};

// Görev Düzenleme
const editTask = () => {
  console.log('Düzenlenecek görev:', selectedTask.value);
  // Gerçek uygulamada: düzenleme formuna yönlendir veya modal aç
};

// Veri Yükleme
const fetchPlanningData = async () => {
  loading.value = true;
  try {
    // Simüle edilmiş API çağrıları
    // const response = await planningService.getPlanningData();
    
    // Mock veri kullanımı
    await new Promise(resolve => setTimeout(resolve, 800)); // API çağrısını simüle et
    
    // Görevleri yükle
    tasks.value = mockTasks;
    schedule.value = mockTasks;
    
    // Yükleme tamamlandı
    loading.value = false;
    
    // Takvim ve grafikleri başlat
    nextTick(() => {
      initializeCalendar();
      renderCapacityChart();
      renderDeliveryChart();
    });
  } catch (error) {
    console.error('Planlama verileri yüklenirken hata:', error);
    loading.value = false;
  }
};

// Lifecycle Hooks
onMounted(() => {
  fetchPlanningData();
  
  // Modali başlat
  const modalEl = document.getElementById('taskDetailModal');
  if (modalEl) {
    taskDetailModal = new Modal(modalEl);
  }
});

onBeforeUnmount(() => {
  if (calendar.value) {
    calendar.value.destroy();
  }
  if (capacityChartInstance) {
    capacityChartInstance.destroy();
  }
  if (deliveryChartInstance) {
    deliveryChartInstance.destroy();
  }
});
</script>

<style scoped>
.planning-module {
  padding: 1rem;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.calendar-container {
  min-height: 500px;
}

.calendar-container.loading {
  opacity: 0.6;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 300px;
}

table th {
  cursor: pointer;
}

table th:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.task-details label {
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 0;
}

.task-details p {
  margin-bottom: 0.5rem;
}

/* Responsive düzenlemeler */
@media (max-width: 768px) {
  .planning-module {
    padding: 0.5rem;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start !important;
  }
  
  .card-header .btn-group,
  .card-header .dropdown,
  .card-header .input-group {
    margin-top: 0.5rem;
    width: 100%;
  }
}
</style>