import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthService } from '@/composables/useAuthService';
import { useRouter } from 'vue-router';

export const useAuthStore = defineStore('auth', () => {
  // Servis
  const authService = useAuthService();
  const router = useRouter();
  
  // State
  const user = ref(null);
  const isAuthenticated = ref(false);
  const loading = ref(true);
  const sessionInitialized = ref(false);
  const error = ref(null);
  const isDemoMode = ref(false);
  
  // Getters
  const currentUser = computed(() => user.value);
  const userRole = computed(() => user.value?.role || 'user');
  const userName = computed(() => user.value?.displayName || user.value?.name || 'Kullanıcı');
  
  // Actions
  async function initialize() {
    if (sessionInitialized.value) return { success: true, isAuthenticated: isAuthenticated.value };

    try {
      loading.value = true;
      error.value = null;
      
      const { isAuthenticated: authStatus, user: userData, demo } = await authService.checkAuth();
      
      isAuthenticated.value = authStatus;
      user.value = userData;
      isDemoMode.value = !!demo;
      
      return { success: true, isAuthenticated: authStatus };
    } catch (err) {
      console.error('Auth durumu kontrol hatası (store):', err);
      error.value = err.message;
      isAuthenticated.value = false;
      user.value = null;
      isDemoMode.value = false;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
      sessionInitialized.value = true;
    }
  }
  
  async function login(credentials) {
    try {
      loading.value = true;
      error.value = null;
      
      const result = await authService.login(credentials);
      
      if (result.success) {
        user.value = result.user;
        isAuthenticated.value = true;
        isDemoMode.value = !!result.demo;
        sessionInitialized.value = true;
        
        router.push(router.currentRoute.value.query.redirect || '/');
        return { success: true, user: result.user };
      } else {
        error.value = result.error;
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Login hatası (store):', err);
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  }
  
  async function loginWithGoogle() {
    try {
      loading.value = true;
      error.value = null;
      
      const result = await authService.loginWithGoogle();
      
      if (result.success) {
        user.value = result.user;
        isAuthenticated.value = true;
        isDemoMode.value = !!result.demo;
        sessionInitialized.value = true;
        
        router.push(router.currentRoute.value.query.redirect || '/');
        return { success: true };
      } else {
        if (result.code === 'auth/popup-closed-by-user') {
          return { success: false, silent: true };
        }
        error.value = result.error;
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Google ile giriş hatası (store):', err);
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  }
  
  async function demoLogin() {
    try {
      loading.value = true;
      error.value = null;
      
      const result = await authService.demoLogin();
      
      if (result.success) {
        user.value = result.user;
        isAuthenticated.value = true;
        isDemoMode.value = true;
        sessionInitialized.value = true;
        
        router.push(router.currentRoute.value.query.redirect || '/');
        return { success: true, user: result.user };
      } else {
        error.value = result.error;
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Demo giriş hatası (store):', err);
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  }
  
  async function register(userData) {
    try {
      loading.value = true;
      error.value = null;
      
      const result = await authService.register(userData);
      
      if (result.success) {
        user.value = result.user;
        isAuthenticated.value = true;
        isDemoMode.value = !!result.demo;
        sessionInitialized.value = true;
        
        router.push('/');
        return { success: true };
      } else {
        error.value = result.error;
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Kayıt hatası (store):', err);
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  }
  
  async function resetPassword(email) {
    try {
      loading.value = true;
      error.value = null;
      
      const result = await authService.resetPassword(email);
      
      if (result.success) {
        return { success: true };
      } else {
        error.value = result.error;
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Şifre sıfırlama hatası (store):', err);
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  }
  
  async function logout() {
    try {
      loading.value = true;
      
      await authService.logout();
      
      user.value = null;
      isAuthenticated.value = false;
      isDemoMode.value = false;
      
      router.push('/login');
      
      return { success: true };
    } catch (err) {
      console.error('Çıkış hatası (store):', err);
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  }
  
  return {
    // State
    user,
    isAuthenticated,
    loading,
    sessionInitialized,
    error,
    isDemoMode,
    
    // Getters
    currentUser,
    userRole,
    userName,
    
    // Actions
    initialize,
    login,
    loginWithGoogle,
    register,
    resetPassword,
    logout,
    demoLogin
  };
});