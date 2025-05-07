<template>
  <div class="model-selector">
    <div class="model-selector-header">
      <h6 class="m-0">AI Modeli Seçin</h6>
    </div>
    <div class="model-list">
      <div 
        v-for="model in models" 
        :key="model.key" 
        class="model-item" 
        :class="{ active: model.key === activeModel }"
        @click="selectModel(model.key)"
      >
        <div class="model-icon">
          <i :class="getModelIcon(model)"></i>
        </div>
        <div class="model-details">
          <div class="model-name">{{ model.name }}</div>
          <div class="model-description">{{ model.description }}</div>
          <div class="model-capabilities">
            <span 
              v-for="(capability, index) in model.capabilities" 
              :key="index"
              class="badge rounded-pill me-1"
              :class="getCapabilityClass(capability)"
            >{{ capability }}</span>
          </div>
        </div>
        <div class="model-status" v-if="model.key === activeModel">
          <i class="bi bi-check-circle-fill text-success"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  models: {
    type: Array,
    required: true,
    default: () => []
  },
  activeModel: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['select'])

// Model ikonu
const getModelIcon = (model) => {
  if (model.icon) return model.icon
  
  switch (model.type) {
    case 'gpt':
      return 'bi bi-chat-square-text'
    case 'embed':
      return 'bi bi-list-nested'
    case 'vision':
      return 'bi bi-camera'
    case 'technical':
      return 'bi bi-gear'
    case 'cad':
      return 'bi bi-box'
    default:
      return 'bi bi-cpu'
  }
}

// Yetenek sınıfı
const getCapabilityClass = (capability) => {
  // Yeteneklere göre renk belirle
  switch (capability.toLowerCase()) {
    case 'chat':
    case 'sohbet':
      return 'bg-primary'
    case 'vision':
    case 'görüntü':
    case 'image':
    case 'görsel':
      return 'bg-info'
    case 'cad':
    case '3d':
      return 'bg-success'
    case 'technical':
    case 'teknik':
      return 'bg-warning'
    case 'ml':
    case 'ai':
    case 'yapay zeka':
      return 'bg-danger'
    default:
      return 'bg-secondary'
  }
}

// Model seç
const selectModel = (modelKey) => {
  emit('select', modelKey)
}
</script>

<style scoped>
.model-selector {
  position: absolute;
  top: 100%;
  left: 0;
  width: 320px;
  background-color: var(--bg-color, #ffffff);
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color, #dee2e6);
  z-index: 1000;
  margin-top: 10px;
  max-height: 350px;
  overflow-y: auto;
}

.model-selector-header {
  padding: 12px 15px;
  border-bottom: 1px solid var(--border-color, #dee2e6);
  background-color: var(--bg-light, #f8f9fa);
}

.model-list {
  padding: 8px 0;
}

.model-item {
  display: flex;
  padding: 10px 15px;
  border-bottom: 1px solid var(--border-color, #dee2e6);
  cursor: pointer;
  transition: background-color 0.2s;
}

.model-item:last-child {
  border-bottom: none;
}

.model-item:hover {
  background-color: var(--bg-light, #f8f9fa);
}

.model-item.active {
  background-color: var(--bg-active, #e9ecef);
}

.model-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--bg-light, #f8f9fa);
  margin-right: 12px;
  color: var(--primary-color, #0d6efd);
}

.model-details {
  flex: 1;
}

.model-name {
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 2px;
}

.model-description {
  font-size: 12px;
  color: var(--text-muted, #6c757d);
  margin-bottom: 5px;
}

.model-capabilities {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.model-capabilities .badge {
  font-size: 10px;
  font-weight: 500;
}

.model-status {
  display: flex;
  align-items: center;
  margin-left: 8px;
}

/* Koyu tema desteği */
@media (prefers-color-scheme: dark) {
  .model-selector {
    --bg-color: #212529;
    --bg-light: #2c3034;
    --bg-active: #343a40;
    --border-color: #495057;
    color: #f8f9fa;
  }
  
  .model-icon {
    background-color: #343a40;
  }
  
  .model-description {
    color: #adb5bd;
  }
}
</style>