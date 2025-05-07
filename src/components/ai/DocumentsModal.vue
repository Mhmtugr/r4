<template>
  <transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="documents-modal">
        <div class="documents-header">
          <h5>İlgili Belgeler <span class="doc-counter">({{ documents.length }})</span></h5>
          <div class="documents-actions">
            <button @click="toggleViewMode" class="btn btn-sm btn-outline-secondary mx-2" :title="isGridView ? 'Liste Görünümü' : 'Grid Görünümü'">
              <i class="bi" :class="isGridView ? 'bi-list' : 'bi-grid'"></i>
            </button>
            <button @click="handleClose" class="btn btn-sm btn-outline-danger" title="Kapat">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <div class="documents-content">
          <div class="documents-filters mb-3">
            <div class="row g-2">
              <div class="col-md-6">
                <div class="input-group input-group-sm">
                  <span class="input-group-text">Ara</span>
                  <input type="text" class="form-control" v-model="searchQuery" placeholder="Belge ara...">
                </div>
              </div>
              <div class="col-md-6">
                <div class="input-group input-group-sm">
                  <span class="input-group-text">Tür</span>
                  <select class="form-select" v-model="typeFilter">
                    <option value="">Tümü</option>
                    <option v-for="(type, index) in availableTypes" :key="index" :value="type">{{ getTypeLabel(type) }}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Liste Görünümü -->
          <div v-if="!isGridView" class="documents-list-view">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Belge</th>
                  <th>Tür</th>
                  <th>Tarih</th>
                  <th>İlgi Puanı</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(doc, index) in filteredDocuments" :key="index">
                  <td class="document-title">
                    <div class="d-flex align-items-center">
                      <div class="document-icon me-2">
                        <i class="bi" :class="getDocumentIcon(doc.type)"></i>
                      </div>
                      <div>
                        {{ doc.name }}
                        <div class="document-path text-muted small">{{ truncatePath(doc.path) }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="document-type-badge" :class="'document-type-' + doc.type">
                      {{ getTypeLabel(doc.type) }}
                    </span>
                  </td>
                  <td>{{ formatDate(doc.date) }}</td>
                  <td>
                    <div class="relevance-score">
                      <div class="relevance-bar" :style="{ width: `${doc.relevance * 100}%` }"></div>
                      <span>{{ formatRelevance(doc.relevance) }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="document-actions">
                      <button class="btn btn-sm btn-primary me-1" @click="openDocument(doc)">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-secondary" @click="downloadDocument(doc)">
                        <i class="bi bi-download"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredDocuments.length === 0">
                  <td colspan="5" class="text-center py-3">
                    <div class="alert alert-info m-0">Filtrelere uygun belge bulunamadı.</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Grid Görünümü -->
          <div v-else class="documents-grid-view">
            <div class="row g-3">
              <div v-for="(doc, index) in filteredDocuments" :key="index" class="col-md-4 col-xl-3">
                <div class="document-card" @click="openDocument(doc)">
                  <div class="document-card-icon">
                    <i class="bi" :class="getDocumentIcon(doc.type)"></i>
                  </div>
                  <div class="document-card-content">
                    <div class="document-card-title">{{ doc.name }}</div>
                    <div class="document-card-type">
                      <span class="document-type-badge" :class="'document-type-' + doc.type">
                        {{ getTypeLabel(doc.type) }}
                      </span>
                    </div>
                    <div class="document-card-date">{{ formatDate(doc.date) }}</div>
                    <div class="document-card-relevance">
                      <div class="relevance-score">
                        <div class="relevance-bar" :style="{ width: `${doc.relevance * 100}%` }"></div>
                        <span>{{ formatRelevance(doc.relevance) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="document-card-actions">
                    <button class="btn btn-sm btn-outline-secondary" @click.stop="downloadDocument(doc)" title="İndir">
                      <i class="bi bi-download"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div v-if="filteredDocuments.length === 0" class="col-12 text-center py-3">
                <div class="alert alert-info m-0">Filtrelere uygun belge bulunamadı.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Belge Önizleme -->
      <div v-if="selectedDocument" class="document-preview-overlay" @click.self="selectedDocument = null">
        <div class="document-preview-modal">
          <div class="document-preview-header">
            <h6>{{ selectedDocument.name }}</h6>
            <div class="document-preview-actions">
              <button @click="downloadDocument(selectedDocument)" class="btn btn-sm btn-outline-secondary me-2" title="İndir">
                <i class="bi bi-download"></i>
              </button>
              <button @click="selectedDocument = null" class="btn btn-sm btn-outline-danger" title="Kapat">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
          <div class="document-preview-content">
            <div v-if="documentPreviewLoading" class="document-preview-loading">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Yükleniyor...</span>
              </div>
              <div class="mt-2">Belge yükleniyor...</div>
            </div>
            
            <!-- PDF Önizleme -->
            <div v-else-if="selectedDocument.type === 'pdf'" class="document-pdf-preview">
              <iframe 
                v-if="documentPreviewSrc" 
                :src="documentPreviewSrc" 
                frameborder="0" 
                width="100%"
                height="100%"
              ></iframe>
              <div v-else class="document-preview-error">
                <i class="bi bi-exclamation-triangle text-warning fs-2"></i>
                <div class="mt-2">PDF önizleme kullanılamıyor. <br> Belgeyi indirip görüntüleyebilirsiniz.</div>
                <button class="btn btn-primary mt-3" @click="downloadDocument(selectedDocument)">
                  <i class="bi bi-download me-1"></i> İndir
                </button>
              </div>
            </div>
            
            <!-- Resim Önizleme -->
            <div v-else-if="['jpg', 'png', 'gif', 'jpeg', 'image'].includes(selectedDocument.type)" class="document-image-preview">
              <img 
                v-if="documentPreviewSrc" 
                :src="documentPreviewSrc" 
                alt="Görüntü önizleme" 
                class="img-preview"
              />
              <div v-else class="document-preview-error">
                <i class="bi bi-exclamation-triangle text-warning fs-2"></i>
                <div class="mt-2">Resim önizleme kullanılamıyor.</div>
              </div>
            </div>
            
            <!-- Metin Önizleme -->
            <div v-else-if="['txt', 'md', 'text'].includes(selectedDocument.type)" class="document-text-preview">
              <pre v-if="documentPreviewText" class="text-preview">{{ documentPreviewText }}</pre>
              <div v-else class="document-preview-error">
                <i class="bi bi-exclamation-triangle text-warning fs-2"></i>
                <div class="mt-2">Metin önizleme kullanılamıyor.</div>
              </div>
            </div>
            
            <!-- HTML Önizleme -->
            <div v-else-if="selectedDocument.type === 'html'" class="document-html-preview">
              <iframe 
                v-if="documentPreviewSrc" 
                :src="documentPreviewSrc" 
                frameborder="0" 
                width="100%"
                height="100%"
                sandbox="allow-same-origin"
              ></iframe>
              <div v-else class="document-preview-error">
                <i class="bi bi-exclamation-triangle text-warning fs-2"></i>
                <div class="mt-2">HTML önizleme kullanılamıyor.</div>
              </div>
            </div>
            
            <!-- Diğer belgeler için önizleme yok -->
            <div v-else class="document-preview-error">
              <i class="bi bi-file-earmark text-secondary fs-2"></i>
              <div class="mt-2">Bu belge türü için önizleme desteklenmiyor.</div>
              <button class="btn btn-primary mt-3" @click="downloadDocument(selectedDocument)">
                <i class="bi bi-download me-1"></i> İndir
              </button>
            </div>
            
            <!-- İlgili metin parçaları -->
            <div v-if="selectedDocument.highlights && selectedDocument.highlights.length > 0" class="document-highlights">
              <h6 class="highlights-title">İlgili Bölümler</h6>
              <div class="highlights-list">
                <div v-for="(highlight, index) in selectedDocument.highlights" :key="index" class="highlight-item">
                  <div class="highlight-context" v-html="formatHighlight(highlight.text, highlight.matchedTerms)"></div>
                  <div class="highlight-page" v-if="highlight.page">
                    <span class="page-label">Sayfa:</span> {{ highlight.page }}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Belge meta verileri -->
            <div v-if="selectedDocument.metadata" class="document-metadata">
              <h6 class="metadata-title">Belge Bilgileri</h6>
              <div class="metadata-list">
                <div v-for="(value, key) in selectedDocument.metadata" :key="key" class="metadata-item">
                  <div class="metadata-key">{{ formatMetadataKey(key) }}:</div>
                  <div class="metadata-value">{{ value }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

// Props
const props = defineProps({
  documents: {
    type: Array,
    required: true
  },
  show: {
    type: Boolean,
    default: false
  }
});

// Emit
const emit = defineEmits(['close']);

// State
const searchQuery = ref('');
const typeFilter = ref('');
const isGridView = ref(false);
const selectedDocument = ref(null);
const documentPreviewSrc = ref(null);
const documentPreviewText = ref(null);
const documentPreviewLoading = ref(false);

// Hesaplanmış değerler
const filteredDocuments = computed(() => {
  let result = [...props.documents];
  
  // Arama filtresi
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(doc => 
      doc.name.toLowerCase().includes(query) ||
      (doc.description && doc.description.toLowerCase().includes(query))
    );
  }
  
  // Tür filtresi
  if (typeFilter.value) {
    result = result.filter(doc => doc.type === typeFilter.value);
  }
  
  // İlgi puanına göre sırala
  result.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
  
  return result;
});

const availableTypes = computed(() => {
  const types = new Set();
  props.documents.forEach(doc => {
    if (doc.type) types.add(doc.type);
  });
  return Array.from(types);
});

// Yardımcı fonksiyonlar

// Belgeyi aç
const openDocument = (doc) => {
  documentPreviewLoading.value = true;
  selectedDocument.value = doc;
  
  documentPreviewSrc.value = null;
  documentPreviewText.value = null;
  
  // Gerçek uygulamada burada backend'den belge içeriği alınır
  // Bu demo için basitleştirilmiş simülasyon
  setTimeout(() => {
    if (doc.url) {
      documentPreviewSrc.value = doc.url;
    } else if (doc.content) {
      if (['txt', 'md', 'text'].includes(doc.type)) {
        documentPreviewText.value = doc.content;
      } else if (['html'].includes(doc.type)) {
        const blob = new Blob([doc.content], { type: 'text/html' });
        documentPreviewSrc.value = URL.createObjectURL(blob);
      }
    }
    documentPreviewLoading.value = false;
  }, 800); // Simülasyon için yükleme gösterme
};

// Belgeyi indir
const downloadDocument = (doc) => {
  // Gerçek uygulamada burada dosya indirme fonksiyonu olmalı
  // Bu sadece bir simülasyon
  const link = document.createElement('a');
  link.href = doc.url || 'javascript:void(0)';
  link.download = doc.name;
  if (!doc.url) {
    alert(`${doc.name} belgesini indirme işlemi simüle edildi.`);
    return;
  }
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Tarih formatla
const formatDate = (dateStr) => {
  if (!dateStr) return 'Belirtilmemiş';
  
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch (e) {
    return dateStr;
  }
};

// İlgi puanı formatla
const formatRelevance = (score) => {
  if (score === undefined || score === null) return '?';
  return `%${Math.round(score * 100)}`;
};

// Belge türü etiketi
const getTypeLabel = (type) => {
  const types = {
    'pdf': 'PDF',
    'doc': 'Word',
    'docx': 'Word',
    'xls': 'Excel',
    'xlsx': 'Excel',
    'ppt': 'PowerPoint',
    'pptx': 'PowerPoint',
    'txt': 'Metin',
    'csv': 'CSV',
    'jpg': 'Resim',
    'jpeg': 'Resim',
    'png': 'Resim',
    'gif': 'Resim',
    'image': 'Resim',
    'html': 'HTML',
    'md': 'Markdown',
    'text': 'Metin',
    'technical': 'Teknik Doküman',
    'manual': 'Kullanım Kılavuzu',
    'report': 'Rapor',
    'specification': 'Şartname',
    'drawing': 'Teknik Çizim',
  };
  
  return types[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

// Belge simgesi
const getDocumentIcon = (type) => {
  const icons = {
    'pdf': 'bi-file-earmark-pdf',
    'doc': 'bi-file-earmark-word',
    'docx': 'bi-file-earmark-word',
    'xls': 'bi-file-earmark-excel',
    'xlsx': 'bi-file-earmark-excel',
    'ppt': 'bi-file-earmark-ppt',
    'pptx': 'bi-file-earmark-ppt',
    'txt': 'bi-file-earmark-text',
    'csv': 'bi-file-earmark-spreadsheet',
    'jpg': 'bi-file-earmark-image',
    'jpeg': 'bi-file-earmark-image',
    'png': 'bi-file-earmark-image',
    'gif': 'bi-file-earmark-image',
    'image': 'bi-file-earmark-image',
    'html': 'bi-file-earmark-code',
    'md': 'bi-markdown',
    'technical': 'bi-file-earmark-ruled',
    'manual': 'bi-book',
    'report': 'bi-file-earmark-bar-graph',
    'specification': 'bi-list-check',
    'drawing': 'bi-file-earmark-ruled',
  };
  
  return icons[type] || 'bi-file-earmark';
};

// Dosya yolunu kısalt
const truncatePath = (path) => {
  if (!path) return '';
  
  const maxLength = 30;
  if (path.length <= maxLength) return path;
  
  // ...ile bölüm çıkarma ve ana klasörü gösterme
  const parts = path.split('/');
  if (parts.length <= 2) return path;
  
  return parts[0] + '/.../' + parts[parts.length - 1];
};

// Görünüm modunu değiştir
const toggleViewMode = () => {
  isGridView.value = !isGridView.value;
};

// Modal kapatma
const handleClose = () => {
  selectedDocument.value = null;
  emit('close');
};

// Meta veri anahtarını formatla
const formatMetadataKey = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace('_', ' ');
};

// Metinde eşleşen terimleri vurgula
const formatHighlight = (text, terms = []) => {
  if (!text) return '';
  if (!terms || !terms.length) return text;
  
  let formattedText = text;
  terms.forEach(term => {
    const regex = new RegExp(term, 'gi');
    formattedText = formattedText.replace(regex, match => `<mark>${match}</mark>`);
  });
  
  return formattedText;
};

// Component yüklendi
onMounted(() => {
  // İşlemler
});

// Önizleme kaynağını temizle
watch(selectedDocument, (newVal) => {
  if (!newVal) {
    // Önizleme kaynağı URL ise, belleği temizle
    if (documentPreviewSrc.value && documentPreviewSrc.value.startsWith('blob:')) {
      URL.revokeObjectURL(documentPreviewSrc.value);
    }
    documentPreviewSrc.value = null;
    documentPreviewText.value = null;
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.documents-modal {
  width: 900px;
  max-width: 90vw;
  height: 80vh;
  background-color: var(--bg-color, #ffffff);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.documents-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: var(--primary-color, #0d6efd);
  color: white;
}

.doc-counter {
  font-size: 0.85rem;
  opacity: 0.8;
  margin-left: 5px;
}

.documents-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}

.documents-list-view {
  overflow-y: auto;
}

.document-title {
  min-width: 250px;
}

.document-icon {
  font-size: 1.5rem;
  color: var(--primary-color, #0d6efd);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.document-path {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 2px;
}

.relevance-score {
  display: flex;
  align-items: center;
  position: relative;
  width: 100px;
  height: 18px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.relevance-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: var(--primary-color, #0d6efd);
  z-index: 1;
}

.relevance-score span {
  position: absolute;
  width: 100%;
  text-align: center;
  font-size: 0.8rem;
  font-weight: 500;
  color: white;
  mix-blend-mode: difference;
  z-index: 2;
}

.document-type-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  background-color: rgba(0, 0, 0, 0.1);
}

.document-type-pdf {
  background-color: #ff000020;
  color: #c10000;
}

.document-type-doc, .document-type-docx {
  background-color: #0075f620;
  color: #0074f6;
}

.document-type-xls, .document-type-xlsx {
  background-color: #00800020;
  color: #008000;
}

.document-type-ppt, .document-type-pptx {
  background-color: #ff660020;
  color: #ff6600;
}

.document-type-txt, .document-type-text {
  background-color: #66666620;
  color: #666666;
}

.document-type-jpg, .document-type-jpeg, .document-type-png, .document-type-gif, .document-type-image {
  background-color: #9c27b020;
  color: #9c27b0;
}

.document-type-html {
  background-color: #ff990020;
  color: #ff9900;
}

.document-type-technical, .document-type-specification, .document-type-drawing {
  background-color: #03a9f420;
  color: #03a9f4;
}

.document-type-manual {
  background-color: #79554820;
  color: #795548;
}

.document-type-report {
  background-color: #607d8b20;
  color: #607d8b;
}

/* Grid Görünümü */
.documents-grid-view {
  margin-top: 10px;
}

.document-card {
  height: 180px;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.document-card:hover {
  border-color: var(--primary-color, #0d6efd);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.1);
  transform: translateY(-2px);
}

.document-card-icon {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--primary-color, #0d6efd);
  border-bottom: 1px solid var(--border-color, #dee2e6);
  background-color: var(--light-color, #f8f9fa);
}

.document-card-content {
  flex: 1;
  padding: 10px;
  overflow: hidden;
}

.document-card-title {
  font-weight: 500;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.document-card-type {
  margin-bottom: 5px;
}

.document-card-date {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-bottom: 5px;
}

.document-card-relevance {
  margin-top: auto;
}

.document-card-actions {
  position: absolute;
  right: 10px;
  bottom: 10px;
  opacity: 0;
  transition: opacity 0.2s;
}

.document-card:hover .document-card-actions {
  opacity: 1;
}

/* Belge Önizleme Modalı */
.document-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1200;
}

.document-preview-modal {
  width: 90vw;
  height: 90vh;
  background-color: var(--bg-color, #ffffff);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.document-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background-color: var(--primary-color, #0d6efd);
  color: white;
}

.document-preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.document-preview-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-color, #ffffff);
  z-index: 10;
}

.document-pdf-preview,
.document-image-preview,
.document-text-preview,
.document-html-preview {
  flex: 1;
  overflow: hidden;
}

.document-preview-error {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px;
  color: var(--secondary-color, #6c757d);
}

.img-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.text-preview {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 20px;
  overflow: auto;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  background-color: var(--light-color, #f8f9fa);
}

/* İlgili bölümler */
.document-highlights {
  padding: 15px;
  border-top: 1px solid var(--border-color, #dee2e6);
  background-color: var(--light-color, #f8f9fa);
  max-height: 200px;
  overflow-y: auto;
}

.highlights-title {
  margin-bottom: 10px;
  font-size: 0.9rem;
}

.highlight-item {
  padding: 10px;
  margin-bottom: 10px;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.highlight-item:last-child {
  margin-bottom: 0;
}

.highlight-context {
  line-height: 1.5;
  font-size: 0.9rem;
}

.highlight-context mark {
  background-color: #fff2a8;
  padding: 0 2px;
  border-radius: 2px;
}

.highlight-page {
  margin-top: 5px;
  text-align: right;
  font-size: 0.8rem;
  opacity: 0.7;
}

.page-label {
  font-weight: 500;
}

/* Meta veriler */
.document-metadata {
  padding: 15px;
  border-top: 1px solid var(--border-color, #dee2e6);
  background-color: var(--light-color, #f8f9fa);
}

.metadata-title {
  margin-bottom: 10px;
  font-size: 0.9rem;
}

.metadata-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.metadata-item {
  flex: 1 0 30%;
  min-width: 200px;
  display: flex;
  padding: 8px;
  background-color: #fff;
  border-radius: 6px;
}

.metadata-key {
  font-weight: 500;
  margin-right: 5px;
  white-space: nowrap;
}

.metadata-value {
  flex: 1;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Koyu mod desteği */
@media (prefers-color-scheme: dark) {
  .documents-modal {
    --bg-color: #212529;
    --border-color: #495057;
    --light-color: #343a40;
  }
  
  .document-card {
    background-color: #212529;
    border-color: #495057;
  }
  
  .document-card-icon {
    background-color: #343a40;
    border-color: #495057;
  }
  
  .document-preview-modal {
    --bg-color: #212529;
  }
  
  .text-preview {
    background-color: #343a40;
    color: #f8f9fa;
  }
  
  .highlight-item {
    background-color: #343a40;
  }
  
  .highlight-context mark {
    background-color: #664d00;
    color: #fff;
  }
  
  .metadata-item {
    background-color: #343a40;
  }
  
  .table {
    --bs-table-bg: transparent;
    --bs-table-color: #f8f9fa;
  }
}
</style>