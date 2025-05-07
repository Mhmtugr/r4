<template>
  <div class="reports-view">
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Raporlar ve Analizler</h5>
            <!-- Rapor Alma Dropdown -->
            <div class="dropdown">
                 <button class="btn btn-primary dropdown-toggle" type="button" id="reportsDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                     <i class="bi bi-download"></i> Rapor Al
                 </button>
                 <ul class="dropdown-menu" aria-labelledby="reportsDropdown">
                     <li><a class="dropdown-item" href="#" @click.prevent="downloadReport('production')">Üretim Raporu</a></li>
                     <li><a class="dropdown-item" href="#" @click.prevent="downloadReport('material')">Malzeme Raporu</a></li>
                     <li><a class="dropdown-item" href="#" @click.prevent="downloadReport('delay')">Gecikme Raporu</a></li>
                     <li><a class="dropdown-item" href="#" @click.prevent="downloadReport('efficiency')">Verimlilik Raporu</a></li>
                     <li><hr class="dropdown-divider"></li>
                     <li><a class="dropdown-item" href="#" @click.prevent="createCustomReport">Özel Rapor Oluştur</a></li>
                 </ul>
             </div>
          </div>
          <div class="card-body">
            <div class="row">
              <!-- Sol Sütun Grafikler -->
              <div class="col-md-6">
                <div class="card mb-4">
                  <div class="card-header">
                    <h6 class="mb-0">Üretim Verimliliği</h6>
                  </div>
                  <div class="card-body">
                    <canvas id="efficiencyChart" height="250"></canvas> <!-- Chart.js bileşeni -->
                  </div>
                </div>
                <div class="card">
                  <div class="card-header">
                    <h6 class="mb-0">Gecikme Nedenleri</h6>
                  </div>
                  <div class="card-body">
                    <canvas id="delayChart" height="250"></canvas> <!-- Chart.js bileşeni (doughnut/pie) -->
                  </div>
                </div>
              </div>
              <!-- Sağ Sütun Grafikler -->
              <div class="col-md-6">
                <div class="card mb-4">
                  <div class="card-header">
                    <h6 class="mb-0">Birim Bazlı Çalışma Süreleri</h6>
                  </div>
                  <div class="card-body">
                    <canvas id="unitTimeChart" height="250"></canvas> <!-- Chart.js bileşeni (bar) -->
                  </div>
                </div>
                <div class="card">
                  <div class="card-header">
                    <h6 class="mb-0">Müşteri Bazlı Siparişler</h6>
                  </div>
                  <div class="card-body">
                    <canvas id="customerChart" height="250"></canvas> <!-- Chart.js bileşeni (bar/pie) -->
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
// import Chart from 'chart.js/auto';
// import apiService from '@/services/api-service';

// let efficiencyChartInstance = null;
// let delayChartInstance = null;
// let unitTimeChartInstance = null;
// let customerChartInstance = null;

onMounted(async () => {
    // Veri çekme ve grafik kurulumu
    // const reportData = await apiService.getAllReportData();
    // setupCharts(reportData);
});

// onBeforeUnmount(() => {
//     // Grafik örneklerini temizle
//     efficiencyChartInstance?.destroy();
//     delayChartInstance?.destroy();
//     unitTimeChartInstance?.destroy();
//     customerChartInstance?.destroy();
// });

// const setupCharts = (data) => {
    // setupEfficiencyChart(data?.efficiencyData);
    // setupDelayChart(data?.delayData);
    // setupUnitTimeChart(data?.unitTimeData);
    // setupCustomerChart(data?.customerData);
// };

// Örnek Grafik Kurulum Fonksiyonları
// const setupEfficiencyChart = (efficiencyData) => {
//   const ctx = document.getElementById('efficiencyChart')?.getContext('2d');
//   if (!ctx) return;
//   efficiencyChartInstance = new Chart(ctx, {
//       type: 'line',
//       data: { labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'], datasets: [{ label: 'Verimlilik (%)', data: [75, 78, 80, 79, 82, 85], borderColor: '#27ae60', fill: true }] },
//       options: { /* ... */ }
//   });
// };

// const setupDelayChart = (delayData) => {
//   const ctx = document.getElementById('delayChart')?.getContext('2d');
//   if (!ctx) return;
//   delayChartInstance = new Chart(ctx, {
//       type: 'doughnut',
//       data: { labels: ['Malzeme Eksikliği', 'Planlama Hatası', 'Personel Yetersizliği', 'Diğer'], datasets: [{ data: [40, 25, 15, 20], backgroundColor: ['#e74c3c', '#f39c12', '#3498db', '#95a5a6'] }] },
//       options: { /* ... */ }
//   });
// };

// Diğer grafikler için benzer kurulum fonksiyonları...

const downloadReport = (reportType) => {
    console.log(`Downloading ${reportType} report...`);
    // apiService.downloadReport(reportType);
    alert(`${reportType} raporu indirme işlemi başlatıldı.`);
};

const createCustomReport = () => {
    console.log('Opening custom report creation interface...');
    // Özel rapor oluşturma modalını aç veya sayfaya yönlendir
    alert('Özel rapor oluşturma özelliği henüz aktif değil.');
};

</script>

<style scoped>
/* Raporlar görünümü özel stilleri */
.card-body canvas {
    max-width: 100%;
}
</style> 