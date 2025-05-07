<template>
  <div class="predictive-maintenance-dashboard">
    <div class="dashboard-header">
      <h2>Predictive Maintenance Dashboard</h2>
      <div class="controls">
        <select v-model="selectedEquipment" @change="loadPredictions">
          <option value="">Ekipman Seçin</option>
          <option v-for="item in equipmentList" :key="item.id" :value="item.id">
            {{ item.name }} ({{ item.location }})
          </option>
        </select>
        <button @click="refreshData" :disabled="isLoading" class="refresh-btn">
          <i class="fas fa-sync"></i> Yenile
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Bakım tahminleri hesaplanıyor...</p>
    </div>

    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="loadPredictions">Tekrar Dene</button>
    </div>

    <div v-else-if="maintenancePrediction" class="prediction-results">
      <!-- Equipment Information -->
      <div class="info-card equipment-info">
        <h3>Ekipman Bilgileri</h3>
        <table>
          <tr>
            <td>ID:</td>
            <td>{{ maintenancePrediction.equipmentInfo.id }}</td>
          </tr>
          <tr>
            <td>Ad:</td>
            <td>{{ maintenancePrediction.equipmentInfo.name }}</td>
          </tr>
          <tr>
            <td>Tip:</td>
            <td>{{ maintenancePrediction.equipmentInfo.type }}</td>
          </tr>
          <tr>
            <td>Konum:</td>
            <td>{{ maintenancePrediction.equipmentInfo.location }}</td>
          </tr>
          <tr>
            <td>Kurulum Tarihi:</td>
            <td>{{ maintenancePrediction.equipmentInfo.installDate }}</td>
          </tr>
          <tr>
            <td>Çalışma Saati:</td>
            <td>{{ maintenancePrediction.equipmentInfo.operatingHours }} saat</td>
          </tr>
        </table>
      </div>

      <!-- Failure Probability -->
      <div class="info-card failure-probability">
        <h3>Arıza Olasılığı</h3>
        <div class="probability-bars">
          <div class="prob-item">
            <div class="label">30 Gün</div>
            <div class="bar-container">
              <div class="bar" :style="{ width: `${maintenancePrediction.failureProbability.next30Days}%` }" 
                   :class="getProbabilityClass(maintenancePrediction.failureProbability.next30Days)"></div>
              <div class="value">{{ maintenancePrediction.failureProbability.next30Days }}%</div>
            </div>
          </div>
          <div class="prob-item">
            <div class="label">60 Gün</div>
            <div class="bar-container">
              <div class="bar" :style="{ width: `${maintenancePrediction.failureProbability.next60Days}%` }"
                   :class="getProbabilityClass(maintenancePrediction.failureProbability.next60Days)"></div>
              <div class="value">{{ maintenancePrediction.failureProbability.next60Days }}%</div>
            </div>
          </div>
          <div class="prob-item">
            <div class="label">90 Gün</div>
            <div class="bar-container">
              <div class="bar" :style="{ width: `${maintenancePrediction.failureProbability.next90Days}%` }"
                   :class="getProbabilityClass(maintenancePrediction.failureProbability.next90Days)"></div>
              <div class="value">{{ maintenancePrediction.failureProbability.next90Days }}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Likely Failure Components -->
      <div class="info-card likely-failures">
        <h3>Olası Arıza Bileşenleri</h3>
        <table>
          <thead>
            <tr>
              <th>Bileşen</th>
              <th>Olasılık</th>
              <th>Tahmini Maliyet</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(component, index) in maintenancePrediction.likelyFailureComponents" :key="index">
              <td>{{ component.component }}</td>
              <td :class="getProbabilityClass(component.probability)">{{ component.probability }}%</td>
              <td>{{ formatCurrency(component.estimatedReplacementCost) }} ₺</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Recommended Maintenance -->
      <div class="info-card recommendations">
        <h3>Bakım Önerileri</h3>
        <div class="recommendation-details">
          <p><strong>Önerilen Bakım Tarihi:</strong> {{ formatDate(maintenancePrediction.recommendedMaintenance.nextServiceDate) }}</p>
          <p><strong>Tahmini Süre:</strong> {{ maintenancePrediction.recommendedMaintenance.estimatedServiceTime }}</p>
          <p><strong>Tahmini Maliyet:</strong> {{ formatCurrency(maintenancePrediction.recommendedMaintenance.estimatedServiceCost) }} ₺</p>
          
          <h4>Önerilen İşlemler:</h4>
          <ul>
            <li v-for="(action, index) in maintenancePrediction.recommendedMaintenance.maintenanceActions" :key="index">
              {{ action }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Cost Benefit Analysis -->
      <div class="info-card cost-benefit">
        <h3>Maliyet-Fayda Analizi</h3>
        <div class="cost-comparison">
          <div class="cost-item preventive">
            <h4>Önleyici Bakım</h4>
            <p><strong>Maliyet:</strong> {{ formatCurrency(maintenancePrediction.costBenefitAnalysis.preventiveMaintenance.cost) }} ₺</p>
            <p><strong>Risk Azaltma:</strong> {{ maintenancePrediction.costBenefitAnalysis.preventiveMaintenance.riskReduction }}</p>
            <p><strong>Üretim Sürekliliği:</strong> {{ maintenancePrediction.costBenefitAnalysis.preventiveMaintenance.productionContinuity }}</p>
          </div>
          <div class="cost-item reactive">
            <h4>Reaktif Bakım</h4>
            <p><strong>Tahmini Duruş:</strong> {{ maintenancePrediction.costBenefitAnalysis.reactiveMaintenance.estimatedDowntime }}</p>
            <p><strong>Tahmini Maliyet:</strong> {{ formatCurrency(maintenancePrediction.costBenefitAnalysis.reactiveMaintenance.estimatedCost) }} ₺</p>
            <p><strong>Üretim Kaybı:</strong> {{ maintenancePrediction.costBenefitAnalysis.reactiveMaintenance.productionLoss }}</p>
          </div>
        </div>
        <div class="recommendation-summary">
          <h4>Öneri</h4>
          <p>{{ maintenancePrediction.costBenefitAnalysis.recommendation }}</p>
        </div>
      </div>
    </div>

    <div v-else class="no-data">
      <p>Lütfen analiz için ekipman seçin</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useTechnicalService } from '../useTechnicalService';
import { AIService } from '@/services/ai-service';

export default {
  name: 'PredictiveMaintenanceDashboard',
  
  setup() {
    const technicalService = useTechnicalService();
    const aiService = new AIService();
    
    const selectedEquipment = ref('');
    const equipmentList = ref([]);
    const maintenancePrediction = ref(null);
    const isLoading = ref(false);
    const error = ref(null);

    const loadEquipmentList = async () => {
      try {
        isLoading.value = true;
        equipmentList.value = await technicalService.getEquipmentList();
      } catch (err) {
        console.error('Error loading equipment list:', err);
        error.value = 'Ekipman listesi yüklenemedi. Lütfen daha sonra tekrar deneyin.';
        
        // Use mock data if real data cannot be loaded
        equipmentList.value = [
          { id: 'eq001', name: 'CNC Freze Makinesi', location: 'Atölye A' },
          { id: 'eq002', name: 'Endüstriyel Robot Kolu', location: 'Montaj Hattı 2' },
          { id: 'eq003', name: 'Konveyör Sistemi', location: 'Paketleme Alanı' },
          { id: 'eq004', name: 'Hidrolik Pres', location: 'Atölye B' },
          { id: 'eq005', name: 'Endüstriyel Fırın', location: 'Isıl İşlem Merkezi' }
        ];
      } finally {
        isLoading.value = false;
      }
    };

    const loadPredictions = async () => {
      if (!selectedEquipment.value) {
        maintenancePrediction.value = null;
        return;
      }
      
      try {
        error.value = null;
        isLoading.value = true;
        maintenancePrediction.value = await aiService.predictMaintenance(selectedEquipment.value);
      } catch (err) {
        console.error('Error loading maintenance predictions:', err);
        error.value = 'Bakım tahminleri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
        maintenancePrediction.value = null;
      } finally {
        isLoading.value = false;
      }
    };

    const refreshData = () => {
      loadPredictions();
    };

    const getProbabilityClass = (value) => {
      if (value < 30) return 'low-risk';
      if (value < 70) return 'medium-risk';
      return 'high-risk';
    };

    const formatCurrency = (value) => {
      return value.toLocaleString('tr-TR');
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'Belirtilmemiş';
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR');
    };

    onMounted(() => {
      loadEquipmentList();
    });

    return {
      selectedEquipment,
      equipmentList,
      maintenancePrediction,
      isLoading,
      error,
      loadPredictions,
      refreshData,
      getProbabilityClass,
      formatCurrency,
      formatDate
    };
  }
};
</script>

<style scoped lang="scss">
.predictive-maintenance-dashboard {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      color: #2c3e50;
    }
    
    .controls {
      display: flex;
      gap: 10px;
      
      select {
        padding: 8px 12px;
        border-radius: 4px;
        border: 1px solid #ddd;
        min-width: 200px;
      }
      
      .refresh-btn {
        padding: 8px 16px;
        background: #4682b4;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        
        &:hover {
          background: #3a6d96;
        }
        
        &:disabled {
          background: #a9b7c6;
          cursor: not-allowed;
        }
      }
    }
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px 0;
    
    .spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border-left-color: #4682b4;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    
    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  }
  
  .error-message {
    text-align: center;
    padding: 20px;
    background: #fee;
    border-radius: 6px;
    color: #c33;
    margin: 20px 0;
    
    button {
      background: #4682b4;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      margin-top: 10px;
      cursor: pointer;
      
      &:hover {
        background: #3a6d96;
      }
    }
  }
  
  .prediction-results {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 20px;
    
    .info-card {
      background: white;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      
      h3 {
        margin-top: 0;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
        color: #2c3e50;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        
        th, td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        th {
          font-weight: 600;
          background: #f8f9fa;
        }
      }
    }
    
    .equipment-info {
      grid-column: span 1;
    }
    
    .failure-probability {
      .probability-bars {
        .prob-item {
          margin-bottom: 12px;
          
          .label {
            font-weight: 500;
            margin-bottom: 4px;
          }
          
          .bar-container {
            background: #eee;
            height: 24px;
            border-radius: 4px;
            position: relative;
            overflow: hidden;
            
            .bar {
              height: 100%;
              position: absolute;
              left: 0;
              top: 0;
              transition: width 0.8s ease;
              
              &.low-risk {
                background: #28a745;
              }
              
              &.medium-risk {
                background: #ffc107;
              }
              
              &.high-risk {
                background: #dc3545;
              }
            }
            
            .value {
              position: absolute;
              right: 8px;
              top: 0;
              line-height: 24px;
              font-weight: bold;
              color: #333;
              mix-blend-mode: difference;
              color: white;
            }
          }
        }
      }
    }
    
    .likely-failures {
      .low-risk {
        color: #28a745;
      }
      
      .medium-risk {
        color: #ffc107;
      }
      
      .high-risk {
        color: #dc3545;
      }
    }
    
    .recommendations {
      ul {
        margin-top: 10px;
        padding-left: 20px;
        
        li {
          margin-bottom: 6px;
        }
      }
    }
    
    .cost-benefit {
      grid-column: span 2;
      
      .cost-comparison {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
        
        .cost-item {
          flex: 1;
          padding: 15px;
          border-radius: 6px;
          
          &.preventive {
            background: #e8f4fc;
            border: 1px solid #c5e1f9;
          }
          
          &.reactive {
            background: #fef5e7;
            border: 1px solid #fdebd0;
          }
          
          h4 {
            margin-top: 0;
            margin-bottom: 10px;
          }
          
          p {
            margin: 5px 0;
          }
        }
      }
      
      .recommendation-summary {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
        
        h4 {
          margin-top: 0;
          color: #2c3e50;
        }
      }
    }
  }
  
  .no-data {
    text-align: center;
    padding: 40px;
    background: #f8f9fa;
    border-radius: 6px;
    color: #6c757d;
  }
}

@media (max-width: 992px) {
  .predictive-maintenance-dashboard {
    .prediction-results {
      grid-template-columns: 1fr;
      
      .info-card {
        grid-column: span 1;
      }
      
      .cost-benefit {
        grid-column: span 1;
        
        .cost-comparison {
          flex-direction: column;
        }
      }
    }
  }
}
</style>