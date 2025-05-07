<template>
  <div class="ai-chat-modal" v-if="isVisible">
    <div class="ai-chat-container">
      <div class="ai-chat-header">
        <div class="d-flex align-items-center">
          <i class="bi bi-robot me-2"></i>
          <h5 class="m-0">Yapay Zeka Asistanı</h5>
          <span v-if="activeModel && activeModel.name" class="model-badge ms-2">{{ activeModel.name }}</span>
        </div>
        <div class="ai-chat-actions">
          <button class="btn btn-link" @click="toggleModelSelector" title="AI Modeli Değiştir">
            <i class="bi bi-gear"></i>
          </button>
          <button class="btn btn-link" @click="handleClearChat" title="Sohbeti Temizle">
            <i class="bi bi-trash"></i>
          </button>
          <button class="btn btn-link" @click="$emit('close')" title="Kapat">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
      
      <div v-if="showModelSelector" class="model-selector">
        <h6>AI Modeli Seç</h6>
        <div class="model-options">
          <div 
            v-for="(model, key) in supportedModels" 
            :key="key"
            :class="['model-option', activeModel && activeModel.key === key ? 'active' : '']"
            @click="selectModel(key)"
          >
            <div class="model-option-name">{{ model.name }}</div>
            <div class="model-option-capabilities">
              <span v-for="(cap, i) in model.capabilities" :key="i" class="model-capability">{{ cap }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="ai-chat-content" ref="chatContent">
        <div v-if="history.length === 0" class="ai-message ai-message-bot">
          <div class="ai-message-content">
            <p>Merhaba! Size nasıl yardımcı olabilirim?</p>
            <p class="small mb-0">Üretim durumları, malzeme stokları veya teknik bilgiler hakkında sorular sorabilirsiniz.</p>
            <div class="ai-quick-actions">
              <button @click="setQuickQuestion('Üretim durumu nedir?')" class="btn btn-sm btn-outline-primary">Üretim durumu</button>
              <button @click="setQuickQuestion('Geciken siparişler hangileri?')" class="btn btn-sm btn-outline-primary">Geciken siparişler</button>
              <button @click="setQuickQuestion('RM 36 CB hücresi 3D modelini göster')" class="btn btn-sm btn-outline-primary">3D Model</button>
              <button @click="setQuickQuestion('Gelecek hafta üretim tahmini')" class="btn btn-sm btn-outline-primary">Üretim tahmini</button>
            </div>
          </div>
        </div>
        
        <div v-for="(message, index) in history" :key="index" 
             :class="['ai-message', message.role === 'user' ? 'ai-message-user' : 'ai-message-bot']">
          <div class="ai-message-content">
            <div v-if="message.isSystemMessage" class="ai-system-message">
              <i class="bi bi-info-circle me-2"></i>
              {{ message.content }}
            </div>
            <p v-else-if="message.content">{{ message.content }}</p>
            
            <!-- CAD Model Preview -->
            <div v-if="message.modelPreview" class="ai-cad-preview">
              <div class="preview-header d-flex justify-content-between align-items-center">
                <span>{{ message.modelPreview.name }}</span>
                <button class="btn btn-sm btn-primary" @click="openModelViewer(message.modelPreview)">
                  3D Görünüm <i class="bi bi-box-arrow-up-right ms-1"></i>
                </button>
              </div>
              <div class="preview-image" @click="openModelViewer(message.modelPreview)">
                <img :src="message.modelPreview.image || '/assets/images/models/placeholder.png'" alt="CAD Model">
                <div class="preview-overlay">
                  <span>3D Modeli Görüntüle</span>
                </div>
              </div>
            </div>
            
            <!-- ML Prediction Results -->
            <div v-if="message.prediction && message.prediction.predictions" class="ai-prediction-results">
              <div class="prediction-header">
                <span>{{ message.prediction.modelType || 'Tahmin Sonuçları' }}</span>
                <span class="prediction-confidence">Güven: {{ formatConfidence(message.prediction.confidence) }}</span>
              </div>
              <div class="prediction-list">
                <div v-for="(pred, i) in message.prediction.predictions.slice(0, 3)" :key="i" class="prediction-item">
                  <div class="prediction-item-title">{{ pred.label }}</div>
                  <div class="prediction-item-value">{{ pred.value }}</div>
                  <div v-if="pred.trend" :class="['prediction-trend', getTrendClass(pred.trend)]">
                    <i class="bi" :class="getTrendIcon(pred.trend)"></i>
                    {{ pred.trendValue || '' }}
                  </div>
                </div>
                <button 
                  v-if="message.prediction.predictions.length > 3" 
                  class="btn btn-sm btn-outline-primary mt-2"
                  @click="openPredictionDetails(message)"
                >
                  Tüm sonuçları göster ({{ message.prediction.predictions.length }})
                </button>
                
                <div v-if="message.prediction.explanation" class="prediction-explanation mt-2">
                  <p class="small">{{ message.prediction.explanation }}</p>
                </div>
              </div>
            </div>
            
            <!-- Related Documents -->
            <div v-if="message.relatedDocs && message.relatedDocs.length > 0" class="ai-related-docs">
              <div class="related-docs-header">İlgili Belgeler:</div>
              <div class="related-docs-list">
                <div 
                  v-for="(doc, i) in message.relatedDocs.slice(0, 2)" 
                  :key="i" 
                  class="related-doc-item"
                  @click="openDocument(doc)"
                >
                  <i class="bi bi-file-earmark-text me-2"></i>
                  <span>{{ doc.name }}</span>
                </div>
                <button 
                  v-if="message.relatedDocs.length > 2" 
                  class="btn btn-sm btn-link"
                  @click="openDocumentsModal(message.relatedDocs)"
                >
                  + {{ message.relatedDocs.length - 2 }} belge daha
                </button>
              </div>
            </div>
            
            <p v-if="message.source && !message.isSystemMessage" class="ai-message-source">
              <small>Kaynak: {{ message.source }}</small>
            </p>
          </div>
        </div>
        
        <div v-if="isProcessing" class="ai-message ai-message-bot">
          <div class="ai-message-content">
            <div class="ai-typing">
              <div class="ai-typing-dot"></div>
              <div class="ai-typing-dot"></div>
              <div class="ai-typing-dot"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="ai-chat-input">
        <form @submit.prevent="handleSendMessage">
          <div class="input-group">
            <button 
              class="btn btn-outline-secondary dropdown-toggle" 
              type="button" 
              @click="toggleAdvancedOptions"
              :title="showAdvancedOptions ? 'Seçenekleri gizle' : 'Gelişmiş sorgu seçenekleri'"
            >
              <i class="bi" :class="showAdvancedOptions ? 'bi-caret-up' : 'bi-caret-down'"></i>
            </button>
            <input 
              type="text" 
              class="form-control" 
              placeholder="Mesajınızı yazın..." 
              v-model="userInput"
              :disabled="isProcessing" 
              @keypress.enter="handleSendMessage" 
            >
            <button class="btn btn-primary" type="submit" :disabled="isProcessing || !userInput.trim()">
              <i class="bi" :class="isProcessing ? 'bi-hourglass-split' : 'bi-send'"></i>
            </button>
          </div>
          
          <div v-if="showAdvancedOptions" class="advanced-options">
            <div class="row g-3 mt-2">
              <div class="col-md-6">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" v-model="options.searchTechnicalDocs" id="technicalDocsOption">
                  <label class="form-check-label" for="technicalDocsOption">Teknik dokümanlarda ara</label>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" v-model="options.searchCADModels" id="cadModelsOption">
                  <label class="form-check-label" for="cadModelsOption">3D modellerde ara</label>
                </div>
              </div>
            </div>
            <div class="row g-3 mt-2">
              <div class="col-md-6">
                <select class="form-select form-select-sm" v-model="selectedModelType" :disabled="!options.searchCADModels">
                  <option value="">Tüm model tipleri</option>
                  <option value="rm36cb">RM 36 CB</option>
                  <option value="rm36lb">RM 36 LB</option>
                  <option value="rm36bc">RM 36 BC</option>
                </select>
              </div>
              <div class="col-md-6">
                <div class="text-end">
                  <button 
                    type="button" 
                    class="btn btn-sm btn-outline-secondary"
                    @click="clearHistory"
                    title="Tüm sohbet geçmişini temizle"
                  >
                    Sohbeti Temizle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
  
  <!-- CAD Model Viewer Modal -->
  <model-viewer-modal 
    v-if="selectedModel" 
    :model="selectedModel" 
    :show="!!selectedModel" 
    @close="closeModelViewer" 
  />
  
  <!-- Prediction Details Modal -->
  <prediction-details-modal
    v-if="selectedPredictions"
    :predictions="selectedPredictions"
    :prediction-type="selectedPredictionType"
    :confidence="selectedConfidence"
    :show="!!selectedPredictions"
    @close="closePredictionDetails"
  />
  
  <!-- Documents Modal -->
  <documents-modal
    v-if="selectedDocuments && selectedDocuments.length"
    :documents="selectedDocuments"
    :show="!!selectedDocuments"
    @close="closeDocumentsModal"
  />
</template>

<script setup>
import { ref, watch, nextTick, onMounted, computed } from 'vue'
import { useAiService } from '@/services/ai-service'
import ModelViewerModal from './ModelViewerModal.vue'
import PredictionDetailsModal from './PredictionDetailsModal.vue'
import DocumentsModal from './DocumentsModal.vue'
import { useTechnicalStore } from '@/store/technical';

// Props
const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  }
})

// Emit
const emit = defineEmits(['close'])

// Servisler
const aiService = useAiService()
const technicalStore = useTechnicalStore();
const { 
  sendMessage, 
  history, 
  isProcessing, 
  clearHistory, 
  supportedModels, 
  switchModel, 
  getCurrentModel, 
  getSystemData,
  modelComponents,
  modelMeasurements
} = aiService

// State
const userInput = ref('')
const chatContent = ref(null)
const showModelSelector = ref(false)
const showAdvancedOptions = ref(false)
const activeModel = ref(null)
const selectedModel = ref(null)
const selectedPredictions = ref(null)
const selectedPredictionType = ref('')
const selectedConfidence = ref(0)
const selectedDocuments = ref(null)
const selectedModelType = ref('')
const options = ref({
  searchTechnicalDocs: false,
  runPrediction: false,
  searchCADModels: false
})

// Hesaplanmış değerler
const shouldSearchTechnical = computed(() => {
  if (options.value.searchTechnicalDocs) return true;
  
  // Alakalı anahtar kelimeler varsa otomatik olarak teknik dokümanlarda ara
  const keywords = ['teknik', 'doküman', 'şartname', 'talimat', 'çizim', 'manual', 'katalog'];
  return keywords.some(keyword => userInput.value.toLowerCase().includes(keyword));
})

const shouldRunPrediction = computed(() => {
  if (options.value.runPrediction) return true;
  
  // Tahmin ile ilgili anahtar kelimeler varsa otomatik olarak tahmin analizi çalıştır
  const keywords = ['tahmin', 'öngör', 'analiz', 'trend', 'gelecek', 'hafta', 'ay', 'ne olacak', 'beklen'];
  return keywords.some(keyword => userInput.value.toLowerCase().includes(keyword));
})

const shouldSearchCADModels = computed(() => {
  if (options.value.searchCADModels) return true;
  
  // 3D model ile ilgili anahtar kelimeler varsa otomatik olarak model ara
  const keywords = ['3d', 'model', 'cad', 'çizim', 'görselleştir', 'ar', 'vr', 'göster'];
  return keywords.some(keyword => userInput.value.toLowerCase().includes(keyword));
})

// AI modeli seçildiğinde
const selectModel = async (modelKey) => {
  if (switchModel(modelKey)) {
    activeModel.value = getCurrentModel();
    showModelSelector.value = false;
  }
}

// AI model seçicisini göster/gizle
const toggleModelSelector = () => {
  showModelSelector.value = !showModelSelector.value;
  activeModel.value = getCurrentModel();
}

// Gelişmiş seçenekleri göster/gizle
const toggleAdvancedOptions = () => {
  showAdvancedOptions.value = !showAdvancedOptions.value;
}

// Mesaj gönderme
const handleSendMessage = async () => {
  if (!userInput.value.trim() || isProcessing.value) return

  const userMessage = userInput.value
  userInput.value = ''
  
  // Bir mesaj gönderildikten sonra mesaj alanına odaklan
  nextTick(() => {
    const inputElement = document.querySelector('.ai-chat-input input')
    if (inputElement) {
      inputElement.focus()
    }
  });

  try {
    // Standart mesaj gönderimi
    let response = await sendMessage(userMessage)
    
    // Teknik dokümanlarda ara
    if (shouldSearchTechnical.value) {
      await searchTechnicalDocuments(userMessage)
    }
    
    // CAD modelleri ara
    if (shouldSearchCADModels.value && !response?.modelPreview) {
      await processCADModelRequest(userMessage)
    }
    
    await scrollToBottom()
  } catch (error) {
    console.error('AI yanıtı alınamadı:', error)
  }
}

// Teknik dokümanlarda ara
const searchTechnicalDocuments = async (query) => {
  try {
    // Teknik dokümanları ara
    const documents = await technicalStore.performTechnicalQuery(query);
    
    if (documents && documents.length > 0) {
      // Son mesaja ek olarak ilgili dokümanları ekle
      const lastMessage = history.value[history.value.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.relatedDocs = documents.map(doc => ({
          id: doc.id,
          name: doc.name,
          category: doc.category,
          version: doc.version
        }));
      }
    }
  } catch (error) {
    console.error('Teknik doküman araması hatası:', error);
  }
}

// CAD model isteğini işle
const processCADModelRequest = async (query) => {
  const modelKeywords = {
    'rm 36 cb': 'rm36cb',
    'rm36cb': 'rm36cb',
    'rm 36 lb': 'rm36lb',
    'rm36lb': 'rm36lb',
    'rm 36 bc': 'rm36bc',
    'rm36bc': 'rm36bc',
    'akım trafosu': 'tr36ai',
    'trafo': 'tr36ai',
    'tr36ai': 'tr36ai',
  }
  
  let modelId = selectedModelType.value
  
  // Model tipini sorgudan tespit et
  if (!modelId) {
    const lowerQuery = query.toLowerCase()
    for (const [keyword, id] of Object.entries(modelKeywords)) {
      if (lowerQuery.includes(keyword)) {
        modelId = id
        break
      }
    }
  }
  
  if (!modelId) return
  
  try {
    // Sistem verilerinden model bilgisini al
    const systemData = await getSystemData()
    const model = systemData.cadModels.find(m => m.id === modelId.toLowerCase())
    
    if (model) {
      // Mesaj geçmişine ekle
      history.value.push({
        role: 'assistant',
        content: `"${model.name}" 3D modelini buldum. Bu modeli incelemek ister misiniz?`,
        timestamp: new Date(),
        modelPreview: {
          id: model.id,
          name: model.name,
          image: model.previewImage
        },
        source: 'CAD Model Asistanı',
        relatedDocs: model.relatedDocs || []
      })
      
      // Model bileşenlerini al
      const components = await modelComponents(model.id)
      if (components.success) {
        // Özet bilgileri mesaj olarak ekle
        const compCount = components.data.components.length;
        history.value.push({
          role: 'assistant',
          content: `${model.name} modeli ${compCount} bileşenden oluşmaktadır. Ana bileşenler: ${components.data.components.slice(0, 2).map(c => c.name).join(', ')} ve diğerleri. 3D görünümde tüm detayları inceleyebilirsiniz.`,
          source: 'CAD Analizi',
          timestamp: new Date()
        })
      }
    }
  } catch (error) {
    console.error('CAD model işleme hatası:', error)
  }
}

// Güven oranını formatla
const formatConfidence = (confidence) => {
  const value = Number(confidence)
  if (isNaN(value)) return '?'
  return `%${(value * 100).toFixed(0)}`
}

// Eğilim simgesini al
const getTrendIcon = (trend) => {
  if (trend > 0) return 'bi-arrow-up-right'
  if (trend < 0) return 'bi-arrow-down-right'
  return 'bi-dash'
}

// Eğilim sınıfını al
const getTrendClass = (trend) => {
  if (trend > 0) return 'trend-up'
  if (trend < 0) return 'trend-down'
  return 'trend-neutral'
}

// 3D model görüntüleyicisini aç
const openModelViewer = (modelPreview) => {
  // Veriyi uyumlu formata dönüştür
  selectedModel.value = {
    id: modelPreview.id,
    name: modelPreview.name,
    previewImage: modelPreview.image
  }
}

// 3D model görüntüleyicisini kapat
const closeModelViewer = () => {
  selectedModel.value = null
}

// Tahmin detaylarını aç
const openPredictionDetails = (message) => {
  selectedPredictions.value = message.prediction.predictions
  selectedPredictionType.value = message.prediction.modelType
  selectedConfidence.value = message.prediction.confidence
}

// Tahmin detaylarını kapat
const closePredictionDetails = () => {
  selectedPredictions.value = null
  selectedPredictionType.value = ''
  selectedConfidence.value = 0
}

// Belgeleri aç
const openDocument = (doc) => {
  selectedDocuments.value = [doc]
}

// Belgeler modalını aç
const openDocumentsModal = (docs) => {
  selectedDocuments.value = docs
}

// Belgeler modalını kapat
const closeDocumentsModal = () => {
  selectedDocuments.value = null
}

// Hızlı soru ayarla
const setQuickQuestion = (question) => {
  userInput.value = question
}

// Chat geçmişini temizle
const handleClearChat = () => {
  if (confirm('Gerçekten sohbet geçmişini temizlemek istiyor musunuz?')) {
    clearHistory()
    showAdvancedOptions.value = false
  }
}

// Chat alanını en aşağı kaydır
const scrollToBottom = async () => {
  await nextTick()
  if (chatContent.value) {
    chatContent.value.scrollTop = chatContent.value.scrollHeight
  }
}

// Modal görünür olduğunda
watch(() => props.isVisible, async (newVal) => {
  if (newVal) {
    await nextTick()
    await scrollToBottom()
    
    const inputElement = document.querySelector('.ai-chat-input input')
    if (inputElement) {
      inputElement.focus()
    }
    
    // Aktif modeli yükle
    activeModel.value = getCurrentModel()
  }
})

// Mesaj geçmişi değiştiğinde kaydır
watch(history, scrollToBottom, { deep: true })

// Component yüklendiğinde
onMounted(() => {
  activeModel.value = getCurrentModel()
})
</script>

<style scoped>
.ai-chat-modal {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 450px;
  height: 600px;
  background-color: var(--bg-color, #ffffff);
  border-radius: 12px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
}

.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.ai-chat-header {
  padding: 15px;
  background-color: var(--primary-color, #0d6efd);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-chat-actions .btn-link {
  color: white;
  padding: 0 8px;
}

.ai-chat-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.ai-message {
  display: flex;
  margin-bottom: 15px;
}

.ai-message-user {
  justify-content: flex-end;
}

.ai-message-content {
  max-width: 80%;
  padding: 10px 15px;
  border-radius: 18px;
}

.ai-message-bot .ai-message-content {
  background-color: var(--light-color, #f0f2f5);
  color: var(--dark-color, #343a40);
}

.ai-message-user .ai-message-content {
  background-color: var(--primary-color, #0d6efd);
  color: white;
}

.ai-message-content p {
  margin: 0;
}

.ai-message-source {
  margin-top: 5px;
  font-style: italic;
  opacity: 0.8;
}

.ai-system-message {
  font-style: italic;
  color: var(--secondary-color, #6c757d);
  font-size: 0.9em;
}

.ai-chat-input {
  padding: 15px;
  border-top: 1px solid var(--border-color, #dee2e6);
}

.ai-typing {
  display: flex;
  align-items: center;
}

.ai-typing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--gray-color, #6c757d);
  margin: 0 2px;
  animation: typing 1s infinite ease-in-out;
}

.ai-typing-dot:nth-child(1) {
  animation-delay: 0s;
}

.ai-typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.ai-typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

.model-selector {
  background-color: var(--light-color, #f8f9fa);
  padding: 1rem;
  border-bottom: 1px solid var(--border-color, #dee2e6);
}

.model-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.model-option {
  padding: 10px;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.model-option:hover {
  background-color: rgba(13, 110, 253, 0.1);
}

.model-option.active {
  border-color: var(--primary-color, #0d6efd);
  background-color: rgba(13, 110, 253, 0.1);
}

.model-option-name {
  font-weight: 600;
}

.model-option-capabilities {
  margin-top: 5px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.model-capability {
  font-size: 0.7rem;
  background-color: var(--light-color, #e9ecef);
  padding: 2px 6px;
  border-radius: 10px;
}

.model-badge {
  font-size: 0.7rem;
  background-color: rgba(255, 255, 255, 0.3);
  padding: 2px 8px;
  border-radius: 10px;
}

.advanced-options {
  padding: 0.75rem;
  background-color: var(--light-color, #f8f9fa);
  border-radius: 0.5rem;
  margin-top: 0.5rem;
}

.ai-quick-actions {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ai-cad-preview {
  margin-top: 10px;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  padding: 8px 12px;
  background-color: var(--light-color, #f0f2f5);
  border-bottom: 1px solid var(--border-color, #dee2e6);
  font-weight: 500;
}

.preview-image {
  position: relative;
  height: 180px;
  cursor: pointer;
  overflow: hidden;
}

.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s;
}

.preview-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 8px;
  color: white;
  text-align: center;
  transform: translateY(100%);
  transition: transform 0.3s;
}

.preview-image:hover img {
  transform: scale(1.05);
}

.preview-image:hover .preview-overlay {
  transform: translateY(0);
}

.ai-prediction-results {
  margin-top: 10px;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 8px;
}

.prediction-header {
  padding: 8px 12px;
  background-color: var(--light-color, #f0f2f5);
  border-bottom: 1px solid var(--border-color, #dee2e6);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.prediction-confidence {
  font-size: 0.8rem;
  background-color: var(--primary-color, #0d6efd);
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
}

.prediction-list {
  padding: 10px;
}

.prediction-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  border-bottom: 1px solid var(--border-color, #dee2e6);
  align-items: center;
}

.prediction-item:last-child {
  border-bottom: none;
}

.prediction-item-title {
  flex: 2;
}

.prediction-item-value {
  flex: 1;
  text-align: right;
  font-weight: 500;
}

.prediction-trend {
  margin-left: 10px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 2px;
}

.prediction-explanation {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color, #dee2e6);
  font-size: 0.9em;
  color: var(--secondary-color, #6c757d);
}

.trend-up {
  color: var(--success-color, #198754);
}

.trend-down {
  color: var(--danger-color, #dc3545);
}

.trend-neutral {
  color: var(--secondary-color, #6c757d);
}

.ai-related-docs {
  margin-top: 10px;
  padding: 8px 10px;
  background-color: var(--light-color, #f8f9fa);
  border-radius: 8px;
}

.related-docs-header {
  font-weight: 500;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.related-doc-item {
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 4px;
}

.related-doc-item:hover {
  background-color: rgba(13, 110, 253, 0.1);
}

@keyframes typing {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0);
  }
}

/* Koyu mod desteği */
@media (prefers-color-scheme: dark) {
  .ai-chat-modal {
    --bg-color: #212529;
    --border-color: #495057;
    --light-color: #343a40;
  }
  
  .ai-message-bot .ai-message-content {
    background-color: #343a40;
    color: #f8f9fa;
  }
  
  .ai-chat-input {
    background-color: #212529;
  }
  
  .model-selector,
  .advanced-options {
    background-color: #2c3034;
  }
  
  .model-capability {
    background-color: #495057;
    color: #e9ecef;
  }
  
  .ai-related-docs,
  .prediction-header,
  .preview-header {
    background-color: #343a40;
    color: #e9ecef;
  }
}
</style>