/**
 * useToast.js
 * Toast bildirimlerini yönetmek için composable
 */

import { ref, reactive } from 'vue';

// Singleton pattern - tüm uygulama için tek bir toast state
const toastState = reactive({
  toasts: []
});

export function useToast() {
  const defaultDuration = 3000; // 3 saniye varsayılan
  
  /**
   * Toast bildirimi ekle
   * @param {string} message Bildirim metni
   * @param {string} type Bildirim tipi (success, error, warning, info)
   * @param {number} duration Görünme süresi (ms)
   * @returns {string} Toast ID
   */
  const showToast = (message, type = 'info', duration = defaultDuration) => {
    const id = `toast-${Date.now()}`;
    const toast = {
      id,
      message,
      type,
      shown: true
    };
    
    toastState.toasts.push(toast);
    
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
    
    return id;
  };
  
  /**
   * Toast bildirimini gizle
   * @param {string} id Toast ID
   */
  const hideToast = (id) => {
    const index = toastState.toasts.findIndex(t => t.id === id);
    if (index !== -1) {
      toastState.toasts[index].shown = false;
      setTimeout(() => {
        removeToast(id);
      }, 300); // Animasyon için bekle
    }
  };
  
  /**
   * Toast bildirimini tamamen kaldır
   * @param {string} id Toast ID
   */
  const removeToast = (id) => {
    const index = toastState.toasts.findIndex(t => t.id === id);
    if (index !== -1) {
      toastState.toasts.splice(index, 1);
    }
  };
  
  /**
   * Tüm toast bildirimlerini temizle
   */
  const clearToasts = () => {
    toastState.toasts = [];
  };
  
  // Helper fonksiyonlar
  
  /**
   * Başarı bildirimi göster
   * @param {string} message Bildirim metni
   * @param {number} duration Görünme süresi (ms)
   */
  const success = (message, duration = defaultDuration) => {
    return showToast(message, 'success', duration);
  };
  
  /**
   * Hata bildirimi göster
   * @param {string} message Bildirim metni
   * @param {number} duration Görünme süresi (ms)
   */
  const error = (message, duration = defaultDuration) => {
    return showToast(message, 'error', duration);
  };
  
  /**
   * Uyarı bildirimi göster
   * @param {string} message Bildirim metni
   * @param {number} duration Görünme süresi (ms)
   */
  const warning = (message, duration = defaultDuration) => {
    return showToast(message, 'warning', duration);
  };
  
  /**
   * Bilgi bildirimi göster
   * @param {string} message Bildirim metni
   * @param {number} duration Görünme süresi (ms)
   */
  const info = (message, duration = defaultDuration) => {
    return showToast(message, 'info', duration);
  };
  
  return {
    // Ana state
    toasts: toastState.toasts,
    
    // Ana fonksiyonlar
    showToast,
    hideToast,
    clearToasts,
    
    // Helper fonksiyonlar
    toast: {
      success,
      error,
      warning,
      info
    }
  };
}