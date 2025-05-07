/**
 * MehmetEndustriyelTakip AI Konfigürasyon Dosyası
 * Bu dosya, uygulamanın yapay zeka bileşenlerini yapılandırmak için kullanılır.
 */

const aiConfig = {
  // Kullanılacak API türü: 'openrouter', 'gemini', 'firebase-ml', 'openai', 'local' veya 'demo'
  provider: 'auto', // 'auto': API anahtarına göre otomatik seçim yapar
  
  // OpenRouter API konfigürasyonu (öncelikli)
  openrouter: {
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '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',
    apiUrl: 'https://openrouter.ai/api/v1',
    models: {
      primary: 'google/gemini-2.5-pro-exp-03-25', // Görselleri de destekleyen ana model
      advanced: 'google/gemini-2.5-pro-exp-03-25', // Aynı model daha yüksek token limiti için
      fallback: 'anthropic/claude-3-haiku', // Yedek model (hızlı ve ekonomik)
    },
    defaultOptions: {
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.8,
      top_k: 40
    },
    // OpenRouter için site bilgileri (istatistikler için)
    referer: 'https://mehmetendustriyel.com',
    siteTitle: 'MehmetEndustriyelTakip'
  },
  
  // Gemini API konfigürasyonu (ikincil)
  gemini: {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    modelName: 'gemini-1.5-pro-latest',
    defaultOptions: {
      temperature: 0.7,
      maxOutputTokens: 2048,
      topP: 0.8,
      topK: 40
    }
  },
  
  // Firebase ML konfigürasyonu
  firebaseML: {
    enabled: true,
    modelPath: 'ml-models',
    localModelCache: true,
    customModels: {
      orderAnalysis: 'order-analysis-v1',
      productionOptimization: 'production-opt-v1',
      inventoryPrediction: 'inventory-pred-v1'
    }
  },
  
  // Demo modu konfigürasyonu
  demo: {
    enabled: true, // API anahtarı yoksa demo mod kullanılır
    responseDelay: {
      min: 800,  // Minimum yanıt süresi (ms)
      max: 2000  // Maksimum yanıt süresi (ms)
    },
    simulateErrors: false  // Rastgele hatalar simüle edilsin mi?
  },
  
  // AI özellikleri konfigürasyonu
  features: {
    chatbot: {
      enabled: true,
      contextWindow: 10,  // Kaç mesaj hatırlansın
      systemPrompt: 'Sen MehmetEndustriyelTakip sisteminin bir parçası olan üretim asistanısın. Orta gerilim anahtarlama ekipmanı üreten bir fabrikada çalışıyorsun. Kullanıcı sorularına profesyonel, net ve yardımcı yanıtlar vermelisin.'
    },
    orderAnalysis: {
      enabled: true,
      defaultDepth: 'medium',  // 'basic', 'medium', 'deep'
    },
    productionOptimization: {
      enabled: true,
      includeHistoricalData: true,
      lookbackPeriod: 90  // gün cinsinden
    },
    stockPrediction: {
      enabled: true,
      alertThreshold: 0.15  // %15 altına düşünce uyarı ver
    }
  },
  
  // Kullanıcı arayüzü ayarları
  ui: {
    showModelName: true,
    showConfidenceScore: true,
    chatbotPosition: 'bottom-right'
  }
};

export default aiConfig;