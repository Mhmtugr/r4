// Modern yapıda vue bileşenleri arası olay haberleşmesi için EventBus
import mitt from 'mitt';

// Mitt kütüphanesi kullanarak EventBus oluşturuyoruz
const emitter = mitt();

// Önceden tanımlı olaylar (event tiplerinin güvenli kullanımı için)
export const Events = {
  // Sistem olayları
  APP_READY: 'app:ready',
  APP_ERROR: 'app:error',
  APP_CONFIG_LOADED: 'app:config:loaded',
  
  // Kullanıcı işlemleri
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  USER_PROFILE_UPDATED: 'user:profile:updated',
  
  // UI olayları
  UI_THEME_CHANGED: 'ui:theme:changed',
  UI_LOCALE_CHANGED: 'ui:locale:changed',
  UI_SIDEBAR_TOGGLE: 'ui:sidebar:toggle',
  UI_FULLSCREEN_TOGGLE: 'ui:fullscreen:toggle',
  
  // Modül olayları
  MODULE_LOADED: 'module:loaded',
  MODULE_ERROR: 'module:error',
  
  // Veri olayları
  DATA_REFRESHED: 'data:refreshed',
  DATA_CHANGED: 'data:changed',
  DATA_ERROR: 'data:error',
  
  // Entegrasyon olayları
  INTEGRATION_CONNECTED: 'integration:connected',
  INTEGRATION_DISCONNECTED: 'integration:disconnected',
  INTEGRATION_ERROR: 'integration:error'
};

// Olay dinleyicisi ekle
const on = (event, handler) => {
  emitter.on(event, handler);
  return () => emitter.off(event, handler); // Unsubscribe fonksiyonu döndür
};

// Olay dinleyicisi kaldır
const off = (event, handler) => {
  emitter.off(event, handler);
};

// Bir olay yayınla
const emit = (event, payload) => {
  emitter.emit(event, payload);
};

// Bir kerelik olay dinleyicisi
const once = (event, handler) => {
  const wrappedHandler = (evt) => {
    handler(evt);
    off(event, wrappedHandler);
  };
  on(event, wrappedHandler);
};

// Vue 3 composition API için useEventBus hook
export const useEventBus = () => {
  return {
    on,
    off,
    emit,
    once,
    Events
  };
};

// Vue component metodu olarak kullanım için
export const EventBus = {
  on,
  off,
  emit,
  once,
  Events
};

// Modern import için varsayılan export
export default {
  on,
  off,
  emit,
  once,
  Events
};