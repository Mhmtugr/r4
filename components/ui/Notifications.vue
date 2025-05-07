<template>
  <div class="notifications-container">
    <!-- Toast bildirimleri -->
    <transition-group name="notification" tag="div" class="notification-list">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification-toast', notification.type]"
        @click="notification.closable && removeNotification(notification.id)"
      >
        <div class="notification-icon">
          <i :class="getIconClass(notification.type)"></i>
        </div>
        <div class="notification-content">
          <div class="notification-header">
            <h5>{{ notification.title }}</h5>
            <button 
              v-if="notification.closable"
              class="notification-close" 
              @click.stop="removeNotification(notification.id)"
            >
              <i class="bi bi-x"></i>
            </button>
          </div>
          <div class="notification-body" v-html="notification.message"></div>
          <div class="notification-time">{{ formatTime(notification.timestamp) }}</div>
        </div>
      </div>
    </transition-group>
    
    <!-- Modal -->
    <div class="modal-wrapper" v-if="modal">
      <div 
        class="modal-backdrop" 
        @click="modal.showCancel && closeModal()"
      ></div>
      <div 
        class="modal-container" 
        :class="'modal-' + modal.size"
      >
        <div class="modal-header">
          <h5 class="modal-title">{{ modal.title }}</h5>
          <button 
            v-if="modal.showCancel"
            class="modal-close" 
            @click="handleModalCancel"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body" v-html="modal.content"></div>
        <div class="modal-footer">
          <button 
            v-if="modal.showCancel"
            class="btn btn-secondary" 
            @click="handleModalCancel"
          >
            {{ modal.cancelText }}
          </button>
          <button 
            class="btn btn-primary" 
            @click="handleModalConfirm"
          >
            {{ modal.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { useNotificationStore } from '@/store/notification';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Store
const notificationStore = useNotificationStore();

// Computed properties
const notifications = computed(() => {
  return notificationStore.notifications;
});

const modal = computed(() => {
  return notificationStore.modal;
});

// Methods
function removeNotification(id) {
  notificationStore.removeNotification(id);
}

function closeModal() {
  notificationStore.closeModal();
}

function handleModalConfirm() {
  if (modal.value && typeof modal.value.onConfirm === 'function') {
    modal.value.onConfirm();
  }
  closeModal();
}

function handleModalCancel() {
  if (modal.value && typeof modal.value.onCancel === 'function') {
    modal.value.onCancel();
  }
  closeModal();
}

function getIconClass(type) {
  switch (type) {
    case 'success': return 'bi bi-check-circle-fill';
    case 'error': return 'bi bi-x-circle-fill';
    case 'warning': return 'bi bi-exclamation-triangle-fill';
    case 'info':
    default: return 'bi bi-info-circle-fill';
  }
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    return format(date, 'HH:mm:ss', { locale: tr });
  } catch (error) {
    console.error('Zaman formatlanırken hata:', error);
    return '';
  }
}

// Klavye kısayolları için event listener
function handleEscapeKey(event) {
  if (event.key === 'Escape' && modal.value && modal.value.showCancel) {
    handleModalCancel();
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey);
});
</script>

<style lang="scss">
.notifications-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  width: 350px;
  max-width: calc(100% - 2rem);
  pointer-events: none;
  
  .notification-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .notification-toast {
    background-color: #fff;
    border-radius: 0.375rem;
    box-shadow: 0 0.25rem 1rem rgba(0, 0, 0, 0.15);
    overflow: hidden;
    pointer-events: auto;
    cursor: pointer;
    display: flex;
    transform-origin: top right;
    
    &.success {
      border-left: 4px solid var(--success-color);
      .notification-icon { color: var(--success-color); }
    }
    
    &.error {
      border-left: 4px solid var(--danger-color);
      .notification-icon { color: var(--danger-color); }
    }
    
    &.warning {
      border-left: 4px solid var(--warning-color);
      .notification-icon { color: var(--warning-color); }
    }
    
    &.info {
      border-left: 4px solid var(--secondary-color);
      .notification-icon { color: var(--secondary-color); }
    }
    
    .notification-icon {
      display: flex;
      align-items: flex-start;
      padding: 1rem 0.5rem 1rem 1rem;
      font-size: 1.25rem;
    }
    
    .notification-content {
      flex: 1;
      padding: 1rem 1rem 0.75rem 0;
      
      .notification-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.25rem;
        
        h5 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
        }
        
        .notification-close {
          background: none;
          border: none;
          font-size: 1rem;
          padding: 0;
          cursor: pointer;
          color: #666;
          
          &:hover {
            color: #333;
          }
        }
      }
      
      .notification-body {
        font-size: 0.875rem;
        color: #333;
        margin-bottom: 0.25rem;
      }
      
      .notification-time {
        font-size: 0.7rem;
        color: #777;
        text-align: right;
      }
    }
  }

  // Modal styling
  .modal-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    pointer-events: auto;
    
    .modal-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
    }
    
    .modal-container {
      background-color: #fff;
      border-radius: 0.5rem;
      box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.2);
      position: relative;
      max-height: 90vh;
      max-width: 90vw;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      
      &.modal-sm { width: 300px; }
      &.modal-md { width: 500px; }
      &.modal-lg { width: 800px; }
      &.modal-xl { width: 1100px; }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #eee;
        
        .modal-title {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 600;
        }
        
        .modal-close {
          background: none;
          border: none;
          font-size: 1.25rem;
          padding: 0;
          cursor: pointer;
          color: #666;
          
          &:hover {
            color: #333;
          }
        }
      }
      
      .modal-body {
        padding: 1.5rem;
        overflow-y: auto;
        flex: 1;
      }
      
      .modal-footer {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        border-top: 1px solid #eee;
      }
    }
  }
}

// Animations
.notification-enter-active {
  animation: notification-in 0.3s ease-out forwards;
}

.notification-leave-active {
  animation: notification-out 0.3s ease-in forwards;
}

@keyframes notification-in {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes notification-out {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(30px);
  }
}

// Responsive adjustments
@media (max-width: 576px) {
  .notifications-container {
    width: calc(100% - 2rem);
    right: 0;
    left: 0;
    margin: 0 auto;
  }
  
  .modal-wrapper .modal-container {
    width: 95% !important;
  }
}
</style>