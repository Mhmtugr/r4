/**
 * useMaterials.js
 * Individual materials management composable
 */

import { ref, computed } from 'vue';
import { useToast } from '@/composables/useToast';

export function useMaterials() {
  // Dependencies
  const { showToast } = useToast();
  
  // State
  const materials = ref([]);
  const isLoading = ref(false);
  const currentMaterialId = ref(null);
  const currentMaterial = computed(() => {
    return currentMaterialId.value ? materials.value.find(material => material.id === currentMaterialId.value) : null;
  });
  
  /**
   * Load materials for a specific list
   * @param {string} listId - Material list ID to load materials for
   * @returns {Promise<Array>} - Materials list
   */
  async function loadMaterialsByList(listId) {
    try {
      isLoading.value = true;
      
      if (!listId) {
        materials.value = [];
        return [];
      }
      
      if (window.firebase && window.firebase.firestore) {
        const snapshot = await window.firebase.firestore().collection('materials')
          .where('listId', '==', listId)
          .get();
        
        const items = [];
        snapshot.forEach(doc => {
          items.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        materials.value = items;
      } else {
        // Demo data
        materials.value = getExampleMaterials(listId);
        console.log('Using demo materials data');
      }
      
      return materials.value;
    } catch (error) {
      console.error("Error loading materials:", error);
      showToast("Malzemeler yüklenirken bir hata oluştu", "error");
      // Fallback to example data
      materials.value = getExampleMaterials(listId);
      return materials.value;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * Save a material
   * @param {Object} materialData - Material data to save
   * @param {string} listId - Associated list ID
   * @returns {Promise<Object>} - Result with success status and material ID
   */
  async function saveMaterial(materialData, listId) {
    try {
      if (!listId) {
        showToast("Önce malzeme listesini kaydedin", "error");
        return { success: false, error: "No list ID provided" };
      }
      
      // Validation
      if (!materialData.materialCode || !materialData.materialName) {
        showToast("Malzeme kodu ve adı zorunludur", "error");
        return { success: false, error: "Required fields missing" };
      }
      
      const saveData = {
        ...materialData,
        listId,
        updatedAt: window.firebase?.firestore ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date()
      };
      
      let materialId;
      
      // Save to Firebase if available
      if (window.firebase && window.firebase.firestore) {
        if (currentMaterialId.value) {
          // Update existing material
          await window.firebase.firestore().collection('materials').doc(currentMaterialId.value).update(saveData);
          materialId = currentMaterialId.value;
          showToast("Malzeme güncellendi", "success");
        } else {
          // Create new material
          const docRef = await window.firebase.firestore().collection('materials').add({
            ...saveData,
            createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
          });
          materialId = docRef.id;
          
          // Update material count in the list
          const listRef = window.firebase.firestore().collection('materialLists').doc(listId);
          await window.firebase.firestore().runTransaction(async transaction => {
            const listDoc = await transaction.get(listRef);
            if (listDoc.exists) {
              const count = (listDoc.data().materialsCount || 0) + 1;
              transaction.update(listRef, { materialsCount: count });
            }
          });
          
          showToast("Malzeme eklendi", "success");
        }
      } else {
        // Demo mode
        if (currentMaterialId.value) {
          // Update existing material
          const index = materials.value.findIndex(material => material.id === currentMaterialId.value);
          if (index !== -1) {
            materials.value[index] = {
              ...materials.value[index],
              ...saveData,
              updatedAt: new Date()
            };
          }
          materialId = currentMaterialId.value;
          showToast("Malzeme güncellendi (Demo)", "success");
        } else {
          // Create new material
          materialId = 'material-' + Date.now();
          const newMaterial = {
            id: materialId,
            ...saveData,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          materials.value.push(newMaterial);
          showToast("Malzeme eklendi (Demo)", "success");
        }
      }
      
      // Refresh materials
      await loadMaterialsByList(listId);
      
      return { success: true, materialId };
    } catch (error) {
      console.error("Error saving material:", error);
      showToast("Malzeme kaydedilemedi: " + error.message, "error");
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Delete a material
   * @param {string} materialId - Material ID to delete
   * @param {string} listId - Associated list ID
   * @returns {Promise<Object>} - Result with success status
   */
  async function deleteMaterial(materialId, listId) {
    try {
      if (window.firebase && window.firebase.firestore) {
        // Delete the material
        await window.firebase.firestore().collection('materials').doc(materialId).delete();
        
        // Update material count in the list
        if (listId) {
          const listRef = window.firebase.firestore().collection('materialLists').doc(listId);
          await window.firebase.firestore().runTransaction(async transaction => {
            const listDoc = await transaction.get(listRef);
            if (listDoc.exists) {
              const count = Math.max(0, (listDoc.data().materialsCount || 0) - 1);
              transaction.update(listRef, { materialsCount: count });
            }
          });
        }
        
        showToast("Malzeme silindi", "success");
      } else {
        // Demo mode
        const index = materials.value.findIndex(material => material.id === materialId);
        if (index !== -1) {
          materials.value.splice(index, 1);
          showToast("Malzeme silindi (Demo)", "success");
        }
      }
      
      // Reset current material ID if it was the deleted one
      if (currentMaterialId.value === materialId) {
        currentMaterialId.value = null;
      }
      
      // Refresh materials
      if (listId) {
        await loadMaterialsByList(listId);
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting material:", error);
      showToast("Malzeme silinemedi: " + error.message, "error");
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Import materials from a CSV file
   * @param {File} file - CSV file to import
   * @param {string} listId - List ID to associate with imported materials
   * @returns {Promise<Object>} - Result with success status and import count
   */
  async function importMaterialsFromCSV(file, listId) {
    try {
      if (!file || !listId) {
        return { success: false, error: "File and list ID are required" };
      }
      
      // Read the file
      const text = await readFileAsText(file);
      const rows = text.split("\n").map(row => row.trim()).filter(row => row);
      
      if (rows.length < 2) {
        showToast("Dosya boş veya geçersiz", "error");
        return { success: false, error: "Empty or invalid file" };
      }
      
      // Parse header
      const header = parseCSVRow(rows[0]);
      const requiredColumns = ["materialCode", "materialName", "quantity", "unit"];
      const columnIndexes = {};
      
      // Map column indexes
      requiredColumns.forEach(column => {
        const index = header.findIndex(h => 
          h.toLowerCase() === column.toLowerCase() ||
          h.toLowerCase().replace(/\s+/g, '') === column.toLowerCase()
        );
        columnIndexes[column] = index;
      });
      
      // Validate all required columns exist
      const missingColumns = requiredColumns.filter(col => columnIndexes[col] === -1);
      if (missingColumns.length > 0) {
        showToast(`Eksik sütunlar: ${missingColumns.join(', ')}`, "error");
        return { success: false, error: `Missing required columns: ${missingColumns.join(', ')}` };
      }
      
      // Parse data rows
      const validRows = [];
      const errors = [];
      
      for (let i = 1; i < rows.length; i++) {
        try {
          const rowData = parseCSVRow(rows[i]);
          if (rowData.length < header.length) continue;
          
          const material = {
            materialCode: rowData[columnIndexes.materialCode],
            materialName: rowData[columnIndexes.materialName],
            quantity: parseFloat(rowData[columnIndexes.quantity]) || 1,
            unit: rowData[columnIndexes.unit] || "Adet",
            listId
          };
          
          // Validate required fields
          if (!material.materialCode || !material.materialName) {
            errors.push(`Satır ${i + 1}: Malzeme kodu veya adı eksik`);
            continue;
          }
          
          validRows.push(material);
        } catch (error) {
          errors.push(`Satır ${i + 1}: ${error.message}`);
        }
      }
      
      if (validRows.length === 0) {
        showToast("İçe aktarılacak geçerli malzeme bulunamadı", "error");
        return { success: false, error: "No valid materials to import" };
      }
      
      // Save to database
      let importedCount = 0;
      
      if (window.firebase && window.firebase.firestore) {
        const batch = window.firebase.firestore().batch();
        
        validRows.forEach(material => {
          const docRef = window.firebase.firestore().collection('materials').doc();
          batch.set(docRef, {
            ...material,
            createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
          });
        });
        
        await batch.commit();
        
        // Update material count in the list
        const listRef = window.firebase.firestore().collection('materialLists').doc(listId);
        await window.firebase.firestore().runTransaction(async transaction => {
          const listDoc = await transaction.get(listRef);
          if (listDoc.exists) {
            const count = (listDoc.data().materialsCount || 0) + validRows.length;
            transaction.update(listRef, { materialsCount: count });
          }
        });
        
        importedCount = validRows.length;
      } else {
        // Demo mode
        validRows.forEach(material => {
          const materialId = 'material-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
          materials.value.push({
            id: materialId,
            ...material,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        });
        
        importedCount = validRows.length;
      }
      
      // Refresh materials
      await loadMaterialsByList(listId);
      
      let message = `${importedCount} malzeme başarıyla içe aktarıldı.`;
      if (errors.length > 0) {
        message += ` ${errors.length} satır hatalı.`;
      }
      
      showToast(message, "success");
      
      return { success: true, importedCount, errorCount: errors.length };
    } catch (error) {
      console.error("Error importing materials:", error);
      showToast("Malzemeler içe aktarılamadı: " + error.message, "error");
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Read a file as text
   * @param {File} file - File to read
   * @returns {Promise<string>} - File contents
   */
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
  
  /**
   * Parse a CSV row
   * @param {string} row - CSV row to parse
   * @returns {Array} - Array of cell values
   */
  function parseCSVRow(row) {
    // Simple CSV parsing (doesn't handle all edge cases)
    const result = [];
    let inQuote = false;
    let currentValue = '';
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        result.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Add the last value
    result.push(currentValue.trim());
    
    return result;
  }
  
  /**
   * Export materials to CSV
   * @param {string} listId - List ID to export materials for
   * @returns {Promise<Object>} - Result with success status and CSV data
   */
  async function exportMaterialsToCSV(listId) {
    try {
      // Ensure we have materials
      if (materials.value.length === 0) {
        await loadMaterialsByList(listId);
      }
      
      if (materials.value.length === 0) {
        showToast("Dışa aktarılacak malzeme bulunamadı", "warning");
        return { success: false, error: "No materials to export" };
      }
      
      // Generate CSV header
      const headers = ["materialCode", "caniasCode", "materialName", "quantity", "unit"];
      let csv = headers.join(",") + "\n";
      
      // Generate CSV rows
      materials.value.forEach(material => {
        const row = [
          material.materialCode || "",
          material.caniasCode || "",
          material.materialName || "",
          material.quantity || 1,
          material.unit || "Adet"
        ].map(value => {
          // Quote values that contain commas
          if (typeof value === "string" && value.includes(",")) {
            return `"${value}"`;
          }
          return value;
        });
        
        csv += row.join(",") + "\n";
      });
      
      return { success: true, csv };
    } catch (error) {
      console.error("Error exporting materials:", error);
      showToast("Malzemeler dışa aktarılamadı: " + error.message, "error");
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get example materials for demo mode
   * @param {string} listId - List ID to generate materials for
   * @returns {Array} - Example materials
   */
  function getExampleMaterials(listId) {
    // Generate different example materials based on list ID to simulate 
    // different materials for different lists
    const materialsSets = {
      'list-1': [
        {
          id: 'material-1-1',
          listId: 'list-1',
          materialCode: 'P-001',
          caniasCode: '10230045',
          materialName: 'Ana Bara 30x10mm (Cu)',
          quantity: 3,
          unit: 'metre',
          createdAt: new Date('2024-05-01'),
          updatedAt: new Date('2024-05-01')
        },
        {
          id: 'material-1-2',
          listId: 'list-1',
          materialCode: 'P-002',
          caniasCode: '10250032',
          materialName: 'Toprağa Bara 20x5mm (Cu)',
          quantity: 2,
          unit: 'metre',
          createdAt: new Date('2024-05-01'),
          updatedAt: new Date('2024-05-01')
        },
        {
          id: 'material-1-3',
          listId: 'list-1',
          materialCode: 'P-003',
          caniasCode: '20140056',
          materialName: 'Yük Ayırıcısı 36kV 630A',
          quantity: 1,
          unit: 'adet',
          createdAt: new Date('2024-05-01'),
          updatedAt: new Date('2024-05-01')
        }
      ],
      'list-2': [
        {
          id: 'material-2-1',
          listId: 'list-2',
          materialCode: 'S-001',
          caniasCode: '30120078',
          materialName: 'Gösterge Lambası (LED, Kırmızı)',
          quantity: 3,
          unit: 'adet',
          createdAt: new Date('2024-05-01'),
          updatedAt: new Date('2024-05-01')
        },
        {
          id: 'material-2-2',
          listId: 'list-2',
          materialCode: 'S-002',
          caniasCode: '30120079',
          materialName: 'Gösterge Lambası (LED, Yeşil)',
          quantity: 3,
          unit: 'adet',
          createdAt: new Date('2024-05-01'),
          updatedAt: new Date('2024-05-01')
        }
      ]
    };
    
    // If we have predefined materials for this list, return them
    if (materialsSets[listId]) {
      return materialsSets[listId];
    }
    
    // Otherwise generate random materials
    return [
      {
        id: `material-${listId}-1`,
        listId,
        materialCode: `CODE-${Math.floor(Math.random() * 1000)}`,
        caniasCode: `CAN-${Math.floor(Math.random() * 10000)}`,
        materialName: 'Demo Malzeme ' + Math.floor(Math.random() * 100),
        quantity: Math.floor(Math.random() * 10) + 1,
        unit: 'adet',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `material-${listId}-2`,
        listId,
        materialCode: `CODE-${Math.floor(Math.random() * 1000)}`,
        caniasCode: `CAN-${Math.floor(Math.random() * 10000)}`,
        materialName: 'Demo Malzeme ' + Math.floor(Math.random() * 100),
        quantity: Math.floor(Math.random() * 10) + 1,
        unit: 'adet',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  // Return public API
  return {
    // State
    materials,
    isLoading,
    currentMaterialId,
    currentMaterial,
    
    // Methods
    loadMaterialsByList,
    saveMaterial,
    deleteMaterial,
    importMaterialsFromCSV,
    exportMaterialsToCSV
  };
}