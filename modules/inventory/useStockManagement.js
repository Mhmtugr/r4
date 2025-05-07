/**
 * useStockManagement.js
 * Stok yönetimi ve kontrolü için kompozisyon fonksiyonu
 */

import { ref, reactive } from 'vue';
import { useToast } from '@/composables/useToast';

export function useStockManagement() {
  // Dependencies
  const { showToast } = useToast();
  
  // State
  const isLoading = ref(false);
  const stockReports = ref([]);
  const currentStockReport = ref(null);
  
  /**
   * Canias ERP entegrasyonu için servis sınıfı
   */
  class CaniasService {
    /**
     * Stok kontrolü yapar
     * @param {string} caniasCode - Canias malzeme kodu
     * @param {string} depot - Depo kodu (varsayılan: "B01")
     * @returns {Promise<Object>} - Stok bilgisi
     */
    async checkStock(caniasCode, depot = "B01") {
      try {
        console.log(`${caniasCode} kodlu malzemenin ${depot} depodaki stok durumu kontrol ediliyor...`);
        
        // Demo modda örnek veri dönelim (gerçek uygulamada API çağrısı yapılacak)
        return {
          caniasCode: caniasCode,
          available: Math.floor(Math.random() * 100),
          allocated: Math.floor(Math.random() * 20),
          incoming: Math.floor(Math.random() * 30),
          depot: depot
        };
      } catch (error) {
        console.error("Canias stok kontrolü hatası:", error);
        throw error;
      }
    }
  
    /**
     * Birden fazla malzeme için stok kontrolü yapar
     * @param {Array<string>} caniasCodes - Canias malzeme kodları dizisi
     * @param {string} depot - Depo kodu (varsayılan: "B01")
     * @returns {Promise<Array>} - Stok bilgisi dizisi
     */
    async checkStockMultiple(caniasCodes, depot = "B01") {
      try {
        console.log(`${caniasCodes.length} adet malzemenin ${depot} depodaki stok durumları kontrol ediliyor...`);
        
        // Her malzeme için stok kontrolü yap
        const results = [];
        for (const code of caniasCodes) {
          const stockInfo = await this.checkStock(code, depot);
          results.push(stockInfo);
        }
        
        return results;
      } catch (error) {
        console.error("Canias toplu stok kontrolü hatası:", error);
        throw error;
      }
    }
  
    /**
     * Satın alma talebi oluşturur
     * @param {Array<Object>} materials - Malzeme dizisi
     * @returns {Promise<Object>} - Talep sonuç bilgisi
     */
    async createPurchaseRequest(materials) {
      try {
        console.log(`${materials.length} adet malzeme için satın alma talebi oluşturuluyor...`);
        
        // Demo modda başarılı yanıt döndürelim
        return {
          requestId: "PR-" + Date.now(),
          status: "created",
          materialsCount: materials.length,
          createdAt: new Date()
        };
      } catch (error) {
        console.error("Canias satın alma talebi hatası:", error);
        throw error;
      }
    }
  }
  
  /**
   * Malzeme listesi şablonu getirir
   * @param {string} cellType - Hücre tipi
   * @param {string} listType - Liste tipi (primer/sekonder)
   * @returns {Promise<Array>} - Malzeme listesi
   */
  async function getMaterialListTemplate(cellType, listType) {
    try {
      isLoading.value = true;
      console.log(`${cellType} tipi için ${listType} malzeme listesi şablonu getiriliyor...`);
      
      // Gerçek uygulamada veritabanından alınacak
      if (window.firebase && window.firebase.firestore) {
        const snapshot = await window.firebase.firestore()
          .collection('materialListTemplates')
          .where('cellType', '==', cellType)
          .where('type', '==', listType)
          .limit(1)
          .get();
        
        if (!snapshot.empty) {
          return snapshot.docs[0].data().materials || [];
        }
      }
      
      // Demo verileri
      if (listType === "primer") {
        return getDemoPrimerList(cellType);
      } else {
        return getDemoSeconderList(cellType);
      }
    } catch (error) {
      console.error("Malzeme listesi şablonu getirme hatası:", error);
      showToast("Şablon yüklenirken bir hata oluştu", "error");
      throw error;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * Demo primer listesi döndürür
   * @param {string} cellType - Hücre tipi
   * @returns {Array} - Malzeme listesi
   */
  function getDemoPrimerList(cellType) {
    // Temel malzeme listesi
    const baseMaterials = [
      { materialCode: "P001", caniasCode: "105121%", name: "Ana Hücre Gövdesi", quantity: 1, unit: "Adet", category: "Mekanik" },
      { materialCode: "P002", caniasCode: "105122%", name: "Anahtarlama Mekanizması", quantity: 1, unit: "Adet", category: "Mekanik" },
      { materialCode: "P003", caniasCode: "105123%", name: "Topraklama Anahtarı", quantity: 1, unit: "Adet", category: "Mekanik" },
      { materialCode: "P004", caniasCode: "105124%", name: "Bağlantı Barası", quantity: 3, unit: "Adet", category: "Mekanik" },
      { materialCode: "P005", caniasCode: "105125%", name: "Ana İzolatör", quantity: 6, unit: "Adet", category: "İzolasyon" }
    ];
    
    // Hücre tipine göre özel malzemeleri ekle
    if (cellType.includes("RM 36 LB")) {
      baseMaterials.push(
        { materialCode: "P006", caniasCode: "105126%", name: "Yük Ayırıcı Kontakları", quantity: 3, unit: "Takım", category: "Elektrik" },
        { materialCode: "P007", caniasCode: "105127%", name: "Kapasitif Gerilim Bölücü", quantity: 3, unit: "Adet", category: "Elektrik" }
      );
    } else if (cellType.includes("RM 36 CB")) {
      baseMaterials.push(
        { materialCode: "P008", caniasCode: "105091%", name: "Kesici Mekanizması", quantity: 1, unit: "Adet", category: "Mekanik" },
        { materialCode: "P009", caniasCode: "105092%", name: "Akım Trafosu Yuvaları", quantity: 3, unit: "Adet", category: "Elektrik" }
      );
    } else if (cellType.includes("RM 36 FL")) {
      baseMaterials.push(
        { materialCode: "P010", caniasCode: "105112%", name: "Sigorta Taşıyıcı", quantity: 3, unit: "Adet", category: "Elektrik" },
        { materialCode: "P011", caniasCode: "105113%", name: "YG Sigorta Yuvası", quantity: 3, unit: "Adet", category: "Elektrik" }
      );
    }
    
    return baseMaterials;
  }
  
  /**
   * Demo sekonder listesi döndürür
   * @param {string} cellType - Hücre tipi
   * @returns {Array} - Malzeme listesi
   */
  function getDemoSeconderList(cellType) {
    // Temel malzeme listesi
    const baseMaterials = [
      { materialCode: "S001", caniasCode: "109367%", name: "Kablaj Seti", quantity: 1, unit: "Takım", category: "Elektrik" },
      { materialCode: "S002", caniasCode: "109368%", name: "Gerilim Göstergesi", quantity: 1, unit: "Adet", category: "Elektrik" },
      { materialCode: "S003", caniasCode: "109369%", name: "UKD Set", quantity: 1, unit: "Takım", category: "Elektrik" },
      { materialCode: "S004", caniasCode: "109370%", name: "Terminal Bloğu", quantity: 5, unit: "Adet", category: "Elektrik" },
      { materialCode: "S005", caniasCode: "109371%", name: "İkincil Kablo", quantity: 25, unit: "Metre", category: "Elektrik" }
    ];
    
    // Hücre tipine göre özel malzemeleri ekle
    if (cellType.includes("RM 36 LB")) {
      baseMaterials.push(
        { materialCode: "S006", caniasCode: "109372%", name: "Motor Kontrol Rölesi", quantity: 1, unit: "Adet", category: "Elektrik" },
        { materialCode: "S007", caniasCode: "109373%", name: "Kontrol Butonu", quantity: 3, unit: "Adet", category: "Elektrik" }
      );
    } else if (cellType.includes("RM 36 CB")) {
      baseMaterials.push(
        { materialCode: "S008", caniasCode: "137998%", name: "Koruma Rölesi", quantity: 1, unit: "Adet", category: "Elektrik" },
        { materialCode: "S009", caniasCode: "137999%", name: "Kesici Kontrol Kartı", quantity: 1, unit: "Adet", category: "Elektrik" }
      );
    } else if (cellType.includes("RM 36 FL")) {
      baseMaterials.push(
        { materialCode: "S010", caniasCode: "138000%", name: "Sigorta Açma Rölesi", quantity: 1, unit: "Adet", category: "Elektrik" },
        { materialCode: "S011", caniasCode: "138001%", name: "Termal Koruma Rölesi", quantity: 1, unit: "Adet", category: "Elektrik" }
      );
    }
    
    return baseMaterials;
  }
  
  /**
   * Sipariş için malzeme listesi oluşturur
   * @param {Object} orderData - Sipariş verisi
   * @returns {Promise<Object>} - Oluşturulan malzeme listesi
   */
  async function generateMaterialListForOrder(orderData) {
    try {
      isLoading.value = true;
      console.log(`${orderData.orderNo || 'Yeni'} siparişi için malzeme listesi oluşturuluyor...`);
      
      // Her hücre için malzeme listesi oluştur
      const cellMaterialLists = [];
      
      for (const cell of orderData.cells) {
        // Hücre tipine göre temel primer ve sekonder malzeme listelerini al
        const primerList = await getMaterialListTemplate(cell.productTypeCode, "primer");
        const seconderList = await getMaterialListTemplate(cell.productTypeCode, "sekonder");
        
        // Hücrenin özel malzemelerini belirle
        const customMaterials = identifyCustomComponents(cell);
        
        // Temel listeyi özelleştir (gerçek uygulama için)
        // const customizedPrimerList = customizeMaterialList(primerList, customMaterials.primer);
        // const customizedSeconderList = customizeMaterialList(seconderList, customMaterials.sekonder);
        
        // Demo için özelleştirme yapılmadığını varsayalım
        const customizedPrimerList = primerList;
        const customizedSeconderList = seconderList;
        
        // Hücre için malzeme listesini kaydet
        cellMaterialLists.push({
          cellId: cell.serialNumber || `cell-${Date.now()}`,
          cellType: cell.productTypeCode,
          technicalValues: cell.technicalValues,
          primerList: customizedPrimerList,
          seconderList: customizedSeconderList,
          quantity: cell.quantity || 1
        });
      }
      
      // Projeye ait genel malzemeler
      const projectMaterials = [
        { materialCode: "PRJ001", caniasCode: "109367%", name: "Bara Bağlantı Takımı", quantity: 6, unit: "Adet", category: "Mekanik" },
        { materialCode: "PRJ002", caniasCode: "109363%", name: "Yan Kapak Seti", quantity: 2, unit: "Takım", category: "Mekanik" }
      ];
      
      // Sipariş için malzeme listesini oluştur
      const orderMaterialList = {
        orderId: orderData.orderNo || `order-${Date.now()}`,
        customerName: orderData.customerInfo?.name || "Bilinmeyen Müşteri",
        cellMaterialLists,
        projectMaterials,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log(`Sipariş malzeme listesi oluşturuldu. Toplam ${cellMaterialLists.length} hücre.`);
      
      // Veritabanına kaydet (gerçek uygulama için)
      if (window.firebase && window.firebase.firestore) {
        await window.firebase.firestore().collection('orderMaterialLists').doc(orderMaterialList.orderId).set(orderMaterialList);
      }
      
      return orderMaterialList;
    } catch (error) {
      console.error("Malzeme listesi oluşturma hatası:", error);
      showToast("Malzeme listesi oluşturulamadı", "error");
      throw error;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * Hücrenin özel komponentlerini belirler
   * @param {Object} cell - Hücre verisi
   * @returns {Object} - Özelleştirilmiş komponentler listesi
   */
  function identifyCustomComponents(cell) {
    const custom = {
      primer: [],
      sekonder: []
    };
    
    // Koruma rölesi
    if (cell.relay && cell.relay.model) {
      custom.sekonder.push({
        type: "relay",
        model: cell.relay.model,
        code: cell.relay.caniasCode,
        required: true
      });
    }
    
    // Enerji analizörü
    if (cell.energyAnalyzer && cell.energyAnalyzer.model) {
      custom.sekonder.push({
        type: "analyzer",
        model: cell.energyAnalyzer.model,
        code: cell.energyAnalyzer.caniasCode,
        required: true
      });
    }
    
    // AGD
    if (cell.agd && cell.agd.model) {
      custom.sekonder.push({
        type: "agd",
        model: cell.agd.model,
        code: cell.agd.caniasCode,
        required: true
      });
    }
    
    // Sayaç
    if (cell.counter && cell.counter.model) {
      custom.sekonder.push({
        type: "counter",
        model: cell.counter.model,
        code: cell.counter.caniasCode,
        required: true
      });
    }
    
    return custom;
  }
  
  /**
   * Sipariş için malzeme stok kontrolü yapar
   * @param {string} orderId - Sipariş ID
   * @param {Object} orderMaterialList - Sipariş malzeme listesi (opsiyonel)
   * @returns {Promise<Object>} - Stok raporu
   */
  async function checkOrderMaterialStock(orderId, orderMaterialList = null) {
    try {
      isLoading.value = true;
      console.log(`${orderId} siparişi için malzeme stok kontrolü yapılıyor...`);
      
      // Sipariş malzeme listesini getir (parametre olarak gelmezse)
      if (!orderMaterialList) {
        if (window.firebase && window.firebase.firestore) {
          const doc = await window.firebase.firestore().collection('orderMaterialLists').doc(orderId).get();
          
          if (doc.exists) {
            orderMaterialList = doc.data();
          } else {
            // Demo için örnek siparişi oluşturalım
            const demoOrder = {
              orderNo: orderId,
              cells: [
                {
                  productTypeCode: "RM 36 LB",
                  technicalValues: "36kV 630A 16kA Yük Ayırıcılı Giriş Hücresi",
                  quantity: 2,
                  serialNumber: "SN-001"
                },
                {
                  productTypeCode: "RM 36 CB",
                  technicalValues: "36kV 630A 16kA Kesicili ÇIKIŞ Hücresi",
                  quantity: 1,
                  serialNumber: "SN-002",
                  relay: {
                    model: "Siemens 7SR1003-1JA20-2DA0+ZY20",
                    caniasCode: "137998%"
                  }
                }
              ],
              customerInfo: {
                name: "AYEDAŞ"
              }
            };
            
            orderMaterialList = await generateMaterialListForOrder(demoOrder);
          }
        } else {
          // Demo için örnek siparişi oluşturalım
          const demoOrder = {
            orderNo: orderId,
            cells: [
              {
                productTypeCode: "RM 36 LB",
                technicalValues: "36kV 630A 16kA Yük Ayırıcılı Giriş Hücresi",
                quantity: 2,
                serialNumber: "SN-001"
              },
              {
                productTypeCode: "RM 36 CB",
                technicalValues: "36kV 630A 16kA Kesicili ÇIKIŞ Hücresi",
                quantity: 1,
                serialNumber: "SN-002",
                relay: {
                  model: "Siemens 7SR1003-1JA20-2DA0+ZY20",
                  caniasCode: "137998%"
                }
              }
            ],
            customerInfo: {
              name: "AYEDAŞ"
            }
          };
          
          orderMaterialList = await generateMaterialListForOrder(demoOrder);
        }
      }
      
      // Tüm malzemelerin Canias kodlarını toplama
      const caniasCodes = [];
      const materialMap = new Map();
      
      // Hücre malzemeleri
      orderMaterialList.cellMaterialLists.forEach(cellList => {
        // Her hücrenin miktarını hesaba kat
        const quantity = cellList.quantity || 1;
        
        // Primer ve sekonder listeleri işle
        [cellList.primerList, cellList.seconderList].forEach(list => {
          list.forEach(material => {
            if (material.caniasCode) {
              const requiredQty = material.quantity * quantity;
              
              // Map'e ekle (aynı malzeme birden fazla hücrede kullanılabilir)
              if (materialMap.has(material.caniasCode)) {
                const existingMaterial = materialMap.get(material.caniasCode);
                existingMaterial.requiredQuantity += requiredQty;
              } else {
                materialMap.set(material.caniasCode, {
                  ...material,
                  requiredQuantity: requiredQty
                });
                caniasCodes.push(material.caniasCode);
              }
            }
          });
        });
      });
      
      // Proje malzemeleri
      orderMaterialList.projectMaterials.forEach(material => {
        if (material.caniasCode) {
          if (materialMap.has(material.caniasCode)) {
            const existingMaterial = materialMap.get(material.caniasCode);
            existingMaterial.requiredQuantity += material.quantity;
          } else {
            materialMap.set(material.caniasCode, {
              ...material,
              requiredQuantity: material.quantity
            });
            caniasCodes.push(material.caniasCode);
          }
        }
      });
      
      console.log(`Toplam ${caniasCodes.length} farklı malzeme için stok kontrolü yapılıyor...`);
      
      // Canias ERP stok kontrolü
      const caniasService = new CaniasService();
      const stockResults = await caniasService.checkStockMultiple(caniasCodes);
      
      // Stok durumu raporunu oluştur
      const stockReport = {
        orderId,
        checkDate: new Date(),
        materials: [],
        missingMaterials: [],
        stockSufficient: true
      };
      
      // Tüm malzemeleri kontrol et
      for (const [caniasCode, material] of materialMap.entries()) {
        const stockInfo = stockResults.find(s => s.caniasCode === caniasCode) || 
                          { available: 0, allocated: 0, incoming: 0 };
        
        const availableStock = stockInfo.available || 0;
        const isAvailable = availableStock >= material.requiredQuantity;
        
        const materialStatus = {
          ...material,
          availableStock,
          allocatedStock: stockInfo.allocated || 0,
          incomingStock: stockInfo.incoming || 0,
          isAvailable,
          shortage: isAvailable ? 0 : material.requiredQuantity - availableStock,
          expectedDeliveryDate: stockInfo.expectedDeliveryDate || null
        };
        
        stockReport.materials.push(materialStatus);
        
        if (!isAvailable) {
          stockReport.missingMaterials.push(materialStatus);
          stockReport.stockSufficient = false;
        }
      }
      
      console.log(`Stok kontrolü tamamlandı. ${stockReport.missingMaterials.length} adet eksik malzeme tespit edildi.`);
      
      // Oluşturulan raporu state'e kaydet
      currentStockReport.value = stockReport;
      stockReports.value.push(stockReport);
      
      return stockReport;
    } catch (error) {
      console.error("Stok kontrolü hatası:", error);
      showToast("Stok kontrolü yapılamadı", "error");
      throw error;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * Eksik malzemeler için satın alma talebi oluşturur
   * @param {Object} stockReport - Stok raporu
   * @param {string} requesterUserId - Talep eden kullanıcı ID'si
   * @returns {Promise<Object>} - Talep sonuç bilgisi
   */
  async function createPurchaseRequestForMissingMaterials(stockReport, requesterUserId = "demo-user") {
    try {
      isLoading.value = true;
      console.log(`${stockReport.orderId} siparişi için satın alma talebi oluşturuluyor...`);
      
      // Eksik malzeme yoksa işlem yapma
      if (!stockReport.missingMaterials || stockReport.missingMaterials.length === 0) {
        return { success: true, message: "Eksik malzeme bulunmamaktadır." };
      }
      
      // Satın alma talebi oluştur
      const purchaseRequest = {
        orderId: stockReport.orderId,
        requestDate: new Date(),
        requesterId: requesterUserId,
        status: "pending",
        materials: stockReport.missingMaterials.map(material => ({
          caniasCode: material.caniasCode,
          materialCode: material.materialCode,
          name: material.name,
          quantity: material.shortage,
          unit: material.unit,
          isUrgent: material.shortage > (material.requiredQuantity * 0.5) // %50'den fazlası eksikse acil
        }))
      };
      
      // Canias ERP'ye satın alma talebi gönder
      const caniasService = new CaniasService();
      const result = await caniasService.createPurchaseRequest(purchaseRequest.materials);
      
      // Talebin ID'sini ve durumunu güncelle
      purchaseRequest.requestId = result.requestId;
      purchaseRequest.caniasStatus = result.status;
      
      console.log(`Satın alma talebi oluşturuldu. Talep ID: ${purchaseRequest.requestId}`);
      
      // Veritabanına kaydet (gerçek uygulamada)
      if (window.firebase && window.firebase.firestore) {
        await window.firebase.firestore().collection('purchaseRequests').doc(purchaseRequest.requestId).set(purchaseRequest);
      }
      
      showToast("Satın alma talebi başarıyla oluşturuldu", "success");
      
      return {
        success: true,
        requestId: purchaseRequest.requestId,
        message: "Satın alma talebi başarıyla oluşturuldu"
      };
    } catch (error) {
      console.error("Satın alma talebi oluşturma hatası:", error);
      showToast("Satın alma talebi oluşturulamadı", "error");
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  // Return public API
  return {
    // State
    isLoading,
    stockReports,
    currentStockReport,
    
    // Methods
    getMaterialListTemplate,
    generateMaterialListForOrder,
    checkOrderMaterialStock,
    createPurchaseRequestForMissingMaterials,
    
    // Helper classes
    CaniasService
  };
}