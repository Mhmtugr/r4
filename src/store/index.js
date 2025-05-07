import { createPinia } from 'pinia';

// Store modülleri
import { useAuthStore } from './auth';
import { useNotificationStore } from './notification';
import { useIntegrationStore } from './integration';
import { useTechnicalStore } from './technical';

// Pinia store oluştur
const pinia = createPinia();

export default pinia;

// Store'ları dışa aktar
export {
  useAuthStore,
  useNotificationStore,
  useIntegrationStore,
  useTechnicalStore
};