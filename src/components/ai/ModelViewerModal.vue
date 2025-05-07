<template>
  <div>
    <div class="modal fade" :id="modalId" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i v-if="isCADDrawing" class="bi bi-file-earmark-ruled me-2"></i>
              <i v-else class="bi bi-badge-3d me-2"></i>
              {{ title }}
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Kapat"></button>
          </div>
          <div class="modal-body p-0">
            <div v-if="loading" class="d-flex justify-content-center align-items-center p-5">
              <div class="spinner-border text-primary" role="status"></div>
              <span class="ms-3">Yükleniyor...</span>
            </div>
            
            <div v-else-if="error" class="alert alert-danger m-4">
              <i class="bi bi-exclamation-triangle me-2"></i>
              {{ error }}
            </div>
            
            <!-- CAD Görüntüleyici -->
            <div v-else-if="isCADDrawing">
              <CADViewerModal
                :modalId="'innerCADViewerModal'"
                :initialDrawingSrc="modelUrl"
                :title="title"
                @analysis-complete="handleAnalysisComplete"
                @apply-results="handleApplyResults"
              />
            </div>
            
            <!-- 3D Model Görüntüleyici -->
            <div v-else class="model-viewer-container">
              <div v-if="modelUrl" class="model-preview-wrapper">
                <!-- Model önizleme için iframe kullanımı -->
                <iframe v-if="isEmbeddableUrl" :src="modelUrl" class="model-preview-iframe" frameborder="0" allowfullscreen></iframe>
                
                <!-- Model önizleme bileşeni - ThreeJS benzeri bir kütüphane entegre edilebilir -->
                <div v-else class="model-placeholder d-flex align-items-center justify-content-center h-100">
                  <div class="text-center">
                    <i class="bi bi-cube fs-1 text-primary mb-3"></i>
                    <h5 class="mb-3">3D Model Önizleme</h5>
                    
                    <div class="model-info mb-3">
                      <div v-if="modelMetadata">
                        <div><strong>Boyutlar:</strong> {{ modelMetadata.dimensions }}</div>
                        <div><strong>Parça Sayısı:</strong> {{ modelMetadata.partCount }}</div>
                        <div><strong>Format:</strong> {{ modelMetadata.format }}</div>
                      </div>
                      <div v-else>
                        <small class="text-muted">Model URL: {{ modelUrl }}</small>
                      </div>
                    </div>
                    
                    <button class="btn btn-sm btn-outline-primary" @click="toggleModelOptions">
                      {{ showModelOptions ? 'Seçenekleri Gizle' : 'Seçenekleri Göster' }}
                    </button>
                  </div>
                </div>
                
                <!-- Model Seçenekleri -->
                <div v-if="showModelOptions" class="model-options p-3 border-top">
                  <div class="row g-3">
                    <div class="col-md-4">
                      <label class="form-label">Görünüm</label>
                      <select class="form-select form-select-sm">
                        <option value="shaded">Gölgeli</option>
                        <option value="wireframe">Tel Örgü</option>
                        <option value="points">Noktalar</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Arka Plan</label>
                      <select class="form-select form-select-sm">
                        <option value="light">Açık</option>
                        <option value="dark">Koyu</option>
                        <option value="gradient">Gradyan</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Döndürme</label>
                      <div class="btn-group w-100">
                        <button class="btn btn-sm btn-outline-secondary">
                          <i class="bi bi-arrow-counterclockwise"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary">
                          <i class="bi bi-arrow-clockwise"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary">
                          <i class="bi bi-aspect-ratio"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-else class="model-upload-placeholder d-flex align-items-center justify-content-center">
                <div class="text-center p-5">
                  <i class="bi bi-cloud-upload fs-1 text-primary mb-3"></i>
                  <h5>Model Yükle</h5>
                  <p class="text-muted mb-3">Desteklenen formatlar: OBJ, GLTF, STL, FBX</p>
                  <button class="btn btn-primary" @click="triggerModelUpload">
                    <i class="bi bi-upload me-2"></i>Model Seç
                  </button>
                  <input ref="modelUploadInput" type="file" class="d-none" @change="handleFileUpload" 
                         accept=".obj,.gltf,.glb,.stl,.fbx">
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer d-flex justify-content-between">
            <div>
              <button v-if="modelUrl && !isCADDrawing" class="btn btn-outline-primary me-2" @click="downloadModel">
                <i class="bi bi-download me-1"></i> İndir
              </button>
              
              <button v-if="isCADDrawing" class="btn btn-outline-success me-2" @click="analyzeDrawing">
                <i class="bi bi-search me-1"></i> Analiz Et
              </button>
            </div>
            
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import CADViewerModal from './CADViewerModal.vue';

export default {
  name: 'ModelViewerModal',
  
  components: {
    CADViewerModal
  },
  
  props: {
    modalId: {
      type: String,
      default: 'modelViewerModal'
    },
    title: {
      type: String,
      default: 'Model Görüntüleyici'
    },
    modelUrl: {
      type: String,
      default: ''
    },
    modelType: {
      type: String,
      default: 'auto' // 'auto', '3d', 'cad'
    },
    modelMetadata: {
      type: Object,
      default: () => null
    }
  },
  
  emits: ['model-analyzed', 'model-loaded', 'model-error'],
  
  setup(props, { emit }) {
    const loading = ref(false);
    const error = ref(null);
    const modelUploadInput = ref(null);
    const showModelOptions = ref(false);
    const analysisResults = ref(null);
    
    // CAD mı yoksa 3D model mi olduğunu belirle
    const isCADDrawing = computed(() => {
      if (props.modelType !== 'auto') {
        return props.modelType === 'cad';
      }
      
      // URL'ye bakarak otomatik belirleme
      if (props.modelUrl) {
        const cadExtensions = ['.dwg', '.dxf', '.pdf', '.svg', '.png', '.jpg', '.jpeg'];
        const url = props.modelUrl.toLowerCase();
        return cadExtensions.some(ext => url.endsWith(ext));
      }
      
      return false;
    });
    
    // Iframe'de gösterilebilir URL mi?
    const isEmbeddableUrl = computed(() => {
      if (!props.modelUrl) return false;
      
      // Desteklenen embeddable URL formatları
      return props.modelUrl.includes('sketchfab.com') || 
             props.modelUrl.includes('viewer.autodesk.com') ||
             props.modelUrl.includes('3dviewer.net') ||
             props.modelUrl.endsWith('.html');
    });
    
    // Yöntemler
    const triggerModelUpload = () => {
      modelUploadInput.value.click();
    };
    
    const handleFileUpload = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      loading.value = true;
      error.value = null;
      
      reader.onload = (e) => {
        // Başarılı yükleme
        emit('model-loaded', {
          url: e.target.result,
          type: getFileType(file.name),
          name: file.name,
          size: file.size
        });
        
        loading.value = false;
      };
      
      reader.onerror = () => {
        error.value = 'Dosya yüklenirken bir hata oluştu';
        loading.value = false;
        emit('model-error', 'Dosya yükleme hatası');
      };
      
      reader.readAsDataURL(file);
    };
    
    const getFileType = (filename) => {
      const extension = filename.split('.').pop().toLowerCase();
      
      const cadExtensions = ['dwg', 'dxf', 'pdf', 'svg', 'png', 'jpg', 'jpeg'];
      const modelExtensions = ['obj', 'gltf', 'glb', 'stl', 'fbx'];
      
      if (cadExtensions.includes(extension)) return 'cad';
      if (modelExtensions.includes(extension)) return '3d';
      
      return 'unknown';
    };
    
    const toggleModelOptions = () => {
      showModelOptions.value = !showModelOptions.value;
    };
    
    const downloadModel = () => {
      // URL'den model indirme
      if (props.modelUrl) {
        const link = document.createElement('a');
        link.href = props.modelUrl;
        link.download = props.modelUrl.split('/').pop() || 'model';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
    
    const analyzeDrawing = () => {
      // CAD analiz fonksiyonu - bileşen içindeki çocuk CADViewerModal'a ulaşmak için
      // Vue'nun $refs sistemi kullanılabilir, ancak burada basitlik için olay yayalım
      emit('model-analyzed', { action: 'analyze', url: props.modelUrl });
    };
    
    // CADViewerModal'dan gelen olayları işle
    const handleAnalysisComplete = (results) => {
      analysisResults.value = results;
      emit('model-analyzed', results);
    };
    
    const handleApplyResults = (results) => {
      emit('model-analyzed', { 
        action: 'apply', 
        results: results,
        url: props.modelUrl
      });
    };
    
    onMounted(() => {
      // Başlangıçta model URL'si varsa yükleniyor olarak göster ve yükle
      if (props.modelUrl) {
        loading.value = true;
        
        // Gerçek bir uygulama için model yükleme kontrolü yapılır
        setTimeout(() => {
          loading.value = false;
        }, 1000);
      }
    });
    
    return {
      loading,
      error,
      modelUploadInput,
      showModelOptions,
      isCADDrawing,
      isEmbeddableUrl,
      analysisResults,
      triggerModelUpload,
      handleFileUpload,
      toggleModelOptions,
      downloadModel,
      analyzeDrawing,
      handleAnalysisComplete,
      handleApplyResults
    };
  }
};
</script>

<style scoped>
.model-viewer-container {
  height: 70vh;
  min-height: 400px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.model-preview-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.model-preview-iframe {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border: none;
}

.model-placeholder {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background-color: #f8f9fa;
}

.model-upload-placeholder {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background-color: #f8f9fa;
  border: 2px dashed #dee2e6;
}

.model-info {
  max-width: 300px;
  margin: 0 auto;
}

.model-options {
  background-color: rgba(248, 249, 250, 0.8);
}

@media (max-width: 768px) {
  .model-viewer-container {
    height: 50vh;
  }
}
</style>