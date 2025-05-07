<template>
  <aside class="sidebar" :class="{ 'collapsed': isCollapsed }">
    <div class="sidebar-header">
      <router-link to="/" class="logo-link">
        <!-- Base64 formatında logolar kullanıyoruz - build hatalarını önlemek için -->
        <img :src="logoLarge" alt="Logo" class="logo-icon" v-if="!isCollapsed">
        <img :src="logoSmall" alt="Logo" class="logo-icon-sm" v-else>
        <h4 v-if="!isCollapsed">MehmetEndüstriyelTakip</h4>
      </router-link>
      <p v-if="!isCollapsed" class="text-muted small">Orta Gerilim Hücre Üretim Takip</p>
    </div>

    <nav class="sidebar-nav">
      <ul class="nav flex-column">
        <li class="nav-item">
          <router-link class="nav-link" to="/" active-class="active" exact>
            <i class="bi bi-speedometer2"></i>
            <span v-if="!isCollapsed">Genel Bakış</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/orders" active-class="active">
            <i class="bi bi-file-earmark-text"></i>
            <span v-if="!isCollapsed">Siparişler</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/production" active-class="active">
            <i class="bi bi-gear"></i>
            <span v-if="!isCollapsed">Üretim Takip</span>
          </router-link>
        </li>
        <li class="nav-item">
          <!-- Corrected link to point to the specific materials view -->
          <router-link class="nav-link" to="/inventory" active-class="active">
            <i class="bi bi-box-seam"></i>
            <span v-if="!isCollapsed">Malzeme Yönetimi</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/planning" active-class="active">
            <i class="bi bi-calendar-check"></i>
            <span v-if="!isCollapsed">Planlama</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/reports" active-class="active">
            <i class="bi bi-graph-up"></i>
            <span v-if="!isCollapsed">Raporlar & Analizler</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/technical" active-class="active">
            <i class="bi bi-file-earmark-code"></i>
            <span v-if="!isCollapsed">Teknik Dokümanlar</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/settings" active-class="active">
            <i class="bi bi-sliders"></i>
            <span v-if="!isCollapsed">Ayarlar</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <div class="sidebar-footer" v-if="!isCollapsed">
      <p>v1.0.0</p>
      <p>© 2025 MehmetEndüstriyel</p>
    </div>
  </aside>
</template>

<script setup>
import { defineProps, ref } from 'vue';

// Base64 encoded logos - build during deployment issues solved
const logoLarge = ref('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAA7EAAAOxAGVKw4bAAADy0lEQVRYhe2YTWhcVRTHf+e+eZPJJI3NR9skpkmTSJumH6a2SitWFBQFKVYUBDdupK7cKO7cuBFx5ap0IbhQdwouRHEhFJEiVhGrKLbaJqlJmma+mmQymcy8d1y8mTczeTOZVOKiXrjce+697/zP/Z9z3oMAcM5FgK3AMNDjc9n+ag+kQOXmJDKAzYCHQL1z7pNisZivVqvFarVqg8Ggp5Ty1us1wzn3Q4HZcrkcCIfDaiQSCcTjcS8ajXrGmMPBA64HnCiVSpVYLKZ6e3u9gYGBoUgk8j4f8PDCoCwgMAsURkdHg5OTk15/f3+or68vePToUW9sbGwwFou9LCKvFQqFX6anpwu5XG42mUxOzczMFLLZbDkYDBbn5+eL+Xw+HwqF5gKBwJmN4tulgUfGmJnl5eVCPB73wuFwoLu7O9jV1RXM5/ORVCo1BoyJyIlCofBLPp+fzmazM8vLy7lsNpvP5/MFYNM7uAA/AZlCoVDK5/OmWq0aa61prVVr7SXgIvA2cKJcLv9aKpVmy+VyEVhlgdZgK/A58AjwWLlcrlQqFaPrP7XWlK21S8ALwFEgUalUpkqlUg4orQOOAN8BbwHfRKPRQiwWQ0QQEZRSBINBAoEAWmuCwSDGmCvAy8BR4MNoNFqMx+Nr9toB08DHwDzwtojMAW8aY34Oh8PB9tl1DmjdVMCDwBXn3NtKqYPGmOlIJBK01m5Yv7ePlwEw1tpDSqlrxpjT4XA4qLVe1w5oe4lvACeAWREhEAiQSqWir1y8GP3g9OktvQMD4AT+XFjIfvnpp7mFq1ffAh4G/mitlaBWPQzw0cmTXfv27x99/NChPfv378/kcrmnDx8+/D3wFXC7tUYA/p6aUi+eOZN+5cyZkXfeey89MTGhzp07N/b6a69NAm8AV+t2a9gcVVV9+sUXRvbu3Tvw6NGjPaPj46H9Bw48cPaTT/b19vaOAd+21a1TcCXx7PnzqWSrlBYXF5mYmEilUqnrwNl1gB3/For79u3DVxMiEAoGGRkZie3cudMD2qVt3cE6Upf1gdoH3XMwBPwJ/FrXeKzua7RNQZsOtgzxKPArcNw5x/T09ORrr746CxxoXzcKeL5p/6Un8QDrROS2Uuqrc+fOFRYWFm4Ar7bXjal1i3gCeL49r29irtZ+6OtFoBaJbUkBGlhpY1gLkRpgRUSM1rrLz1G/PQ+hNT75DUgDyDpHHUABUkrp+/fv+25uV8HbQArgPwyQu89gA5gC3mie9fspdF/d+bb9Hy7/A8DGP9v3Vd+FA6/df2qeZYGGKjRVdj09bcLQ0MC2uz8A9yT+AZkZmWLcA8BaAAAAAElFTkSuQmCC');
const logoSmall = ref('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAA7EAAAOxAGVKw4bAAADy0lEQVRYhcWXS2icVRTHf+eb70smk0nSJtMmaZq0SdqkD1Pb0hYrCkULUlwoCIIbN1JXbpTixo0LcedKdFFwIbgQcSHUpYhSsA9bRK2Pk7xmJslMMpP5Zt5x8c1MZjKZmZK68HIv937nv+ec/z3nfvcKAOdcCNgD9AJdPpftXrsAvFeYk0gGsAlwB9DonPuiWCwWKpVKsVKp2GAw6Cml5Ea9YZxz3xeYKZfLhXA4rLq7uwMdHR1eNBr1jDGHggfsFnCiVCpVYrGY2rx5s9fZ2TkQiUQ+5D0eXBiUBQRmgMLAwEBwdHQ00N7e7re3twePHz/uDQ4OdsVisVdF5NVCofDj1NRUIZvNziaT/08orwHsSDQaDebzef/ChQtXz549e01rvQRgrdXW2pL/noho4BQwC5TNBodtdqV8TXunAAZYBqYKhUJxaGgo1NfX12mt3XnmzJn26enpJmvtNwDOuYq1tlwul0v+KG3STYAWET8SiXhtbW1eLpfrEpG9QBDY33YbiIrIgIg8AbwEbPXtBwc5EZkGvgK+cs5dFqA4Pz9/ZGFh4eFYLLZ7aGgocenSpbXXuwporfclEolf+vv7d4yNjQkwLsbYzpMnT7rl5eXO48ePdwwPD0eLxaJordloseWO0lo7pZSq3Lt376933nnzb+Av4Leg1tobpVKpMDs7W7l79+5NoA14amRk5LtDhw7deu7w4cXDhw5defTRgZudnffOvHPy5FX6+trk13PnSsl//lG9jz26dODpp29NTd38Z3x8fLG1tfXzUCi0BwhbawGwwLvATKFQKD/xxBNqcnJSNzY20tDQoBsaGvTnn39+8ciRI5PAC+12lZ6entm2trZNoVDIk9WJBbLZrD106FAMuAJ84UC+BO4DLCwssG3bNi+ZTGKM4f79+5w6deoR4FEAEfFPnjxZefrpp4PxeJxYLCa5XA7nXKNSagR4fCXgtLS0hA4ePKiMMTjn8DyPcDisXnrppWB/f3+HiAyKiPF936tUKmbDqwWcCCgR8X3fD87OztLR0UFHRwciguejVMaBTytL+B3wSH3QNXADGK9HbzLwDFAGpoA3gSHgYD1Y2hRcnVwtQHyttQRqa5FVfwGrgCvAc8Az9aMkgN+Bf+vPrdc+/Gf2jRKrQA9wDnhmZWYuLQyAH4DR+jNrgdD+dVK1tHkROORHq0RsS+LXtrAeERsUMcAd55znA/4DV2iASj37UIB1QOR28JN/KDQAi8DrtVm/nUKb6ufbtP8c6L/AeuPfjfAvHVjZv7VXcgCVCjhlWFpcYvGRh/jkyzkAnr//mDd9vyGyXGhpVO4VaOx4cNP/A0A6KxOZkwDkAAAAAElFTkSuQmCC');

// Props'ları tanımla (DefaultLayout'tan gelecek)
defineProps({
  isCollapsed: {
    type: Boolean,
    default: false
  }
});
</script>

<style lang="scss" scoped>
// Eski @import yerine modern @use kullanımı
// Değişken tanımlamaları için doğrudan erişim sağlıyoruz
$sidebar-width: 250px;
$sidebar-collapsed-width: 70px;

.sidebar {
  width: $sidebar-width;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background-color: var(--primary-color, #2c3e50);
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease, left 0.3s ease;
  overflow-x: hidden;
  z-index: 1030; // Ensure it's above header

  .sidebar-header {
    padding: 1.25rem 1rem;
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .logo-link {
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: white;
      margin-bottom: 0.5rem;

      .logo-icon, .logo-icon-sm {
        height: 30px;
        margin-right: 10px;
      }
       .logo-icon-sm {
         margin-right: 0;
       }

      h4 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        white-space: nowrap;
      }
    }

    p {
      margin: 0;
      font-size: 0.8rem;
      white-space: nowrap;
      color: rgba(255, 255, 255, 0.6);
    }
  }

  .sidebar-nav {
    flex-grow: 1;
    overflow-y: auto;
    padding-top: 1rem;

    .nav-link {
      color: rgba(255, 255, 255, 0.8);
      margin: 0.2rem 0.75rem;
      border-radius: 5px;
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      white-space: nowrap;
      transition: background-color 0.2s ease, color 0.2s ease;

      i {
        margin-right: 10px;
        font-size: 1.1rem;
        width: 20px;
        text-align: center;
      }

      &:hover, &.active {
        background-color: rgba(255, 255, 255, 0.1); 
        color: white;
      }
    }
  }

  .sidebar-footer {
    padding: 1rem;
    text-align: center;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    white-space: nowrap;

    p {
      margin: 0;
    }
  }

  // Collapsed state
  &.collapsed {
    width: $sidebar-collapsed-width;

    .sidebar-header {
      padding: 1.25rem 0.5rem;
       .logo-link h4, p {
         display: none;
       }
    }

    .sidebar-nav {
       .nav-link {
         justify-content: center;
         margin: 0.2rem 0.5rem;
         padding: 0.75rem;
         span {
           display: none;
         }
         i {
           margin-right: 0;
         }
       }
    }
    .sidebar-footer {
      display: none;
    }
  }
}

// Responsive adjustments
@media (max-width: 992px) {
  .sidebar {
    left: -#{$sidebar-width}; 
    
    &:not(.collapsed) {
       left: 0;
       box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
    }
     
    &.collapsed {
      left: -#{$sidebar-collapsed-width}; 
    }
  }
}

// Further refinement for very small screens
@media (max-width: 768px) {
   .sidebar {
     width: 100%;
     
     &.collapsed {
       left: -100%;
       width: 100%;
     }
   }
}
</style>
