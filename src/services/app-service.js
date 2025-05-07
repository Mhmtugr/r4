/**
 * Uygulama Servis Modülü
 * Uygulamanın başlatılması, bileşenlerin yüklenmesi ve 
 * yaşam döngüsü yönetimi için temel işlevleri içerir
 */

// Firebase ve Authentication servisleri
import { initializeFirebase, isFirebaseAvailable } from '@/services/firebase-service.js';

// Router
import { Router } from '@/router/index.js';

// Bileşenler
import { AppShell } from '@/components/app/AppShell.js';
import { Sidebar } from '@/components/app/Sidebar.js';
import { Header } from '@/components/app/Header.js';
import { ChatbotButton } from '@/components/app/ChatbotButton.js';

// Event bus
import { eventBus } from '@/utils/event-bus.js';
import { Logger } from '@/utils/logger.js';

// Singleton logger instance
const logger = new Logger('AppService');

// Uygulama durumu
let appState = {
  isInitialized: false,
  isLoading: false,
  isAuthenticated: false,
  user: null,
  config: null,
  currentView: null,
  error: null
};

/**
 * Uygulamayı başlat
 * @param {Object} config - Uygulama konfigürasyonu
 * @returns {Promise<boolean>} Başarılı olup olmadığını döndürür
 */
export async function initializeApp(config) {
  try {
    logger.info('Uygulama başlatılıyor...');
    appState.isLoading = true;
    appState.config = config;
    
    // Demo mod kontrolü
    const isDemoMode = config.useDemoMode;
    
    if (isDemoMode) {
      logger.info('Demo mod aktif');
      showDemoModeNotification();
    }
    
    // Firebase başlatma
    if (!isDemoMode && isFirebaseAvailable()) {
      try {
        await initializeFirebase(config.firebase);
      } catch (error) {
        logger.error('Firebase başlatılamadı, demo moda geçiliyor', error);
        appState.config.useDemoMode = true;
        showDemoModeNotification();
      }
    }
    
    // Bileşenleri başlat
    await initializeComponents();
    
    // Router'ı başlat
    const router = new Router();
    router.initialize();
    
    // Event listener'ları ekle
    setupEventListeners();
    
    // Başarıyla başlatıldı
    appState.isInitialized = true;
    appState.isLoading = false;
    
    // Event yayınla
    eventBus.emit('app:initialized', appState);
    
    return true;
  } catch (error) {
    logger.error('Uygulama başlatma hatası', error);
    appState.isLoading = false;
    appState.error = error;
    
    // Event yayınla
    eventBus.emit('app:error', error);
    
    return false;
  }
}

/**
 * Uygulama bileşenlerini başlat
 */
async function initializeComponents() {
  logger.debug('Bileşenler başlatılıyor');
  
  // App shell
  const appElement = document.getElementById('app');
  if (appElement) {
    // AppShell bileşeni
    const appShell = new AppShell();
    appElement.innerHTML = '';
    appElement.appendChild(appShell.render());
    
    // Sidebar bileşeni
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
      const sidebar = new Sidebar();
      sidebarContainer.appendChild(sidebar.render());
    }
    
    // Header bileşeni
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
      const header = new Header();
      headerContainer.appendChild(header.render());
    }
    
    // ChatbotButton bileşeni
    const chatbotContainer = document.getElementById('ai-chatbot-container');
    if (chatbotContainer) {
      const chatbotButton = new ChatbotButton();
      chatbotContainer.appendChild(chatbotButton.render());
    }
  }
}

/**
 * Event listener'ları ayarla
 */
function setupEventListeners() {
  logger.debug('Event listener\'lar ayarlanıyor');
  
  // Auth durumu değiştiğinde
  eventBus.on('auth:changed', (user) => {
    appState.isAuthenticated = !!user;
    appState.user = user;
    
    // Duruma göre içeriği göster/gizle
    if (user) {
      showMainApp();
    } else {
      showLogin();
    }
    
    logger.info('Auth durumu değişti', { isAuthenticated: appState.isAuthenticated });
  });
  
  // Görünüm değiştiğinde
  eventBus.on('view:changed', (view) => {
    appState.currentView = view;
    logger.debug('Görünüm değişti', { view });
  });
}

/**
 * Ana uygulamayı göster
 */
function showMainApp() {
  const loginPage = document.getElementById('login-page');
  const mainApp = document.getElementById('main-app');
  
  if (loginPage) loginPage.classList.add('hidden');
  if (mainApp) mainApp.classList.remove('hidden');
  
  logger.debug('Ana uygulama gösteriliyor');
}

/**
 * Login sayfasını göster
 */
function showLogin() {
  const loginPage = document.getElementById('login-page');
  const mainApp = document.getElementById('main-app');
  
  if (mainApp) mainApp.classList.add('hidden');
  if (loginPage) loginPage.classList.remove('hidden');
  
  logger.debug('Login sayfası gösteriliyor');
}

/**
 * Demo modu bildirimini göster
 */
function showDemoModeNotification() {
  // Daha sonra toast bileşeni ile bildirim gösterilecek
  logger.info('Demo mod bildirimi gösteriliyor');
  
  // Geçici çözüm - Basit bir toast oluştur
  const toast = document.createElement('div');
  toast.className = 'toast show position-fixed bottom-0 end-0 m-3';
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="toast-header bg-info text-white">
      <strong class="me-auto">Demo Modu</strong>
      <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
    </div>
    <div class="toast-body">
      Uygulama demo modunda çalışıyor. Bazı özellikler sınırlı olabilir.
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // 5 saniye sonra kaldır
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 500);
  }, 5000);
}

/**
 * Mevcut uygulama durumunu getir
 * @returns {Object} Uygulama durumu
 */
export function getAppState() {
  return {...appState};
}

/**
 * Uygulamanın başlatıldığını doğrula
 * @returns {boolean} Uygulama başlatıldı mı
 */
export function isAppInitialized() {
  return appState.isInitialized;
}

/**
 * Uygulama servislerini başlatan yardımcı fonksiyon
 */
export function initializeAppServices() {
  try {
    console.log('Uygulama servisleri başlatılıyor...');
    // Firebase veya diğer servisler burada başlatılabilir
    
    return true;
  } catch (error) {
    console.error('Servis başlatma hatası:', error);
    return false;
  }
}