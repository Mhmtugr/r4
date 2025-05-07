<template>
  <div class="settings-view">
    <div class="row">
      <!-- Sistem Ayarları -->
      <div class="col-md-6">
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="mb-0">Sistem Ayarları</h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="saveSystemSettings">
              <div class="mb-3">
                <label for="companyName" class="form-label">Şirket Adı</label>
                <input type="text" class="form-control" id="companyName" v-model="systemSettings.companyName">
              </div>
              <div class="mb-3">
                <label for="timezone" class="form-label">Zaman Dilimi</label>
                <select class="form-select" id="timezone" v-model="systemSettings.timezone">
                  <option>(UTC+03:00) İstanbul</option>
                  <option>(UTC+01:00) Berlin</option>
                  <option>(UTC+00:00) Londra</option>
                  <option>(UTC-05:00) New York</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="dateFormat" class="form-label">Tarih Formatı</label>
                <select class="form-select" id="dateFormat" v-model="systemSettings.dateFormat">
                  <option>DD.MM.YYYY</option>
                  <option>MM/DD/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">ERP Entegrasyonu</label>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="erpIntegration" v-model="systemSettings.erpIntegration">
                  <label class="form-check-label" for="erpIntegration">Canias ERP ile entegrasyon aktif</label>
                </div>
              </div>
              <button type="submit" class="btn btn-primary">Sistem Ayarlarını Kaydet</button>
            </form>
          </div>
        </div>
      </div>

      <!-- Kullanıcı Yönetimi -->
      <div class="col-md-6">
        <div class="card mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Kullanıcı Yönetimi</h5>
             <button class="btn btn-sm btn-primary" @click="openAddUserModal">
                 <i class="bi bi-plus"></i> Yeni Kullanıcı Ekle
             </button>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Ad Soyad</th>
                    <th>Departman</th>
                    <th>Rol</th>
                    <th>Durum</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Dinamik Veri -->
                  <tr v-for="user in users" :key="user.id">
                    <td>{{ user.name }}</td>
                    <td>{{ user.department }}</td>
                    <td>{{ user.role }}</td>
                    <td><span :class="getUserStatusClass(user.isActive)">{{ user.isActive ? 'Aktif' : 'Pasif' }}</span></td>
                    <td>
                      <button class="btn btn-sm btn-outline-secondary" @click="editUser(user)"><i class="bi bi-pencil"></i></button>
                    </td>
                  </tr>
                   <tr v-if="users.length === 0">
                      <td colspan="5" class="text-center">Kullanıcı bulunamadı.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Yapay Zeka Ayarları -->
    <div class="row">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Yapay Zeka Ayarları</h5>
                </div>
                <div class="card-body">
                    <form @submit.prevent="saveAiSettings">
                        <div class="mb-3">
                            <label class="form-label">Yapay Zeka Modülleri</label>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="aiProduction" v-model="aiSettings.modules.production">
                                <label class="form-check-label" for="aiProduction">Üretim Tahmini Modülü</label>
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="aiMaterial" v-model="aiSettings.modules.material">
                                <label class="form-check-label" for="aiMaterial">Malzeme Tahmini Modülü</label>
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="aiTechnical" v-model="aiSettings.modules.technical">
                                <label class="form-check-label" for="aiTechnical">Teknik Destek Modülü</label>
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="aiAnalysis" v-model="aiSettings.modules.analysis">
                                <label class="form-check-label" for="aiAnalysis">Analiz Modülü (Deneysel)</label>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="aiModel" class="form-label">Model Seçimi</label>
                            <select class="form-select" id="aiModel" v-model="aiSettings.model">
                                <option>GPT-4 (OpenAI)</option>
                                <option>GPT-3.5 Turbo (OpenAI)</option>
                                <option>DeepSeek (Yerel Model)</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="apiKey" class="form-label">API Anahtarı</label>
                            <input type="password" class="form-control" id="apiKey" placeholder="sk-..." v-model="aiSettings.apiKey">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Eğitim Verileri</label>
                            <div class="form-text mb-2">Sistemin öğrenmesi için teknik dokümanları yükleyin:</div>
                            <input type="file" class="form-control" multiple @change="handleFileUpload">
                            <!-- Yüklenen dosyalar listelenebilir -->
                        </div>
                        <button type="submit" class="btn btn-primary">Yapay Zeka Ayarlarını Kaydet</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Kullanıcı Ekleme Modalı -->
    <AddUserModal :show="isAddUserModalOpen" @close="closeAddUserModal" @user-added="handleUserAdded" />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
// import apiService from '@/services/api-service';
import AddUserModal from '@/modules/settings/components/AddUserModal.vue';

const systemSettings = ref({
    companyName: 'Mehmet Endüstriyel',
    timezone: '(UTC+03:00) İstanbul',
    dateFormat: 'DD.MM.YYYY',
    erpIntegration: true
});

const users = ref([]);

const aiSettings = ref({
    modules: {
        production: true,
        material: true,
        technical: true,
        analysis: false
    },
    model: 'DeepSeek (Yerel Model)', // Varsayılanı config'den alabilir
    apiKey: '' // Güvenli bir şekilde saklanmalı
});

const isAddUserModalOpen = ref(false);

onMounted(async () => {
    // Veri çekme
    // const settings = await apiService.getSystemSettings();
    // Object.assign(systemSettings.value, settings);
    // users.value = await apiService.getUsers();
    // const currentAiSettings = await apiService.getAiSettings();
    // Object.assign(aiSettings.value, currentAiSettings);

    // Örnek Kullanıcı Verileri
    users.value = [
        { id: 'user1', name: 'Ahmet Yılmaz', department: 'Elektrik Tasarım', role: 'Yönetici', isActive: true },
        { id: 'user2', name: 'Mehmet Demir', department: 'Mekanik Tasarım', role: 'Kullanıcı', isActive: true },
        { id: 'user3', name: 'Ayşe Kaya', department: 'Test', role: 'Kullanıcı', isActive: true },
        { id: 'user4', name: 'Fatma Şahin', department: 'Kablaj', role: 'Kullanıcı', isActive: false },
    ];
});

const saveSystemSettings = () => {
    console.log('Saving system settings:', systemSettings.value);
    // await apiService.saveSystemSettings(systemSettings.value);
    alert('Sistem ayarları kaydedildi.');
};

const saveAiSettings = () => {
    console.log('Saving AI settings:', aiSettings.value);
    // await apiService.saveAiSettings(aiSettings.value);
    alert('Yapay zeka ayarları kaydedildi.');
};

const getUserStatusClass = (isActive) => {
    return isActive ? 'badge bg-success' : 'badge bg-secondary';
};

const openAddUserModal = () => {
    isAddUserModalOpen.value = true;
    // console.log('Opening add user modal...'); // Modal bileşeni kendi içinde logluyor
};

const closeAddUserModal = () => {
    isAddUserModalOpen.value = false;
};

// Yeni kullanıcı eklendiğinde listeyi yenilemek için (opsiyonel)
const handleUserAdded = (newUser) => {
    console.log('New user added in parent component:', newUser);
    // users.value.push(newUser); // Gerçek API çağrısı sonrası listeyi yenilemek daha doğru olabilir
    // Veya listeyi yeniden çek:
    // fetchUsers();
};

const editUser = (user) => {
    console.log('Editing user:', user);
    // Kullanıcı düzenleme modalını aç
    alert(`Kullanıcı düzenleme: ${user.name}`);
};

const handleFileUpload = (event) => {
    const files = event.target.files;
    console.log('Files uploaded for AI training:', files);
    // Dosyaları yükleme işlemi
    // await apiService.uploadAiTrainingFiles(files);
    alert(`${files.length} adet dosya yüklendi.`);
};

</script>

<style scoped>
/* Ayarlar görünümü özel stilleri */
.table th {
    background-color: var(--bs-light);
}
</style> 