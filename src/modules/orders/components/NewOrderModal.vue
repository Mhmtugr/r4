<template>
  <div class="modal fade" id="newOrderModalComponent" tabindex="-1" aria-labelledby="newOrderModalLabel" aria-hidden="true" ref="modalRef">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="newOrderModalLabel">Yeni Sipariş Ekle</h5>
          <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveOrder">
            <!-- Sipariş Genel Bilgileri -->
            <div class="row mb-3">
              <div class="col-md-6">
                <label for="orderNumber" class="form-label">Sipariş No</label>
                <input type="text" class="form-control" id="orderNumber" :value="generatedOrderId" readonly>
              </div>
              <div class="col-md-6">
                <label for="orderDate" class="form-label">Sipariş Tarihi</label>
                <input type="date" class="form-control" id="orderDate" v-model="orderData.orderDate" required>
              </div>
            </div>
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="customer" class="form-label">Müşteri</label>
                    <select class="form-select" id="customer" v-model="orderData.customer" required>
                        <option value="" disabled>Seçiniz</option>
                        <option>AYEDAŞ</option>
                        <option>BEDAŞ</option>
                        <option>TEİAŞ</option>
                        <option>ENERJİSA</option>
                        <option>OSMANİYE ELEKTRİK</option>
                        <option>DİĞER</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <label for="projectNumber" class="form-label">Proje No</label>
                    <input type="text" class="form-control" id="projectNumber" v-model="orderData.projectNumber">
                </div>
            </div>
            <div class="row mb-3">
                 <div class="col-md-6">
                     <label for="deliveryDate" class="form-label">Planlanan Teslim Tarihi</label>
                     <input type="date" class="form-control" id="deliveryDate" v-model="orderData.deliveryDate" required>
                 </div>
                 <div class="col-md-6">
                     <label for="incoterm" class="form-label">Teslim Şekli (Incoterm)</label>
                     <select class="form-select" id="incoterm" v-model="orderData.incoterm">
                         <option selected>Seçiniz</option>
                         <option>Nakliye Dahil, İndirme Hariç</option>
                         <option>FCA - Fabrika Teslim</option>
                         <option>FOB - Gemi Bordasında Teslim</option>
                         <option>CIF - Mal Bedeli, Sigorta ve Navlun Ödenmiş Olarak Teslim</option>
                     </select>
                 </div>
             </div>
            <hr>
            <!-- Hücre Bilgileri -->
            <h5 class="mb-3">Hücre Bilgileri</h5>
            <div class="row mb-3">
                 <div class="col-md-4">
                     <label for="cellType" class="form-label">Hücre Tipi</label>
                     <select class="form-select" id="cellType" v-model="orderData.cellType" required>
                         <option value="" disabled>Seçiniz</option>
                         <option>RM 36 CB</option>
                         <option>RM 36 LB</option>
                         <option>RM 36 FL</option>
                         <option>RMU</option>
                     </select>
                 </div>
                 <div class="col-md-4">
                     <label for="quantity" class="form-label">Miktar</label>
                     <input type="number" class="form-control" id="quantity" min="1" v-model.number="orderData.quantity" required>
                 </div>
                 <div class="col-md-4">
                     <label for="cellCode" class="form-label">Hücre Kodu</label>
                     <input type="text" class="form-control" id="cellCode" v-model="orderData.cellCode">
                 </div>
             </div>
             <!-- Diğer Hücre Bilgisi Alanları (Gerilim, Akım vb.) -->
              <div class="row mb-3">
                  <div class="col-md-6">
                      <label for="voltage" class="form-label">Çalışma Gerilimi</label>
                      <select class="form-select" id="voltage" v-model="orderData.voltage">
                          <option selected>36kV</option>
                          <option>24kV</option>
                          <option>12kV</option>
                      </select>
                  </div>
                  <div class="col-md-6">
                      <label for="current" class="form-label">Nominal Çalışma Akımı</label>
                      <select class="form-select" id="current" v-model="orderData.current">
                          <option selected>630A</option>
                          <option>1250A</option>
                          <option>2000A</option>
                          <option>4000A</option>
                      </select>
                  </div>
              </div>
               <div class="row mb-3">
                  <div class="col-md-6">
                      <label for="shortCircuit" class="form-label">Kısa Devre Akımı</label>
                      <select class="form-select" id="shortCircuit" v-model="orderData.shortCircuit">
                          <option selected>16kA</option>
                          <option>20kA</option>
                          <option>25kA</option>
                          <option>31.5kA</option>
                      </select>
                  </div>
                  <div class="col-md-6">
                      <label for="controlVoltage" class="form-label">Kontrol Gerilimi</label>
                      <select class="form-select" id="controlVoltage" v-model="orderData.controlVoltage">
                          <option selected>24 VDC</option>
                          <option>48 VDC</option>
                          <option>110 VDC</option>
                          <option>220 VAC</option>
                      </select>
                  </div>
              </div>
              <div class="mb-3">
                  <label for="cellDescription" class="form-label">Teknik Değer ve Ürün Tanımı</label>
                  <textarea class="form-control" id="cellDescription" rows="2" v-model="orderData.cellDescription"></textarea>
              </div>
            <hr>
            <!-- Ekipman Seçimleri -->
            <h5 class="mb-3">Ekipman Seçimleri</h5>
            <!-- Ekipman Alanları (Akım Trafosu, Röle vb.) -->
             <div class="row mb-3">
                 <div class="col-md-6">
                     <label for="currentTransformer" class="form-label">Akım Trafosu</label>
                     <select class="form-select" id="currentTransformer" v-model="orderData.equipment.currentTransformer">
                         <option selected>Seçiniz</option>
                         <option>200-400/5-5A 5P20 7,5/15VA</option>
                         <option>300-600/5-5A 5P20 7,5/15VA</option>
                         <option>400-800/5-5A 5P20 7,5/15VA</option>
                     </select>
                 </div>
                 <div class="col-md-6">
                     <label for="voltageTransformer" class="form-label">Gerilim Trafosu (Canias Kodu)</label>
                     <input type="text" class="form-control" id="voltageTransformer" v-model="orderData.equipment.voltageTransformer">
                 </div>
             </div>
              <!-- Diğer ekipman alanları... -->

            <hr>
            <!-- Diğer Bilgiler -->
             <div class="mb-3">
                 <label for="otherFeatures" class="form-label">Diğer Özellikler</label>
                 <textarea class="form-control" id="otherFeatures" rows="2" placeholder="Örneğin: *Motorlu *Kablo başlıkları Euromold marka. *UKD 10 m." v-model="orderData.otherFeatures"></textarea>
             </div>
             <div class="mb-3">
                 <label class="form-label">Özel Tasarım Gerekli Mi?</label>
                 <div class="form-check form-check-inline">
                     <input class="form-check-input" type="radio" name="customDesign" id="customDesignNo" :value="false" v-model="orderData.customDesignRequired">
                     <label class="form-check-label" for="customDesignNo">Gerekli değil</label>
                 </div>
                 <div class="form-check form-check-inline">
                     <input class="form-check-input" type="radio" name="customDesign" id="customDesignYes" :value="true" v-model="orderData.customDesignRequired">
                     <label class="form-check-label" for="customDesignYes">Gerekli</label>
                 </div>
             </div>
             <!-- Kilitleme, Etiket vb. alanlar -->
             <div class="mb-3">
                 <label for="comments" class="form-label">Yorumlar</label>
                 <textarea class="form-control" id="comments" rows="2" v-model="orderData.comments"></textarea>
             </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">Kapat</button>
          <button type="button" class="btn btn-primary" @click="saveOrder">Siparişi Kaydet</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { Modal } from 'bootstrap';
// import apiService from '@/services/api-service';

const props = defineProps({
  // Eğer mevcut bir siparişi düzenlemek için açılıyorsa:
  // initialOrderData: { type: Object, default: null }
});

const emit = defineEmits(['close', 'order-saved']);

const modalRef = ref(null);
let modalInstance = null;

const orderData = ref({
  orderDate: new Date().toISOString().slice(0, 10), // Default to today
  customer: '',
  projectNumber: '',
  deliveryDate: '',
  incoterm: 'Seçiniz',
  cellType: '',
  quantity: 1,
  cellCode: '',
  voltage: '36kV',
  current: '630A',
  shortCircuit: '16kA',
  controlVoltage: '24 VDC',
  cellDescription: '',
  equipment: { // Ekipmanları bir nesne altında toplamak daha iyi olabilir
      currentTransformer: 'Seçiniz',
      voltageTransformer: '',
      // ... diğer ekipmanlar
  },
  otherFeatures: '',
  customDesignRequired: false,
  // lockingWorkRequired: false,
  // labels: 'standardTurkish',
  // referenceDocuments: '',
  comments: ''
});

onMounted(() => {
  if (modalRef.value) {
    modalInstance = new Modal(modalRef.value);
    // Modal'ı programatik olarak göstermek yerine OrderList'ten kontrol edilebilir
    // modalInstance.show();

    // Props'tan gelen veri varsa formu doldur
    // if (props.initialOrderData) {
    //    Object.assign(orderData.value, props.initialOrderData);
    // }
  }
});

onBeforeUnmount(() => {
  modalInstance?.dispose();
});

const generatedOrderId = computed(() => {
    // if (props.initialOrderData) return props.initialOrderData.id;
    const date = new Date();
    const year = date.getFullYear().toString().substring(2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `#${year}${month}-${randomNum}`; // Daha unique ID
});

const closeModal = () => {
  modalInstance?.hide();
  emit('close');
};

const saveOrder = async () => {
  console.log('Saving order:', orderData.value);
  try {
      // const savedOrder = await apiService.saveOrder({...orderData.value, id: generatedOrderId.value });
      // emit('order-saved', savedOrder);
      alert('Sipariş başarıyla kaydedildi (simülasyon).');
      closeModal();
  } catch (error) {
      console.error("Sipariş kaydedilemedi:", error);
      alert("Sipariş kaydedilirken bir hata oluştu.");
  }
};

// Props'tan gelen veriyi izleyerek formu güncellemek için watcher eklenebilir
// watch(() => props.initialOrderData, (newData) => {
//   if (newData) {
//     Object.assign(orderData.value, newData);
//   } else {
//     // Formu sıfırla
//   }
// });

</script>

<style scoped>
/* Modal özel stilleri */
textarea {
    resize: vertical;
}
</style> 