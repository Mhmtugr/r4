/**
 * useMaterialLists.js
 * Material lists management composable
 */

import { ref, computed } from 'vue';
import { useToast } from '@/composables/useToast';

export function useMaterialLists() {
  // Dependencies
  const { showToast } = useToast();
  
  // State
  const materialLists = ref([]);
  const isLoading = ref(false);
  const currentListId = ref(null);
  const currentList = computed(() => {
    return currentListId.value ? materialLists.value.find(list => list.id === currentListId.value) : null;
  });
  
  /**
   * Load all material lists
   * @returns {Promise<Array>} - Material lists
   */
  async function loadMaterialLists() {
    try {
      isLoading.value = true;
      
      if (window.firebase && window.firebase.firestore) {
        const snapshot = await window.firebase.firestore().collection('materialLists').get();
        
        const lists = [];
        snapshot.forEach(doc => {
          lists.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        materialLists.value = lists;
      } else {
        // Demo data mode
        materialLists.value = getExampleMaterialLists();
        console.log('Using demo material lists data');
      }
      
      return materialLists.value;
    } catch (error) {
      console.error("Error loading material lists:", error);
      showToast("Malzeme listeleri yüklenirken bir hata oluştu", "error");
      // Fallback to example data
      materialLists.value = getExampleMaterialLists();
      return materialLists.value;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * Save a material list
   * @param {Object} listData - Material list data
   * @returns {Promise<Object>} - Result with success state and list ID
   */
  async function saveMaterialList(listData) {
    try {
      // Validation
      if (!listData.listCode || !listData.listType || !listData.cellType) {
        showToast("Liste kodu, tipi ve hücre tipi zorunludur", "error");
        return { success: false, error: "Required fields missing" };
      }
      
      const saveData = {
        ...listData,
        updatedAt: window.firebase?.firestore ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date()
      };
      
      let listId = null;
      
      // Save to Firebase if available
      if (window.firebase && window.firebase.firestore) {
        if (currentListId.value) {
          // Update existing list
          await window.firebase.firestore().collection('materialLists').doc(currentListId.value).update(saveData);
          listId = currentListId.value;
          showToast("Malzeme listesi güncellendi", "success");
        } else {
          // Create new list
          const docRef = await window.firebase.firestore().collection('materialLists').add({
            ...saveData,
            createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
            materialsCount: 0
          });
          listId = docRef.id;
          showToast("Malzeme listesi oluşturuldu", "success");
        }
      } else {
        // Demo mode
        if (currentListId.value) {
          // Update existing list
          const index = materialLists.value.findIndex(list => list.id === currentListId.value);
          if (index !== -1) {
            materialLists.value[index] = {
              ...materialLists.value[index],
              ...saveData,
              updatedAt: new Date()
            };
          }
          listId = currentListId.value;
          showToast("Malzeme listesi güncellendi (Demo)", "success");
        } else {
          // Create new list
          listId = 'list-' + Date.now();
          const newList = {
            id: listId,
            ...saveData,
            createdAt: new Date(),
            updatedAt: new Date(),
            materialsCount: 0
          };
          materialLists.value.push(newList);
          showToast("Malzeme listesi oluşturuldu (Demo)", "success");
        }
      }
      
      // Update current list ID
      currentListId.value = listId;
      
      // Refresh lists
      await loadMaterialLists();
      
      return { success: true, listId };
    } catch (error) {
      console.error("Error saving material list:", error);
      showToast("Malzeme listesi kaydedilemedi: " + error.message, "error");
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Delete a material list
   * @param {string} listId - Material list ID to delete
   * @returns {Promise<Object>} - Result with success state
   */
  async function deleteMaterialList(listId) {
    try {
      if (window.firebase && window.firebase.firestore) {
        // Delete the list
        await window.firebase.firestore().collection('materialLists').doc(listId).delete();
        
        // Delete associated materials
        const materialsSnapshot = await window.firebase.firestore().collection('materials')
          .where('listId', '==', listId)
          .get();
        
        const batch = window.firebase.firestore().batch();
        materialsSnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        showToast("Malzeme listesi silindi", "success");
      } else {
        // Demo mode
        const index = materialLists.value.findIndex(list => list.id === listId);
        if (index !== -1) {
          materialLists.value.splice(index, 1);
          showToast("Malzeme listesi silindi (Demo)", "success");
        }
      }
      
      // Reset current list ID if it was the deleted one
      if (currentListId.value === listId) {
        currentListId.value = null;
      }
      
      // Refresh lists
      await loadMaterialLists();
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting material list:", error);
      showToast("Malzeme listesi silinemedi: " + error.message, "error");
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Duplicate a material list
   * @param {string} listId - Material list ID to duplicate
   * @returns {Promise<Object>} - Result with success state and new list ID
   */
  async function duplicateMaterialList(listId) {
    try {
      // Find the source list
      const sourceList = materialLists.value.find(list => list.id === listId);
      
      if (!sourceList) {
        throw new Error('Source list not found');
      }
      
      // Generate new list code
      const newListCode = generateListCode();
      
      // Prepare new list data
      const newListData = {
        listCode: newListCode,
        listType: sourceList.listType,
        cellType: sourceList.cellType,
        technicalDetails: sourceList.technicalDetails,
        description: sourceList.description + ' (Kopya)',
        materialsCount: 0
      };
      
      let newListId;
      
      if (window.firebase && window.firebase.firestore) {
        // Create the new list
        const docRef = await window.firebase.firestore().collection('materialLists').add({
          ...newListData,
          createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
        });
        
        newListId = docRef.id;
        
        // Copy materials
        const materialsSnapshot = await window.firebase.firestore().collection('materials')
          .where('listId', '==', listId)
          .get();
        
        if (!materialsSnapshot.empty) {
          const batch = window.firebase.firestore().batch();
          let materialCount = 0;
          
          materialsSnapshot.forEach(doc => {
            const materialData = doc.data();
            const newMaterialRef = window.firebase.firestore().collection('materials').doc();
            
            batch.set(newMaterialRef, {
              ...materialData,
              listId: newListId,
              createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
              updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
            });
            
            materialCount++;
          });
          
          await batch.commit();
          
          // Update materials count
          await window.firebase.firestore().collection('materialLists').doc(newListId).update({
            materialsCount: materialCount
          });
        }
        
        showToast("Malzeme listesi kopyalandı", "success");
      } else {
        // Demo mode
        newListId = 'list-' + Date.now();
        const newList = {
          id: newListId,
          ...newListData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        materialLists.value.push(newList);
        showToast("Malzeme listesi kopyalandı (Demo)", "success");
      }
      
      // Refresh lists
      await loadMaterialLists();
      
      return { success: true, newListId };
    } catch (error) {
      console.error("Error duplicating material list:", error);
      showToast("Malzeme listesi kopyalanamadı: " + error.message, "error");
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Generate a new list code based on current date and existing codes
   * @returns {string} - Generated list code
   */
  function generateListCode() {
    const now = new Date();
    const year = now.getFullYear().toString().substr(-2);
    const month = ('0' + (now.getMonth() + 1)).slice(-2);
    
    // Find the last code number
    let lastCode = 0;
    materialLists.value.forEach(list => {
      if (list.listCode && list.listCode.startsWith(`ML-${year}${month}`)) {
        const codeNumber = parseInt(list.listCode.split('-')[2]);
        if (codeNumber > lastCode) {
          lastCode = codeNumber;
        }
      }
    });
    
    // Create new code
    return `ML-${year}${month}-${(lastCode + 1).toString().padStart(3, '0')}`;
  }
  
  /**
   * Get example material lists for demo mode
   * @returns {Array} - Example material lists
   */
  function getExampleMaterialLists() {
    return [
      {
        id: 'list-1',
        listCode: 'ML-2405-001',
        listType: 'primer',
        cellType: 'RM 36 LB',
        technicalDetails: '36kV 630A 16kA Yük Ayırıcılı Giriş Hücresi',
        description: 'Standart yapılandırma',
        materialsCount: 45,
        createdAt: new Date('2024-05-01'),
        updatedAt: new Date('2024-05-01')
      },
      {
        id: 'list-2',
        listCode: 'ML-2405-002',
        listType: 'sekonder',
        cellType: 'RM 36 LB',
        technicalDetails: '36kV 630A 16kA Yük Ayırıcılı Giriş Hücresi',
        description: 'Standart yapılandırma',
        materialsCount: 78,
        createdAt: new Date('2024-05-01'),
        updatedAt: new Date('2024-05-01')
      },
      {
        id: 'list-3',
        listCode: 'ML-2405-003',
        listType: 'primer',
        cellType: 'RM 36 CB',
        technicalDetails: '36kV 630A 16kA Kesicili ÇIKIŞ Hücresi',
        description: 'Standart yapılandırma',
        materialsCount: 52,
        createdAt: new Date('2024-05-02'),
        updatedAt: new Date('2024-05-02')
      },
      {
        id: 'list-4',
        listCode: 'ML-2405-004',
        listType: 'sekonder',
        cellType: 'RM 36 CB',
        technicalDetails: '36kV 630A 16kA Kesicili ÇIKIŞ Hücresi',
        description: 'Standart yapılandırma',
        materialsCount: 85,
        createdAt: new Date('2024-05-02'),
        updatedAt: new Date('2024-05-02')
      },
      {
        id: 'list-5',
        listCode: 'ML-2405-005',
        listType: 'primer',
        cellType: 'RM 36 FL',
        technicalDetails: '36kV 200A 16kA Sigortalı Yük Ayırıcılı TR.Koruma Hücresi',
        description: 'Standart yapılandırma',
        materialsCount: 48,
        createdAt: new Date('2024-05-03'),
        updatedAt: new Date('2024-05-03')
      },
      {
        id: 'list-6',
        listCode: 'ML-2405-006',
        listType: 'sekonder',
        cellType: 'RM 36 FL',
        technicalDetails: '36kV 200A 16kA Sigortalı Yük Ayırıcılı TR.Koruma Hücresi',
        description: 'Standart yapılandırma',
        materialsCount: 72,
        createdAt: new Date('2024-05-03'),
        updatedAt: new Date('2024-05-03')
      }
    ];
  }

  // Return public API
  return {
    // State
    materialLists,
    isLoading,
    currentListId,
    currentList,
    
    // Methods
    loadMaterialLists,
    saveMaterialList,
    deleteMaterialList,
    duplicateMaterialList,
    generateListCode
  };
}