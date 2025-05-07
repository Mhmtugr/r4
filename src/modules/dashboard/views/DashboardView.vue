<template>
  <div class="dashboard-view">
    <!-- İstatistik Kartları - ornekindex.html'deki 4 kart yapısına uygun -->
    <div class="row mb-4">
      <div class="col-md-3 col-sm-6 mb-3">
        <div class="stat-card card border-0 h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="text-muted mb-2">Aktif Siparişler</h6>
                <h3 class="mb-0">{{ dashboardData.activeOrders || 0 }}</h3>
              </div>
              <div class="stat-icon bg-primary bg-opacity-10 rounded-circle">
                <i class="bi bi-file-earmark-text text-primary"></i>
              </div>
            </div>
            <div class="mt-3 d-flex align-items-center">
              <span :class="dashboardData.ordersTrend > 0 ? 'text-success' : 'text-danger'">
                <i :class="dashboardData.ordersTrend > 0 ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i>
                {{ Math.abs(dashboardData.ordersTrend || 0) }}%
              </span>
              <span class="text-muted ms-2">geçen aya göre</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-3 col-sm-6 mb-3">
        <div class="stat-card card border-0 h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="text-muted mb-2">Devam Eden Üretim</h6>
                <h3 class="mb-0">{{ dashboardData.ongoingProduction || 0 }}</h3>
              </div>
              <div class="stat-icon bg-warning bg-opacity-10 rounded-circle">
                <i class="bi bi-gear text-warning"></i>
              </div>
            </div>
            <div class="mt-3 d-flex align-items-center">
              <span :class="dashboardData.productionTrend > 0 ? 'text-success' : 'text-danger'">
                <i :class="dashboardData.productionTrend > 0 ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i>
                {{ Math.abs(dashboardData.productionTrend || 0) }}%
              </span>
              <span class="text-muted ms-2">geçen aya göre</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-3 col-sm-6 mb-3">
        <div class="stat-card card border-0 h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="text-muted mb-2">Geciken Siparişler</h6>
                <h3 class="mb-0">{{ dashboardData.delayedOrders || 0 }}</h3>
              </div>
              <div class="stat-icon bg-danger bg-opacity-10 rounded-circle">
                <i class="bi bi-exclamation-triangle text-danger"></i>
              </div>
            </div>
            <div class="mt-3 d-flex align-items-center">
              <span :class="dashboardData.delayedTrend < 0 ? 'text-success' : 'text-danger'">
                <i :class="dashboardData.delayedTrend < 0 ? 'bi bi-arrow-down' : 'bi bi-arrow-up'"></i>
                {{ Math.abs(dashboardData.delayedTrend || 0) }}%
              </span>
              <span class="text-muted ms-2">geçen aya göre</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-3 col-sm-6 mb-3">
        <div class="stat-card card border-0 h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="text-muted mb-2">Tamamlanan Siparişler</h6>
                <h3 class="mb-0">{{ dashboardData.completedOrders || 0 }}</h3>
              </div>
              <div class="stat-icon bg-success bg-opacity-10 rounded-circle">
                <i class="bi bi-check-circle text-success"></i>
              </div>
            </div>
            <div class="mt-3 d-flex align-items-center">
              <span :class="dashboardData.completedTrend > 0 ? 'text-success' : 'text-danger'">
                <i :class="dashboardData.completedTrend > 0 ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i>
                {{ Math.abs(dashboardData.completedTrend || 0) }}%
              </span>
              <span class="text-muted ms-2">geçen aya göre</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Grafikler - ornekindex.html'deki düzene göre (8-4 sütun) -->
    <div class="row">
      <!-- Üretim Durumu Grafiği -->
      <div class="col-lg-8 col-md-12 mb-4">
        <div class="card border-0 h-100">
          <div class="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">Üretim Durumu</h5>
            <div class="card-actions">
              <div class="btn-group">
                <button @click="changeChartPeriod('weekly')" :class="['btn btn-sm', chartPeriod === 'weekly' ? 'btn-primary' : 'btn-outline-primary']">Haftalık</button>
                <button @click="changeChartPeriod('monthly')" :class="['btn btn-sm', chartPeriod === 'monthly' ? 'btn-primary' : 'btn-outline-primary']">Aylık</button>
              </div>
            </div>
          </div>
          <div class="card-body">
            <div class="chart-container">
              <canvas ref="productionChart" height="300"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Hücre Tipi Dağılımı Grafiği -->
      <div class="col-lg-4 col-md-6 mb-4">
        <div class="card border-0 h-100">
          <div class="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">Hücre Tipi Dağılımı</h5>
          </div>
          <div class="card-body d-flex align-items-center justify-content-center">
            <div class="chart-container doughnut-chart-container">
              <canvas ref="cellTypeChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Yapay Zeka Öngörüleri -->
    <div class="row mt-4">
      <div class="col-12 mb-4">
        <AIInsightsDashboard />
      </div>
    </div>
      
    <!-- Alt Tablolar ve Listeler - ornekindex.html'deki düzene göre (6-6 sütun) -->
    <div class="row mt-4">
      <!-- Kritik Malzeme Durumu Tablosu -->
      <div class="col-lg-6 col-md-12 mb-4">
        <div class="card border-0 h-100">
          <div class="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">Kritik Malzeme Durumu</h5>
            <router-link to="/materials" class="btn btn-sm btn-outline-primary">Tümünü Gör</router-link>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0 custom-table">
                <thead>
                  <tr>
                    <th>Malzeme Kodu</th>
                    <th>Malzeme Adı</th>
                    <th>Stok</th>
                    <th>İhtiyaç</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!dashboardData.criticalMaterials || dashboardData.criticalMaterials.length === 0">
                    <td colspan="5" class="text-center py-3">Kritik malzeme bulunmamaktadır.</td>
                  </tr>
                  <tr v-for="(material, index) in dashboardData.criticalMaterials" :key="index" 
                      :class="material.status === 'critical' ? 'material-critical' : 'material-required'">
                    <td>{{ material.code }}</td>
                    <td class="text-nowrap text-truncate" style="max-width: 200px;">{{ material.name }}</td>
                    <td>{{ material.stock }}</td>
                    <td>{{ material.required }}</td>
                    <td>
                      <span :class="['badge', material.status === 'critical' ? 'bg-danger' : 'bg-warning']">
                        {{ material.status === 'critical' ? 'Kritik' : 'Eksik' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Son Uyarılar Listesi -->
      <div class="col-lg-6 col-md-12 mb-4">
        <div class="card border-0 h-100">
          <div class="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">Son Uyarılar</h5>
            <router-link to="/notifications" class="btn btn-sm btn-outline-primary">Tümünü Gör</router-link>
          </div>
          <div class="card-body p-0">
            <div class="list-group list-group-flush">
              <div v-if="!dashboardData.alerts || dashboardData.alerts.length === 0" class="text-center p-4">
                <i class="bi bi-info-circle text-muted fs-3"></i>
                <p class="mt-2">Şu an için bildirim bulunmamaktadır.</p>
              </div>
              <a v-for="(alert, index) in dashboardData.alerts" :key="index" href="#" 
                 class="list-group-item list-group-item-action py-3 border-0" 
                 :class="{'border-danger border-start border-3': alert.type === 'danger', 'border-warning border-start border-3': alert.type === 'warning', 'border-info border-start border-3': alert.type === 'info'}">
                <div class="d-flex justify-content-between">
                  <h6 class="mb-1">{{ alert.title }}</h6>
                  <small :class="`text-${alert.type}`">{{ alert.time }}</small>
                </div>
                <p class="mb-1 text-break">{{ alert.message }}</p>
                <small class="text-muted">{{ alert.source }}</small>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Gecikmiş Siparişler Detay Kartı - YENİ EKLENEN BÖLÜM -->
    <div class="row mt-2">
      <div class="col-12 mb-4">
        <div class="card border-0">
          <div class="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">
              <i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>
              Gecikmiş Siparişler
            </h5>
            <div class="d-flex gap-2">
              <button @click="refreshDelayedOrders" class="btn btn-sm btn-outline-primary">
                <i class="bi bi-arrow-clockwise me-1"></i>
                Yenile
              </button>
              <router-link to="/orders?status=delayed" class="btn btn-sm btn-outline-danger">
                Tümünü Gör
              </router-link>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0 custom-table">
                <thead>
                  <tr>
                    <th>Sipariş No</th>
                    <th>Müşteri</th>
                    <th>Ürün</th>
                    <th>Gecikme</th>
                    <th>İşlem Aşaması</th>
                    <th>AI Önerisi</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="isLoadingDelayed" class="text-center">
                    <td colspan="7" class="py-4">
                      <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                      Gecikmiş siparişler yükleniyor...
                    </td>
                  </tr>
                  <tr v-else-if="!dashboardData.delayedOrdersList || dashboardData.delayedOrdersList.length === 0">
                    <td colspan="7" class="text-center py-4">
                      <i class="bi bi-check-circle text-success fs-4"></i>
                      <p class="mt-2">Gecikmiş sipariş bulunmamaktadır.</p>
                    </td>
                  </tr>
                  <tr v-for="(order, index) in dashboardData.delayedOrdersList" :key="index" 
                      :class="order.delayDays > 7 ? 'bg-danger bg-opacity-10' : 'bg-warning bg-opacity-10'">
                    <td>
                      <router-link :to="`/orders/${order.id}`" class="fw-bold text-decoration-none">
                        {{ order.orderNo }}
                      </router-link>
                    </td>
                    <td>{{ order.customerName }}</td>
                    <td>
                      <span v-if="order.productType" class="badge bg-primary bg-opacity-75 me-1">
                        {{ order.productType }}
                      </span>
                      <span class="small">{{ order.quantity }} adet</span>
                    </td>
                    <td>
                      <span class="badge rounded-pill" 
                            :class="order.delayDays > 7 ? 'bg-danger' : 'bg-warning'">
                        {{ order.delayDays }} gün
                      </span>
                    </td>
                    <td>
                      <div class="d-flex align-items-center">
                        <div class="progress flex-grow-1" style="height: 6px;">
                          <div class="progress-bar bg-info" 
                               :style="`width: ${order.progress}%`"></div>
                        </div>
                        <span class="ms-2 small">{{ order.progress }}%</span>
                      </div>
                      <small class="text-muted">{{ order.currentStage }}</small>
                    </td>
                    <td>
                      <span class="ai-suggestion">
                        <i class="bi bi-robot me-1"></i>
                        {{ order.aiSuggestion }}
                      </span>
                    </td>
                    <td>
                      <div class="btn-group">
                        <button @click="analyzeOrder(order.id)" class="btn btn-sm btn-outline-primary">
                          <i class="bi bi-graph-up"></i>
                        </button>
                        <button @click="notifyCustomer(order.id, order.customerName)" class="btn btn-sm btn-outline-warning">
                          <i class="bi bi-envelope"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount, nextTick } from 'vue';
import Chart from 'chart.js/auto';
import { useAuthStore } from '@/store/auth';
import { useDashboardData } from '@/modules/dashboard/useDashboardData';
import { aiService } from '@/services/ai-service';
import { useNotificationStore } from '@/store/notification';
import AIInsightsDashboard from '@/components/ai/AIInsightsDashboard.vue';

// Chart.js gereken kontroller
const getTextColor = () => document.body.classList.contains('dark-mode') ? '#e2e2e2' : '#6c757d';
const getGridLineColor = () => document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(200, 200, 200, 0.15)';
const getLabelColor = () => document.body.classList.contains('dark-mode') ? '#adb5bd' : '#6c757d';

Chart.defaults.color = getTextColor();
Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

// Dashboard servisini başlat
const dashboardService = useDashboardData();
const notificationStore = useNotificationStore();

// References for chart instances
const productionChart = ref(null);
const cellTypeChart = ref(null);

// Chart instances
let productionChartInstance = null;
let cellTypeChartInstance = null;

// Chart period state
const chartPeriod = ref('monthly');

// Gecikmiş siparişler için loading durumu
const isLoadingDelayed = ref(false);

// Dashboard data - daha zengin hale getirildi
const dashboardData = ref({
  activeOrders: 24,
  ongoingProduction: 18,
  delayedOrders: 3,
  completedOrders: 42,
  ordersTrend: 5.2,
  productionTrend: -2.1,
  delayedTrend: -1.8,
  completedTrend: 8.7,
  criticalMaterials: [
    { code: '137998%', name: 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC', stock: 2, required: 8, status: 'critical' },
    { code: '144866%', name: 'KAP-80/190-95 Akım Trafosu', stock: 3, required: 5, status: 'warning' },
    { code: '157322%', name: 'Siemens 8DL5 Sekonder Kablo Seti', stock: 0, required: 2, status: 'critical' },
    { code: '119845%', name: 'LED Lamba Kiti (Kırmızı-Yeşil-Sarı) 24V', stock: 5, required: 10, status: 'warning' },
    { code: '162480%', name: 'Rezistif Gerilim Bölücü 36kV', stock: 1, required: 3, status: 'critical' }
  ],
  alerts: [
    { 
      title: 'Teslim Tarihi Gecikmesi', 
      time: '1 saat önce', 
      message: 'Sipariş No: #0424-1251 - RM 36 CB hücresinin mekanik montajı gecikiyor.',
      source: 'Mekanik Üretim Birimi',
      type: 'danger'
    },
    { 
      title: 'Malzeme Eksikliği', 
      time: '3 saat önce', 
      message: 'Sipariş No: #0424-1245 için gerekli akım trafosu stokta yok.',
      source: 'Satın Alma Birimi',
      type: 'warning'
    },
    { 
      title: 'Yeni Sipariş', 
      time: '5 saat önce', 
      message: 'KEE Enerji için 12 hücrelik yeni bir sipariş oluşturuldu.',
      source: 'Satış Birimi',
      type: 'info'
    },
    {
      title: 'Teknik Değişiklik',
      time: '1 gün önce',
      message: 'RM 36 CB hücre tipleri için şartnameye uygun yeni braket tasarımı onaylandı.',
      source: 'Teknik Ofis',
      type: 'info'
    }
  ],
  // Gecikmiş siparişler listesi - YENİ EKLENEN VERİ
  delayedOrdersList: [
    {
      id: 'order-001',
      orderNo: '#0424-1251',
      customerName: 'AYEDAŞ',
      productType: 'RM 36 CB',
      quantity: 1,
      delayDays: 12,
      progress: 65,
      currentStage: 'Sekonder Montajı',
      aiSuggestion: 'Montaj ekibi takviyesi yapın'
    },
    {
      id: 'order-002',
      orderNo: '#0424-1245',
      customerName: 'BEDAŞ',
      productType: 'RM 36 LB',
      quantity: 2,
      delayDays: 5,
      progress: 35,
      currentStage: 'Primer Montajı',
      aiSuggestion: 'Tedarikçi ile iletişime geçin'
    },
    {
      id: 'order-007',
      orderNo: '#0424-1218',
      customerName: 'ENERJİSA TOROSLAR',
      productType: 'RM 36 CB',
      quantity: 4,
      delayDays: 8,
      progress: 80,
      currentStage: 'Test Aşaması',
      aiSuggestion: 'Test sürecini hızlandırın'
    }
  ],
  recentActivities: [
    {
      id: 1,
      type: 'order',
      title: 'Yeni sipariş eklendi',
      description: 'AYEDAŞ için 8 adet RM 36 CB hücre siparişi',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 dakika önce
      user: 'Ahmet Yılmaz'
    },
    {
      id: 2,
      type: 'production',
      title: 'Üretim tamamlandı',
      description: 'Sipariş #0424-1239 için hücreler test aşamasında',
      timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 saat önce
      user: 'Mehmet Demir'
    }
  ]
});

// Formatlı tarih
const formattedDate = computed(() => {
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return today.toLocaleDateString('tr-TR', options);
});

// Dashboard verilerini yeniler
const refreshDashboard = async () => {
  console.log('Dashboard yenileniyor...');
  const isLoading = ref(true);
  
  try {
    await fetchDashboardData();
    updateCharts();
  } catch (error) {
    console.error('Dashboard yenilenirken hata:', error);
  } finally {
    isLoading.value = false;
  }
};

// Gecikmiş siparişleri yeniler
const refreshDelayedOrders = async () => {
  isLoadingDelayed.value = true;
  
  try {
    await fetchDelayedOrders();
    
    notificationStore.add({
      title: 'Gecikmiş Siparişler',
      message: 'Gecikmiş siparişler listesi güncellendi.',
      type: 'info'
    });
  } catch (error) {
    console.error('Gecikmiş siparişler yüklenirken hata:', error);
    
    notificationStore.add({
      title: 'Hata',
      message: 'Gecikmiş siparişler listesi güncellenemedi.',
      type: 'danger'
    });
  } finally {
    isLoadingDelayed.value = false;
  }
};

// Sipariş analizi yapar
const analyzeOrder = async (orderId) => {
  try {
    notificationStore.add({
      title: 'Sipariş Analizi',
      message: 'Yapay zeka sipariş analizi başlatıldı...',
      type: 'info'
    });
    
    // Gerçek uygulamada aiService.analyzeOrder() kullanılabilir
    setTimeout(() => {
      notificationStore.add({
        title: 'Sipariş Analizi',
        message: 'Analiz tamamlandı. Detaylar için sipariş sayfasını ziyaret edin.',
        type: 'success'
      });
    }, 1500);
  } catch (error) {
    console.error('Sipariş analizi yapılırken hata:', error);
  }
};

// Müşteri bildirim modalını açar
const notifyCustomer = (orderId, customerName) => {
  notificationStore.add({
    title: 'Müşteri Bildirimi',
    message: `${customerName} için bildirim oluşturuluyor...`,
    type: 'info'
  });
  
  // Burada modal açma mantığı olabilir
  // Notification modalı ekleme veya mevcut bir modalı açma işlemi burada yapılabilir
};

// Grafik periyodunu değiştirir
const changeChartPeriod = (period) => {
  chartPeriod.value = period;
  nextTick(() => {
    updateProductionChart();
  });
};

// Üretim grafiğini oluşturur - Geliştirildi: ornekindex.html'e göre
const createProductionChart = () => {
  if (!productionChart.value) {
    console.warn('Production chart canvas not found');
    return;
  }

  const ctx = productionChart.value.getContext('2d');
  
  // Tarih etiketleri - myrule2.mdc özelinde geliştirildi
  const getLabels = () => {
    if (chartPeriod.value === 'weekly') {
      return ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    } else {
      // Son 6 ay etiketleri
      const currentDate = new Date();
      const monthLabels = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(currentDate.getMonth() - i);
        monthLabels.push(date.toLocaleDateString('tr-TR', { month: 'short' }));
      }
      
      return monthLabels;
    }
  };
  
  // Veri setleri - myrule2.mdc'de bahsedilen daha kapsamlı analiz için
  const data = {
    labels: getLabels(),
    datasets: [
      {
        label: 'Planlanan Üretim',
        data: chartPeriod.value === 'weekly' 
          ? [12, 15, 18, 14, 16, 10, 8]
          : [35, 42, 45, 50, 48, 55, 60],
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Gerçekleşen Üretim',
        data: chartPeriod.value === 'weekly' 
          ? [10, 13, 16, 14, 15, 9, 7]
          : [32, 38, 43, 45, 42, 50, 55],
        borderColor: '#20c997',
        backgroundColor: 'rgba(32, 201, 151, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Hedef Üretim',
        data: chartPeriod.value === 'weekly' 
          ? [14, 14, 14, 14, 14, 8, 8]
          : [40, 40, 40, 45, 45, 50, 50],
        borderColor: '#ffc107',
        borderDash: [5, 5],
        backgroundColor: 'rgba(0, 0, 0, 0)',
        tension: 0,
        fill: false
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false
      },
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          color: getTextColor()
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: getGridLineColor()
        },
        ticks: {
          color: getLabelColor()
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: getLabelColor()
        }
      }
    }
  };

  try {
    if (productionChartInstance) {
      productionChartInstance.destroy();
    }
    
    productionChartInstance = new Chart(ctx, {
      type: 'line',
      data: data,
      options: options
    });
  } catch (error) {
    console.error('Production chart creation error:', error);
  }
};

// Hücre tipi grafiğini oluşturur - Ornekindex.html'e göre geliştirildi
const createCellTypeChart = () => {
  if (!cellTypeChart.value) {
    console.warn('Cell type chart canvas not found');
    return;
  }

  const ctx = cellTypeChart.value.getContext('2d');
  
  const data = {
    labels: ['RM 36 CB', 'RM 36 Switch', 'RM 36 VT', 'RM 36 Cable', 'RM 36 M+F', 'RM 36 Others'],
    datasets: [
      {
        data: [35, 25, 15, 10, 8, 7],
        backgroundColor: [
          '#0d6efd',
          '#20c997',
          '#ffc107',
          '#fd7e14',
          '#6f42c1',
          '#adb5bd'
        ],
        borderWidth: 0,
        borderRadius: 3,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          boxWidth: 8,
          font: {
            size: 10
          },
          color: getTextColor()
        }
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            return `${tooltipItem.label}: ${tooltipItem.raw}%`;
          }
        }
      }
    },
    cutout: '65%'
  };

  try {
    if (cellTypeChartInstance) {
      cellTypeChartInstance.destroy();
    }
    
    cellTypeChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: data,
      options: options
    });
  } catch (error) {
    console.error('Cell type chart creation error:', error);
  }
};

// Tüm grafikleri günceller
const updateCharts = () => {
  updateProductionChart();
  updateCellTypeChart();
};

// Üretim grafiğini günceller
const updateProductionChart = () => {
  nextTick(() => {
    createProductionChart();
  });
};

// Hücre tipi grafiğini günceller
const updateCellTypeChart = () => {
  nextTick(() => {
    createCellTypeChart();
  });
};

// Dashboard verilerini çeker - myrule2.mdc'de istenen API entegrasyonuna hazırlık
const fetchDashboardData = async () => {
  try {
    // Gerçek bir API çağrısı örneği - Canias ERP sisteminden veri çekme simülasyonu
    // const response = await dashboardService.getDashboardData();
    // dashboardData.value = response;
    
    // API çağrısı simülasyonu
    console.log('ERP sisteminden dashboard verileri çekiliyor...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Demo veri - Gerçek uygulamada API'den alınacak
    dashboardData.value = {
      ...dashboardData.value,
      activeOrders: 24,
      ongoingProduction: 18,
      delayedOrders: 3,
      completedOrders: 42,
      ordersTrend: Math.random() > 0.5 ? 5.2 : -2.3, // Demo için rastgele değişim
      productionTrend: Math.random() > 0.5 ? 4.7 : -2.1,
      delayedTrend: Math.random() > 0.5 ? 1.5 : -1.8,
      completedTrend: Math.random() > 0.5 ? 8.7 : -3.4
    };
    
    // Gecikmiş siparişler listesi de güncelle
    await fetchDelayedOrders();
    
    console.log('Dashboard verileri başarıyla güncellendi');
  } catch (error) {
    console.error('Dashboard verileri çekilirken hata:', error);
    throw error;
  }
};

// Gecikmiş siparişleri çeker
const fetchDelayedOrders = async () => {
  try {
    // Gerçek bir API çağrısı örneği
    // const response = await dashboardService.getDelayedOrders();
    // dashboardData.value.delayedOrdersList = response;
    
    // API çağrısı simülasyonu
    console.log('Gecikmiş siparişler çekiliyor...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Demo veri - Gerçek uygulamada API'den alınacak
    dashboardData.value.delayedOrdersList = [
      {
        id: 'order-001',
        orderNo: '#0424-1251',
        customerName: 'AYEDAŞ',
        productType: 'RM 36 CB',
        quantity: 1,
        delayDays: 12,
        progress: 65,
        currentStage: 'Sekonder Montajı',
        aiSuggestion: 'Montaj ekibi takviyesi yapın'
      },
      {
        id: 'order-002',
        orderNo: '#0424-1245',
        customerName: 'BEDAŞ',
        productType: 'RM 36 LB',
        quantity: 2,
        delayDays: 5,
        progress: 35,
        currentStage: 'Primer Montajı',
        aiSuggestion: 'Tedarikçi ile iletişime geçin'
      },
      {
        id: 'order-007',
        orderNo: '#0424-1218',
        customerName: 'ENERJİSA TOROSLAR',
        productType: 'RM 36 CB',
        quantity: 4,
        delayDays: 8,
        progress: 80,
        currentStage: 'Test Aşaması',
        aiSuggestion: 'Test sürecini hızlandırın'
      }
    ];
    
    console.log('Gecikmiş siparişler başarıyla güncellendi');
  } catch (error) {
    console.error('Gecikmiş siparişler çekilirken hata:', error);
    throw error;
  }
};

// Dark mode değişikliği izle
const handleDarkModeChange = () => {
  if (productionChartInstance || cellTypeChartInstance) {
    Chart.defaults.color = getTextColor();
    updateCharts();
  }
};

// Boyut değişikliğinde grafikleri yeniden boyutlandır
const handleResize = () => {
  if (productionChartInstance) {
    productionChartInstance.resize();
  }
  if (cellTypeChartInstance) {
    cellTypeChartInstance.resize();
  }
};

// Eklenen event listener'lar için temizleme
const setupEventListeners = () => {
  window.addEventListener('resize', handleResize);
  document.addEventListener('dark-mode-toggle', handleDarkModeChange);
};

const cleanupEventListeners = () => {
  window.removeEventListener('resize', handleResize);
  document.removeEventListener('dark-mode-toggle', handleDarkModeChange);
};

// Bileşen yüklendiğinde
onMounted(async () => {
  // Event listener'ları ekle
  setupEventListeners();

  try {
    // Önce data al
    await fetchDashboardData();
    
    // Sonra grafikleri çiz
    nextTick(() => {
      createProductionChart();
      createCellTypeChart();
      
      // Otomatik güncelleme için interval
      const refreshInterval = setInterval(() => {
        refreshDashboard();
      }, 300000); // 5 dakika
      
      // Cleanup için interval'i kaydet
      onBeforeUnmount(() => {
        clearInterval(refreshInterval);
        cleanupEventListeners();

        // Grafik instance'larını temizle
        if (productionChartInstance) {
          productionChartInstance.destroy();
          productionChartInstance = null;
        }
        
        if (cellTypeChartInstance) {
          cellTypeChartInstance.destroy();
          cellTypeChartInstance = null;
        }
      });
    });
  } catch (error) {
    console.error('Dashboard yüklenirken hata:', error);
  }
});

// Dark mode değişimini izle
watch(() => document.body.classList.contains('dark-mode'), (isDark) => {
  handleDarkModeChange();
});
</script>

<style scoped>
.dashboard-view {
  padding: 1rem;
}

/* Kart stilleri - ornekindex.html'den uyarlandı */
.card {
  border: none;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  transition: transform 0.3s;
}

.card:hover {
  transform: translateY(-5px);
}

.card-header {
  background-color: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  font-weight: 600;
}

/* İstatistik kartları */
.stat-card {
  transition: all 0.2s ease;
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon i {
  font-size: 1.5rem;
}

/* Grafik stilleri */
.chart-container {
  position: relative;
  width: 100%;
  height: 300px;
}

.doughnut-chart-container {
  height: 250px;
  width: 100%;
}

/* Malzeme durumu stilleri - ornekindex.html'den */
.material-critical {
  background-color: var(--material-critical-bg, #ffebee);
}

.material-required {
  background-color: var(--material-required-bg, #fff3e0);
}

.material-available {
  background-color: var(--material-available-bg, #e8f5e9);
}

/* Custom tablo stilleri - ornekindex.html'den */
.custom-table th {
  background-color: var(--light-color, #ecf0f1);
  font-weight: 600;
}

/* AI öneri stilleri */
.ai-suggestion {
  font-size: 0.85rem;
  font-style: italic;
  color: var(--ai-suggestion-color, #6c757d);
}

/* Duyarlı tasarım ayarları */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start !important;
  }
  
  .card-actions {
    margin-top: 0.5rem;
    align-self: flex-end;
  }
}
</style>