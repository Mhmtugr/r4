<template>
  <div
    class="ai-chat-modal"
    :class="{ 'is-open': isOpen, 'is-minimized': isMinimized }"
  >
    <!-- Modal Header -->
    <div class="ai-chat-modal__header">
      <div class="ai-chat-modal__title">
        <span class="ai-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
        </span>
        <span>METS Asistan</span>
      </div>
      <div class="ai-chat-modal__actions">
        <button
          v-if="!isMinimized"
          class="action-button minimize-button"
          @click="minimizeChat"
          title="Küçült"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button
          v-else
          class="action-button expand-button"
          @click="expandChat"
          title="Genişlet"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        </button>
        <button
          class="action-button close-button"
          @click="closeModal"
          title="Kapat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- Chat Messages Area -->
    <div v-if="!isMinimized" class="ai-chat-modal__body" ref="chatBodyRef">
      <!-- Welcome message -->
      <div class="ai-chat-modal__welcome" v-if="messages.length === 0">
        <h3>METS Asistana Hoş Geldiniz</h3>
        <p>Size nasıl yardımcı olabilirim?</p>
        <div class="ai-chat-modal__suggestions">
          <button 
            v-for="(suggestion, index) in suggestions" 
            :key="`suggestion-${index}`"
            @click="sendMessage(suggestion)"
            class="suggestion-button"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>
      
      <!-- Message history -->
      <div v-else class="ai-chat-modal__messages">
        <div
          v-for="(msg, i) in messages"
          :key="`msg-${i}`"
          class="ai-chat-modal__message"
          :class="{
            'user-message': msg.role === 'user',
            'assistant-message': msg.role === 'assistant'
          }"
        >
          <div class="message-avatar">
            <span v-if="msg.role === 'user'" class="user-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="7" r="4"></circle>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              </svg>
            </span>
            <span v-else class="assistant-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            </span>
          </div>
          <div class="message-content">
            <!-- Display formatted message with line breaks -->
            <div v-html="formatMessage(msg.content)"></div>
            <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
          </div>
        </div>

        <!-- Loading indicator -->
        <div v-if="isLoading" class="ai-chat-modal__loading">
          <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div v-if="!isMinimized" class="ai-chat-modal__input">
      <textarea
        ref="inputRef"
        v-model="inputValue"
        placeholder="Bir soru sorun..."
        @keydown.enter.prevent="handleEnterPress"
        rows="1"
      ></textarea>
      <button
        class="ai-chat-modal__send"
        :disabled="isLoading || !inputValue.trim()"
        @click="sendMessage()"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import { aiService } from '@/services/ai-service';
import { useToast } from '@/composables/useToast';

// Component props and emits
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

// Component state
const isMinimized = ref(false);
const isLoading = ref(false);
const inputValue = ref('');
const messages = ref([]);
const chatBodyRef = ref(null);
const inputRef = ref(null);

// Composables
const toast = useToast();

// Predefined suggestions
const suggestions = [
  'Geciken siparişler hangileri?',
  'Kritik malzeme durumu nedir?',
  'CB hücresi teknik belgeleri',
  'Bugünün üretim özeti'
];

// Lifecycle hooks
onMounted(() => {
  // Initialize the AI service
  if (!aiService.isInitialized) {
    aiService.initialize();
  }
  
  // Auto-focus input when modal opens
  watch(() => props.isOpen, (isOpen) => {
    if (isOpen && !isMinimized.value) {
      nextTick(() => {
        focusInput();
      });
    }
  }, { immediate: true });
  
  // Scroll to bottom when new messages are added
  watch(() => messages.value.length, () => {
    nextTick(() => {
      scrollToBottom();
    });
  });
});

// Methods
const focusInput = () => {
  if (inputRef.value) {
    inputRef.value.focus();
  }
};

const scrollToBottom = () => {
  if (chatBodyRef.value) {
    chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight;
  }
};

const minimizeChat = () => {
  isMinimized.value = true;
};

const expandChat = () => {
  isMinimized.value = false;
  nextTick(() => {
    focusInput();
    scrollToBottom();
  });
};

const closeModal = () => {
  emit('close');
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatMessage = (content) => {
  if (!content) return '';
  
  // Convert line breaks to HTML
  return content
    .replace(/\n/g, '<br>')
    // Auto-link order IDs
    .replace(/(\b#?\d{4}-\d{4}\b)/g, '<a href="#" class="order-link">$1</a>')
    // Auto-link material IDs
    .replace(/(\bM-\d{6}\b)/g, '<a href="#" class="material-link">$1</a>');
};

const handleEnterPress = (e) => {
  // Only send on Enter without shift key
  if (!e.shiftKey) {
    sendMessage();
  }
};

// Send message to AI service
const sendMessage = async (customMessage = null) => {
  const messageText = customMessage || inputValue.value.trim();
  
  if (!messageText || isLoading.value) return;
  
  // Add user message to chat
  messages.value.push({
    role: 'user',
    content: messageText,
    timestamp: new Date()
  });
  
  // Reset input
  inputValue.value = '';
  focusInput();
  
  try {
    isLoading.value = true;
    
    // Get AI response
    const response = await aiService.askQuestion(messageText);
    
    // Add AI response to chat
    messages.value.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('AI error:', error);
    
    // Add error message
    messages.value.push({
      role: 'assistant',
      content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
      timestamp: new Date()
    });
    
    toast.error('AI yanıtı alınırken bir hata oluştu.');
  } finally {
    isLoading.value = false;
  }
};

// Export component's public API for potential parent component use
defineExpose({
  minimizeChat,
  expandChat,
  sendMessage,
});
</script>

<style lang="scss">
.ai-chat-modal {
  position: fixed;
  bottom: 6rem;
  right: 2rem;
  width: 400px;
  height: 500px;
  background-color: var(--surface-overlay, white);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(20px);
  visibility: hidden;
  border: 1px solid var(--surface-border, #ddd);
  
  @media (max-width: 768px) {
    width: 90%;
    height: 70vh;
    right: 5%;
    bottom: 5rem;
  }
  
  // Modal states
  &.is-open {
    opacity: 1;
    transform: translateY(0);
    visibility: visible;
  }
  
  &.is-minimized {
    height: auto;
    width: 300px;
  }
  
  // Modal header
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background-color: var(--primary-color, #3b82f6);
    color: white;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }
  
  &__title {
    display: flex;
    align-items: center;
    font-weight: 600;
    font-size: 1rem;
    
    .ai-icon {
      margin-right: 8px;
    }
  }
  
  &__actions {
    display: flex;
    gap: 8px;
    
    .action-button {
      border: none;
      background: none;
      color: white;
      cursor: pointer;
      border-radius: 4px;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }
  }
  
  // Modal body
  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
  }
  
  // Welcome message
  &__welcome {
    text-align: center;
    margin: auto 0;
    padding: 20px 0;
    
    h3 {
      margin-bottom: 12px;
      font-size: 1.25rem;
      color: var(--text-color, #333);
    }
    
    p {
      margin-bottom: 24px;
      color: var(--text-color-secondary, #666);
    }
  }
  
  &__suggestions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    
    .suggestion-button {
      background-color: var(--surface-hover, #f0f0f0);
      border: 1px solid var(--surface-border, #ddd);
      padding: 8px 12px;
      border-radius: 16px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background-color: var(--primary-color-light, #e1e9ff);
        border-color: var(--primary-color, #3b82f6);
      }
    }
  }
  
  // Messages
  &__messages {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  &__message {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding-bottom: 8px;
    
    &.user-message {
      flex-direction: row-reverse;
      
      .message-content {
        background-color: var(--primary-color-light, #e1e9ff);
        border-radius: 12px 12px 0 12px;
      }
    }
    
    &.assistant-message .message-content {
      background-color: var(--surface-card, #f8f8f8);
      border-radius: 12px 12px 12px 0;
    }
    
    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      .user-avatar {
        background-color: var(--primary-color, #3b82f6);
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .assistant-avatar {
        background-color: var(--highlight-bg, #e9ecef);
        color: var(--text-color, #333);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
    
    .message-content {
      padding: 12px;
      max-width: 75%;
      word-break: break-word;
      position: relative;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      
      .message-time {
        display: block;
        font-size: 0.7rem;
        color: var(--text-color-secondary, #666);
        margin-top: 4px;
        text-align: right;
      }
      
      a {
        color: var(--primary-color, #3b82f6);
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
  
  // Loading indicator
  &__loading {
    display: flex;
    padding: 12px 0;
    
    .loading-dots {
      display: flex;
      align-items: center;
      gap: 4px;
      
      span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--primary-color, #3b82f6);
        animation: dotPulse 1.4s infinite ease-in-out;
        
        &:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        &:nth-child(3) {
          animation-delay: 0.4s;
        }
      }
      
      @keyframes dotPulse {
        0%, 100% {
          opacity: 0.4;
          transform: scale(0.8);
        }
        50% {
          opacity: 1;
          transform: scale(1);
        }
      }
    }
  }
  
  // Input area
  &__input {
    padding: 12px 16px;
    border-top: 1px solid var(--surface-border, #ddd);
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: var(--surface-overlay, white);
    position: relative;
    z-index: 1;
    
    textarea {
      flex: 1;
      border: 1px solid var(--surface-border, #ddd);
      border-radius: 18px;
      padding: 10px 16px;
      resize: none;
      font-family: inherit;
      font-size: 0.9rem;
      background-color: var(--surface-ground, #f8f8f8);
      max-height: 100px;
      overflow-y: auto;
      
      &:focus {
        outline: none;
        border-color: var(--primary-color, #3b82f6);
      }
    }
    
    .ai-chat-modal__send {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: var(--primary-color, #3b82f6);
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
      
      &:hover:not(:disabled) {
        background-color: var(--primary-700, #1d4ed8);
      }
      
      &:disabled {
        background-color: var(--surface-border, #ddd);
        cursor: not-allowed;
      }
    }
  }
}
</style>