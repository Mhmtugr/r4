<template>
  <div class="order-creation">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Yeni Sipariş</h1>
      <router-link :to="{ name: 'Orders' }" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left me-1"></i> Siparişler
      </router-link>
    </div>

    <!-- İlerleme Çubuğu -->
    <div class="mb-4">
      <div class="progress" style="height: 10px;">
        <div 
          class="progress-bar" 
          role="progressbar" 
          :style="`width: ${currentProgress}%`"
          :aria-valuenow="currentProgress" 
          aria-valuemin="0" 
          aria-valuemax="100">
        </div>
      </div>
      <div class="d-flex justify-content-between mt-2">
        <div class="step" :class="{ 'active': currentStep >= 1, 'completed': currentStep > 1 }">
          1. Müşteri Bilgileri
        </div>
        <div class="step" :class="{ 'active': currentStep >= 2, 'completed': currentStep > 2 }">
          2. Teknik Detaylar
        </div>
        <div class="step" :class="{ 'active': currentStep >= 3, 'completed': currentStep > 3 }">
          3. Hücre Bilgileri
        </div>
        <div class="step" :class="{ 'active': currentStep >= 4 }">
          4. Onay
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-body">
        <!-- Adım formları -->
        <div v-if="currentStep === 1">
          <!-- Müşteri Bilgileri - ornekindex.html'den uyarlandı -->
          <h4 class="mb-4">Müşteri ve Sipariş Bilgileri</h4>
          <div class="row mb-3">
            <div class="col-md-4">
              <div class="mb-3">
                <label for="customer" class="form-label">Müşteri Adı <span class="text-danger">*</span></label>
                <select id="customer" v-model="orderData.customerInfo.name" class="form-select" required>
                  <option value="">Müşteri Seçiniz</option>
                  <option>AYEDAŞ</option>
                  <option>BEDAŞ</option>
                  <option>TEİAŞ</option>
                  <option>OSMANİYE ELEKTRİK</option>
                  <option>KEE ENERJİ</option>
                  <option>BAŞKENT ELEKTRİK</option>
                </select>
              </div>
            </div>
            <div class="col-md-4">
              <div class="mb-3">
                <label for="documentNo" class="form-label">Doküman No <span class="text-danger">*</span></label>
                <input type="text" id="documentNo" v-model="orderData.customerInfo.documentNo" class="form-control" placeholder="Sipariş/Doküman No" required>
              </div>
            </div>
            <div class="col-md-4">
              <div class="mb-3">
                <label for="orderDate" class="form-label">Sipariş Tarihi</label>
                <input type="date" id="orderDate" v-model="orderData.customerInfo.orderDate" class="form-control">
              </div>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-4">
              <div class="mb-3">
                <label for="contactPerson" class="form-label">İlgili Kişi <span class="text-danger">*</span></label>
                <input type="text" id="contactPerson" v-model="orderData.customerInfo.contactPerson" class="form-control" placeholder="İlgili Kişi Adı" required>
              </div>
            </div>
            <div class="col-md-4">
              <div class="mb-3">
                <label for="contactEmail" class="form-label">E-posta</label>
                <input type="email" id="contactEmail" v-model="orderData.customerInfo.contactEmail" class="form-control" placeholder="E-posta Adresi">
              </div>
            </div>
            <div class="col-md-4">
              <div class="mb-3">
                <label for="contactPhone" class="form-label">Telefon</label>
                <input type="tel" id="contactPhone" v-model="orderData.customerInfo.contactPhone" class="form-control" placeholder="Telefon Numarası">
              </div>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <div class="mb-3">
                <label for="deliveryDate" class="form-label">İstenen Teslim Tarihi</label>
                <input type="date" id="deliveryDate" v-model="orderData.customerInfo.deliveryDate" class="form-control">
              </div>
            </div>
            <div class="col-md-6">
              <div class="mb-3">
                <label for="priority" class="form-label">Öncelik</label>
                <select id="priority" v-model="orderData.customerInfo.priority" class="form-select">
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                </select>
              </div>
            </div>
          </div>
          <div class="mb-3">
            <label for="notes" class="form-label">Notlar</label>
            <textarea id="notes" v-model="orderData.customerInfo.notes" class="form-control" rows="3" placeholder="Sipariş ile ilgili ek notlar..."></textarea>
          </div>
        </div>

        <div v-if="currentStep === 2">
          <!-- Teknik Detaylar - ornekindex.html'den uyarlandı -->
          <h4 class="mb-4">Teknik Detaylar</h4>
          <div class="row mb-3">
            <div class="col-md-4">
              <div class="mb-3">
                <label for="voltageLevel" class="form-label">Gerilim Seviyesi <span class="text-danger">*</span></label>
                <select id="voltageLevel" v-model="orderData.technicalInfo.voltageLevel" class="form-select" required>
                  <option value="">Seçiniz</option>
                  <option value="12">12 kV</option>
                  <option value="24">24 kV</option>
                  <option value="36">36 kV</option>
                </select>
              </div>
            </div>
            <div class="col-md-4">
              <div class="mb-3">
                <label for="controlVoltage" class="form-label">Kontrol Gerilimi</label>
                <select id="controlVoltage" v-model="orderData.technicalInfo.controlVoltage" class="form-select">
                  <option value="">Seçiniz</option>
                  <option value="24DC">24V DC</option>
                  <option value="48DC">48V DC</option>
                  <option value="110DC">110V DC</option>
                  <option value="220AC">220V AC</option>
                </select>
              </div>
            </div>
            <div class="col-md-4">
              <div class="mb-3">
                <label for="standardVersion" class="form-label">Standart Versiyon</label>
                <select id="standardVersion" v-model="orderData.technicalInfo.standardVersion" class="form-select">
                  <option value="">Seçiniz</option>
                  <option value="IEC">IEC</option>
                  <option value="ANSI">ANSI</option>
                  <option value="GOST">GOST</option>
                  <option value="VDE">VDE</option>
                </select>
              </div>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-4">
              <div class="mb-3">
                <label for="shortCircuitRating" class="form-label">Kısa Devre Dayanım</label>
                <select id="shortCircuitRating" v-model="orderData.technicalInfo.shortCircuitRating" class="form-select">
                  <option value="">Seçiniz</option>
                  <option value="16">16 kA</option>
                  <option value="20">20 kA</option>
                  <option value="25">25 kA</option>
                  <option value="31.5">31.5 kA</option>
                </select>
              </div>
            </div>
            <div class="col-md-4">
              <div class="mb-3">
                <label for="frequencyRating" class="form-label">Frekans</label>
                <select id="frequencyRating" v-model="orderData.technicalInfo.frequencyRating" class="form-select">
                  <option value="">Seçiniz</option>
                  <option value="50">50 Hz</option>
                  <option value="60">60 Hz</option>
                </select>
              </div>
            </div>
            <div class="col-md-4">
              <div class="mb-3">
                <label for="protectionDegree" class="form-label">Koruma Derecesi</label>
                <select id="protectionDegree" v-model="orderData.technicalInfo.protectionDegree" class="form-select">
                  <option value="">Seçiniz</option>
                  <option value="IP2X">IP2X</option>
                  <option value="IP3X">IP3X</option>
                  <option value="IP4X">IP4X</option>
                  <option value="IP54">IP54</option>
                </select>
              </div>
            </div>
          </div>
          <div class="mb-3">
            <label for="technicalNotes" class="form-label">Özel Teknik Notlar</label>
            <textarea id="technicalNotes" v-model="orderData.technicalInfo.notes" class="form-control" rows="3" placeholder="Teknik detaylar ile ilgili ek notlar..."></textarea>
          </div>
        </div>

        <div v-if="currentStep === 3">
          <!-- Hücre Bilgileri - ornekindex.html'den uyarlandı -->
          <h4 class="mb-4">Hücre Bilgileri</h4>
          
          <div v-for="(cell, index) in orderData.cells" :key="`cell-${index}`" class="card mb-3 p-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="mb-0">Hücre #{{ index + 1 }}</h5>
              <button v-if="orderData.cells.length > 1" @click="removeCell(index)" class="btn btn-sm btn-outline-danger">
                <i class="bi bi-trash"></i>
              </button>
            </div>
            
            <div class="row mb-3">
              <div class="col-md-4">
                <div class="mb-3">
                  <label :for="`cellType-${index}`" class="form-label">Hücre Tipi <span class="text-danger">*</span></label>
                  <select :id="`cellType-${index}`" v-model="cell.productTypeCode" class="form-select" required>
                    <option value="">Seçiniz</option>
                    <option value="RM36-CB">RM 36 CB</option>
                    <option value="RM36-LB">RM 36 LB</option>
                    <option value="RM36-FL">RM 36 FL</option>
                    <option value="RM36-VT">RM 36 VT</option>
                    <option value="RM36-RMU">RM 36 RMU</option>
                  </select>
                </div>
              </div>
              <div class="col-md-4">
                <div class="mb-3">
                  <label :for="`quantity-${index}`" class="form-label">Miktar <span class="text-danger">*</span></label>
                  <input type="number" :id="`quantity-${index}`" v-model.number="cell.quantity" class="form-control" min="1" required>
                </div>
              </div>
              <div class="col-md-4">
                <div class="mb-3">
                  <label :for="`ratedCurrent-${index}`" class="form-label">Anma Akımı</label>
                  <select :id="`ratedCurrent-${index}`" v-model="cell.ratedCurrent" class="form-select">
                    <option value="">Seçiniz</option>
                    <option value="630">630 A</option>
                    <option value="1250">1250 A</option>
                    <option value="2000">2000 A</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="row mb-3">
              <div class="col-md-6">
                <div class="mb-3">
                  <label :for="`ctSpec-${index}`" class="form-label">Akım Trafosu Özellikleri</label>
                  <select :id="`ctSpec-${index}`" v-model="cell.ctSpec" class="form-select">
                    <option value="">Seçiniz</option>
                    <option value="100-200/5/5A">100-200/5/5A 15VA CL0.5</option>
                    <option value="200-400/5/5A">200-400/5/5A 15VA CL0.5</option>
                    <option value="300-600/5/5A">300-600/5/5A 15VA CL0.5</option>
                  </select>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label :for="`vtSpec-${index}`" class="form-label">Gerilim Trafosu Özellikleri</label>
                  <select :id="`vtSpec-${index}`" v-model="cell.vtSpec" class="form-select">
                    <option value="">Seçiniz</option>
                    <option value="36/0.1kV">36/0.1kV 50VA CL0.5</option>
                    <option value="24/0.1kV">24/0.1kV 50VA CL0.5</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="row mb-3">
              <div class="col-md-6">
                <div class="mb-3">
                  <label :for="`relayType-${index}`" class="form-label">Röle Tipi</label>
                  <select :id="`relayType-${index}`" v-model="cell.relayType" class="form-select">
                    <option value="">Seçiniz</option>
                    <option value="SIEMENS-7SR">SIEMENS 7SR</option>
                    <option value="ABB-REF">ABB REF</option>
                    <option value="SCHNEIDER-P">SCHNEIDER P</option>
                  </select>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label :for="`motorControl-${index}`" class="form-label">Motor Kontrolü</label>
                  <select :id="`motorControl-${index}`" v-model="cell.motorControl" class="form-select">
                    <option value="none">Yok</option>
                    <option value="24DC">24V DC</option>
                    <option value="48DC">48V DC</option>
                    <option value="110DC">110V DC</option>
                    <option value="220AC">220V AC</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="mb-3">
              <label :for="`cellNotes-${index}`" class="form-label">Hücre Notları</label>
              <textarea :id="`cellNotes-${index}`" v-model="cell.notes" class="form-control" rows="2" placeholder="Hücre ile ilgili özel notlar..."></textarea>
            </div>
          </div>
          
          <div class="d-flex justify-content-center mt-4">
            <button @click="addCell" class="btn btn-outline-primary">
              <i class="bi bi-plus-circle me-1"></i> Yeni Hücre Ekle
            </button>
          </div>
        </div>

        <div v-if="currentStep === 4">
          <!-- Onay - ornekindex.html'den uyarlandı -->
          <h4 class="mb-4">Sipariş Onayı</h4>
          
          <div class="card mb-4">
            <div class="card-header">
              <h5>Müşteri Bilgileri</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-4">
                  <p class="mb-1"><strong>Müşteri:</strong> {{ orderData.customerInfo.name }}</p>
                  <p class="mb-1"><strong>Doküman No:</strong> {{ orderData.customerInfo.documentNo }}</p>
                  <p class="mb-1"><strong>İlgili Kişi:</strong> {{ orderData.customerInfo.contactPerson }}</p>
                </div>
                <div class="col-md-4">
                  <p class="mb-1"><strong>Sipariş Tarihi:</strong> {{ formatDate(orderData.customerInfo.orderDate) }}</p>
                  <p class="mb-1"><strong>İstenen Teslim:</strong> {{ formatDate(orderData.customerInfo.deliveryDate) }}</p>
                  <p class="mb-1"><strong>Öncelik:</strong> {{ getPriorityText(orderData.customerInfo.priority) }}</p>
                </div>
                <div class="col-md-4">
                  <p class="mb-1"><strong>E-posta:</strong> {{ orderData.customerInfo.contactEmail || '-' }}</p>
                  <p class="mb-1"><strong>Telefon:</strong> {{ orderData.customerInfo.contactPhone || '-' }}</p>
                </div>
              </div>
              <div class="row mt-2" v-if="orderData.customerInfo.notes">
                <div class="col-12">
                  <p class="mb-1"><strong>Notlar:</strong> {{ orderData.customerInfo.notes }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="card mb-4">
            <div class="card-header">
              <h5>Teknik Detaylar</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-4">
                  <p class="mb-1"><strong>Gerilim Seviyesi:</strong> {{ orderData.technicalInfo.voltageLevel }} kV</p>
                  <p class="mb-1"><strong>Kontrol Gerilimi:</strong> {{ orderData.technicalInfo.controlVoltage || '-' }}</p>
                </div>
                <div class="col-md-4">
                  <p class="mb-1"><strong>Standart:</strong> {{ orderData.technicalInfo.standardVersion || '-' }}</p>
                  <p class="mb-1"><strong>Kısa Devre:</strong> {{ orderData.technicalInfo.shortCircuitRating ? orderData.technicalInfo.shortCircuitRating + ' kA' : '-' }}</p>
                </div>
                <div class="col-md-4">
                  <p class="mb-1"><strong>Frekans:</strong> {{ orderData.technicalInfo.frequencyRating ? orderData.technicalInfo.frequencyRating + ' Hz' : '-' }}</p>
                  <p class="mb-1"><strong>Koruma Derecesi:</strong> {{ orderData.technicalInfo.protectionDegree || '-' }}</p>
                </div>
              </div>
              <div class="row mt-2" v-if="orderData.technicalInfo.notes">
                <div class="col-12">
                  <p class="mb-1"><strong>Notlar:</strong> {{ orderData.technicalInfo.notes }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="card mb-4">
            <div class="card-header">
              <h5>Hücre Bilgileri</h5>
            </div>
            <div class="table-responsive">
              <table class="table table-bordered">
                <thead class="table-light">
                  <tr>
                    <th>#</th>
                    <th>Hücre Tipi</th>
                    <th>Miktar</th>
                    <th>Anma Akımı</th>
                    <th>Trafo Özellikleri</th>
                    <th>Röle Tipi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(cell, index) in orderData.cells" :key="`summary-${index}`">
                    <td>{{ index + 1 }}</td>
                    <td>{{ cell.productTypeCode }}</td>
                    <td>{{ cell.quantity }}</td>
                    <td>{{ cell.ratedCurrent ? cell.ratedCurrent + ' A' : '-' }}</td>
                    <td>
                      <div v-if="cell.ctSpec">AT: {{ cell.ctSpec }}</div>
                      <div v-if="cell.vtSpec">GT: {{ cell.vtSpec }}</div>
                      <div v-if="!cell.ctSpec && !cell.vtSpec">-</div>
                    </td>
                    <td>{{ cell.relayType || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="form-check mb-4">
            <input class="form-check-input" type="checkbox" id="confirmOrder" v-model="orderConfirmed">
            <label class="form-check-label" for="confirmOrder">
              Sipariş bilgilerinin doğruluğunu onaylıyorum
            </label>
          </div>
          
          <div class="alert alert-info d-flex align-items-center" role="alert">
            <i class="bi bi-info-circle me-2"></i>
            <div>
              Sipariş onaylandıktan sonra planlamaya aktarılacak ve üretim sürecine alınacaktır. 
              Lütfen bilgilerin doğruluğunu kontrol ediniz.
            </div>
          </div>
        </div>
      </div>
      
      <div class="card-footer d-flex justify-content-between">
        <button
          v-if="!isFirstStep"
          @click="prevStep"
          class="btn btn-outline-secondary"
          type="button"
          :disabled="isLoading"
        >
          <i class="bi bi-chevron-left me-1"></i> Önceki Adım
        </button>
        <div v-else></div>
        
        <div>
          <button
            v-if="!isLastStep"
            @click="nextStep"
            class="btn btn-primary"
            type="button"
            :disabled="!canProceed"
          >
            Sonraki Adım <i class="bi bi-chevron-right ms-1"></i>
          </button>
          
          <button
            v-if="isLastStep"
            @click="submitOrder"
            class="btn btn-success"
            type="button"
            :disabled="!canSubmit || isLoading"
          >
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
            Siparişi Oluştur
          </button>
          
          <button
            v-if="isLastStep"
            @click="cancelOrder"
            class="btn btn-outline-danger ms-2"
            type="button"
            :disabled="isLoading"
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useOrderCreation } from '@/modules/orders/useOrderCreation';

// useOrderCreation composable'dan gerekli state ve metotları al
const {
  isLoading,
  currentStep,
  totalSteps,
  orderData,
  
  isFirstStep,
  isLastStep,
  currentProgress,
  
  addCell,
  removeCell,
  addProject,
  removeProject,
  nextStep,
  prevStep,
  saveOrder,
  cancelOrder
} = useOrderCreation();

// Sipariş onay checkbox'ı
const orderConfirmed = ref(false);

// Sonraki adıma geçiş kontrolü
const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return orderData.customerInfo.name && 
           orderData.customerInfo.documentNo && 
           orderData.customerInfo.contactPerson;
  }
  
  if (currentStep.value === 3) {
    return orderData.cells.length > 0 && 
           orderData.cells.every(cell => cell.productTypeCode && cell.quantity > 0);
  }
  
  return true;
});

// Sipariş gönderme kontrolü
const canSubmit = computed(() => {
  return orderConfirmed.value;
});

// Siparişi oluştur
async function submitOrder() {
  try {
    const orderId = await saveOrder();
    if (orderId) {
      // Başarı durumu
      console.log('Sipariş başarıyla oluşturuldu:', orderId);
    }
  } catch (error) {
    console.error('Sipariş oluşturulurken hata:', error);
  }
}

// Tarih formatla
function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('tr-TR');
  } catch (e) {
    return dateString;
  }
}

// Öncelik metni
function getPriorityText(priority) {
  const priorities = {
    'low': 'Düşük',
    'medium': 'Orta',
    'high': 'Yüksek'
  };
  return priorities[priority] || priority || '-';
}

// Proje tipi metni
function getProjectTypeText(type) {
  const types = {
    'mechanical': 'Mekanik',
    'electrical': 'Elektrik',
    'automation': 'Otomasyon',
    'installation': 'Montaj',
    'other': 'Diğer'
  };
  
  return types[type] || type || '-';
}
</script>

<style scoped>
.step {
  flex: 1;
  text-align: center;
  font-size: 0.9rem;
  color: #6c757d;
  position: relative;
}

.step.active {
  color: #0d6efd;
  font-weight: 500;
}

.step.completed {
  color: #198754;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .step {
    font-size: 0.8rem;
  }
}
</style>