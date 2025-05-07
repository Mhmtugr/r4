<template>
  <div class="document-viewer-overlay" @click.self="closeViewer">
    <div class="document-viewer-modal">
      <div class="document-header">
        <h4>{{ document.name }}</h4>
        <div class="document-actions">
          <button class="btn btn-sm btn-outline-secondary me-2" @click="downloadDocument">
            <i class="bi bi-download"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" @click="closeViewer">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
      
      <div class="document-details">
        <div class="document-metadata">
          <div class="meta-item">
            <span class="meta-label">Doküman Tipi:</span>
            <span class="meta-value">{{ getDocumentTypeName(document.type) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Revizyon:</span>
            <span class="meta-value">{{ document.revision || 'N/A' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Yükleyen:</span>
            <span class="meta-value">{{ document.uploadedBy || document.updatedBy || 'N/A' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Tarih:</span>
            <span class="meta-value">{{ formatDate(document.date || document.uploadDate) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Departman:</span>
            <span class="meta-value">{{ getDepartmentName(document.department) }}</span>
          </div>
          <div class="meta-item" v-if="document.size">
            <span class="meta-label">Dosya Boyutu:</span>
            <span class="meta-value">{{ document.size }}</span>
          </div>
        </div>
        
        <div class="document-description mt-3" v-if="document.description">
          <h5>Açıklama</h5>
          <p>{{ document.description }}</p>
        </div>
        
        <div class="document-tags mt-3" v-if="document.tags && document.tags.length > 0">
          <h5>Etiketler</h5>
          <div class="tags-container">
            <span v-for="(tag, index) in getTagsArray(document.tags)" :key="index" class="tag">{{ tag }}</span>
          </div>
        </div>
      </div>
      
      <div class="document-preview">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="m-0">Doküman Önizleme</h5>
          <div class="preview-controls">
            <button v-if="showPreviewControls" @click="zoomIn" class="btn btn-sm btn-outline-secondary me-1">
              <i class="bi bi-zoom-in"></i>
            </button>
            <button v-if="showPreviewControls" @click="zoomOut" class="btn btn-sm btn-outline-secondary me-1">
              <i class="bi bi-zoom-out"></i>
            </button>
            <button v-if="showPreviewControls && isFullscreenSupported" @click="toggleFullscreen" class="btn btn-sm btn-outline-secondary">
              <i class="bi" :class="isFullscreen ? 'bi-fullscreen-exit' : 'bi-fullscreen'"></i>
            </button>
          </div>
        </div>
        
        <div v-if="isLoading" class="preview-placeholder">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Yükleniyor...</span>
          </div>
          <p class="mt-3">Doküman önizleme yükleniyor...</p>
        </div>
        
        <div v-else-if="!isPreviewAvailable" class="preview-placeholder">
          <i class="bi bi-file-earmark-text display-4"></i>
          <p>Bu doküman için önizleme mevcut değil. Dokümanı indirmek için sağ üstteki indirme butonunu kullanabilirsiniz.</p>
        </div>
        
        <div v-else class="preview-container" ref="previewContainer">
          <!-- PDF Önizleme -->
          <div v-if="isPdfDocument" class="pdf-viewer" ref="pdfViewer">
            <iframe 
              v-if="documentPreviewUrl" 
              :src="documentPreviewUrl" 
              frameborder="0"
              class="pdf-iframe"
              :style="{ transform: `scale(${zoomLevel})` }"
              allow="fullscreen"
            ></iframe>
          </div>
          
          <!-- CAD Önizleme -->
          <div v-else-if="isCadDocument" class="cad-viewer" ref="cadViewer">
            <div class="cad-container" ref="cadContainer"></div>
          </div>
          
          <!-- Resim Önizleme -->
          <div v-else-if="isImageDocument" class="image-viewer">
            <img 
              :src="documentPreviewUrl" 
              :alt="document.name" 
              class="img-fluid preview-image"
              :style="{ transform: `scale(${zoomLevel})` }"
            />
          </div>
          
          <!-- Metin İçerikli Dosya Önizleme (örn. text/plain) -->
          <div v-else-if="isTextDocument" class="text-viewer">
            <pre class="text-content" :style="{ fontSize: `${14 * zoomLevel}px` }">{{ textContent }}</pre>
          </div>
          
          <!-- Diğer Dokümanlar -->
          <div v-else class="generic-viewer">
            <div class="preview-placeholder">
              <i class="bi bi-file-earmark display-4"></i>
              <p>Bu doküman türü için önizleme oluşturulamıyor.</p>
              <button class="btn btn-primary mt-2" @click="downloadDocument">
                <i class="bi bi-download me-1"></i> İndir
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Doküman Yorumları -->
      <div class="document-comments mt-4">
        <h5>Yorumlar</h5>
        
        <div v-if="comments.length === 0" class="text-muted">
          <p>Bu doküman için henüz yorum yapılmamış.</p>
        </div>
        
        <div v-else class="comments-list">
          <div v-for="(comment, index) in comments" :key="index" class="comment-item">
            <div class="comment-header">
              <span class="comment-author">{{ comment.author }}</span>
              <span class="comment-date">{{ formatDate(comment.timestamp) }}</span>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
          </div>
        </div>
        
        <!-- Yorum Ekleme -->
        <div class="add-comment mt-3">
          <textarea 
            class="form-control" 
            placeholder="Doküman hakkında bir yorum yazın..." 
            v-model="newComment"
            rows="2"
          ></textarea>
          <button class="btn btn-primary mt-2" @click="addComment" :disabled="!newComment.trim()">
            <i class="bi bi-chat-dots me-1"></i> Yorum Ekle
          </button>
        </div>
      </div>
      
      <!-- İlgili Dokümanlar -->
      <div class="document-related mt-4">
        <h5>İlgili Dokümanlar</h5>
        <div v-if="relatedDocuments.length > 0">
          <ul class="related-documents-list">
            <li v-for="(doc, index) in relatedDocuments" :key="index">
              <a href="#" @click.prevent="viewRelatedDocument(doc)">
                {{ doc.name }} - Rev. {{ doc.revision || 'N/A' }}
              </a>
            </li>
          </ul>
        </div>
        <div v-else class="text-muted">
          <p>İlgili doküman bulunamadı.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { formatDate } from '@/utils/dateUtils';
import { useToast } from '@/composables/useToast';
import { useTechnicalStore } from '@/store/technical';
// PDF.js ve CADViewer kütüphanelerinin gerçek projelerde import edilmesi gerekir
// import * as pdfjsLib from 'pdfjs-dist';
// import * as CADViewer from '@badging/cad-viewer';

// Props
const props = defineProps({
  document: {
    type: Object,
    required: true
  }
});

// Emits
const emit = defineEmits(['close', 'view-related']);

const technicalStore = useTechnicalStore();
const { showToast } = useToast();
const previewContainer = ref(null);
const pdfViewer = ref(null);
const cadViewer = ref(null);
const cadContainer = ref(null);
const isLoading = ref(true);
const isPreviewAvailable = ref(false);
const documentPreviewUrl = ref(null);
const textContent = ref('');
const zoomLevel = ref(1);
const showPreviewControls = ref(false);
const isFullscreen = ref(false);
const isFullscreenSupported = ref(false);

// Doküman yorumları
const comments = ref([]);
const newComment = ref('');

// İlgili dokümanlar - gerçek uygulamada teknicalStore'dan çekilecek
const relatedDocuments = ref([]);

const isPdfDocument = computed(() => {
  return props.document.type === 'specification' || 
         props.document.type === 'manual' ||
         props.document.type === 'datasheet' ||
         (props.document.fileType === 'application/pdf');
});

const isCadDocument = computed(() => {
  return props.document.type === 'technical_drawing' ||
         (props.document.fileType && props.document.fileType.includes('cad'));
});

const isImageDocument = computed(() => {
  return props.document.fileType && 
         (props.document.fileType.includes('image/') ||
          ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => 
            props.document.name.toLowerCase().endsWith(`.${ext}`)
          ));
});

const isTextDocument = computed(() => {
  return props.document.fileType === 'text/plain' || 
         ['txt', 'md', 'csv'].some(ext => props.document.name.toLowerCase().endsWith(`.${ext}`));
});

onMounted(async () => {
  // Fullscreen API desteğini kontrol et
  isFullscreenSupported.value = document.fullscreenEnabled || 
                                document.webkitFullscreenEnabled || 
                                document.mozFullScreenEnabled || 
                                document.msFullscreenEnabled;
  
  await loadDocumentPreview();
  await fetchRelatedDocuments();
  await fetchDocumentComments();
  
  showPreviewControls.value = isPdfDocument.value || isImageDocument.value || isTextDocument.value;
  
  // ESC tuşu ile kapatma için event listener ekle
  document.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyDown);
  
  // Fullscreen'den çık
  if (isFullscreen.value) {
    exitFullscreen();
  }
});

// Doküman tipine göre önizleme yükleme
const loadDocumentPreview = async () => {
  isLoading.value = true;
  
  try {
    // Gerçek uygulamada API'den dokümanın URL'ini veya içeriğini al
    const documentUrl = await fetchDocumentUrl();
    
    if (documentUrl) {
      documentPreviewUrl.value = documentUrl;
      
      if (isPdfDocument.value) {
        await loadPdfPreview(documentUrl);
      } else if (isCadDocument.value) {
        await loadCadPreview(documentUrl);
      } else if (isTextDocument.value) {
        await loadTextContent(documentUrl);
      }
      
      isPreviewAvailable.value = true;
    } else {
      isPreviewAvailable.value = false;
    }
  } catch (error) {
    console.error('Doküman önizleme yüklenirken hata:', error);
    showToast('Doküman önizleme yüklenirken bir hata oluştu.', 'error');
    isPreviewAvailable.value = false;
  } finally {
    isLoading.value = false;
  }
};

// Demo amaçlı doküman URL'i oluşturma - gerçek uygulamada API'den alınacak
const fetchDocumentUrl = async () => {
  // Demo için gecikme ekliyoruz
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Doküman tipine göre demo URL'ler
  if (isPdfDocument.value) {
    return 'https://mozilla.github.io/pdf.js/web/viewer.html';
  } else if (isImageDocument.value) {
    return props.document.type === 'technical_drawing' 
      ? 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Engineering_drawing_example_with_sections.svg/1200px-Engineering_drawing_example_with_sections.svg.png'
      : 'https://via.placeholder.com/800x600.png?text=' + encodeURIComponent(props.document.name);
  } else if (isTextDocument.value) {
    return ''; // Metin içeriği ayrıca yüklenecek
  } else if (isCadDocument.value) {
    return 'https://example.com/cad-files/sample.dwg'; // Demo URL
  }
  
  return null;
};

// PDF dosyasını yükle
const loadPdfPreview = async (url) => {
  // Gerçek uygulamada PDF.js kullanarak PDF dosyasını yükleyip render et
  // Şimdilik iframe kullanalım
};

// CAD dosyasını yükle
const loadCadPreview = async (url) => {
  // Gerçek uygulamada CAD viewer kütüphanesi kullanarak CAD dosyasını yükleyip render et
  // Örneğin: @badging/cad-viewer veya benzer bir kütüphane
  // Simülasyon için resim gösterelim
  const imgElement = document.createElement('img');
  imgElement.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Engineering_drawing_example_with_sections.svg/1200px-Engineering_drawing_example_with_sections.svg.png';
  imgElement.alt = 'CAD Çizimi';
  imgElement.classList.add('img-fluid');
  
  if (cadContainer.value) {
    cadContainer.value.innerHTML = '';
    cadContainer.value.appendChild(imgElement);
  }
};

// Metin içerikli dosyayı yükle
const loadTextContent = async (url) => {
  // Demo için gecikme ekliyoruz
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Demo metin içeriği
  if (props.document.type === 'test_procedure') {
    textContent.value = `# RM 36 CB Hücresi Test Prosedürü
    
1. Genel Kontroller
   - Cihaz fiziksel hasarlara karşı kontrol edilmelidir
   - Tüm etiketler ve işaretlemeler kontrol edilmelidir
   - Kilitleme mekanizmasının işlevi kontrol edilmelidir

2. Elektriksel Testler
   - Primer devre direnç testi
   - İzolasyon direnci ölçümü
   - Yüksek gerilim testi (36kV)
   - Koruma röle fonksiyon testleri

3. Mekanik Operasyon Testleri
   - Kesicinin açma-kapama testi (minimum 5 operasyon)
   - Manuel ve motorlu operasyon testi
   - Topraklama switch'inin test edilmesi

4. Sensör ve Ölçüm Devreleri
   - Akım trafosu bağlantıları
   - Gerilim trafosu bağlantıları
   - Ölçüm devrelerinin kalibrasyonu

Test sonuçları tabloya kaydedilmeli ve kalite kontrol departmanı tarafından onaylanmalıdır.`;
  } else if (props.document.name.includes('Akım Trafosu')) {
    textContent.value = `# Akım Trafosu Teknik Bilgiler
    
Model: KAP-80/190-95
Anma Akımı: 200-400/5-5A
Hassasiyet Sınıfı: 5P20
Anma Gücü: 7,5/15VA
Çalışma Frekansı: 50Hz
İzolasyon Seviyesi: 36kV

Kullanım Alanları:
- RM 36 CB hücrelerinde koruma ve ölçme amacıyla kullanılır
- Orta gerilim dağıtım sistemlerinde akım ölçümü
- Diferansiyel koruma sistemleri

Montaj Talimatları:
- Bara bağlantı vidaları 35Nm tork ile sıkılmalıdır
- Terminaller 5Nm tork ile sıkılmalıdır
- Topraklama bağlantısı mutlaka yapılmalıdır`;
  } else {
    textContent.value = `${props.document.name} dokümanı içeriği...

Bu bir örnek metin içeriğidir. Gerçek uygulamada dokümanın içeriği API'den alınacaktır.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl eget nisl.`;
  }
};

// İlgili dokümanları yükle
const fetchRelatedDocuments = async () => {
  try {
    // Gerçek uygulamada API'den ilgili dokümanları al
    // const response = await technicalStore.getRelatedDocuments(props.document.id);
    
    // Demo için gecikme ekliyoruz
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Demo ilişkili dokümanlar
    if (props.document.type === 'technical_drawing') {
      relatedDocuments.value = [
        { id: 'rel1', name: 'RM 36 CB Akım Trafosu Seçim Kılavuzu', revision: '2.0' },
        { id: 'rel2', name: 'RM 36 Serisi Montaj Talimatı', revision: '1.5' }
      ];
    } else if (props.document.type === 'manual') {
      relatedDocuments.value = [
        { id: 'rel3', name: 'RM 36 CB Teknik Çizim', revision: '2.1' },
        { id: 'rel4', name: 'RM 36 Serisi Test Prosedürü', revision: '1.0' }
      ];
    } else {
      relatedDocuments.value = [
        { id: 'rel5', name: 'RM 36 CB Teknik Çizim', revision: '2.1' }
      ];
    }
  } catch (error) {
    console.error('İlgili dokümanlar yüklenirken hata:', error);
    relatedDocuments.value = [];
  }
};

// Doküman yorumlarını yükle
const fetchDocumentComments = async () => {
  try {
    // Gerçek uygulamada API'den doküman yorumlarını al
    // const response = await technicalStore.getDocumentComments(props.document.id);
    
    // Demo için gecikme ekliyoruz
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Demo yorumlar
    if (Math.random() > 0.3) {
      comments.value = [
        {
          author: 'Ahmet Yılmaz',
          content: 'Bu dokümandaki ölçüler güncel projeye uygun değil, revize edilmesi gerekiyor.',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 gün önce
        },
        {
          author: 'Mehmet Demir',
          content: 'Revizyon çalışması başladı, önümüzdeki hafta güncellenecek.',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 gün önce
        }
      ];
    } else {
      comments.value = [];
    }
  } catch (error) {
    console.error('Doküman yorumları yüklenirken hata:', error);
    comments.value = [];
  }
};

// Yeni yorum ekle
const addComment = () => {
  if (!newComment.value.trim()) return;
  
  const comment = {
    author: 'Aktif Kullanıcı', // Gerçek uygulamada oturum bilgisinden alınacak
    content: newComment.value.trim(),
    timestamp: new Date()
  };
  
  // Gerçek uygulamada API'ye yorum gönder
  // technicalStore.addDocumentComment(props.document.id, comment);
  
  comments.value.push(comment);
  newComment.value = '';
  
  showToast('Yorumunuz eklendi', 'success');
};

// Doküman tipini kullanıcı dostu metne çeviren yardımcı fonksiyon
const getDocumentTypeName = (typeCode) => {
  const types = {
    'technical_drawing': 'Teknik Çizim',
    'installation': 'Montaj Talimatı',
    'test_procedure': 'Test Prosedürü',
    'specification': 'Teknik Şartname',
    'manual': 'Kullanım Kılavuzu',
    'certificate': 'Sertifika',
    'datasheet': 'Veri Sayfası',
    'other': 'Diğer'
  };
  return types[typeCode] || typeCode || 'Bilinmiyor';
};

// Departman kodunu kullanıcı dostu metne çeviren yardımcı fonksiyon
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
  return departments[departmentCode] || departmentCode || 'Bilinmiyor';
};

// Etiketleri dizi olarak almak için yardımcı fonksiyon
const getTagsArray = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') return tags.split(',').map(tag => tag.trim()).filter(Boolean);
  return [];
};

// Zoom işlevleri
const zoomIn = () => {
  zoomLevel.value = Math.min(2.0, zoomLevel.value + 0.1);
};

const zoomOut = () => {
  zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.1);
};

// Tam ekran modunu aç/kapat
const toggleFullscreen = () => {
  if (isFullscreen.value) {
    exitFullscreen();
  } else {
    enterFullscreen();
  }
};

const enterFullscreen = () => {
  const element = previewContainer.value;
  if (!element) return;
  
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
  
  isFullscreen.value = true;
};

const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
  
  isFullscreen.value = false;
};

// ESC tuşu ile modal kapatma
const handleKeyDown = (event) => {
  if (event.key === 'Escape' && !isFullscreen.value) {
    closeViewer();
  }
};

// Dokümanı indir
const downloadDocument = () => {
  // Gerçek uygulamada dokümanı indirme URL'ini oluştur
  showToast('Doküman indirme hazırlanıyor...', 'info');
  
  // Dokümanı indirmek için bir blob URL oluştur ve tıklama olayını tetikle
  // Demo amacıyla sadece indirme mesajını gösterelim
  setTimeout(() => {
    showToast('Doküman başarıyla indiriliyor', 'success');
  }, 1000);
};

// İlgili dokümanı görüntüle
const viewRelatedDocument = (document) => {
  emit('view-related', document);
};

// Görüntüleyiciyi kapat
const closeViewer = () => {
  emit('close');
};
</script>

<style scoped>
.document-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
  overflow-y: auto;
  padding: 20px;
}

.document-viewer-modal {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px;
  position: relative;
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
  margin-bottom: 20px;
}

.document-header h4 {
  margin: 0;
  font-weight: 600;
}

.document-metadata {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: 0.8rem;
  color: #6c757d;
  margin-bottom: 5px;
}

.meta-value {
  font-weight: 500;
}

.document-preview {
  margin-top: 20px;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 15px;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
  color: #6c757d;
  background-color: #f8f9fa;
  border-radius: 4px;
  min-height: 300px;
}

.document-tags {
  margin-top: 15px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  background-color: #e9ecef;
  color: #495057;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 0.8rem;
}

.preview-container {
  position: relative;
  width: 100%;
  min-height: 400px;
  max-height: 500px;
  overflow: auto;
  background-color: #f8f9fa;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-container:fullscreen {
  background-color: #fff;
  padding: 20px;
  max-height: none;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  display: block;
  margin: 0 auto;
  transition: transform 0.2s ease;
  transform-origin: center center;
}

.pdf-iframe {
  width: 100%;
  height: 500px;
  border: none;
  transition: transform 0.2s ease;
  transform-origin: top left;
}

.text-content {
  padding: 15px;
  width: 100%;
  white-space: pre-wrap;
  font-family: 'Courier New', Courier, monospace;
  color: #212529;
  background-color: #ffffff;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  overflow: auto;
  max-height: 500px;
}

.document-comments {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.comments-list {
  margin-bottom: 20px;
}

.comment-item {
  padding: 10px;
  border-bottom: 1px solid #eee;
  margin-bottom: 10px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.comment-author {
  font-weight: 600;
}

.comment-date {
  font-size: 0.8rem;
  color: #6c757d;
}

.comment-content {
  white-space: pre-line;
}

.related-documents-list {
  padding-left: 20px;
}

.related-documents-list a {
  color: #0d6efd;
  text-decoration: none;
}

.related-documents-list a:hover {
  text-decoration: underline;
}

/* Tam ekran modunda görünümü düzenle */
:fullscreen .preview-controls {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 5px;
  border-radius: 4px;
  z-index: 1100;
}

/* Koyu mod desteği */
@media (prefers-color-scheme: dark) {
  .document-viewer-modal {
    background-color: #212529;
    color: #e9ecef;
  }
  
  .document-header {
    border-bottom-color: #343a40;
  }
  
  .meta-label {
    color: #adb5bd;
  }
  
  .document-preview {
    border-color: #343a40;
  }
  
  .preview-placeholder {
    background-color: #2c3034;
    color: #adb5bd;
  }
  
  .tag {
    background-color: #343a40;
    color: #e9ecef;
  }
  
  .text-content {
    background-color: #2c3034;
    color: #e9ecef;
    border-color: #495057;
  }
  
  .comment-item {
    border-bottom-color: #343a40;
  }
}

/* Mobil için uyarlama */
@media (max-width: 768px) {
  .document-viewer-modal {
    width: 100%;
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
    padding: 15px;
  }
  
  .document-metadata {
    grid-template-columns: 1fr;
  }
  
  .preview-container {
    min-height: 300px;
    max-height: 400px;
  }
  
  .pdf-iframe {
    height: 400px;
  }
}
</style>