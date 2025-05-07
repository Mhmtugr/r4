// Customer servis modülü
import { 
  // Firebase helpers
  addDocument, 
  updateDocument, 
  getDocument, 
  queryDocuments,
  deleteDocument
} from './firebase-service';

/**
 * Tüm müşterileri getir
 * @param {Object} filters - Filtre parametreleri
 * @returns {Promise<Array>} Müşteriler dizisi
 */
const getCustomers = async (filters = {}) => {
  try {
    // Filtreleri oluştur
    let queryFilters = {};
    
    // İsim filtresi (tam eşleşme yerine alt dize araması yapmak daha iyi olur)
    if (filters.name) {
      // Firestore'da doğrudan alt dize araması yapılamaz
      // Basitleştirmek için tam eşleşmeyi kullanıyoruz
      // İleride sunucu tarafında tam metin araması uygulanabilir
      queryFilters.name = filters.name;
    }
    
    // Durum filtresi
    if (filters.status) {
      queryFilters.status = filters.status;
    }
    
    // Sıralama için kullanılacak alan ve yön
    let sortOptions = { 
      field: filters.orderBy || 'name', 
      direction: filters.orderDir || 'asc' 
    };
    
    // Limit
    const limitCount = filters.limit || null;
    
    return await queryDocuments('customers', queryFilters, sortOptions, limitCount);
  } catch (error) {
    console.error("Müşterileri getirme hatası:", error);
    throw error;
  }
};

/**
 * Belirli bir müşteriyi getir
 * @param {string} customerId - Müşteri ID'si
 * @returns {Promise<Object>} Müşteri bilgileri
 */
const getCustomer = async (customerId) => {
  try {
    return await getDocument('customers', customerId);
  } catch (error) {
    console.error("Müşteri getirme hatası:", error);
    throw error;
  }
};

/**
 * Yeni müşteri ekle
 * @param {Object} customerData - Eklenecek müşteri verileri
 * @returns {Promise<Object>} Eklenen müşteri bilgisi
 */
const addCustomer = async (customerData) => {
  try {
    return await addDocument('customers', customerData);
  } catch (error) {
    console.error("Müşteri ekleme hatası:", error);
    throw error;
  }
};

/**
 * Müşteri güncelle
 * @param {string} customerId - Müşteri ID'si
 * @param {Object} customerData - Güncellenecek müşteri verileri
 * @returns {Promise<Object>} Güncellenen müşteri bilgisi
 */
const updateCustomer = async (customerId, customerData) => {
  try {
    return await updateDocument('customers', customerId, customerData);
  } catch (error) {
    console.error("Müşteri güncelleme hatası:", error);
    throw error;
  }
};

/**
 * Müşteri sil
 * @param {string} customerId - Müşteri ID'si
 * @returns {Promise<Object>} Silme sonucu
 */
const deleteCustomer = async (customerId) => {
  try {
    return await deleteDocument('customers', customerId);
  } catch (error) {
    console.error("Müşteri silme hatası:", error);
    throw error;
  }
};

/**
 * Müşterinin tüm siparişlerini getir
 * @param {string} customerId - Müşteri ID'si
 * @returns {Promise<Array>} Siparişler dizisi
 */
const getCustomerOrders = async (customerId) => {
  try {
    return await queryDocuments(
      'orders',
      { customerId },
      { field: 'createdAt', direction: 'desc' }
    );
  } catch (error) {
    console.error("Müşteri siparişlerini getirme hatası:", error);
    throw error;
  }
};

export {
  getCustomers,
  getCustomer,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerOrders
};