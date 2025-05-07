<template>
  <div class="related-documents">
    <div class="related-documents-header">
      <div class="d-flex align-items-center">
        <i class="bi bi-file-earmark-text me-2"></i>
        <h6 class="m-0">İlgili Dokümanlar</h6>
      </div>
      <div v-if="documents.length > 0" class="related-documents-count">
        {{ documents.length }} doküman bulundu
      </div>
    </div>
    
    <div class="related-documents-content">
      <div v-if="documents.length === 0" class="no-documents">
        <i class="bi bi-search me-2"></i>
        Doküman bulunamadı
      </div>
      
      <div v-else class="document-list">
        <div 
          v-for="(document, index) in documents" 
          :key="index"
          class="document-item"
          @click="selectDocument(document)"
        >
          <div class="document-icon">
            <i :class="getDocumentIcon(document)"></i>
          </div>
          <div class="document-details">
            <div class="document-title">{{ document.title || document.name }}</div>
            <div class="document-description" v-if="document.description">{{ document.description }}</div>
            <div class="document-meta">
              <span class="document-type">{{ getDocumentType(document) }}</span>
              <span v-if="document.date" class="document-date">{{ formatDate(document.date) }}</span>
            </div>
          </div>
          <div class="document-actions">
            <button class="btn btn-sm btn-outline-secondary" @click.stop="viewDocument(document)">
              <i class="bi bi-eye"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  documents: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits(['select', 'view'])

// Doküman türüne göre ikon döndür
const getDocumentIcon = (document) => {
  const type = document.type || getFileExtension(document.url || document.path || '')
  
  switch (type.toLowerCase()) {
    case 'pdf':
      return 'bi bi-file-earmark-pdf'
    case 'doc':
    case 'docx':
      return 'bi bi-file-earmark-word'
    case 'xls':
    case 'xlsx':
      return 'bi bi-file-earmark-excel'
    case 'ppt':
    case 'pptx':
      return 'bi bi-file-earmark-ppt'
    case 'txt':
      return 'bi bi-file-earmark-text'
    case 'csv':
      return 'bi bi-file-earmark-spreadsheet'
    case 'img':
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return 'bi bi-file-earmark-image'
    case 'technical':
      return 'bi bi-file-earmark-ruled'
    case 'manual':
      return 'bi bi-journal-text'
    case 'drawing':
      return 'bi bi-pencil-square'
    default:
      return 'bi bi-file-earmark'
  }
}

// Doküman türünü okunaklı şekilde al
const getDocumentType = (document) => {
  const type = document.type || getFileExtension(document.url || document.path || '')
  
  const typeMap = {
    'pdf': 'PDF Doküman',
    'doc': 'Word Belgesi',
    'docx': 'Word Belgesi',
    'xls': 'Excel Dosyası',
    'xlsx': 'Excel Dosyası',
    'ppt': 'Sunum',
    'pptx': 'Sunum',
    'txt': 'Metin Belgesi',
    'csv': 'CSV Dosyası',
    'img': 'Görsel',
    'png': 'PNG Görsel',
    'jpg': 'JPG Görsel',
    'jpeg': 'JPEG Görsel',
    'technical': 'Teknik Doküman',
    'manual': 'Kullanım Kılavuzu',
    'drawing': 'Teknik Çizim'
  }
  
  return typeMap[type.toLowerCase()] || 'Doküman'
}

// Dosya uzantısı al
const getFileExtension = (path) => {
  if (!path) return ''
  
  const parts = path.split('.')
  if (parts.length <= 1) return ''
  
  return parts[parts.length - 1].toLowerCase()
}

// Tarihi formatla
const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

// Doküman seçildiğinde
const selectDocument = (document) => {
  emit('select', document)
}

// Dokümanı görüntüle
const viewDocument = (document) => {
  emit('view', document)
}
</script>

<style scoped>
.related-documents {
  background-color: var(--bg-light, #f8f9fa);
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 8px;
  padding: 12px;
  margin: 10px 0;
}

.related-documents-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color, #dee2e6);
}

.related-documents-count {
  font-size: 12px;
  color: var(--text-muted, #6c757d);
}

.document-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.document-item {
  display: flex;
  padding: 8px;
  border-radius: 6px;
  background-color: var(--bg-color, #ffffff);
  cursor: pointer;
  transition: background-color 0.2s;
}

.document-item:hover {
  background-color: var(--bg-hover, #e9ecef);
}

.document-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 18px;
  color: var(--primary-color, #0d6efd);
  margin-right: 12px;
}

.document-details {
  flex: 1;
}

.document-title {
  font-weight: 500;
  margin-bottom: 2px;
}

.document-description {
  font-size: 12px;
  color: var(--text-muted, #6c757d);
  margin-bottom: 4px;
}

.document-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.document-type {
  padding: 2px 6px;
  background-color: var(--bg-light, #f8f9fa);
  border-radius: 4px;
  color: var(--text-muted, #6c757d);
}

.document-date {
  color: var(--text-muted, #6c757d);
}

.document-actions {
  display: flex;
  align-items: center;
}

.no-documents {
  padding: 20px;
  text-align: center;
  color: var(--text-muted, #6c757d);
  font-size: 14px;
}

/* Koyu tema desteği */
@media (prefers-color-scheme: dark) {
  .related-documents {
    background-color: var(--dark-bg-light, #2c3034);
    border-color: var(--dark-border-color, #495057);
    color: #f8f9fa;
  }
  
  .related-documents-header {
    border-color: var(--dark-border-color, #495057);
  }
  
  .document-item {
    background-color: var(--dark-bg, #343a40);
  }
  
  .document-item:hover {
    background-color: var(--dark-bg-hover, #495057);
  }
  
  .document-description,
  .document-date,
  .related-documents-count {
    color: #adb5bd;
  }
  
  .document-type {
    background-color: #343a40;
    color: #adb5bd;
  }
}
</style>