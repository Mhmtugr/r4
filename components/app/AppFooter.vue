<template>
  <footer class="app-footer">
    <div class="container-fluid">
      <div class="row align-items-center">
        <div class="col-md-4">
          <div class="footer-branding">
            <img src="@/assets/images/sample-image.jpg" alt="METS Logo" class="footer-logo" />
            <div class="footer-brand-text">
              <h5>METS</h5>
              <span>MehmetEndüstriyelTakip Sistemi</span>
            </div>
          </div>
        </div>
        
        <div class="col-md-4 text-center">
          <div class="footer-links">
            <a href="#" @click.prevent="showAboutModal">Hakkımızda</a>
            <a href="#" @click.prevent="showPrivacyPolicy">Gizlilik Politikası</a>
            <router-link to="/help">Yardım</router-link>
            <router-link to="/contact">İletişim</router-link>
          </div>
        </div>
        
        <div class="col-md-4 text-md-end">
          <div class="footer-info">
            <p class="copy">&copy; {{ currentYear }} METS</p>
            <div class="version-info">
              <span class="version">v{{ appVersion }}</span>
              <button class="system-info-btn" @click="showSystemInfo" title="Sistem Bilgisi">
                <i class="bi bi-info-circle"></i> Sistem Bilgisi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useIntegrationStore } from '@/store/integration';
import { useNotificationStore } from '@/store/notification';

// Store
const integrationStore = useIntegrationStore();
const notificationStore = useNotificationStore();

// State
const appVersion = ref('2.0.0');
const currentYear = computed(() => new Date().getFullYear());

// Methods
const showSystemInfo = () => {
  const systemInfo = {
    version: appVersion.value,
    nodeEnv: import.meta.env.MODE || 'production',
    buildDate: window.__BUILD_DATE__ || new Date().toLocaleDateString('tr-TR'),
    services: integrationStore.serviceStatus || {},
    browser: navigator.userAgent
  };
  
  notificationStore.showModal({
    title: 'Sistem Bilgisi',
    content: `
      <div class="system-info">
        <p><strong>Versiyon:</strong> ${systemInfo.version}</p>
        <p><strong>Ortam:</strong> ${systemInfo.nodeEnv}</p>
        <p><strong>Derleme Tarihi:</strong> ${systemInfo.buildDate}</p>
        <p><strong>Tarayıcı:</strong> ${systemInfo.browser}</p>
        <p><strong>Servis Durumları:</strong></p>
        <ul>
          ${Object.entries(systemInfo.services).map(([key, value]) => `
            <li>${key}: <span class="badge bg-${value.status === 'connected' ? 'success' : (value.status === 'error' ? 'danger' : 'warning')}">${value.status}</span></li>
          `).join('')}
        </ul>
      </div>
    `,
    type: 'info'
  });
};

const showAboutModal = () => {
  notificationStore.showModal({
    title: 'METS Hakkında',
    content: `
      <div class="about-info">
        <p>METS (MehmetEndüstriyelTakip Sistemi), orta gerilim hücre imalatı için geliştirilmiş kapsamlı bir takip ve yönetim sistemidir.</p>
        <p>Bu sistem ile siparişlerinizin takibi, üretim planlaması, malzeme yönetimi ve teknik veri takibi yapabilirsiniz.</p>
        <p>2021 yılından bu yana hizmet vermektedir.</p>
      </div>
    `,
    type: 'info'
  });
};

const showPrivacyPolicy = () => {
  notificationStore.showModal({
    title: 'Gizlilik Politikası',
    content: `
      <div class="privacy-policy">
        <h5>Veri Kullanımı</h5>
        <p>METS uygulaması içinde girilen tüm veriler, kullanıcıların izni olmadan üçüncü şahıslarla paylaşılmaz.</p>
        <h5>Çerezler</h5>
        <p>Bu uygulama, daha iyi bir deneyim sağlamak için çerezleri kullanmaktadır.</p>
        <h5>Güvenlik</h5>
        <p>Tüm veriler şifreli bir şekilde saklanır ve aktarılır.</p>
      </div>
    `,
    type: 'info'
  });
};
</script>

<style lang="scss">
@use "@/styles/base/variables" as vars;

.app-footer {
  background-color: var(--card-bg);
  color: var(--text-color);
  padding: 1.5rem 0;
  font-size: 0.9rem;
  border-top: 1px solid var(--border-color);
  margin-top: auto;

  .footer-branding {
    display: flex;
    align-items: center;
    
    .footer-logo {
      height: 32px;
      width: auto;
      margin-right: 1rem;
    }
    
    .footer-brand-text {
      h5 {
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
        color: var(--primary);
      }
      
      span {
        font-size: 0.75rem;
        color: var(--text-muted);
        display: block;
      }
    }
  }
  
  .footer-links {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    flex-wrap: wrap;
    
    a {
      color: var(--text-color);
      text-decoration: none;
      transition: color 0.2s;
      font-size: 0.85rem;
      
      &:hover {
        color: var(--primary);
      }
    }
  }
  
  .footer-info {
    .copy {
      margin: 0 0 0.5rem;
      color: var(--text-muted);
    }
    
    .version-info {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 1rem;
      
      .version {
        background-color: rgba(var(--bs-primary-rgb), 0.1);
        color: var(--primary);
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        border-radius: 30px;
        font-weight: 500;
      }
      
      .system-info-btn {
        background: none;
        border: none;
        padding: 0;
        color: var(--text-muted);
        font-size: 0.85rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        transition: color 0.2s;
        
        &:hover {
          color: var(--primary);
        }
      }
    }
  }
}

.system-info, .about-info, .privacy-policy {
  text-align: left;
  
  ul {
    padding-left: 1.5rem;
  }
  
  h5 {
    margin-top: 1rem;
    font-size: 1.05rem;
  }
}

/* Responsive styles */
@media (max-width: 768px) {
  .app-footer {
    .row > div {
      text-align: center !important;
      margin-bottom: 1rem;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    .footer-branding {
      justify-content: center;
    }
    
    .footer-info {
      .version-info {
        justify-content: center;
      }
    }
  }
}
</style>