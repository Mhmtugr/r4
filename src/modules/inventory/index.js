/**
 * inventory/index.js
 * Envanter modülü ana giriş noktası
 */

// Kompozisyon fonksiyonlarını içe aktar
import { useMaterialLists } from './useMaterialLists';
import { useMaterials } from './useMaterials';
import { useStockManagement } from './useStockManagement';

// Tüm envanter modülü işlevselliğini dışa aktar
export {
  useMaterialLists,
  useMaterials,
  useStockManagement
};