<template>
  <div class="modal fade" id="uploadDocumentModalComponent" tabindex="-1" aria-labelledby="uploadDocumentModalLabel" aria-hidden="true" ref="modalRef">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="uploadDocumentModalLabel">Teknik Doküman Yükle</h5>
          <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="uploadDocument">
            <div class="mb-3">
              <label for="documentName" class="form-label">Doküman Adı</label>
              <input type="text" class="form-control" id="documentName" v-model="documentData.name" required>
            </div>
            <div class="mb-3">
              <label for="documentType" class="form-label">Doküman Türü</label>
              <select class="form-select" id="documentType" v-model="documentData.type" required>
                <option value="" disabled>Seçiniz</option>
                <option value="technical_drawing">Teknik Çizim</option>
                <option value="installation">Montaj Talimatı</option>
                <option value="test_procedure">Test Prosedürü</option>
                <option value="specification">Teknik Şartname</option>
                <option value="manual">Kullanım Kılavuzu</option>
                <option value="certificate">Sertifika</option>
                <option value="datasheet">Veri Sayfası</option>
                <option value="other">Diğer</option>
              </select>
            </div>
            <div class="mb-3">
              <label for="documentDepartment" class="form-label">İlgili Birim</label>
              <select class="form-select" id="documentDepartment" v-model="documentData.department" required>
                <option value="" disabled>Seçiniz</option>
                <option value="electrical">Elektrik Tasarım</option>
                <option value="mechanical">Mekanik Tasarım</option>
                <option value="purchasing">Satın Alma</option>
                <option value="production">Mekanik Üretim</option>
                <option value="assembly">İç Montaj</option>
                <option value="wiring">Kablaj</option>
                <option value="general_assembly">Genel Montaj</option>
                <option value="testing">Test</option>
                <option value="quality">Kalite</option>
              </select>
            </div>
            <div class="mb-3">
              <label for="documentRevision" class="form-label">Revizyon No</label>
              <input type="text" class="form-control" id="documentRevision" v-model="documentData.revision" placeholder="Örneğin: 1.0">
            </div>
            <div class="mb-3">
              <label for="documentFile" class="form-label">Dosya Seçin</label>
              <input class="form-control" type="file" id="documentFile" @change="handleFileChange" required>
            </div>
            <div class="mb-3">
              <label for="documentTags" class="form-label">Etiketler (virgülle ayırın)</label>
              <input type="text" class="form-control" id="documentTags" v-model="documentData.tags">
            </div>
            <div class="mb-3">
              <label for="documentDescription" class="form-label">Açıklama</label>
              <textarea class="form-control" id="documentDescription" rows="3" v-model="documentData.description"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">Kapat</button>
          <button type="button" class="btn btn-primary" @click="uploadDocument">Yükle</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Modal } from 'bootstrap';
import { useTechnicalStore } from '@/store/technical';
import { useToast } from '@/composables/useToast';

const emit = defineEmits(['close', 'document-uploaded']);
const technicalStore = useTechnicalStore();
const { showToast } = useToast();

const modalRef = ref(null);
let modalInstance = null;
const selectedFile = ref(null);
const isUploading = ref(false);

const documentData = ref({
  name: '',
  type: '',
  department: '',
  revision: '',
  tags: '',
  description: ''
});

onMounted(() => {
  if (modalRef.value) {
    modalInstance = new Modal(modalRef.value);
    modalInstance.show(); // Programatik olarak göster
  }
});

onBeforeUnmount(() => {
  modalInstance?.dispose();
});

const handleFileChange = (event) => {
  selectedFile.value = event.target.files[0];
  // Dosya adını otomatik doldur (opsiyonel)
  if (selectedFile.value && !documentData.value.name) {
    documentData.value.name = selectedFile.value.name.split('.').slice(0, -1).join('.');
  }
};

const closeModal = () => {
  modalInstance?.hide();
  resetForm();
  emit('close');
};

const resetForm = () => {
  documentData.value = {
    name: '',
    type: '',
    department: '',
    revision: '',
    tags: '',
    description: ''
  };
  selectedFile.value = null;
  // Dosya input alanını sıfırlama
  const fileInput = document.getElementById('documentFile');
  if (fileInput) fileInput.value = '';
};

const uploadDocument = async () => {
  if (!selectedFile.value) {
    showToast('Lütfen bir doküman seçin.', 'warning');
    return;
  }

  if (!documentData.value.name || !documentData.value.type || !documentData.value.department) {
    showToast('Lütfen gerekli alanları doldurun.', 'warning');
    return;
  }

  isUploading.value = true;
  console.log('Uploading document:', documentData.value.name, selectedFile.value);

  const formData = new FormData();
  formData.append('file', selectedFile.value);
  formData.append('name', documentData.value.name);
  formData.append('type', documentData.value.type);
  formData.append('department', documentData.value.department);
  formData.append('revision', documentData.value.revision || '1.0');
  formData.append('tags', documentData.value.tags);
  formData.append('description', documentData.value.description);

  try {
    // Gerçek uygulamada technicalStore veya servis üzerinden API çağrısı yapılacak
    // const uploadedDocument = await technicalStore.uploadDocument(formData);
    
    // Simülasyon için gecikme ekliyoruz
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Demo için yeni eklenen dokümanı simüle et
    const uploadedDocument = {
      id: Date.now().toString(),
      name: documentData.value.name,
      type: documentData.value.type,
      department: documentData.value.department,
      revision: documentData.value.revision || '1.0',
      uploadDate: new Date().toISOString(),
      size: formatFileSize(selectedFile.value.size),
      uploadedBy: 'Aktif Kullanıcı',
      tags: documentData.value.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      description: documentData.value.description
    };
    
    emit('document-uploaded', uploadedDocument);
    showToast('Doküman başarıyla yüklendi.', 'success');
    closeModal();
  } catch (error) {
    console.error('Doküman yüklenemedi:', error);
    showToast('Doküman yüklenirken bir hata oluştu.', 'error');
  } finally {
    isUploading.value = false;
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<style scoped>
textarea {
  resize: vertical;
}

.modal-body {
  max-height: 70vh;
  overflow-y: auto;
}
</style>