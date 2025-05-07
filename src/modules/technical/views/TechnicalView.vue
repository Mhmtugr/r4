<template>
  <div class="technical-view">
    <div class="row">
      <!-- Teknik Dokümanlar Listesi -->
      <div class="col-md-5">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Teknik Dokümanlar</h5>
            <button class="btn btn-sm btn-primary" @click="openUploadModal">
              <i class="bi bi-upload"></i> Yükle
            </button>
          </div>
          <div class="card-body">
            <!-- Arama Çubuğu -->
            <div class="input-group mb-3">
              <input 
                type="text" 
                class="form-control" 
                placeholder="Doküman ara..." 
                v-model="searchTerm"
                @keyup.enter="searchDocuments"
              >
              <button class="btn btn-outline-secondary" type="button" @click="searchDocuments">
                <i class="bi bi-search"></i>
              </button>
            </div>
            
            <!-- Son Aramalar -->
            <div v-if="technicalStore.recentQueries.length > 0 && !searchTerm" class="mb-3 small">
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted">Son aramalar:</span>
                <button class="btn btn-sm text-muted" @click="technicalStore.recentQueries = []">
                  <i class="bi bi-x-circle"></i>
                </button>
              </div>
              <div class="recent-queries mt-1">
                <a 
                  href="#" 
                  v-for="(query, index) in technicalStore.recentQueries" 
                  :key="index" 
                  @click.prevent="applyQuery(query.query)"
                  class="recent-query"
                >
                  {{ query.query }}
                </a>
              </div>
            </div>
            
            <!-- Doküman Kategorileri -->
            <div class="mb-3" v-if="documentCategories.length > 0">
              <span class="badge rounded-pill bg-light text-dark me-1 mb-1"
                :class="{ 'bg-primary text-white': selectedCategory === 'all' }"
                @click="filterByCategory('all')"
                style="cursor: pointer;"
              >
                Tümü
              </span>
              <span 
                v-for="category in documentCategories" 
                :key="category"
                class="badge rounded-pill bg-light text-dark me-1 mb-1"
                :class="{ 'bg-primary text-white': selectedCategory === category }"
                @click="filterByCategory(category)"
                style="cursor: pointer;"
              >
                {{ getCategoryName(category) }}
              </span>
            </div>
            
            <!-- Doküman Listesi -->
            <div class="list-group" v-if="filteredDocuments.length > 0">
              <a 
                href="#" 
                class="list-group-item list-group-item-action" 
                v-for="doc in filteredDocuments" 
                :key="doc.id" 
                @click.prevent="viewDocument(doc)"
              >
                <div class="d-flex w-100 justify-content-between">
                  <h6 class="mb-1">{{ doc.name }}</h6>
                  <small class="text-muted">{{ formatDate(doc.uploadDate || doc.date) }}</small>
                </div>
                <p class="mb-1">
                  <span class="badge bg-secondary me-2">{{ doc.category }}</span>
                  <span>{{ doc.version || 'Rev.' + doc.revision }}</span>
                </p>
                <small class="text-muted">{{ doc.description || getDepartmentName(doc.department) }}</small>
              </a>
            </div>
            <p v-else class="text-center text-muted py-3">
              <i class="bi bi-file-earmark-x me-2"></i>
              Gösterilecek doküman bulunamadı.
            </p>
          </div>
        </div>
      </div>

      <!-- Teknik Sorgulama Alanı -->
      <div class="col-md-7">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-robot me-2"></i>
              Teknik Sorgulama (AI Destekli)
            </h5>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label for="technicalQuestion" class="form-label">Teknik sorunuzu yazın:</label>
              <textarea 
                class="form-control" 
                id="technicalQuestion" 
                rows="3" 
                placeholder="Örneğin: RM 36 CB hücresinde hangi akım trafosu kullanılır?" 
                v-model="technicalQuestion"
              ></textarea>
            </div>
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <button 
                  class="btn btn-primary" 
                  @click="queryAI" 
                  :disabled="isQueryingAI || !technicalQuestion.trim()"
                >
                  <span v-if="isQueryingAI" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span v-else><i class="bi bi-search me-2"></i>Sorgula</span>
                </button>
                <button 
                  class="btn btn-outline-secondary ms-2" 
                  @click="clearQuery" 
                  :disabled="isQueryingAI || !technicalQuestion.trim()"
                >
                  Temizle
                </button>
              </div>
              
              <div class="dropdown" v-if="commonQuestions.length > 0">
                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="commonQuestionsDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                  Örnek Sorular
                </button>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="commonQuestionsDropdown">
                  <li v-for="(question, index) in commonQuestions" :key="index">
                    <a class="dropdown-item" href="#" @click.prevent="applyQuery(question)">{{ question }}</a>
                  </li>
                </ul>
              </div>
            </div>
            
            <hr v-if="aiResponse || relatedDocuments.length > 0">
            
            <!-- AI Cevabı -->
            <div class="alert alert-light mt-3" v-if="aiResponse">
              <div class="mb-3">
                <h6 class="d-flex align-items-center">
                  <i class="bi bi-lightbulb me-2 text-primary"></i> 
                  <span>Yapay Zeka Cevabı:</span>
                </h6>
                <p>{{ aiResponse.text }}</p>
                <p class="mb-0 small text-muted">
                  Referans doküman: 
                  <a href="#" @click.prevent="viewDocumentByName(aiResponse.reference)">
                    {{ aiResponse.reference }}
                  </a>
                </p>
              </div>
              
              <!-- İlgili Dokümanlar -->
              <div class="mt-3" v-if="relatedDocuments.length > 0">
                <h6><i class="bi bi-file-earmark me-2"></i> İlgili Dokümanlar:</h6>
                <div class="list-group list-group-flush">
                  <a 
                    href="#" 
                    v-for="doc in relatedDocuments" 
                    :key="doc.id" 
                    @click.prevent="viewDocument(doc)"
                    class="list-group-item list-group-item-action py-2 px-0 border-0"
                  >
                    <div class="d-flex align-items-center">
                      <span class="badge rounded-pill bg-light text-dark me-2">{{ doc.category || 'Doküman' }}</span>
                      <div>
                        {{ doc.name }}
                        <small class="d-block text-muted">{{ doc.version || 'Rev.' + doc.revision }}</small>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
            
            <!-- Sorgu Önerileri -->
            <div v-if="!aiResponse && !isQueryingAI" class="border rounded p-3 mt-3">
              <h6 class="mb-3">Örnek Sorgular:</h6>
              <ul class="mb-0">
                <li>RM 36 CB hücresinde hangi akım trafosu kullanılır?</li>
                <li>RM 36 LB hücresinin montajı nasıl yapılır?</li>
                <li>Baralar hangi tork değeri ile sıkılmalıdır?</li>
                <li>Ayırıcı motorlarının gerilim değerleri nedir?</li>
                <li>Yüksek gerilim testleri hangi değerlerde yapılır?</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Doküman Yükleme Modalı -->
    <UploadDocumentModal 
      v-if="isUploadModalOpen" 
      @close="closeUploadModal" 
      @document-uploaded="handleDocumentUploaded" 
    />

    <!-- Doküman Görüntüleme Modalı -->
    <DocumentViewer 
      v-if="selectedDocument" 
      :document="selectedDocument" 
      @close="selectedDocument = null" 
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAiService } from '@/services/ai-service';
import { useTechnicalStore } from '@/store/technical';
import { formatDate } from '@/utils/dateUtils';
import { useToast } from '@/composables/useToast';
import UploadDocumentModal from '../components/UploadDocumentModal.vue';
import DocumentViewer from '../components/DocumentViewer.vue';

const { queryTechnical } = useAiService();
const technicalStore = useTechnicalStore();
const { showToast } = useToast();

// State
const documents = ref([]);
const searchTerm = ref('');
const technicalQuestion = ref('');
const aiResponse = ref(null);
const relatedDocuments = ref([]);
const isUploadModalOpen = ref(false);
const selectedDocument = ref(null);
const selectedCategory = ref('all');

// Computed
const isQueryingAI = computed(() => technicalStore.getIsLoading);

const commonQuestions = [
  'RM 36 CB hücresinde hangi akım trafosu kullanılır?',
  'RM 36 LB hücresinin montajı nasıl yapılır?',
  'Baralar hangi tork değeri ile sıkılmalıdır?',
  'Ayırıcı motorlarının gerilim değerleri nedir?',
  'Yüksek gerilim testleri hangi değerlerde yapılır?',
];

// Belge kategorileri
const documentCategories = computed(() => {
  const categories = new Set();
  documents.value.forEach(doc => {
    if (doc.category) {
      categories.add(doc.category);
    } else if (doc.department) {
      categories.add(doc.department);
    }
  });
  return [...categories];
});

// Filtrelenmiş dokümanlar
const filteredDocuments = computed(() => {
  let filtered = documents.value;

  // Kategoriye göre filtrele
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(doc => {
      if (doc.category) {
        return doc.category === selectedCategory.value;
      } else if (doc.department) {
        return doc.department === selectedCategory.value;
      }
      return false;
    });
  }
  
  // Arama terimine göre filtrele
  if (searchTerm.value) {
    const lowerSearchTerm = searchTerm.value.toLowerCase();
    filtered = filtered.filter(doc =>
      doc.name.toLowerCase().includes(lowerSearchTerm) ||
      (doc.description && doc.description.toLowerCase().includes(lowerSearchTerm)) ||
      (doc.category && doc.category.toLowerCase().includes(lowerSearchTerm)) ||
      (doc.department && doc.department.toLowerCase().includes(lowerSearchTerm))
    );
  }
  
  return filtered;
});

// Lifecycle hooks
onMounted(async () => {
  try {
    await technicalStore.fetchDocuments();
    documents.value = technicalStore.documents;
  } catch (error) {
    console.error('Teknik dokümanlar yüklenemedi:', error);
    showToast('Teknik dokümanlar yüklenirken bir hata oluştu.', 'error');
  }
});

// Methods
const searchDocuments = () => {
  // searchTerm değişkeni filteredDocuments computed özelliğinde kullanılıyor
  // Burada ek bir işleme gerek yok
  console.log('Dokümanlar aranıyor:', searchTerm.value);
};

const filterByCategory = (category) => {
  selectedCategory.value = category;
};

const getCategoryName = (category) => {
  // Kategori isimlerini daha kullanıcı dostu hale getir
  const categoryMap = {
    'şartname': 'Şartname',
    'talimat': 'Talimat',
    'kılavuz': 'Kılavuz',
    'prosedür': 'Prosedür',
    'katalog': 'Katalog',
    '3D model': '3D Model',
    'teknik doküman': 'Teknik Doküman'
  };
  return categoryMap[category] || category;
};

const queryAI = async () => {
  if (!technicalQuestion.value.trim()) {
    showToast('Lütfen teknik sorunuzu girin.', 'warning');
    return;
  }

  aiResponse.value = null;
  relatedDocuments.value = [];

  try {
    const response = await technicalStore.performTechnicalQuery(technicalQuestion.value);
    
    if (response.success) {
      aiResponse.value = response.answer;
      relatedDocuments.value = response.relatedDocs || [];
    } else {
      showToast('Yapay zeka bir cevap üretemedi.', 'info');
    }

  } catch (error) {
    console.error('AI sorgusu başarısız:', error);
    showToast(`Teknik sorgu sırasında bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`, 'error');
    aiResponse.value = { text: 'Sorgulama sırasında bir hata oluştu. Lütfen tekrar deneyin.', reference: 'Hata' };
  }
};

const clearQuery = () => {
  technicalQuestion.value = '';
  aiResponse.value = null;
  relatedDocuments.value = [];
};

const applyQuery = (query) => {
  technicalQuestion.value = query;
  queryAI();
};

const openUploadModal = () => {
  isUploadModalOpen.value = true;
};

const closeUploadModal = () => {
  isUploadModalOpen.value = false;
};

const handleDocumentUploaded = (document) => {
  const newDoc = technicalStore.addDocument(document);
  documents.value.unshift(newDoc);
  showToast(`"${document.name}" dokümanı başarıyla eklendi.`, 'success');
};

const viewDocument = (doc) => {
  selectedDocument.value = doc;
  console.log('Doküman görüntüleniyor:', doc.name);
};

const viewDocumentByName = (docName) => {
  // Doküman adını ayıkla (Rev. kısmını çıkar)
  const nameOnly = docName.split(' Rev.')[0];
  
  const doc = documents.value.find(d => d.name.includes(nameOnly));
  if (doc) {
    viewDocument(doc);
  } else {
    showToast(`"${nameOnly}" dokümanı bulunamadı.`, 'warning');
  }
};

const getDepartmentName = (departmentCode) => {
  const departments = {
    'electrical': 'Elektrik Tasarım',
    'mechanical': 'Mekanik Tasarım',
    'purchasing': 'Satın Alma',
    'production': 'Mekanik Üretim',
    'assembly': 'İç Montaj',
    'wiring': 'Kablaj',
    'general_assembly': 'Genel Montaj',
    'testing': 'Test',
    'quality': 'Kalite'
  };
  
  return departments[departmentCode] || departmentCode;
};
</script>

<style scoped>
.list-group-item-action:hover {
  background-color: #f8f9fa;
}

.list-group-item {
  transition: all 0.2s ease;
}

.list-group-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

textarea {
  resize: vertical;
}

.recent-queries {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.recent-query {
  font-size: 0.85rem;
  text-decoration: none;
  color: var(--bs-gray-700);
  background-color: var(--bs-gray-200);
  padding: 2px 8px;
  border-radius: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
  display: inline-block;
}

.recent-query:hover {
  background-color: var(--bs-gray-300);
  text-decoration: none;
  color: var(--bs-gray-900);
}

/* Dark mode uyumluluğu */
@media (prefers-color-scheme: dark) {
  .alert-light {
    background-color: #2c3034;
    color: #e9ecef;
    border-color: #495057;
  }
  
  .list-group-item-action:hover {
    background-color: #2c3034;
  }
  
  .recent-query {
    background-color: #495057;
    color: #e9ecef;
  }
  
  .recent-query:hover {
    background-color: #6c757d;
    color: #fff;
  }
  
  .badge.bg-light.text-dark {
    background-color: #495057 !important;
    color: #e9ecef !important;
  }
  
  .border {
    border-color: #495057 !important;
  }
}
</style>