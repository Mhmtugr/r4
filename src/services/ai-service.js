import { ref } from 'vue';
// Corrected import paths assuming stores are exported from these module files
import { useOrders } from '@/modules/orders/useOrders'; // Corrected function name
import { useStockManagement } from '@/modules/inventory/useStockManagement'; // Corrected import name
import { useTechnicalStore } from '@/store/technical.js'; // Added .js for clarity
import logger from '@/utils/logger';

// API configuration - Using environment variables for security
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || 'demo-key'; // Use environment variable
const API_URL = import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';

// Service state
const isInitialized = ref(false);
const isLoading = ref(false);
const error = ref(null);

/**
 * AI Service class - Used for AI integration
 */
class AIService {
  constructor() {
    this.isInitialized = false;
    this.apiKey = API_KEY;
    this.modelConfig = {
      modelName: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 1000
    };
    // Add conversation history support
    this.conversationHistory = [];
    // Max conversation history entries to keep
    this.maxHistoryLength = 10;
  }

  /**
   * Initialize the service
   */
  initialize() {
    logger.info('Initializing AI service...');
    
    try {
      this.isInitialized = true;
      logger.info('AI service successfully initialized.');
    } catch (err) {
      logger.error('AI service initialization error:', err);
      error.value = 'An error occurred while initializing the AI service.';
    }
  }

  /**
   * Answer the user's question
   * @param {string} question - User's question
   * @returns {Promise<string>} - AI response
   */
  async askQuestion(question) {
    try {
      isLoading.value = true;
      
      // Collect system data
      const systemData = await this.getSystemData();
      
      // Add user question to conversation history
      this.addToConversationHistory('user', question);
      
      // Check if we should use the real API or mock response
      let response;
      if (API_KEY !== 'demo-key' && !import.meta.env.DEV) {
        // Use real API in production when API key is available
        response = await this.callDeepseekAPI(question, systemData);
      } else {
        // Use mock response in development or when no API key is available
        response = this.generateMockResponse(question, systemData);
      }
      
      // Add AI response to conversation history
      this.addToConversationHistory('assistant', response);
      
      isLoading.value = false;
      return response;
    } catch (err) {
      logger.error('AI query error:', err);
      error.value = 'An error occurred during the AI query.';
      isLoading.value = false;
      throw err;
    }
  }

  /**
   * Add message to conversation history
   * @param {string} role - 'user' or 'assistant'
   * @param {string} content - Message content
   */
  addToConversationHistory(role, content) {
    this.conversationHistory.push({
      role,
      content,
      timestamp: new Date()
    });
    
    // Limit conversation history length
    if (this.conversationHistory.length > this.maxHistoryLength * 2) {
      // Keep the most recent conversations
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength * 2);
    }
  }

  /**
   * Generate AI insights about production trends
   * @returns {Promise<Object>} - Analysis results
   */
  async generateProductionInsights() {
    try {
      isLoading.value = true;
      
      // Collect system data
      const systemData = await this.getSystemData();
      
      // Use actual API or mock response
      let response;
      if (API_KEY !== 'demo-key' && !import.meta.env.DEV) {
        // Create a specialized prompt for production analysis
        const analysisPrompt = `
          Analyze the following production data and provide insights about:
          1. Production efficiency trends
          2. Potential bottlenecks
          3. Delayed order patterns
          4. Critical material shortages
          5. Recommended actions to improve efficiency
          
          System data for analysis:
          ${JSON.stringify(systemData, null, 2)}
          
          Format the response as a JSON object with sections for each category.
        `;
        
        response = await this.callDeepseekAPI(analysisPrompt, systemData);
        try {
          // Parse JSON response
          return JSON.parse(response);
        } catch (e) {
          // If parsing fails, return as text
          return { analysisText: response };
        }
      } else {
        // Generate mock insights
        return this.generateMockInsights(systemData);
      }
    } catch (err) {
      logger.error('AI insights generation error:', err);
      error.value = 'An error occurred while generating AI insights.';
      isLoading.value = false;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Generate mock production insights
   * @param {Object} systemData - System data
   * @returns {Object} - Mock insights
   */
  generateMockInsights(systemData) {
    const totalOrders = systemData.orders.length || 0;
    const delayedOrders = systemData.orders.filter(o => o.status === 'delayed').length || 0;
    const delayRate = totalOrders > 0 ? (delayedOrders / totalOrders * 100).toFixed(1) : 0;
    
    const criticalMaterials = systemData.materials?.filter(m => m.status === 'Kritik').length || 0;
    const totalMaterials = systemData.materials?.length || 0;
    
    return {
      efficiencyTrends: {
        currentEfficiency: systemData.stats.productionEfficiency || 78,
        weeklyChange: "+2.3%",
        monthlyChange: "-1.5%",
        insights: "Üretim verimliliği son haftada artış göstermiş ancak aylık bazda %1.5 düşüş yaşanmıştır. CB tipi hücrelerde verimlilik diğerlerine göre daha yüksektir."
      },
      bottlenecks: {
        primaryBottleneck: "Malzeme Tedarik Süreci",
        secondaryBottleneck: "Tasarım Onay Süreci",
        affectedOrders: delayedOrders,
        insights: "Tedarik sürecindeki gecikmeler, özellikle Siemens röleleri için sipariş süresinin uzaması, projelerde gecikmeye neden olmaktadır."
      },
      delayedOrders: {
        count: delayedOrders,
        percentage: delayRate,
        patterns: "Gecikmelerin %60'ı malzeme tedarikinden, %30'u tasarım değişikliklerinden, %10'u ise üretim kapasitesinden kaynaklanmaktadır.",
        insights: "Gecikmeler en çok CB tipi hücrelerde görülmektedir. En sık geciken müşteri siparişleri: AYEDAŞ, ENERJİSA."
      },
      materialShortages: {
        criticalCount: criticalMaterials,
        criticalPercentage: totalMaterials > 0 ? (criticalMaterials / totalMaterials * 100).toFixed(1) : 0,
        mostCritical: ["Siemens 7SJ85 Röle", "VG4 Kesici", "Akım Trafosu"],
        insights: "Kritik malzemeler için alternatif tedarikçilere yönelmek ve minimum stok seviyelerini artırmak önerilir."
      },
      recommendations: [
        "Tedarikçilerle yeni anlaşmalar yaparak teslimat sürelerini kısaltın",
        "CB tipi hücreler için tasarım sürecini optimize edin",
        "Kritik malzemeler için minimum stok seviyelerini %15 artırın",
        "Müşteri ile tasarım onay sürecini hızlandıracak yeni bir iletişim sistemi kurun"
      ]
    };
  }
  
  /**
   * Analyze specific order for optimization
   * @param {string} orderId - Order ID to analyze
   * @returns {Promise<Object>} - Order analysis
   */
  async analyzeOrder(orderId) {
    try {
      isLoading.value = true;
      
      // Get system data
      const systemData = await this.getSystemData();
      
      // Find specific order
      const order = systemData.orders.find(o => o.id === orderId || o.orderNo === orderId);
      
      if (!order) {
        throw new Error(`Sipariş bulunamadı: ${orderId}`);
      }
      
      // Use actual API or mock
      if (API_KEY !== 'demo-key' && !import.meta.env.DEV) {
        const analysisPrompt = `
          Analyze the following specific order and provide optimization recommendations:
          ${JSON.stringify(order, null, 2)}
          
          Include:
          1. Risk assessment 
          2. Critical path analysis
          3. Resource optimization suggestions
          4. Schedule improvement options
          
          Format the response as a JSON object with sections for each category.
        `;
        
        const response = await this.callDeepseekAPI(analysisPrompt, systemData);
        try {
          // Parse JSON response
          return JSON.parse(response);
        } catch (e) {
          // If parsing fails, return as text
          return { analysisText: response };
        }
      } else {
        // Generate mock order analysis
        return this.generateMockOrderAnalysis(order);
      }
    } catch (err) {
      logger.error('Order analysis error:', err);
      error.value = `An error occurred while analyzing order: ${err.message}`;
      isLoading.value = false;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * Generate mock order analysis
   * @param {Object} order - Order to analyze
   * @returns {Object} - Mock analysis
   */
  generateMockOrderAnalysis(order) {
    // Calculate days until delivery
    const today = new Date();
    const deliveryDate = order.cells && order.cells[0]?.deliveryDate 
      ? new Date(order.cells[0].deliveryDate) 
      : null;
      
    const daysUntilDelivery = deliveryDate 
      ? Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24))
      : 0;
      
    // Calculate if order is at risk
    const isDelayed = order.status === 'delayed';
    const progress = order.progress || 0;
    const expectedProgress = daysUntilDelivery <= 0 ? 100 : (100 - (daysUntilDelivery / 180 * 100));
    const progressDifference = progress - expectedProgress;
    
    const riskLevel = isDelayed ? 'Yüksek' : 
                    progressDifference < -15 ? 'Orta' :
                    progressDifference < 0 ? 'Düşük' : 'Minimal';
    
    return {
      orderInfo: {
        orderNo: order.orderNo,
        customer: order.customerInfo?.name,
        products: order.cells?.map(cell => `${cell.productTypeCode} (${cell.quantity} adet)`) || [],
        currentProgress: `%${progress}`,
        status: order.status
      },
      riskAssessment: {
        riskLevel: riskLevel,
        deliveryRisk: daysUntilDelivery <= 0 
          ? 'Termin tarihi geçmiş' 
          : `${daysUntilDelivery} gün kalan, ${isDelayed ? 'gecikmeli' : 'plan dahilinde'}`,
        progressGap: isNaN(progressDifference) ? 0 : progressDifference.toFixed(1) + '%',
        criticalIssues: isDelayed 
          ? ["Malzeme tedarik gecikmesi", "Teknik onay süreci uzaması"] 
          : []
      },
      criticalPath: {
        currentPhase: progress <= 10 ? 'Tasarım' :
                    progress <= 30 ? 'Malzeme Tedarik' :
                    progress <= 60 ? 'Üretim' :
                    progress <= 90 ? 'Test' : 'Sevkiyat',
        bottlenecks: isDelayed 
          ? ["Malzeme tedariki", "Teknik çizim onayları"] 
          : ["Standart üretim süreci"],
        dependentTasks: ["Teknik çizim onayı", "Malzeme siparişi", "Üretime başlama", "FAT testi", "Sevkiyat"]
      },
      optimizationSuggestions: {
        resources: [
          "Üretim ekibine 1 kişi takviye yapılması",
          "Tedarikçi ile acil durum toplantısı yapılması",
          "Alternatif malzeme tedarikçilerinin değerlendirilmesi"
        ],
        schedule: [
          "FAT testinin 2 gün öne çekilmesi",
          "Sevkiyat planının yeniden değerlendirilmesi",
          isDelayed ? "Müşteri ile termin tarihi revizyonu görüşülmesi" : "Standart plan takibi"
        ],
        priorities: [
          "Kritik malzeme teslimat takibi",
          "Teknik çizimlerin önceliklendirilmesi",
          "Üretim kapasitesi optimizasyonu"
        ]
      },
      recommendations: [
        isDelayed 
          ? "Müşteri ile iletişime geçilip yeni termin tarihi belirlenmesi" 
          : "Mevcut planın takip edilmesi",
        "Kritik malzemelerin teslimat takibinin günlük yapılması",
        "Üretim sürecinde öncelik verilmesi",
        progressDifference < -10 ? "Fazla mesai planlaması yapılması" : "Standart mesai takibi"
      ]
    };
  }

  /**
   * Predict equipment maintenance needs based on historical data
   * @param {string} equipmentId - Equipment ID to analyze
   * @returns {Promise<Object>} - Maintenance predictions
   */
  async predictMaintenance(equipmentId) {
    try {
      isLoading.value = true;
      
      // Get system data
      const systemData = await this.getSystemData();
      
      // Find specific equipment data (would come from a dedicated store in production)
      const equipmentData = systemData.technical?.find(doc => 
        doc.equipment?.id === equipmentId || doc.id === equipmentId
      );
      
      if (!equipmentData) {
        throw new Error(`Ekipman bulunamadı: ${equipmentId}`);
      }
      
      // Use actual API or mock
      if (API_KEY !== 'demo-key' && !import.meta.env.DEV) {
        const analysisPrompt = `
          Analyze the following equipment data and predict maintenance needs:
          ${JSON.stringify(equipmentData, null, 2)}
          
          Include:
          1. Failure probability in the next 30, 60, and 90 days
          2. Most likely failure components
          3. Recommended maintenance schedule
          4. Cost-benefit analysis of preventive vs. reactive maintenance
          
          Format the response as a JSON object with sections for each category.
        `;
        
        const response = await this.callDeepseekAPI(analysisPrompt, systemData);
        try {
          // Parse JSON response
          return JSON.parse(response);
        } catch (e) {
          // If parsing fails, return as text
          return { analysisText: response };
        }
      } else {
        // Generate mock maintenance prediction
        return this.generateMockMaintenancePrediction(equipmentData);
      }
    } catch (err) {
      logger.error('Predictive maintenance error:', err);
      error.value = `An error occurred while predicting maintenance: ${err.message}`;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * Generate mock maintenance prediction
   * @param {Object} equipmentData - Equipment to analyze
   * @returns {Object} - Mock prediction
   */
  generateMockMaintenancePrediction(equipmentData) {
    // Calculate baseline risk based on age
    const installDate = equipmentData.installDate ? new Date(equipmentData.installDate) : new Date('2023-01-01');
    const now = new Date();
    const ageInMonths = ((now - installDate) / (1000 * 60 * 60 * 24 * 30));
    
    // Baseline risk increases with age
    const baselineRisk = Math.min(0.8, ageInMonths * 0.015);
    
    // Mock operating hours (assume 8 hours per day since installation)
    const operatingHours = Math.floor(ageInMonths * 30 * 8);
    
    return {
      equipmentInfo: {
        id: equipmentData.id || 'unknown',
        name: equipmentData.name || 'Bilinmeyen Ekipman',
        type: equipmentData.type || 'Bilinmeyen Tip',
        location: equipmentData.location || 'Belirtilmemiş',
        installDate: equipmentData.installDate || 'Belirtilmemiş',
        operatingHours: operatingHours
      },
      failureProbability: {
        next30Days: Math.min(95, Math.round(baselineRisk * 100 * 0.7)),
        next60Days: Math.min(95, Math.round(baselineRisk * 100 * 1.5)),
        next90Days: Math.min(95, Math.round(baselineRisk * 100 * 2.3))
      },
      likelyFailureComponents: [
        {
          component: "Motor Rulmanı",
          probability: Math.min(95, Math.round(baselineRisk * 100 * 1.2)),
          estimatedReplacementCost: 3500
        },
        {
          component: "Kontrol Paneli",
          probability: Math.min(95, Math.round(baselineRisk * 100 * 0.8)),
          estimatedReplacementCost: 5200
        },
        {
          component: "Güç Kaynağı",
          probability: Math.min(95, Math.round(baselineRisk * 100 * 0.6)),
          estimatedReplacementCost: 2800
        }
      ],
      recommendedMaintenance: {
        nextServiceDate: new Date(now.setDate(now.getDate() + 30)).toISOString().split('T')[0],
        maintenanceActions: [
          "Motor rulmanlarının kontrol edilmesi ve gerekiyorsa değiştirilmesi",
          "Kontrol paneli bağlantılarının sıkılması ve test edilmesi",
          "Güç kaynağı diagnostiği yapılması",
          "Tüm yağlama noktalarının kontrolü"
        ],
        estimatedServiceTime: "4 saat",
        estimatedServiceCost: 2200
      },
      costBenefitAnalysis: {
        preventiveMaintenance: {
          cost: 2200,
          riskReduction: "%75",
          productionContinuity: "Yüksek"
        },
        reactiveMaintenance: {
          estimatedDowntime: "2-5 gün",
          estimatedCost: 9500,
          productionLoss: "Yaklaşık 120 birim"
        },
        recommendation: "Önleyici bakım ekonomik olarak avantajlıdır. Reaktif bakım senaryosunda üretim kaybı ve ekipman değişim maliyetleri toplam maliyeti 4-5 kat artıracaktır."
      }
    };
  }

  /**
   * Get conversation history for API context
   * @returns {Array} - Formatted conversation history
   */
  getConversationHistoryForAPI() {
    return this.conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Collect system data from stores
   * @returns {Object} - System data
   */
  async getSystemData() {
    try {
      // Get store instances
      const ordersStore = useOrders();
      const inventoryStore = useStockManagement(); // Corrected function call
      const technicalStore = useTechnicalStore();
      
      // Collect data from stores (Ensure properties like activeOrders exist on the stores)
      // Note: useOrders composable returns 'orders' ref, not 'activeOrders'. Adjusting accordingly.
      // Also check properties returned by useInventoryStore and useTechnicalStore.
      const systemData = {
        orders: ordersStore.orders.value || [], // Adjusted to use the 'orders' ref from useOrders
        // TODO: Determine correct source for general materials list from inventory composables (e.g., useMaterials or aggregate data)
        materials: [], // Placeholder: useStockManagement doesn't directly provide a simple 'materialsList'
        technical: technicalStore.technicalDocuments || [], // Verify 'technicalDocuments' exists on useTechnicalStore result
        stats: {
          totalOrders: ordersStore.totalOrderCount.value || 0, // Adjusted to use 'totalOrderCount' ref
          // Assuming delayedOrders, criticalMaterials, productionEfficiency might need adjustments based on store content
          delayedOrders: ordersStore.orders.value.filter(o => o.status === 'delayed').length || 0, // Example calculation
          // TODO: Update criticalMaterials calculation based on the actual source of materials data
          criticalMaterials: 0, // Placeholder: Needs actual source from inventory composables
          productionEfficiency: 78 // Placeholder - Needs actual source from a store/composable
        }
      };
      
      return systemData;
    } catch (error) {
      logger.error('Error collecting system data:', error);
      // Provide default structure on error
      return {
        orders: [],
        materials: [],
        technical: [],
        stats: {
          totalOrders: 0,
          delayedOrders: 0,
          criticalMaterials: 0,
          productionEfficiency: 0
        }
      };
    }
  }

  /**
   * Send request to DeepSeek API
   * @param {string} question - User question
   * @param {Object} systemData - System data
   * @returns {Promise<string>} - API response
   */
  async callDeepseekAPI(question, systemData) {
    try {
      // Create system content
      const systemContent = `
        You are an industrial production assistant. You work in the "MehmetEndüstriyelTakip" software.
        You are used for a factory that produces medium voltage cells.
        The factory manufactures medium voltage switchgear equipment.
        Cell types produced: CB (Circuit Breaker), LB (Load Break), FL (Fused), RMU (Ring Main Unit).
        
        You can answer questions based on the following system data:
        ${JSON.stringify(systemData, null, 2)}
        
        Your answers should be short, clear and professional. Do not guess about topics you don't know.
        For command prompts (order creation, editing, etc.), respond with "You need to use the relevant menu to perform this operation."
      `;

      // Get conversation history
      let messages = [
        {
          role: 'system',
          content: systemContent
        }
      ];
      
      // Add recent conversation history (limited)
      const historyMessages = this.getConversationHistoryForAPI().slice(-6);
      messages = [...messages, ...historyMessages];
      
      // Add current question if not in history
      if (!historyMessages.some(msg => msg.role === 'user' && msg.content === question)) {
        messages.push({
          role: 'user',
          content: question
        });
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.modelConfig.modelName,
          messages: messages,
          temperature: this.modelConfig.temperature,
          max_tokens: this.modelConfig.maxTokens
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error('DeepSeek API error:', errorData);
        throw new Error('API response error: ' + response.status);
      }

      const data = await response.json();
      return data.choices[0].message.content;
      
    } catch (err) {
      logger.error('DeepSeek API call error:', err);
      throw err;
    }
  }

  /**
   * Generate mock AI response (until real API connection is established)
   * @param {string} question - User question
   * @param {Object} systemData - System data
   * @returns {string} - Generated mock response
   */
  generateMockResponse(question, systemData) {
    const lowerQuestion = question.toLowerCase();
    
    // Check for context in conversation history
    const context = this.getContextFromHistory();
    
    // Orders related questions
    if (lowerQuestion.includes('sipariş') || lowerQuestion.includes('order')) {
      if (lowerQuestion.includes('geciken') || lowerQuestion.includes('gecikme')) {
        const delayedOrders = systemData.orders.filter(order => order.status === 'Gecikiyor');
        
        if (delayedOrders.length > 0) {
          return `Sistemde geciken ${delayedOrders.length} sipariş bulunmaktadır:\n\n${
            delayedOrders.map(order => `- ${order.id} no'lu ${order.customer} firmasına ait ${order.cellType} hücresi (İlerleme: %${order.progress})`).join('\n')
          }`;
        }
        return 'Şu anda geciken sipariş bulunmamaktadır.';
      }
      
      if (lowerQuestion.includes('devam eden') || lowerQuestion.includes('üretim')) {
        const inProgressOrders = systemData.orders.filter(order => order.status === 'Devam Ediyor');
        
        if (inProgressOrders.length > 0) {
          return `Şu anda üretimi devam eden ${inProgressOrders.length} sipariş bulunmaktadır:\n\n${
            inProgressOrders.map(order => `- ${order.id} - ${order.customer} - ${order.cellType} (İlerleme: %${order.progress})`).join('\n')
          }`;
        }
        return 'Şu anda üretimi devam eden sipariş bulunmamaktadır.';
      }

      if (lowerQuestion.match(/\b#?\d{4}-\d{4}\b/) || lowerQuestion.match(/\b#?\d{4}-\d{3}\b/)) {
        // Order number query
        const orderIdMatch = lowerQuestion.match(/\b#?(\d{4}-\d{4})\b/) || lowerQuestion.match(/\b#?(\d{4}-\d{3})\b/);
        if (orderIdMatch) {
          const orderId = orderIdMatch[0].startsWith('#') ? orderIdMatch[0] : `#${orderIdMatch[0]}`;
          const order = systemData.orders.find(o => o.id === orderId);
          
          if (order) {
            return `${order.id} no'lu sipariş bilgileri:\n\nMüşteri: ${order.customer}\nHücre Tipi: ${order.cellType}\nDurum: ${order.status}\nİlerleme: %${order.progress}\n\nÜretim aşamaları:\n- Tasarım: ${order.progress > 10 ? '✓ Tamamlandı' : '○ Bekliyor'}\n- Malzeme: ${order.progress > 30 ? '✓ Tamamlandı' : '○ Bekliyor'}\n- Mekanik Üretim: ${order.progress > 50 ? '✓ Tamamlandı' : '○ Bekliyor'}\n- Montaj: ${order.progress > 70 ? '✓ Tamamlandı' : '○ Bekliyor'}\n- Test: ${order.progress > 90 ? '✓ Tamamlandı' : '○ Bekliyor'}`;
          }
          return `${orderId} numaralı sipariş bulunamadı.`;
        }
      }
      
      // General order query
      return `Sistemde toplam ${systemData.orders.length} aktif sipariş bulunmaktadır. ${
        systemData.orders.filter(o => o.status === 'Gecikiyor').length
      } sipariş gecikmiş durumda, ${
        systemData.orders.filter(o => o.status === 'Devam Ediyor').length
      } sipariş devam ediyor, ${
        systemData.orders.filter(o => o.status === 'Planlandı').length
      } sipariş ise henüz planlanma aşamasında. Detaylı bilgi için "siparişler" sayfasını inceleyebilirsiniz.`;
    }
    
    // Material queries
    if (lowerQuestion.includes('malzeme') || lowerQuestion.includes('stok') || lowerQuestion.includes('material')) {
      if (lowerQuestion.includes('kritik') || lowerQuestion.includes('acil')) {
        const criticalMaterials = systemData.materials.filter(mat => mat.status === 'Kritik');
        
        if (criticalMaterials.length > 0) {
          return `Kritik seviyede olan malzemeler:\n\n${
            criticalMaterials.map(mat => `- ${mat.name} (Stok: ${mat.stock}, İhtiyaç: ${mat.required})`).join('\n')
          }`;
        }
        return 'Şu anda kritik seviyede malzeme bulunmamaktadır.';
      }
      
      if (lowerQuestion.includes('röle') || lowerQuestion.includes('role') || lowerQuestion.includes('siemens')) {
        const roleResults = systemData.materials.filter(mat => 
          mat.name.toLowerCase().includes('siemens') || 
          mat.name.toLowerCase().includes('röle') || 
          mat.name.toLowerCase().includes('role'));
          
        if (roleResults.length > 0) {
          return `Röle ile ilgili malzeme sonuçları:\n\n${
            roleResults.map(mat => `- ${mat.name} (Stok: ${mat.stock}, Durum: ${mat.status})`).join('\n')
          }`;
        }
        return 'Röle ile ilgili sonuç bulunamadı.';
      }
      
      // General materials query
      return `Sistemde toplam ${systemData.materials.length} farklı malzeme kaydı bulunmaktadır. ${
        systemData.materials.filter(m => m.status === 'Kritik').length
      } malzeme kritik seviyede, ${
        systemData.materials.filter(m => m.status === 'Sipariş Edildi').length
      } malzeme sipariş edilmiş durumda. Detaylı bilgi için "Stok Yönetimi" sayfasını inceleyebilirsiniz.`;
    }
    
    // Technical document queries
    if (lowerQuestion.includes('teknik') || lowerQuestion.includes('doküman') || lowerQuestion.includes('belge') || lowerQuestion.includes('çizim')) {
      if (lowerQuestion.includes('cb') || lowerQuestion.includes('kesici')) {
        return 'CB tipi hücreler için teknik belgeler:\n\n- CB Teknik Şartname\n- CB Montaj Talimatları\n- CB Test Prosedürü\n- CB CAD Çizimleri\n\nBelgelere erişmek için "Teknik Belgeler > CB Dokümanları" menüsünü kullanabilirsiniz.';
      }
      
      if (lowerQuestion.includes('lb') || lowerQuestion.includes('yük')) {
        return 'LB tipi hücreler için teknik belgeler:\n\n- LB Teknik Şartname\n- LB Montaj Talimatları\n- LB Test Prosedürü\n- LB CAD Çizimleri\n\nBelgelere erişmek için "Teknik Belgeler > LB Dokümanları" menüsünü kullanabilirsiniz.';
      }
      
      // General technical documents response
      return 'Teknik belgeler modülünde aşağıdaki kategorilerde dokümanlar bulabilirsiniz:\n\n- CB Dokümanları\n- LB Dokümanları\n- FL Dokümanları\n- RMU Dokümanları\n- Test Raporları\n- Sertifikalar\n- CAD Çizimleri\n\nİlgili dokümanlara erişmek için sol menüdeki "Teknik Belgeler" bölümünü kullanabilirsiniz.';
    }
    
    // Dashboard summary
    if (lowerQuestion.includes('özet') || lowerQuestion.includes('dashboard') || lowerQuestion.includes('gösterge')) {
      return `Günlük üretim özeti (${new Date().toLocaleDateString('tr-TR')}):\n\n- Toplam Aktif Sipariş: ${systemData.stats.totalOrders || 0}\n- Geciken Siparişler: ${systemData.stats.delayedOrders || 0}\n- Kritik Malzemeler: ${systemData.stats.criticalMaterials || 0}\n- Üretim Verimliliği: %${systemData.stats.productionEfficiency || 0}\n\nDetaylı bilgi için Dashboard sayfasını inceleyebilirsiniz.`;
    }
    
    // Help menu
    if (lowerQuestion.includes('yardım') || lowerQuestion.includes('ne yapabilir') || lowerQuestion.includes('nasıl kullan')) {
      return 'Size nasıl yardımcı olabilirim:\n\n• Siparişler hakkında bilgi verebilirim (örn. "Geciken siparişler hangileri?")\n• Stok ve malzeme durumunu kontrol edebilirim (örn. "Kritik malzeme var mı?")\n• Teknik belgeler hakkında bilgi verebilirim (örn. "CB teknik belgeleri neler?")\n• Günlük üretim özeti sunabilirim (örn. "Günlük üretim özeti")\n\nSpesifik bir sipariş veya malzeme hakkında bilgi almak için ID veya isim belirterek sorabilirsiniz.';
    }
    
    // Generic fallback response
    return context + 'Üzgünüm, bu konuda spesifik bir bilgim yok. Siparişler, malzemeler veya teknik belgeler hakkında sorular sorabilirsiniz. Size nasıl yardımcı olabileceğim konusunda daha fazla bilgi için "yardım" yazabilirsiniz.';
  }

  /**
   * Get context from conversation history
   * @returns {string} - Context string
   */
  getContextFromHistory() {
    // If there's previous conversation, add some context
    if (this.conversationHistory.length > 2) {
      const lastAssistantMessage = [...this.conversationHistory]
        .reverse()
        .find(msg => msg.role === 'assistant');
      
      if (lastAssistantMessage) {
        // Extract topic from last message
        const topics = {
          sipariş: 'siparişler',
          malzeme: 'malzeme ve stok',
          teknik: 'teknik belgeler',
          özet: 'üretim özeti'
        };
        
        for (const [keyword, topic] of Object.entries(topics)) {
          if (lastAssistantMessage.content.toLowerCase().includes(keyword)) {
            return `${topic} hakkında konuşmaya devam ediyoruz. `;
          }
        }
      }
    }
    return '';
  }
}

// Create and export singleton instance
export const aiService = new AIService();