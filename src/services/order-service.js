// Order servis modülü
import { 
  // Firebase helpers
  addDocument, 
  updateDocument, 
  getDocument, 
  queryDocuments,
  
  // Firebase collections
  collections,
  
  // Query builders
  buildQuery,
  getDocsFromQuery,
  
  // Firestore temel
  doc,
  updateDoc,
  db
} from './firebase-service';

/**
 * Sipariş numarası oluştur
 * @param {string} orderId - Sipariş ID'si
 * @returns {string} Oluşturulan sipariş numarası
 */
const generateOrderNumber = (orderId) => {
  const now = new Date();
  const year = now.getFullYear().toString().substr(-2); // Son 2 haneli yıl
  const month = ('0' + (now.getMonth() + 1)).slice(-2); // İki haneli ay
  
  return `${year}-${month}-${orderId.substring(0, 4).toUpperCase()}`;
};

/**
 * Tüm siparişleri getir
 * @param {string|string[]|null} status - Filtrelenecek durum (opsiyonel)
 * @param {number} limit - Maksimum sonuç sayısı (opsiyonel, varsayılan 50)
 * @returns {Promise<Array>} Siparişler dizisi
 */
const getOrders = async (status = null, limit = 50) => {
  try {
    let filters = {};
    let sortOptions = { field: 'createdAt', direction: 'desc' };
    
    // Duruma göre filtrele
    if (status) {
      filters.status = status;
    }
    
    return await queryDocuments('orders', filters, sortOptions, limit);
  } catch (error) {
    console.error("Siparişleri getirme hatası:", error);
    throw error;
  }
};

/**
 * Siparişleri filtrele ve getir
 * @param {Object} filters - Filtre parametreleri
 * @returns {Promise<Array>} Filtrelenmiş siparişler dizisi
 */
const filterOrders = async (filters = {}) => {
  try {
    let queryFilters = {};
    
    // Durum filtresi
    if (filters.status) {
      queryFilters.status = filters.status;
    }
    
    // Müşteri filtresi
    if (filters.customer) {
      queryFilters.customer = filters.customer;
    }
    
    // Hücre tipi
    if (filters.cellType) {
      queryFilters.cellType = filters.cellType;
    }
    
    // Tarih filtreleri daha karmaşık olduğu için ayrı değerlendirme gerekiyor
    // Tarih aralığı - sipariş tarihi
    if (filters.orderDateStart && filters.orderDateEnd) {
      // Burada tarih aralığı sorgusu için composite query yapmak gerekecek
      // Basitleştirmek için tüm siparişleri çekip JS tarafında filtreleyeceğiz
      // İleride Firebase v9 composite query kullanımına geçilebilir
    }
    
    // Sıralama için kullanılacak alan ve yön
    let sortOptions = { 
      field: filters.orderBy || 'createdAt', 
      direction: filters.orderDir || 'desc' 
    };
    
    // Limit
    const limitCount = filters.limit || null;
    
    return await queryDocuments('orders', queryFilters, sortOptions, limitCount);
  } catch (error) {
    console.error("Siparişleri filtreleme hatası:", error);
    throw error;
  }
};

/**
 * Sipariş ekle
 * @param {Object} orderData - Eklenecek sipariş verileri
 * @returns {Promise<Object>} Eklenen sipariş bilgisi
 */
const addOrder = async (orderData) => {
  try {
    // Sipariş ekle ve ID'sini al
    const { id } = await addDocument('orders', orderData);
    
    // Sipariş no oluştur
    const orderNo = generateOrderNumber(id);
    
    // Sipariş numarasını güncelle
    const docRef = doc(db, 'orders', id);
    await updateDoc(docRef, { orderNo });
    
    return {
      id,
      orderNo
    };
  } catch (error) {
    console.error("Sipariş ekleme hatası:", error);
    throw error;
  }
};

/**
 * Sipariş güncelle
 * @param {string} orderId - Sipariş ID'si
 * @param {Object} orderData - Güncellenecek sipariş verileri
 * @returns {Promise<Object>} Güncellenen sipariş bilgisi
 */
const updateOrder = async (orderId, orderData) => {
  try {
    return await updateDocument('orders', orderId, orderData);
  } catch (error) {
    console.error("Sipariş güncelleme hatası:", error);
    throw error;
  }
};

/**
 * Sipariş detayını getir
 * @param {string} orderId - Sipariş ID'si
 * @returns {Promise<Object>} Sipariş detay bilgileri
 */
const getOrderDetail = async (orderId) => {
  try {
    // Önce sipariş bilgilerini al
    const orderData = await getDocument('orders', orderId);
    
    // Sipariş malzemelerini getir
    const materials = await queryDocuments('materials', { orderId });
    orderData.materials = materials;
    
    // Sipariş notlarını getir
    const notes = await queryDocuments('notes', 
      { entityType: 'order', entityId: orderId },
      { field: 'createdAt', direction: 'desc' }
    );
    orderData.notes = notes;
    
    return orderData;
  } catch (error) {
    console.error("Sipariş detayı getirme hatası:", error);
    throw error;
  }
};

/**
 * Sipariş durumunu güncelle
 * @param {string} orderId - Sipariş ID'si
 * @param {string} status - Yeni durum
 * @param {string|null} comment - Durum değişikliği hakkında isteğe bağlı yorum
 * @returns {Promise<boolean>} İşlem başarı durumu
 */
const updateOrderStatus = async (orderId, status, comment = null) => {
  try {
    // Durum güncellemesi
    const updateData = {
      status: status,
    };
    
    // Duruma özel tarih alanı ekle
    const statusDateField = `${status}Date`;
    updateData[statusDateField] = new Date();
    
    // Siparişi güncelle
    await updateDocument('orders', orderId, updateData);
    
    // Eğer bir yorum eklenecekse, not olarak kaydet
    if (comment) {
      await addDocument('notes', {
        entityType: 'order',
        entityId: orderId,
        content: comment,
        type: 'status_change',
        metadata: {
          oldStatus: '', // Önceki durum bilinmiyor, eklemek için önceki durum sorgulanabilir
          newStatus: status
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error("Sipariş durumu güncelleme hatası:", error);
    throw error;
  }
};

/**
 * Sipariş numarasına göre sipariş detayını getirir
 * @param {string} orderNumber - Sipariş numarası
 * @returns {Promise<Object|null>} Sipariş detay bilgileri
 */
const getOrderByNumber = async (orderNumber) => {
  try {
    const orders = await queryDocuments(
      'orders', 
      { orderNo: orderNumber },
      { field: 'createdAt', direction: 'desc' },
      1
    );
    
    if (orders && orders.length > 0) {
      return await getOrderDetail(orders[0].id);
    }
    
    return null;
  } catch (error) {
    console.error(`Sipariş detayı getirme hatası (${orderNumber}):`, error);
    throw error;
  }
};

/**
 * Sipariş için üretim planını getirir
 * @param {string} orderId - Sipariş ID'si
 * @returns {Promise<Object|null>} Üretim planı bilgileri
 */
const getProductionPlanForOrder = async (orderId) => {
  try {
    // Plan verisini getir
    const planData = await queryDocuments(
      'productionPlans',
      { orderId },
      { field: 'createdAt', direction: 'desc' },
      1
    );
    
    if (planData && planData.length > 0) {
      return planData[0];
    }
    
    // Eğer plan yoksa, üretim aşamalarını getir
    const productionStages = await queryDocuments(
      'productionStages',
      { orderId },
      { field: 'sequenceNumber', direction: 'asc' }
    );
    
    if (productionStages && productionStages.length > 0) {
      return {
        orderId,
        stages: productionStages,
        estimatedCompletion: calculateEstimatedCompletion(productionStages),
        delayReason: getDelayReason(productionStages),
        extraHoursNeeded: calculateExtraHours(productionStages)
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Üretim planı getirme hatası (${orderId}):`, error);
    throw error;
  }
};

/**
 * Üretim aşamalarına bakarak tahmini tamamlanma tarihini hesaplar
 * @private
 * @param {Array} stages - Üretim aşamaları
 * @returns {string|null} Tahmini tamamlanma tarihi
 */
const calculateEstimatedCompletion = (stages) => {
  if (!stages || stages.length === 0) return null;
  
  const lastStage = stages[stages.length - 1];
  const inProgressStages = stages.filter(s => s.status === 'in_progress');
  
  if (lastStage.actualEnd) {
    return formatDate(new Date(lastStage.actualEnd));
  } else if (lastStage.plannedEnd) {
    // Gecikme varsa hesapla
    const delay = calculateTotalDelay(stages);
    if (delay > 0) {
      const plannedEnd = new Date(lastStage.plannedEnd);
      plannedEnd.setDate(plannedEnd.getDate() + delay);
      return formatDate(plannedEnd);
    }
    return formatDate(new Date(lastStage.plannedEnd));
  } else if (inProgressStages.length > 0) {
    const currentStage = inProgressStages[0];
    const currentStageIndex = stages.findIndex(s => s.id === currentStage.id);
    
    // Kalan aşamalar
    const remainingStages = stages.slice(currentStageIndex);
    
    // Tahmini kalan süre hesapla (gün)
    const estimatedRemainingDays = remainingStages.reduce((total, stage) => {
      const plannedStart = stage.plannedStart ? new Date(stage.plannedStart) : new Date();
      const plannedEnd = stage.plannedEnd ? new Date(stage.plannedEnd) : new Date();
      const daysDiff = Math.ceil((plannedEnd - plannedStart) / (1000 * 60 * 60 * 24));
      return total + daysDiff;
    }, 0);
    
    const today = new Date();
    today.setDate(today.getDate() + estimatedRemainingDays);
    return formatDate(today);
  }
  
  return null;
};

/**
 * Üretim aşamalarındaki toplam gecikmeyi hesaplar
 * @private
 * @param {Array} stages - Üretim aşamaları
 * @returns {number} Toplam gecikme (gün)
 */
const calculateTotalDelay = (stages) => {
  if (!stages || stages.length === 0) return 0;
  
  return stages.reduce((totalDelay, stage) => {
    return totalDelay + (stage.delay || 0);
  }, 0);
};

/**
 * Üretim aşamalarına bakarak gecikme nedenini getirir
 * @private
 * @param {Array} stages - Üretim aşamaları
 * @returns {string} Gecikme nedeni
 */
const getDelayReason = (stages) => {
  if (!stages || stages.length === 0) return '';
  
  const delayedStages = stages.filter(s => s.delay && s.delay > 0);
  if (delayedStages.length === 0) return '';
  
  const mostDelayedStage = delayedStages.reduce((prev, current) => {
    return (prev.delay > current.delay) ? prev : current;
  });
  
  return mostDelayedStage.delayReason || '';
};

/**
 * Üretim aşamalarına bakarak gereken ek mesai saatlerini hesaplar
 * @private
 * @param {Array} stages - Üretim aşamaları
 * @returns {number} Gereken ek mesai saatleri
 */
const calculateExtraHours = (stages) => {
  if (!stages || stages.length === 0) return 0;
  
  const delayedStages = stages.filter(s => s.delay && s.delay > 0);
  if (delayedStages.length === 0) return 0;
  
  // Her gecikme günü için ortalama 8 saat mesai hesapla
  return delayedStages.reduce((total, stage) => {
    return total + (stage.delay * 8);
  }, 0);
};

/**
 * Tarihi formatlar
 * @private
 * @param {Date} date - Formatlanacak tarih
 * @returns {string} Formatlanmış tarih
 */
const formatDate = (date) => {
  if (!date) return '';
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
};

/**
 * Order Service composable fonksiyonu - ai-service.js için gerekli
 * @returns {Object} Order service fonksiyonları
 */
const useOrderService = () => {
  return {
    getOrders,
    filterOrders,
    addOrder,
    updateOrder,
    getOrderDetail,
    updateOrderStatus,
    generateOrderNumber,
    getOrderByNumber,
    getProductionPlanForOrder
  };
};

export {
  getOrders,
  filterOrders,
  addOrder,
  updateOrder,
  getOrderDetail,
  updateOrderStatus,
  generateOrderNumber,
  getOrderByNumber,
  getProductionPlanForOrder,
  useOrderService
};