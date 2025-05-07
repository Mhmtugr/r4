/**
 * App Shell Component
 * Uygulamanın ana iskeletini oluşturan temel bileşen
 */

import { Logger } from '@/utils/logger.js';

// Logger instance
const logger = new Logger('AppShell');

/**
 * AppShell sınıfı - Ana uygulama iskeletini oluşturan komponent
 */
export class AppShell {
  constructor() {
    this.sidebarCollapsed = false;
    logger.debug('AppShell oluşturuldu');
  }

  /**
   * Yan menüyü aç/kapat
   * @returns {void}
   */
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    document.body.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
    
    // LocalStorage'da kullanıcı tercihini saklayın
    localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed);
    
    logger.debug(`Sidebar ${this.sidebarCollapsed ? 'kapatıldı' : 'açıldı'}`);
  }

  /**
   * Kaydedilmiş sidebar durumunu yükle
   * @returns {void}
   */
  loadSavedState() {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      this.sidebarCollapsed = savedState === 'true';
      document.body.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
    }
  }

  /**
   * Olay dinleyicilerini ekle
   * @returns {void}
   */
  setupEventListeners() {
    // Sidebar toggle butonu için olay dinleyicisi ekle
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleSidebar());
    }

    // Ekran boyutu değiştiğinde sidebar davranışını ayarla
    window.addEventListener('resize', () => {
      if (window.innerWidth < 768 && !this.sidebarCollapsed) {
        this.sidebarCollapsed = true;
        document.body.classList.add('sidebar-collapsed');
      }
    });

    // İlk yükleme için kontrol
    if (window.innerWidth < 768) {
      this.sidebarCollapsed = true;
      document.body.classList.add('sidebar-collapsed');
    }
  }

  /**
   * App Shell bileşenini render et
   * @returns {HTMLElement} DOM elementi
   */
  render() {
    logger.debug('AppShell render ediliyor');
    
    const appShell = document.createElement('div');
    appShell.className = 'app-shell';
    
    appShell.innerHTML = `
      <div class="app-container">
        <div id="sidebar-container"></div>
        <div class="main-container">
          <div id="header-container"></div>
          <main id="main-content" class="main-content"></main>
        </div>
      </div>
      
      <!-- Loading Overlay -->
      <div id="loading-overlay" class="loading-overlay d-none">
        <div class="spinner"></div>
        <p>Yükleniyor...</p>
      </div>
      
      <!-- AI Chatbot Container -->
      <div id="ai-chatbot-container"></div>
    `;
    
    // Kaydedilmiş durumu yükle
    this.loadSavedState();
    
    // Olay dinleyicilerini ekle (DOM yüklendikten sonra)
    setTimeout(() => {
      this.setupEventListeners();
    }, 0);
    
    return appShell;
  }
}

export default AppShell;