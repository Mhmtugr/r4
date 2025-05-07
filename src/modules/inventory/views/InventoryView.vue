<template>
  <div class="inventory-container p-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Envanter ve Malzeme Yönetimi</h2>
      <!-- TODO: Genel arama veya aksiyon butonu eklenebilir -->
    </div>

    <!-- Sekmeler -->
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'lists' }" @click="activeTab = 'lists'">
          Malzeme Listeleri
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'stock' }" @click="activeTab = 'stock'">
          Stok Durumu
        </button>
      </li>
      <!-- Başka sekmeler eklenebilir (örn: Malzeme Detayları) -->
    </ul>

    <!-- Sekme İçeriği -->
    <div class="tab-content">
      <!-- Malzeme Listeleri Sekmesi -->
      <div v-show="activeTab === 'lists'" class="tab-pane fade show active">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="filters d-flex gap-2">
            <!-- TODO: Filtreleme Bileşenleri (Liste Tipi, Hücre Tipi, Arama) -->
            <input type="text" class="form-control form-control-sm w-auto" placeholder="Listelerde ara...">
            <select class="form-select form-select-sm w-auto">
              <option value="">Tüm Tipler</option>
              <option value="primer">Primer</option>
              <option value="sekonder">Sekonder</option>
            </select>
             <select class="form-select form-select-sm w-auto">
              <option value="">Tüm Hücre Tipleri</option>
              <!-- TODO: Hücre tipleri dinamik yüklenecek -->
              <option value="RM 36 CB">RM 36 CB</option>
              <option value="RM 36 LB">RM 36 LB</option>
            </select>
          </div>
          <button class="btn btn-success btn-sm" @click="openAddMaterialListModal">
            <i class="bi bi-plus-circle"></i> Yeni Malzeme Listesi
          </button>
        </div>
        <!-- TODO: Malzeme Listeleri Tablo Bileşeni (MaterialListsTable.vue) -->
        <p>Malzeme listeleri yükleniyor...</p>
      </div>

      <!-- Stok Durumu Sekmesi -->
      <div v-show="activeTab === 'stock'" class="tab-pane fade show active">
         <h4>Stok Durumu Kontrolü</h4>
         <!-- TODO: Stok durumu arama ve görüntüleme bileşeni -->
         <p>Stok durumu görünümü buraya gelecek.</p>
      </div>
    </div>

    <!-- TODO: Modallar (Liste Detay/Düzenle, Malzeme Ekle/Düzenle, İçe Aktar vb.) -->
    <!-- Örnek: <MaterialListDetailModal v-model:visible="isDetailModalVisible" :list-id="currentListId" @list-updated="refreshLists" /> -->

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// TODO: Composable fonksiyonları import et (useMaterialLists, useStockManagement)
// TODO: Alt bileşenleri import et (MaterialListsTable, Modals...)

const activeTab = ref('lists'); // Başlangıç sekmesi
const isLoading = ref(true);
const error = ref(null);

// TODO: Modal görünürlük state'leri
// const isDetailModalVisible = ref(false);
// const currentListId = ref(null);

const loadInitialData = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    // TODO: Gerekli verileri yükle (örn: malzeme listeleri)
    // await loadMaterialLists();
    console.log('InventoryView: Initial data loading...');
  } catch (err) {
    console.error('InventoryView: Veri yükleme hatası:', err);
    error.value = err;
  } finally {
    isLoading.value = false;
  }
};

const openAddMaterialListModal = () => {
  console.log('Yeni malzeme listesi modalı açılacak');
  // TODO: Modal açma mantığı
};

const refreshLists = () => {
  console.log('Liste yenileme tetiklendi');
  // TODO: Malzeme listelerini yeniden yükle
};

onMounted(() => {
  loadInitialData();
});

</script>

<style scoped>
/* inventory/styles içindeki stiller buraya taşınabilir */
.nav-link {
  cursor: pointer;
}
</style>