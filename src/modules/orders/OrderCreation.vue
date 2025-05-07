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
        <div v-if="currentStep === 1">
          <!-- Adım 1: Müşteri Bilgileri -->
          <h3>Müşteri Bilgileri</h3>
          <div class="row g-3">
            <div class="col-md-6">
              <label for="customerName" class="form-label">Müşteri Adı*</label>
              <input
                type="text"
                id="customerName"
                v-model="orderData.customerInfo.name"
                class="form-control"
                required
                placeholder="Müşteri firma adı"
              />
            </div>
            <div class="col-md-6">
              <label for="documentNo" class="form-label">Doküman No*</label>
              <input
                type="text"
                id="documentNo"
                v-model="orderData.customerInfo.documentNo"
                class="form-control"
                required
                placeholder="Sipariş/Teklif/Müşteri doküman numarası"
              />
            </div>
            <div class="col-md-6">
              <label for="projectName" class="form-label">Proje Adı</label>
              <input
                type="text"
                id="projectName"
                v-model="orderData.customerInfo.projectName"
                class="form-control"
                placeholder="Proje adı/referansı"
              />
            </div>
            <div class="col-md-6">
              <label for="contractNo" class="form-label">Sözleşme No</label>
              <input
                type="text"
                id="contractNo"
                v-model="orderData.customerInfo.contractNo"
                class="form-control"
                placeholder="Sözleşme numarası"
              />
            </div>
            <div class="col-md-6">
              <label for="contactPerson" class="form-label">İletişim Kişisi*</label>
              <input
                type="text"
                id="contactPerson"
                v-model="orderData.customerInfo.contactPerson"
                class="form-control"
                required
                placeholder="Müşteri iletişim kişisi"
              />
            </div>
            <div class="col-md-6">
              <label for="contactEmail" class="form-label">E-posta</label>
              <input
                type="email"
                id="contactEmail"
                v-model="orderData.customerInfo.contactEmail"
                class="form-control"
                placeholder="iletisim@ornek.com"
              />
            </div>
            <div class="col-md-6">
              <label for="contactPhone" class="form-label">Telefon</label>
              <input
                type="tel"
                id="contactPhone"
                v-model="orderData.customerInfo.contactPhone"
                class="form-control"
                placeholder="+90 (___) ___ __ __"
              />
            </div>
          </div>
        </div>

        <div v-if="currentStep === 2">
          <!-- Adım 2: Teknik Detaylar -->
          <h3>Teknik Detaylar</h3>
          <div class="row g-3">
            <div class="col-md-3">
              <label for="voltage" class="form-label">Gerilim Seviyesi</label>
              <select id="voltage" v-model="orderData.technicalInfo.voltage" class="form-select">
                <option value="12kV">12 kV</option>
                <option value="24kV">24 kV</option>
                <option value="36kV">36 kV</option>
                <option value="other">Diğer</option>
              </select>
            </div>
            <div class="col-md-3">
              <label for="current" class="form-label">Akım Değeri</label>
              <select id="current" v-model="orderData.technicalInfo.current" class="form-select">
                <option value="400A">400 A</option>
                <option value="630A">630 A</option>
                <option value="800A">800 A</option>
                <option value="1250A">1250 A</option>
                <option value="other">Diğer</option>
              </select>
            </div>
            <div class="col-md-3">
              <label for="shortCircuit" class="form-label">Kısa Devre</label>
              <select id="shortCircuit" v-model="orderData.technicalInfo.shortCircuit" class="form-select">
                <option value="16kA">16 kA</option>
                <option value="20kA">20 kA</option>
                <option value="25kA">25 kA</option>
                <option value="other">Diğer</option>
              </select>
            </div>
            <div class="col-md-3">
              <label for="controlVoltage" class="form-label">Kontrol Gerilimi</label>
              <select id="controlVoltage" v-model="orderData.technicalInfo.controlVoltage" class="form-select">
                <option value="24 VDC">24 VDC</option>
                <option value="48 VDC">48 VDC</option>
                <option value="110 VDC">110 VDC</option>
                <option value="220 VAC">220 VAC</option>
                <option value="other">Diğer</option>
              </select>
            </div>
            <div class="col-md-6">
              <label for="specialRequirements" class="form-label">Özel Gereksinimler</label>
              <input
                type="text"
                id="specialRequirements"
                v-model="orderData.technicalInfo.specialRequirements"
                class="form-control"
                placeholder="Özel gereksinimler"
              />
            </div>
            <div class="col-md-6">
              <label for="labelInfo" class="form-label">Etiket Bilgileri</label>
              <input
                type="text"
                id="labelInfo"
                v-model="orderData.technicalInfo.labelInfo"
                class="form-control"
                placeholder="Etiket bilgileri"
              />
            </div>
            <div class="col-md-12">
              <div class="form-check form-check-inline">
                <input
                  type="checkbox"
                  id="specialDesign"
                  v-model="orderData.technicalInfo.specialDesign"
                  class="form-check-input"
                />
                <label for="specialDesign" class="form-check-label">Özel tasarım gerekli</label>
              </div>
              <div class="form-check form-check-inline">
                <input
                  type="checkbox"
                  id="lockingRequired"
                  v-model="orderData.technicalInfo.lockingRequired"
                  class="form-check-input"
                />
                <label for="lockingRequired" class="form-check-label">Kilitleme gerekli</label>
              </div>
            </div>
            <div class="col-md-12">
              <label for="comments" class="form-label">Açıklamalar</label>
              <textarea
                id="comments"
                v-model="orderData.technicalInfo.comments"
                class="form-control"
                rows="3"
                placeholder="Teknik açıklamalar veya notlar"
              ></textarea>
            </div>
          </div>
        </div>

        <div v-if="currentStep === 3">
          <!-- Adım 3: Hücre Bilgileri -->
          <h3>Hücre Bilgileri</h3>
          
          <div v-for="(cell, index) in orderData.cells" :key="index" class="card mb-3">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Hücre {{ index + 1 }}</h5>
              <button 
                v-if="orderData.cells.length > 1" 
                @click="removeCell(index)" 
                class="btn btn-sm btn-outline-danger"
                type="button">
                <i class="bi bi-trash"></i>
              </button>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label :for="`cellType${index}`" class="form-label">Hücre Tipi*</label>
                  <select :id="`cellType${index}`" v-model="cell.productTypeCode" class="form-select" required>
                    <option value="">Seçiniz...</option>
                    <option value="RM 36 CB">RM 36 CB - Kesicili ÇIKIŞ Hücresi</option>
                    <option value="RM 36 LB">RM 36 LB - Yük Ayırıcılı Giriş Hücresi</option>
                    <option value="RM 36 FL">RM 36 FL - Sigortalı Yük Ayırıcılı TR.Koruma Hücresi</option>
                    <option value="RM 36 BC">RM 36 BC - Bara Bağlantı Hücresi</option>
                    <option value="RM 36 MT">RM 36 MT - Ölçü Hücresi</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label :for="`quantity${index}`" class="form-label">Miktar*</label>
                  <input
                    type="number"
                    :id="`quantity${index}`"
                    v-model.number="cell.quantity"
                    class="form-control"
                    required
                    min="1"
                  />
                </div>
                <div class="col-md-12">
                  <label :for="`techValues${index}`" class="form-label">Teknik Değerler</label>
                  <input
                    type="text"
                    :id="`techValues${index}`"
                    v-model="cell.technicalValues"
                    class="form-control"
                    placeholder="Hücre teknik özellikleri"
                  />
                </div>
                <div class="col-md-6">
                  <label :for="`deliveryDate${index}`" class="form-label">Teslim Tarihi</label>
                  <input
                    type="date"
                    :id="`deliveryDate${index}`"
                    v-model="cell.deliveryDate"
                    class="form-control"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div class="d-flex justify-content-start mb-3">
            <button @click="addCell" class="btn btn-outline-primary" type="button">
              <i class="bi bi-plus-circle me-2"></i> Hücre Ekle
            </button>
          </div>
          
          <!-- Projeler -->
          <h3 class="mt-4">Projeler (Opsiyonel)</h3>
          <div v-for="(project, index) in orderData.projects" :key="`project${index}`" class="card mb-3">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Proje {{ index + 1 }}</h5>
              <button 
                @click="removeProject(index)" 
                class="btn btn-sm btn-outline-danger"
                type="button">
                <i class="bi bi-trash"></i>
              </button>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label :for="`projectName${index}`" class="form-label">Proje Adı</label>
                  <input
                    type="text"
                    :id="`projectName${index}`"
                    v-model="project.name"
                    class="form-control"
                    placeholder="Proje adı"
                  />
                </div>
                <div class="col-md-6">
                  <label :for="`projectType${index}`" class="form-label">Proje Tipi</label>
                  <select :id="`projectType${index}`" v-model="project.type" class="form-select">
                    <option value="">Seçiniz...</option>
                    <option value="mechanical">Mekanik</option>
                    <option value="electrical">Elektrik</option>
                    <option value="automation">Otomasyon</option>
                    <option value="installation">Montaj</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
                <div class="col-md-12">
                  <label :for="`projectNotes${index}`" class="form-label">Açıklama</label>
                  <textarea
                    :id="`projectNotes${index}`"
                    v-model="project.notes"
                    class="form-control"
                    rows="2"
                    placeholder="Proje açıklaması"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
          
          <div class="d-flex justify-content-start">
            <button @click="addProject" class="btn btn-outline-primary" type="button">
              <i class="bi bi-plus-circle me-2"></i> Proje Ekle
            </button>
          </div>
        </div>

        <div v-if="currentStep === 4">
          <!-- Adım 4: Onay -->
          <h3>Sipariş Onayı</h3>
          
          <div class="alert alert-info">
            Lütfen sipariş bilgilerini kontrol ediniz.
          </div>
          
          <div class="row">
            <div class="col-md-6">
              <div class="card mb-3">
                <div class="card-header">
                  <h5 class="mb-0">Müşteri Bilgileri</h5>
                </div>
                <div class="card-body">
                  <div class="mb-2"><strong>Müşteri:</strong> {{ orderData.customerInfo.name }}</div>
                  <div class="mb-2"><strong>Doküman No:</strong> {{ orderData.customerInfo.documentNo }}</div>
                  <div class="mb-2"><strong>İletişim Kişisi:</strong> {{ orderData.customerInfo.contactPerson }}</div>
                  <div><strong>Tarih:</strong> {{ orderData.orderDate }}</div>
                </div>
              </div>
            </div>
            
            <div class="col-md-6">
              <div class="card mb-3">
                <div class="card-header">
                  <h5 class="mb-0">Teknik Bilgiler</h5>
                </div>
                <div class="card-body">
                  <div class="mb-2"><strong>Gerilim:</strong> {{ orderData.technicalInfo.voltage }}</div>
                  <div class="mb-2"><strong>Akım:</strong> {{ orderData.technicalInfo.current }}</div>
                  <div class="mb-2"><strong>Kısa Devre:</strong> {{ orderData.technicalInfo.shortCircuit }}</div>
                  <div><strong>Kontrol Gerilimi:</strong> {{ orderData.technicalInfo.controlVoltage }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="card mb-3">
            <div class="card-header">
              <h5 class="mb-0">Hücreler</h5>
            </div>
            <div class="card-body p-0">
              <table class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tip</th>
                    <th>Teknik Değerler</th>
                    <th>Miktar</th>
                    <th>Teslim Tarihi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(cell, index) in orderData.cells" :key="`summary${index}`">
                    <td>{{ index + 1 }}</td>
                    <td>{{ cell.productTypeCode }}</td>
                    <td>{{ cell.technicalValues }}</td>
                    <td>{{ cell.quantity }} Adet</td>
                    <td>{{ cell.deliveryDate || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div v-if="orderData.projects && orderData.projects.length > 0" class="card mb-3">
            <div class="card-header">
              <h5 class="mb-0">Projeler</h5>
            </div>
            <div class="card-body p-0">
              <table class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Proje Adı</th>
                    <th>Tipi</th>
                    <th>Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(project, index) in orderData.projects" :key="`projectSummary${index}`">
                    <td>{{ index + 1 }}</td>
                    <td>{{ project.name }}</td>
                    <td>{{ getProjectTypeText(project.type) }}</td>
                    <td>{{ project.notes }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="card mb-3">
            <div class="card-header">
              <h5 class="mb-0">Sipariş Notları</h5>
            </div>
            <div class="card-body">
              <textarea
                v-model="orderData.notes"
                class="form-control"
                rows="3"
                placeholder="Sipariş ile ilgili eklemek istediğiniz notlar"
              ></textarea>
            </div>
          </div>
          
          <div class="mb-3">
            <div class="form-check">
              <input type="checkbox" id="confirmOrder" v-model="orderConfirmed" class="form-check-input" />
              <label for="confirmOrder" class="form-check-label">
                Siparişi onaylıyorum ve bilgilerin doğruluğunu teyit ediyorum.
              </label>
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
import { useOrderCreation } from './useOrderCreation';

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