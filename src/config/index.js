/**
 * Uygulama Yapılandırması
 * Varsayılan değerleri ve .env dosyalarından gelen değerleri birleştirir.
 */

// Varsayılan yapılandırma değerleri
const defaults = {
  appName: "MehmetEndüstriyelTakip",
  version: "2.1.0", // Sürüm güncellendi
  apiUrl: '/api', 
  useLocalStorage: true,
  debugMode: import.meta.env.DEV, 

  // AI Yapılandırması (ai-config.js'den gelenler öncelikli olacak)
  ai: {
    enabled: true,
    activeService: 'auto', // 'auto', 'gemini', 'openRouter', 'demo'
    systemPrompt: `Sen MehmetEndüstriyelTakip sisteminin yapay zeka asistanısın.
                   Orta Gerilim Hücre Üretim Takip Sistemi hakkında uzman bir asistan olarak görev yapıyorsun.
                   Her zaman doğru, net ve teknik bilgileri içeren yanıtlar vermelisin.
                   Sistemdeki sipariş durumları, malzeme stokları ve teknik dokümantasyon hakkında detaylı bilgi sahibisin.
                   Eğer sorular net değilse, daha net bilgi iste ve kullanıcıyı yönlendir.`,
    
    // Gemini özel ayarları (ai-service.js bunları kullanacak)
    geminiApiKey: null, 
    geminiApiUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    modelName: 'gemini-1.5-pro', // ai-service.js içinde 'gemini-1.5-pro-latest' idi, tutarlılık için güncellendi.
    geminiGenerationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048, 
        topP: 0.8,
        topK: 40,
    },
    geminiSafetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],

    // OpenRouter özel ayarları (ai-service.js bunları kullanacak)
    openRouterApiKey: null,
    openRouterApiUrl: 'https://openrouter.ai/api/v1',
    openRouterDefaultModels: {
      chat: 'openai/gpt-3.5-turbo', 
      instruct: 'google/gemini-flash-1.5',
    },
    openRouterGenerationConfig: { // ai-service.js'de kullanılan parametreler eklendi
        temperature: 0.7,
        maxTokens: 2048,
        topP: 0.8,
    },
    openRouterSiteUrl: 'https://mehmetendustriyel.com', // ai-config.js'den alındı
    openRouterAppName: 'MehmetEndustriyelTakip', // ai-config.js'den alındı

    // Kullanıcıya sunulacak AI modelleri
    availableModels: {
      'gemini-1.5-flash': {
        key: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        service: 'gemini',
        capabilities: ['Genel Sohbet', 'Hızlı Yanıt'],
        description: 'Google tarafından geliştirilen hızlı ve verimli model.',
        isDefault: true, // Bu model varsayılan olarak seçilsin mi?
      },
      'google/gemini-2.5-pro-exp-03-25': {
        key: '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',
        name: 'google/gemini-2.5-pro-exp-03-25',
        service: 'gemini',
        capabilities: ['Detaylı Analiz', 'Uzun Metinler'],
        description: 'Google tarafından geliştirilen daha kapsamlı ve güçlü model.',
      },
      'openrouter-gpt3.5-turbo': {
        key: 'openrouter-gpt3.5-turbo',
        name: 'GPT-3.5 Turbo (OpenRouter)',
        service: 'openRouter',
        modelId: 'openai/gpt-3.5-turbo', // OpenRouter için model ID'si
        capabilities: ['Genel Sohbet', 'Popüler Model'],
        description: 'OpenAI'nin popüler ve dengeli modeli (OpenRouter üzerinden).',
      },
      'openrouter-gemini-flash': {
        key: 'openrouter-gemini-flash',
        name: 'Gemini Flash (OpenRouter)',
        service: 'openRouter',
        modelId: 'google/gemini-flash-1.5',
        capabilities: ['Hızlı Yanıt', 'Google Kalitesi'],
        description: 'Google Gemini Flash modeli (OpenRouter üzerinden).',
      },
    },
    defaultModelKey: import.meta.env.VITE_AI_DEFAULT_MODEL_KEY || 'gemini-1.5-flash', // Yukarıdaki availableModels'dan bir key
  },

  firebase: {
    apiKey: null,          
    authDomain: null,      
    projectId: null,       
    storageBucket: null,   
    messagingSenderId: null,
    appId: null,           
    measurementId: null    
  },

  log: {
    level: import.meta.env.PROD ? 'WARN' : 'DEBUG', 
    enableConsole: true,
    enableMemory: !import.meta.env.PROD,
    maxMemoryEntries: 500,
    remote: {
        enabled: false,
        url: null,
        level: 'WARN'
    }
  },
  
  useDemoMode: import.meta.env.DEV 
};

// .env ve ai-config.js dosyasından gelen değerleri oku ve birleştir
// ai-config.js içeriği burada doğrudan kullanılmayacak, çünkü ai-service.js zaten kendi içinde yönetiyor.
// Ancak bazı temel ayarlar .env üzerinden okunabilir.

const config = {
  ...defaults,
  environment: import.meta.env.MODE || 'development',
  apiUrl: import.meta.env.VITE_API_URL || defaults.apiUrl,
  debugMode: import.meta.env.VITE_DEBUG_MODE === 'true' || defaults.debugMode,
  useDemoMode: import.meta.env.VITE_DEMO_MODE === 'true' || defaults.useDemoMode,
  
  ai: {
      ...defaults.ai,
      activeService: import.meta.env.VITE_AI_ACTIVE_SERVICE || defaults.ai.activeService,
      geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || defaults.ai.geminiApiKey,
      geminiApiUrl: import.meta.env.VITE_GEMINI_API_URL || defaults.ai.geminiApiUrl,
      modelName: import.meta.env.VITE_AI_MODEL_NAME || defaults.ai.modelName, 
      openRouterApiKey: import.meta.env.VITE_OPENROUTER_API_KEY || defaults.ai.openRouterApiKey,
      openRouterApiUrl: import.meta.env.VITE_OPENROUTER_API_URL || defaults.ai.openRouterApiUrl,
      defaultModelKey: import.meta.env.VITE_AI_DEFAULT_MODEL_KEY || defaults.ai.defaultModelKey,
      availableModels: defaults.ai.availableModels,
  },
  
  firebase: {
      ...defaults.firebase,
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaults.firebase.apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaults.firebase.authDomain,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaults.firebase.projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaults.firebase.storageBucket,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaults.firebase.messagingSenderId,
      appId: import.meta.env.VITE_FIREBASE_APP_ID || defaults.firebase.appId,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || defaults.firebase.measurementId,
  },
  
  log: {
    ...defaults.log,
    level: import.meta.env.VITE_LOG_LEVEL || defaults.log.level,
    remote: {
        ...defaults.log.remote,
        enabled: import.meta.env.VITE_REMOTE_LOGGING_ENABLED === 'true' || defaults.log.remote.enabled,
        url: import.meta.env.VITE_REMOTE_LOGGING_URL || defaults.log.remote.url,
        level: import.meta.env.VITE_REMOTE_LOGGING_LEVEL || defaults.log.remote.level,
    }
  }
};

export default config;