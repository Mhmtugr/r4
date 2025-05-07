<template>
  <header class="app-header">
    <div class="header-left">
      <button class="sidebar-toggle-btn" @click="toggleSidebar">
        <i class="bi bi-list"></i>
      </button>
      <h2 class="header-title">Orta Gerilim Hücre Üretim Takip Sistemi</h2>
    </div>
    <div class="header-right">
      <button class="dark-mode-toggle-btn" @click="toggleDarkMode">
        <i :class="isDarkMode ? 'bi bi-sun-fill' : 'bi bi-moon-fill'"></i>
      </button>
      <div class="dropdown user-dropdown">
        <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-person-circle"></i> {{ username }}
        </button>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
          <li><a class="dropdown-item" href="#"><i class="bi bi-person"></i> Profil</a></li>
          <li><router-link class="dropdown-item" to="/settings"><i class="bi bi-gear"></i> Ayarlar</router-link></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#" @click.prevent="logout"><i class="bi bi-box-arrow-right"></i> Çıkış Yap</a></li>
        </ul>
      </div>
    </div>
  </header>
</template>

<script setup>
import { defineProps, defineEmits, inject } from 'vue';

// Props (DefaultLayout'tan gelecek)
defineProps({
  username: {
    type: String,
    default: 'Kullanıcı'
  }
});

// Emits (DefaultLayout'a gönderilecek olaylar)
const emit = defineEmits(['toggle-sidebar', 'logout', 'toggle-dark-mode']);

// Inject dark mode state
const isDarkMode = inject('isDarkMode');

// Olayları tetikleyen metodlar
const toggleSidebar = () => {
  emit('toggle-sidebar');
};

const logout = () => {
  emit('logout');
};

const toggleDarkMode = () => {
  emit('toggle-dark-mode');
};
</script>

<style lang="scss" scoped>
@use "../../styles/base/_variables" as vars; // Eski @import yerine modern @use kullanımı

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background-color: var(--bg-header, #ffffff); // Use CSS var with fallback
  border-bottom: 1px solid var(--border-color, #dee2e6); // Use CSS var
  height: vars.$header-height; // vars. öneki eklenmiş hali
  position: sticky; // Make header sticky
  top: 0;
  z-index: 1020; // Ensure it's above content but below sidebar overlay

  .header-left {
    display: flex;
    align-items: center;

    .sidebar-toggle-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      margin-right: 1rem;
      cursor: pointer;
      color: var(--text-color, #333); // Use CSS var
    }

    .header-title {
      font-size: 1.25rem; // Match ornekindex.html h2 style
      margin-bottom: 0; // Match ornekindex.html h2 style
      font-weight: 600; // Add weight for emphasis
      color: var(--text-color-dark, #34495e); // Use CSS var
    }
  }

  .header-right {
    display: flex;
    align-items: center;

    .dark-mode-toggle-btn {
      background: none;
      border: none;
      font-size: 1.2rem;
      margin-right: 1rem;
      cursor: pointer;
      color: var(--text-color, #6c757d); // Use CSS var
       &:hover {
         color: var(--text-color-dark, #34495e); // Use CSS var
       }
    }

    .user-dropdown {
      .btn {
        display: flex;
        align-items: center;
        color: var(--text-color, #6c757d); // Use CSS var
        border-color: var(--border-color, #dee2e6); // Use CSS var

        i {
          margin-right: 0.5rem;
        }
         &:hover, &:focus {
           background-color: var(--bg-light, #f8f9fa); // Use CSS var
           border-color: var(--border-color-dark, #adb5bd); // Use CSS var
         }
      }
      .dropdown-menu {
         border-color: var(--border-color-light, #e9ecef); // Use CSS var
         box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        .dropdown-item {
          display: flex;
          align-items: center;
          font-size: 0.9rem;
          color: var(--text-color, #495057); // Use CSS var
          i {
            margin-right: 0.75rem;
            width: 16px; // Align icons
          }
           &:hover, &:focus {
             background-color: var(--bg-light, #f8f9fa); // Use CSS var
             color: var(--text-color-dark, #212529); // Use CSS var
           }
           &:active {
             background-color: var(--primary-color-light, #e9ecef); // Use CSS var
           }
        }
      }
    }
  }

  // Responsive adjustments
  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    .header-left .header-title {
      font-size: 1rem; // Smaller title on mobile
    }
  }
   @media (max-width: 576px) {
     .header-left .header-title {
       display: none; // Hide title on very small screens
     }
   }
}
</style>