<template>
  <div class="ai-chatbot-button">
    <button 
      class="floating-ai-button"
      @click="openChatModal"
      :disabled="isProcessing"
    >
      <span v-if="isProcessing" class="spinner"></span>
      <span v-else>
        <i class="fas fa-robot"></i>
        <span class="button-text">METS AI Asistan</span>
      </span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useTechnicalStore } from '@/store/technical';

const technicalStore = useTechnicalStore();

const openChatModal = () => {
  technicalStore.openChatModal();
};

const isProcessing = computed(() => technicalStore.isProcessing);
</script>

<style lang="scss" scoped>
.ai-chatbot-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 999;
}

.floating-ai-button {
  background-color: #2d5ba9;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 25px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background-color: #234a8e;
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
  }

  &:disabled {
    background-color: #b3b3b3;
    cursor: not-allowed;
  }

  .button-text {
    margin-left: 5px;
  }
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>