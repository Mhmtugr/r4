// Note servis modülü
import { 
  // Firebase helpers
  addDocument, 
  updateDocument, 
  getDocument, 
  queryDocuments,
  deleteDocument
} from './firebase-service';

/**
 * Notları belirli filtrelere göre getir
 * @param {Object} filters - Filtre parametreleri
 * @returns {Promise<Array>} Notlar dizisi
 */
const getNotes = async (filters = {}) => {
  try {
    // Filtreleri oluştur
    let queryFilters = {};
    
    // Referans tipi filtresi (sipariş, müşteri, malzeme, vb.)
    if (filters.referenceType) {
      queryFilters.referenceType = filters.referenceType;
    }
    
    // Referans ID filtresi
    if (filters.referenceId) {
      queryFilters.referenceId = filters.referenceId;
    }
    
    // Kullanıcı ID filtresi (not ekleyen kişi)
    if (filters.userId) {
      queryFilters.userId = filters.userId;
    }
    
    // Sıralama için kullanılacak alan ve yön
    let sortOptions = { 
      field: filters.orderBy || 'createdAt', 
      direction: filters.orderDir || 'desc' 
    };
    
    // Limit
    const limitCount = filters.limit || null;
    
    return await queryDocuments('notes', queryFilters, sortOptions, limitCount);
  } catch (error) {
    console.error("Notları getirme hatası:", error);
    throw error;
  }
};

/**
 * Belirli bir notu getir
 * @param {string} noteId - Not ID'si
 * @returns {Promise<Object>} Not bilgileri
 */
const getNote = async (noteId) => {
  try {
    return await getDocument('notes', noteId);
  } catch (error) {
    console.error("Not getirme hatası:", error);
    throw error;
  }
};

/**
 * Yeni not ekle
 * @param {Object} noteData - Eklenecek not verileri
 * @returns {Promise<Object>} Eklenen not bilgisi
 */
const addNote = async (noteData) => {
  try {
    // Not verilerine zaman damgası ekle
    const noteWithTimestamp = {
      ...noteData,
      createdAt: new Date().toISOString()
    };
    
    return await addDocument('notes', noteWithTimestamp);
  } catch (error) {
    console.error("Not ekleme hatası:", error);
    throw error;
  }
};

/**
 * Not güncelle
 * @param {string} noteId - Not ID'si
 * @param {Object} noteData - Güncellenecek not verileri
 * @returns {Promise<Object>} Güncellenen not bilgisi
 */
const updateNote = async (noteId, noteData) => {
  try {
    // Not verilerine güncelleme zaman damgası ekle
    const noteWithTimestamp = {
      ...noteData,
      updatedAt: new Date().toISOString()
    };
    
    return await updateDocument('notes', noteId, noteWithTimestamp);
  } catch (error) {
    console.error("Not güncelleme hatası:", error);
    throw error;
  }
};

/**
 * Not sil
 * @param {string} noteId - Not ID'si
 * @returns {Promise<Object>} Silme sonucu
 */
const deleteNote = async (noteId) => {
  try {
    return await deleteDocument('notes', noteId);
  } catch (error) {
    console.error("Not silme hatası:", error);
    throw error;
  }
};

/**
 * Belirli bir referansa (sipariş, müşteri, vb.) bağlı notları getir
 * @param {string} referenceType - Referans tipi ('order', 'customer', 'material', vb.)
 * @param {string} referenceId - Referans ID'si
 * @returns {Promise<Array>} İlgili notlar dizisi
 */
const getReferenceNotes = async (referenceType, referenceId) => {
  try {
    return await getNotes({
      referenceType,
      referenceId,
      orderBy: 'createdAt',
      orderDir: 'desc'
    });
  } catch (error) {
    console.error("Referans notlarını getirme hatası:", error);
    throw error;
  }
};

export {
  getNotes,
  getNote,
  addNote,
  updateNote,
  deleteNote,
  getReferenceNotes
};