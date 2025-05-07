/**
 * technical.js
 * Teknik doküman ve sorgulamalar için Pinia store
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import logger from '@/utils/logger';

export const useTechnicalStore = defineStore('technical', () => {
  const documents = ref([
    { id: '1', name: 'RM 36 CB Teknik Çizim', date: '15.10.2024', category: 'Çizimler', content: 'RM 36 CB hücresine ait teknik çizim detayları...' },
    { id: '2', name: 'RM 36 LB Montaj Talimatı', date: '10.10.2024', category: 'Talimatlar', content: 'RM 36 LB hücresi montaj talimatları...' },
    { id: '3', name: 'Akım Trafosu Seçim Kılavuzu', date: '01.10.2024', category: 'Kılavuzlar', content: 'Akım trafolarının seçimine ilişkin teknik bilgiler...' }
  ]);
  
  const isDocumentsLoading = ref(false);
  const isAIChatModalOpen = ref(false);
  const hasNewAISuggestion = ref(false);

  // AI Chat Modal açma/kapama işlevleri
  const setAIChatModalOpen = (value) => {
    isAIChatModalOpen.value = value;
    logger.info(`AI Chat Modal ${value ? 'opened' : 'closed'}`);
    
    // Modal açıldıysa bildirimleri temizle
    if (value) {
      hasNewAISuggestion.value = false;
    }
  };

  const toggleAIChatModal = () => {
    setAIChatModalOpen(!isAIChatModalOpen.value);
  };

  // Dökümanları kategori bazında gruplayarak getir
  const documentsByCategory = computed(() => {
    const result = {};
    
    documents.value.forEach(doc => {
      if (!result[doc.category]) {
        result[doc.category] = [];
      }
      result[doc.category].push(doc);
    });
    
    return result;
  });

  // Technical store fonksiyonları
  const fetchDocuments = async () => {
    try {
      isDocumentsLoading.value = true;
      logger.info('Teknik dokümanlar yükleniyor...');
      
      // Mock veri yükleme - gerçek API entegrasyonu için değiştirilecek
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // documents.value = [...] // Gerçek API'den yüklenecek
      
      isDocumentsLoading.value = false;
      logger.info('Teknik dokümanlar yüklendi.');
    } catch (error) {
      logger.error('Teknik dokümanlar yüklenirken hata:', error);
      isDocumentsLoading.value = false;
    }
  };

  // AI önerileri/bildirimleri
  const setNewAISuggestion = (value) => {
    hasNewAISuggestion.value = value;
  };

  // Doküman arama
  const searchDocuments = (query) => {
    if (!query) return documents.value;
    
    const lowerCaseQuery = query.toLowerCase();
    return documents.value.filter(doc => 
      doc.name.toLowerCase().includes(lowerCaseQuery) || 
      doc.content.toLowerCase().includes(lowerCaseQuery)
    );
  };

  // Doküman ekleme
  const addDocument = (document) => {
    documents.value.push({
      id: Date.now().toString(),
      ...document,
      date: new Date().toLocaleDateString('tr-TR')
    });
    logger.info('Yeni teknik doküman eklendi:', document.name);
  };

  // Doküman silme
  const deleteDocument = (id) => {
    const index = documents.value.findIndex(doc => doc.id === id);
    if (index !== -1) {
      const deletedDoc = documents.value[index];
      documents.value.splice(index, 1);
      logger.info('Teknik doküman silindi:', deletedDoc.name);
    }
  };

  // AI Chatbot state
  const isChatModalOpen = ref(false);
  const chatHistory = ref([]);
  const isProcessing = ref(false);

  // AI Chatbot actions
  function openChatModal() {
    isChatModalOpen.value = true;
  }

  function closeChatModal() {
    isChatModalOpen.value = false;
  }

  function addChatMessage(message, isUser = true) {
    chatHistory.value.push({
      id: Date.now(),
      text: message,
      isUser,
      timestamp: new Date().toISOString()
    });
  }

  function clearChatHistory() {
    chatHistory.value = [];
  }

  return {
    documents,
    documentsByCategory,
    isDocumentsLoading,
    isAIChatModalOpen,
    hasNewAISuggestion,
    setAIChatModalOpen,
    toggleAIChatModal,
    fetchDocuments,
    searchDocuments,
    addDocument,
    deleteDocument,
    setNewAISuggestion,
    isChatModalOpen,
    chatHistory,
    isProcessing,
    openChatModal,
    closeChatModal,
    addChatMessage,
    clearChatHistory
  };
});