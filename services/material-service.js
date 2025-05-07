// Material servis modülü
import { 
  // Firebase helpers
  addDocument, 
  updateDocument, 
  getDocument, 
  queryDocuments,
  deleteDocument
} from './firebase-service';

/**
 * Malzemeleri belirli filtrelere göre getir
 * @param {Object} filters - Filtre parametreleri
 * @returns {Promise<Array>} Malzemeler dizisi
 */
const getMaterials = async (filters = {}) => {
  try {
    // Filtreleri oluştur
    let queryFilters = {};
    
    // Tedarikçi filtresi
    if (filters.supplier) {
      queryFilters.supplier = filters.supplier;
    }
    
    // Durum filtresi
    if (filters.status) {
      queryFilters.status = filters.status;
    }
    
    // Sipariş ID filtresi
    if (filters.orderId) {
      queryFilters.orderId = filters.orderId;
    }
    
    // Stok durumu filtresi
    if (filters.hasOwnProperty('inStock') && typeof filters.inStock === 'boolean') {
      queryFilters.inStock = filters.inStock;
    }
    
    // Sıralama için kullanılacak alan ve yön
    let sortOptions = { 
      field: filters.orderBy || 'name', 
      direction: filters.orderDir || 'asc' 
    };
    
    // Limit
    const limitCount = filters.limit || null;
    
    return await queryDocuments('materials', queryFilters, sortOptions, limitCount);
  } catch (error) {
    console.error("Malzemeleri getirme hatası:", error);
    throw error;
  }
};

/**
 * Belirli bir malzemeyi getir
 * @param {string} materialId - Malzeme ID'si
 * @returns {Promise<Object>} Malzeme bilgileri
 */
const getMaterial = async (materialId) => {
  try {
    return await getDocument('materials', materialId);
  } catch (error) {
    console.error("Malzeme getirme hatası:", error);
    throw error;
  }
};

/**
 * Yeni malzeme ekle
 * @param {Object} materialData - Eklenecek malzeme verileri
 * @returns {Promise<Object>} Eklenen malzeme bilgisi
 */
const addMaterial = async (materialData) => {
  try {
    return await addDocument('materials', materialData);
  } catch (error) {
    console.error("Malzeme ekleme hatası:", error);
    throw error;
  }
};

/**
 * Malzeme güncelle
 * @param {string} materialId - Malzeme ID'si
 * @param {Object} materialData - Güncellenecek malzeme verileri
 * @returns {Promise<Object>} Güncellenen malzeme bilgisi
 */
const updateMaterial = async (materialId, materialData) => {
  try {
    return await updateDocument('materials', materialId, materialData);
  } catch (error) {
    console.error("Malzeme güncelleme hatası:", error);
    throw error;
  }
};

/**
 * Malzeme sil
 * @param {string} materialId - Malzeme ID'si
 * @returns {Promise<Object>} Silme sonucu
 */
const deleteMaterial = async (materialId) => {
  try {
    return await deleteDocument('materials', materialId);
  } catch (error) {
    console.error("Malzeme silme hatası:", error);
    throw error;
  }
};

/**
 * Sipariş için toplu malzeme ekle
 * @param {string} orderId - Sipariş ID'si
 * @param {Array} materials - Eklenecek malzemeler dizisi
 * @returns {Promise<Array>} Eklenen malzemelerin ID'leri
 */
const addOrderMaterials = async (orderId, materials) => {
  try {
    const results = [];
    
    for (const material of materials) {
      const materialData = {
        ...material,
        orderId
      };
      
      const result = await addDocument('materials', materialData);
      results.push(result);
    }
    
    return results;
  } catch (error) {
    console.error("Sipariş malzemeleri ekleme hatası:", error);
    throw error;
  }
};

/**
 * Stokta bulunan malzemeleri getir
 * @param {number} limit - Maksimum sonuç sayısı (opsiyonel)
 * @returns {Promise<Array>} Stokta bulunan malzemeler dizisi
 */
const getInStockMaterials = async (limit = null) => {
  try {
    return await queryDocuments(
      'materials', 
      { inStock: true }, 
      { field: 'name', direction: 'asc' },
      limit
    );
  } catch (error) {
    console.error("Stokta bulunan malzemeleri getirme hatası:", error);
    throw error;
  }
};

/**
 * Stok hareketi ekle
 * @param {Object} movementData - Stok hareketi verileri
 * @returns {Promise<Object>} Eklenen stok hareketi bilgisi
 */
const addStockMovement = async (movementData) => {
  try {
    // Stok hareketi ekle
    const result = await addDocument('stockMovements', movementData);
    
    // İlgili malzemenin stok durumunu güncelle
    if (movementData.materialId) {
      const material = await getMaterial(movementData.materialId);
      
      // Stok miktarını hesapla
      let newQuantity = material.quantity || 0;
      
      if (movementData.type === 'in') {
        newQuantity += movementData.quantity;
      } else if (movementData.type === 'out') {
        newQuantity -= movementData.quantity;
      }
      
      // Stok durumunu güncelle
      await updateMaterial(movementData.materialId, {
        quantity: newQuantity,
        inStock: newQuantity > 0
      });
    }
    
    return result;
  } catch (error) {
    console.error("Stok hareketi ekleme hatası:", error);
    throw error;
  }
};

/**
 * Sipariş için malzemeleri getir
 * @param {string} orderId - Sipariş ID'si
 * @returns {Promise<Array>} Malzemeler dizisi
 */
const getMaterialsForOrder = async (orderId) => {
  try {
    return await queryDocuments(
      'materials',
      { orderId },
      { field: 'name', direction: 'asc' }
    );
  } catch (error) {
    console.error(`Sipariş malzemeleri getirme hatası (${orderId}):`, error);
    throw error;
  }
};

/**
 * Kritik stok seviyesindeki malzemeleri getir
 * @returns {Promise<Array>} Kritik malzemeler dizisi
 */
const getCriticalMaterials = async () => {
  try {
    // Stok durumunu kontrol et ve kritik olanları filtrele
    const allMaterials = await queryDocuments('materials');
    
    return allMaterials.filter(material => {
      return material.minLevel && material.quantity && material.quantity <= material.minLevel;
    });
  } catch (error) {
    console.error("Kritik malzemeleri getirme hatası:", error);
    throw error;
  }
};

/**
 * Stok özeti getir
 * @returns {Promise<Object>} Stok özeti
 */
const getStockSummary = async () => {
  try {
    const allMaterials = await queryDocuments('materials');
    const stockMovements = await queryDocuments(
      'stockMovements',
      {},
      { field: 'timestamp', direction: 'desc' },
      10
    );
    
    // Kritik seviyedeki malzemeleri say
    const criticalCount = allMaterials.filter(material => 
      material.minLevel && material.quantity && material.quantity <= material.minLevel
    ).length;
    
    // Siparişlere ayrılan malzemeleri say
    const reservedCount = allMaterials.filter(material => material.reserved).length;
    
    // Toplam stok değeri
    const stockValue = allMaterials.reduce((total, material) => {
      return total + (material.quantity || 0) * (material.unitPrice || 0);
    }, 0);
    
    // Son değişenler
    const recentlyChanged = stockMovements.map(movement => {
      const material = allMaterials.find(m => m.id === movement.materialId);
      return {
        id: movement.materialId,
        code: material ? material.code : movement.materialId,
        name: material ? material.name : 'Bilinmeyen Malzeme',
        change: movement.type === 'in' ? movement.quantity : -movement.quantity,
        date: movement.timestamp ? new Date(movement.timestamp) : new Date()
      };
    });
    
    return {
      totalMaterials: allMaterials.length,
      criticalCount,
      reservedCount,
      stockValue,
      recentlyChanged
    };
  } catch (error) {
    console.error("Stok özeti getirme hatası:", error);
    throw error;
  }
};

/**
 * Malzeme bilgisini kodu ile getir
 * @param {string} code - Malzeme kodu
 * @returns {Promise<Object|null>} Malzeme bilgisi
 */
const getMaterialByCode = async (code) => {
  try {
    const materials = await queryDocuments(
      'materials',
      { code },
      {},
      1
    );
    
    if (materials && materials.length > 0) {
      return materials[0];
    }
    
    return null;
  } catch (error) {
    console.error(`Malzeme bilgisi getirme hatası (${code}):`, error);
    throw error;
  }
};

/**
 * Material Service composable fonksiyonu - ai-service.js için gerekli
 * @returns {Object} Material service fonksiyonları
 */
const useMaterialService = () => {
  return {
    getMaterials,
    getMaterial,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    addOrderMaterials,
    getInStockMaterials,
    addStockMovement,
    getMaterialsForOrder,
    getCriticalMaterials,
    getStockSummary,
    getMaterialByCode
  };
};

export {
  getMaterials,
  getMaterial,
  addMaterial,
  updateMaterial,
  deleteMaterial,
  addOrderMaterials,
  getInStockMaterials,
  addStockMovement,
  getMaterialsForOrder,
  getCriticalMaterials,
  getStockSummary,
  getMaterialByCode,
  useMaterialService
};