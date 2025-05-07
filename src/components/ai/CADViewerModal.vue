<template>
  <div class="cad-viewer-modal">
    <div class="modal fade" :id="modalId" tabindex="-1" aria-labelledby="cadViewerLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-fullscreen-lg-down">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title" id="cadViewerLabel">
              <i class="bi bi-file-earmark-ruled me-2"></i>
              {{ title || 'Teknik Çizim Görüntüleyici' }}
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Kapat"></button>
          </div>
          <div class="modal-body p-0">
            <!-- Yükleme göstergesi -->
            <div v-if="isLoading" class="loading-overlay d-flex align-items-center justify-content-center">
              <div class="text-center">
                <div class="spinner-border text-primary mb-3" role="status"></div>
                <p>{{ loadingMessage || 'Dosya yükleniyor...' }}</p>
              </div>
            </div>

            <!-- Çizim ve analiz sonuçları ekranı -->
            <div class="cad-viewer-container" :class="{ 'with-sidebar': showAnalysisPane }">
              <div class="cad-viewer-sidebar" v-if="showAnalysisPane">
                <div class="analysis-controls mb-3">
                  <h6 class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-2">
                    <span>Analiz İşlemleri</span>
                  </h6>
                  <div class="px-3">
                    <button @click="analyzeDrawing" class="btn btn-sm btn-primary mb-2 w-100" :disabled="isLoading || !drawingLoaded">
                      <i class="bi bi-search me-2"></i>Çizimi Analiz Et
                    </button>
                    <div class="list-group list-group-flush">
                      <button @click="extractBOM" class="list-group-item list-group-item-action" :disabled="isLoading || !drawingLoaded">
                        <i class="bi bi-list-ul me-2"></i>Malzeme Listesi Çıkar
                      </button>
                      <button @click="detectErrors" class="list-group-item list-group-item-action" :disabled="isLoading || !drawingLoaded">
                        <i class="bi bi-exclamation-triangle me-2"></i>Hataları Tespit Et
                      </button>
                      <button @click="extractText" class="list-group-item list-group-item-action" :disabled="isLoading || !drawingLoaded">
                        <i class="bi bi-type me-2"></i>Metin Çıkar
                      </button>
                      <button v-if="canGenerate3D" @click="generate3DPreview" class="list-group-item list-group-item-action" :disabled="isLoading || !drawingLoaded">
                        <i class="bi bi-badge-3d me-2"></i>3D Önizleme Oluştur
                      </button>
                    </div>
                  </div>
                </div>
                
                <div v-if="analysisResult" class="analysis-results">
                  <!-- Analiz sonuçları başlık -->
                  <h6 class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-2">
                    <span>Analiz Sonuçları</span>
                    <span class="badge bg-success rounded-pill">{{ analysisConfidence }}%</span>
                  </h6>

                  <!-- Dosya bilgileri -->
                  <div class="px-3 mb-3">
                    <div class="card">
                      <div class="card-body p-2">
                        <h6 class="card-title mb-2">Dosya Bilgileri</h6>
                        <div class="small">
                          <div><strong>Dosya türü:</strong> {{ fileType }}</div>
                          <div><strong>Analiz zamanı:</strong> {{ analysisTime }}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Boyutlar -->
                  <div v-if="dimensions && dimensions.length" class="px-3 mb-3">
                    <div class="card">
                      <div class="card-body p-2">
                        <h6 class="card-title mb-2">Boyutlar</h6>
                        <ul class="list-unstyled small mb-0">
                          <li v-for="(dim, index) in dimensions" :key="index">
                            <strong>{{ dim.type }}:</strong> {{ dim.value }} {{ dim.unit }}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Bileşenler -->
                  <div v-if="components && components.length" class="px-3 mb-3">
                    <div class="card">
                      <div class="card-header p-2">
                        <h6 class="card-title mb-0">Tespit Edilen Bileşenler</h6>
                      </div>
                      <ul class="list-group list-group-flush">
                        <li v-for="(comp, index) in components" :key="index" class="list-group-item p-2 small">
                          <div><strong>{{ comp.name }}</strong></div>
                          <div class="text-muted">Tür: {{ comp.type }}</div>
                          <div v-if="comp.material" class="text-muted">Malzeme: {{ comp.material }}</div>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <!-- Hatalar -->
                  <div v-if="errors && errors.length" class="px-3 mb-3">
                    <div class="card">
                      <div class="card-header p-2 text-white" :class="errorSeverityClass">
                        <h6 class="card-title mb-0">Tespit Edilen Hatalar</h6>
                      </div>
                      <ul class="list-group list-group-flush">
                        <li v-for="(error, index) in errors" :key="index" class="list-group-item p-2 small">
                          <div class="d-flex justify-content-between align-items-center">
                            <strong>{{ error.description }}</strong>
                            <span class="badge" :class="getSeverityClass(error.severity)">{{ error.severity }}</span>
                          </div>
                          <div class="text-muted">{{ error.type }}</div>
                          <div v-if="error.fix" class="text-success mt-1">
                            <i class="bi bi-tools me-1"></i>{{ error.fix }}
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <!-- Malzeme listesi -->
                  <div v-if="billOfMaterials && billOfMaterials.length" class="px-3 mb-3">
                    <div class="card">
                      <div class="card-header p-2">
                        <h6 class="card-title mb-0">Malzeme Listesi (BOM)</h6>
                      </div>
                      <div class="table-responsive">
                        <table class="table table-sm table-bordered mb-0">
                          <thead>
                            <tr>
                              <th>Poz.</th>
                              <th>Parça No</th>
                              <th>Açıklama</th>
                              <th>Adet</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="item in billOfMaterials" :key="item.position">
                              <td>{{ item.position }}</td>
                              <td>{{ item.partNumber }}</td>
                              <td>{{ item.description }}</td>
                              <td>{{ item.quantity }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <!-- Çıkarılan metin -->
                  <div v-if="extractedTexts && extractedTexts.length" class="px-3 mb-3">
                    <div class="card">
                      <div class="card-header p-2">
                        <h6 class="card-title mb-0">Çizimdeki Metinler</h6>
                      </div>
                      <ul class="list-group list-group-flush">
                        <li v-for="(text, index) in extractedTexts" :key="index" class="list-group-item p-2 small">
                          <div><strong>{{ text.text }}</strong></div>
                          <div class="text-muted">Tür: {{ text.type }}</div>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <!-- Özet -->
                  <div v-if="summary" class="px-3 mb-3">
                    <div class="card">
                      <div class="card-body p-2">
                        <h6 class="card-title mb-2">Özet</h6>
                        <div class="small">
                          <div v-if="summary.detectedProduct"><strong>Ürün:</strong> {{ summary.detectedProduct }}</div>
                          <div v-if="summary.mainDimensions"><strong>Ana Boyutlar:</strong> {{ summary.mainDimensions }}</div>
                          <div v-if="summary.primaryMaterial"><strong>Ana Malzeme:</strong> {{ summary.primaryMaterial }}</div>
                          <div v-if="summary.componentCount"><strong>Bileşen Sayısı:</strong> {{ summary.componentCount }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="cad-viewer-main">
                <!-- Çizim görüntüleme alanı -->
                <div class="drawing-container" ref="drawingContainer">
                  <img v-if="isImageDrawing && drawingSrc" :src="drawingSrc" class="img-fluid technical-drawing" 
                       @load="onDrawingLoaded" @error="onDrawingError" ref="drawingImage">
                  
                  <div v-if="modelUrl && showModelViewer" class="model-viewer-container">
                    <!-- 3D Model viewer burada yer alacak (üçüncü parti kütüphane entegrasyonu) -->
                    <div class="model-placeholder d-flex align-items-center justify-content-center h-100 border">
                      <div class="text-center p-4">
                        <i class="bi bi-badge-3d fs-1 mb-3"></i>
                        <h5>3D Model Görüntüleyici</h5>
                        <p class="mb-2">Model URL: {{ modelUrl }}</p>
                        <p class="text-muted">Model görüntüleyici entegrasyonu gerekiyor</p>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="!drawingSrc && !modelUrl" class="drawing-placeholder d-flex align-items-center justify-content-center h-100">
                    <div class="text-center">
                      <i class="bi bi-upload fs-1 mb-3"></i>
                      <h5>Teknik Çizim Yükle</h5>
                      <p class="text-muted">CAD dosyası veya çizim görüntüsü seçin</p>
                      <label class="btn btn-outline-primary">
                        Dosya Seç
                        <input type="file" class="d-none" @change="onFileSelected" accept=".dwg,.dxf,.pdf,.png,.jpg,.jpeg,.svg">
                      </label>
                    </div>
                  </div>

                  <!-- Görselleştirme öğeleri (bounding box vs) -->
                  <div v-if="drawingLoaded && showVisualizations" class="visualization-layer">
                    <div v-for="(comp, index) in components" :key="'viz-'+index" 
                        :style="getBoundingBoxStyle(comp.boundingBox)"
                        class="component-box">
                      <span class="component-label">{{ comp.name }}</span>
                    </div>
                  </div>
                </div>

                <!-- Çizim kontrolü toolbar -->
                <div v-if="drawingLoaded" class="drawing-toolbar bg-light p-2">
                  <div class="btn-group me-2">
                    <button class="btn btn-sm btn-outline-secondary" title="Yakınlaştır">
                      <i class="bi bi-zoom-in"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" title="Uzaklaştır">
                      <i class="bi bi-zoom-out"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" title="Sığdır">
                      <i class="bi bi-arrows-fullscreen"></i>
                    </button>
                  </div>
                  
                  <div class="btn-group me-2">
                    <button @click="toggleVisualizations" class="btn btn-sm" 
                            :class="showVisualizations ? 'btn-primary' : 'btn-outline-secondary'"
                            title="Görselleştirmeler">
                      <i class="bi bi-eye"></i>
                    </button>
                    <button @click="toggleAnalysisPane" class="btn btn-sm" 
                            :class="showAnalysisPane ? 'btn-primary' : 'btn-outline-secondary'"
                            title="Analiz Paneli">
                      <i class="bi bi-layout-sidebar"></i>
                    </button>
                  </div>
                  
                  <div class="btn-group">
                    <button @click="downloadResults" class="btn btn-sm btn-outline-primary" title="Sonuçları İndir">
                      <i class="bi bi-download"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Temizle" @click="resetViewer">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Kapat</button>
            <button type="button" class="btn btn-primary" :disabled="!analysisResult" @click="applyResults">
              Sonuçları Uygula
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { cadAiService } from '@/services/cad-ai-service';
import { useToast } from '@/composables/useToast';

export default {
  name: 'CADViewerModal',
  
  props: {
    modalId: {
      type: String,
      default: 'cadViewerModal'
    },
    title: {
      type: String,
      default: 'Teknik Çizim Görüntüleyici'
    },
    initialDrawingSrc: {
      type: String,
      default: ''
    }
  },
  
  emits: ['analysis-complete', 'apply-results'],
  
  setup(props, { emit }) {
    const { toast } = useToast();
    const drawingContainer = ref(null);
    const drawingImage = ref(null);
    
    // Durum değişkenleri
    const isLoading = ref(false);
    const loadingMessage = ref('');
    const drawingSrc = ref(props.initialDrawingSrc || '');
    const drawingLoaded = ref(false);
    const fileType = ref(null);
    const showAnalysisPane = ref(true);
    const showVisualizations = ref(true);
    const analysisResult = ref(null);
    const selectedFile = ref(null);
    const modelUrl = ref('');
    const showModelViewer = ref(false);
    
    // Çizimden çıkarılan veriler
    const components = ref([]);
    const dimensions = ref([]);
    const errors = ref([]);
    const billOfMaterials = ref([]);
    const extractedTexts = ref([]);
    const summary = ref(null);
    
    // Hesaplanan özellikler
    const isImageDrawing = computed(() => {
      const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp'];
      return !fileType.value || imageExtensions.includes(fileType.value.toLowerCase());
    });
    
    const canGenerate3D = computed(() => {
      const supported = ['.dwg', '.dxf', '.step', '.stp', '.iges', '.igs'];
      return fileType.value && supported.includes(fileType.value.toLowerCase());
    });
    
    const errorSeverityClass = computed(() => {
      if (!errors.value || errors.value.length === 0) return 'bg-success';
      
      const hasCritical = errors.value.some(e => e.severity === 'high');
      const hasMedium = errors.value.some(e => e.severity === 'medium');
      
      if (hasCritical) return 'bg-danger';
      if (hasMedium) return 'bg-warning';
      return 'bg-info';
    });
    
    const analysisTime = computed(() => {
      if (!analysisResult.value?.timestamp) return '-';
      return new Date(analysisResult.value.timestamp).toLocaleString();
    });
    
    const analysisConfidence = computed(() => {
      if (!analysisResult.value?.result?.summary?.confidence) return '-';
      return Math.round(analysisResult.value.result.summary.confidence * 100);
    });
    
    // Metodlar
    const loadDrawing = (src, type = null) => {
      drawingSrc.value = src;
      fileType.value = type;
      modelUrl.value = '';
      showModelViewer.value = false;
      resetAnalysisData();
    };
    
    const onFileSelected = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      selectedFile.value = file;
      fileType.value = '.' + file.name.split('.').pop().toLowerCase();
      
      // Dosya türünü kontrol et
      if (!cadAiService._isSupportedFileFormat(fileType.value)) {
        toast.error(`Desteklenmeyen dosya formatı: ${fileType.value}`);
        return;
      }
      
      if (isImageDrawing.value) {
        // Görüntü dosyaları için URL oluştur
        const reader = new FileReader();
        reader.onload = (e) => {
          drawingSrc.value = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        // CAD dosyaları için görüntü dönüştürme simülasyonu (demo)
        isLoading.value = true;
        loadingMessage.value = 'CAD dosyası işleniyor...';
        
        // Demo: Gecikme ile görüntü yükleniyor gibi davran
        setTimeout(() => {
          // Demo: Gerçek uygulamada CAD dosyası önizlemesi API'den alınacak
          drawingSrc.value = 'https://example.com/cad-preview.png';
          // Test için gerçek bir görüntü URL'si atama:
          drawingSrc.value = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSI1MCIgeT0iNTAiIHdpZHRoPSI3MDAiIGhlaWdodD0iNTAwIiBzdHJva2U9ImJsYWNrIiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iMTAwIiB5MT0iMTAwIiB4Mj0iNzAwIiB5Mj0iMTAwIiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjEiLz48bGluZSB4MT0iMTAwIiB5MT0iMTUwIiB4Mj0iNzAwIiB5Mj0iMTUwIiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjEiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIzMDAiIHI9IjgwIiBzdHJva2U9ImJsYWNrIiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjEiLz48cmVjdCB4PSI0MDAiIHk9IjI1MCIgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxMDAiIHN0cm9rZT0iYmxhY2siIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIvPjx0ZXh0IHg9IjUwIiB5PSI0MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjIwIj5PUlRBIEdFUklMSU0gSFVDUkU8L3RleHQ+PHRleHQgeD0iNTAwIiB5PSI0MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij5STSAzNiBDQjwvdGV4dD48L3N2Zz4=';
          isLoading.value = false;
          drawingLoaded.value = true;
        }, 1500);
      }
    };
    
    const onDrawingLoaded = () => {
      drawingLoaded.value = true;
      isLoading.value = false;
    };
    
    const onDrawingError = () => {
      toast.error('Çizim yüklenirken hata oluştu');
      isLoading.value = false;
      drawingLoaded.value = false;
    };
    
    const analyzeDrawing = async () => {
      try {
        isLoading.value = true;
        loadingMessage.value = 'Çizim analiz ediliyor...';
        resetAnalysisData();
        
        // Analiz işlemini başlat
        const result = await cadAiService.analyzeDrawing(selectedFile.value || drawingSrc.value, {
          fileType: fileType.value
        });
        
        if (!result.success) {
          throw new Error(result.error || 'Analiz başarısız oldu');
        }
        
        // Sonuçları işle
        analysisResult.value = result;
        processAnalysisResults(result.analysis);
        
        toast.success('Çizim analizi tamamlandı');
        emit('analysis-complete', result);
      } catch (error) {
        toast.error(`Analiz hatası: ${error.message}`);
        console.error('Çizim analiz hatası:', error);
      } finally {
        isLoading.value = false;
      }
    };
    
    const extractBOM = async () => {
      try {
        isLoading.value = true;
        loadingMessage.value = 'Malzeme listesi çıkarılıyor...';
        
        const result = await cadAiService.extractBillOfMaterials(selectedFile.value || drawingSrc.value);
        
        if (!result.success) {
          throw new Error(result.error || 'BOM çıkarma başarısız oldu');
        }
        
        billOfMaterials.value = result.billOfMaterials;
        toast.success('Malzeme listesi başarıyla çıkarıldı');
      } catch (error) {
        toast.error(`BOM çıkarma hatası: ${error.message}`);
      } finally {
        isLoading.value = false;
      }
    };
    
    const detectErrors = async () => {
      try {
        isLoading.value = true;
        loadingMessage.value = 'Çizimdeki hatalar tespit ediliyor...';
        
        const result = await cadAiService.detectErrors(selectedFile.value || drawingSrc.value);
        
        if (!result.success) {
          throw new Error(result.error || 'Hata tespiti başarısız oldu');
        }
        
        errors.value = result.errors;
        toast.success(`${result.errors.length} hata tespit edildi`);
      } catch (error) {
        toast.error(`Hata tespiti sırasında sorun: ${error.message}`);
      } finally {
        isLoading.value = false;
      }
    };
    
    const extractText = async () => {
      try {
        isLoading.value = true;
        loadingMessage.value = 'Çizimdeki metinler çıkarılıyor...';
        
        const result = await cadAiService.extractText(selectedFile.value || drawingSrc.value);
        
        if (!result.success) {
          throw new Error(result.error || 'Metin çıkarma başarısız oldu');
        }
        
        extractedTexts.value = result.texts;
        toast.success(`${result.texts.length} metin öğesi tespit edildi`);
      } catch (error) {
        toast.error(`Metin çıkarma hatası: ${error.message}`);
      } finally {
        isLoading.value = false;
      }
    };
    
    const generate3DPreview = async () => {
      try {
        isLoading.value = true;
        loadingMessage.value = '3D model oluşturuluyor...';
        
        const result = await cadAiService.generateModelPreview(selectedFile.value || drawingSrc.value);
        
        if (!result.success) {
          throw new Error(result.error || '3D model oluşturma başarısız oldu');
        }
        
        modelUrl.value = result.modelData.url;
        showModelViewer.value = true;
        toast.success('3D model önizlemesi oluşturuldu');
      } catch (error) {
        toast.error(`3D model oluşturma hatası: ${error.message}`);
      } finally {
        isLoading.value = false;
      }
    };
    
    const processAnalysisResults = (analysis) => {
      // Sonuçları ilgili state değişkenlerine aktar
      if (analysis.components) {
        components.value = analysis.components;
      } else if (analysis.recognizedObjects) {
        components.value = analysis.recognizedObjects.map(obj => ({
          id: obj.id,
          name: obj.class,
          type: 'component',
          confidence: obj.confidence,
          boundingBox: obj.boundingBox
        }));
      }
      
      if (analysis.dimensions) {
        dimensions.value = analysis.dimensions;
      }
      
      if (analysis.summary) {
        summary.value = analysis.summary;
      }
      
      // Metinleri kontrol et
      if (analysis.extractedText) {
        extractedTexts.value = analysis.extractedText;
      }
      
      // Çıkarılan verileri görselleştirmeleri aktifleştir
      showVisualizations.value = true;
    };
    
    const toggleAnalysisPane = () => {
      showAnalysisPane.value = !showAnalysisPane.value;
    };
    
    const toggleVisualizations = () => {
      showVisualizations.value = !showVisualizations.value;
    };
    
    const getBoundingBoxStyle = (box) => {
      if (!box) return {};
      
      return {
        position: 'absolute',
        left: `${box.x}px`,
        top: `${box.y}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
        border: '2px solid rgba(0, 123, 255, 0.8)',
        backgroundColor: 'rgba(0, 123, 255, 0.1)'
      };
    };
    
    const getSeverityClass = (severity) => {
      switch(severity) {
        case 'high': return 'bg-danger';
        case 'medium': return 'bg-warning text-dark';
        case 'low': return 'bg-info text-dark';
        default: return 'bg-secondary';
      }
    };
    
    const resetAnalysisData = () => {
      analysisResult.value = null;
      components.value = [];
      dimensions.value = [];
      errors.value = [];
      billOfMaterials.value = [];
      extractedTexts.value = [];
      summary.value = null;
    };
    
    const resetViewer = () => {
      drawingSrc.value = '';
      drawingLoaded.value = false;
      fileType.value = null;
      selectedFile.value = null;
      modelUrl.value = '';
      showModelViewer.value = false;
      resetAnalysisData();
    };
    
    const downloadResults = () => {
      if (!analysisResult.value) {
        toast.error('İndirilebilir sonuç bulunamadı');
        return;
      }
      
      // JSON verisini indirilebilir dosyaya dönüştür
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
        JSON.stringify(analysisResult.value.result, null, 2)
      );
      
      // İndirme bağlantısı oluştur
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "cad_analysis_results.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    };
    
    const applyResults = () => {
      if (!analysisResult.value) {
        toast.error('Uygulanacak sonuç bulunamadı');
        return;
      }
      
      // Sonuçları üst bileşene gönder
      emit('apply-results', {
        components: components.value,
        dimensions: dimensions.value,
        extractedTexts: extractedTexts.value,
        billOfMaterials: billOfMaterials.value,
        summary: summary.value,
        errors: errors.value,
        analysisResult: analysisResult.value
      });
      
      toast.success('Analiz sonuçları başarıyla uygulandı');
    };
    
    // Başlangıçta çizim varsa yükle
    onMounted(() => {
      if (props.initialDrawingSrc) {
        loadDrawing(props.initialDrawingSrc);
      }
    });
    
    return {
      // Refs
      isLoading,
      loadingMessage,
      drawingSrc,
      drawingLoaded,
      showAnalysisPane,
      showVisualizations,
      fileType,
      components,
      dimensions,
      errors,
      billOfMaterials,
      extractedTexts,
      summary,
      analysisResult,
      drawingContainer,
      drawingImage,
      modelUrl,
      showModelViewer,
      
      // Computed
      isImageDrawing,
      canGenerate3D,
      errorSeverityClass,
      analysisTime,
      analysisConfidence,
      
      // Metodlar
      loadDrawing,
      onFileSelected,
      onDrawingLoaded,
      onDrawingError,
      analyzeDrawing,
      extractBOM,
      detectErrors,
      extractText,
      generate3DPreview,
      toggleAnalysisPane,
      toggleVisualizations,
      getBoundingBoxStyle,
      getSeverityClass,
      resetViewer,
      downloadResults,
      applyResults
    };
  }
};
</script>

<style scoped>
.cad-viewer-container {
  display: flex;
  height: calc(90vh - 150px);
}

.cad-viewer-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.cad-viewer-sidebar {
  width: 320px;
  height: 100%;
  overflow-y: auto;
  border-right: 1px solid #dee2e6;
  background-color: #f8f9fa;
}

.cad-viewer-container.with-sidebar .cad-viewer-main {
  flex: 1;
}

.drawing-container {
  flex: 1;
  position: relative;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #eaeaea;
  min-height: 400px;
}

.drawing-placeholder {
  flex: 1;
  background-color: #f8f9fa;
  border: 2px dashed #ccc;
  min-height: 400px;
}

.technical-drawing {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.visualization-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.component-box {
  position: absolute;
  cursor: pointer;
  pointer-events: all;
}

.component-label {
  position: absolute;
  bottom: -20px;
  left: 0;
  background-color: rgba(0, 123, 255, 0.8);
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 2px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

.model-viewer-container {
  width: 100%;
  height: 100%;
}

.model-placeholder {
  width: 100%;
  height: 100%;
  background-color: #f8f9fa;
}

.sidebar-heading {
  font-size: 0.85rem;
  text-transform: uppercase;
  color: #6c757d;
  letter-spacing: 0.05rem;
}
</style>