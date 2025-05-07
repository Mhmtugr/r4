<template>
  <div class="login-container">
    <div class="login-bg"></div>
    <div class="login-wrapper">
      <div class="card login-card border-0">
        <!-- Kart Başlığı -->
        <div class="card-header bg-transparent text-center py-4 border-0">
          <div class="logo-container mb-3">
            <img src="@/assets/images/sample-image.jpg" alt="METS Logo" class="logo-img" />
          </div>
          <h3 class="brand-title">METS</h3>
          <p class="text-muted">Mehmet Endüstriyel Takip Sistemi</p>
        </div>

        <!-- Kart İçeriği -->
        <div class="card-body p-4 p-lg-5">
          <!-- Giriş Formu -->
          <div v-if="view === 'login'">
            <h4 class="card-title text-center mb-4">Giriş Yap</h4>
            <form @submit.prevent="login">
              <div class="mb-4">
                <label for="email" class="form-label">E-posta</label>
                <div class="input-group input-group-lg">
                  <span class="input-group-text bg-transparent border-end-0">
                    <i class="bi bi-envelope"></i>
                  </span>
                  <input
                    type="email"
                    class="form-control border-start-0"
                    id="email"
                    v-model="loginForm.email"
                    placeholder="E-posta adresiniz"
                    required
                  />
                </div>
              </div>

              <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label for="password" class="form-label">Şifre</label>
                  <a href="#" @click.prevent="view = 'forgot'" class="text-decoration-none small">
                    Şifremi Unuttum?
                  </a>
                </div>
                <div class="input-group input-group-lg">
                  <span class="input-group-text bg-transparent border-end-0">
                    <i class="bi bi-lock"></i>
                  </span>
                  <input
                    :type="showPassword ? 'text' : 'password'"
                    class="form-control border-start-0 border-end-0"
                    id="password"
                    v-model="loginForm.password"
                    placeholder="Şifreniz"
                    required
                  />
                  <button
                    class="input-group-text bg-transparent border-start-0"
                    type="button"
                    @click="showPassword = !showPassword"
                  >
                    <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                </div>
              </div>

              <div class="mb-4">
                <div class="form-check">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    id="remember-me"
                    v-model="loginForm.rememberMe"
                  />
                  <label class="form-check-label" for="remember-me">
                    Beni hatırla
                  </label>
                </div>
              </div>

              <div class="d-grid gap-2 mb-4">
                <button
                  type="submit"
                  class="btn btn-primary btn-lg"
                  :disabled="loading"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                  <span>Giriş Yap</span>
                </button>
              </div>
            </form>

            <div class="social-divider">
              <span>veya</span>
            </div>

            <div class="d-grid gap-3 mb-4">
              <button
                type="button"
                class="btn btn-outline-secondary btn-lg social-btn"
                @click="loginWithGoogle"
                :disabled="loading"
              >
                <i class="bi bi-google me-2"></i> Google ile Giriş Yap
              </button>
              <button
                type="button"
                class="btn btn-outline-info btn-lg social-btn"
                @click="demoLogin"
                :disabled="loading"
              >
                <i class="bi bi-person-circle me-2"></i> Demo Kullanıcı ile Giriş
              </button>
            </div>

            <div class="text-center">
              <p class="mb-0">
                Hesabınız yok mu?
                <a href="#" @click.prevent="view = 'register'" class="ms-1 text-decoration-none fw-bold">
                  Kayıt Ol
                </a>
              </p>
            </div>
          </div>

          <!-- Kayıt Formu -->
          <div v-else-if="view === 'register'">
            <h4 class="card-title text-center mb-4">Hesap Oluştur</h4>
            <form @submit.prevent="register">
              <div class="mb-3">
                <label for="register-name" class="form-label">Ad Soyad</label>
                <div class="input-group">
                  <span class="input-group-text bg-transparent border-end-0">
                    <i class="bi bi-person"></i>
                  </span>
                  <input
                    type="text"
                    class="form-control border-start-0"
                    id="register-name"
                    v-model="registerForm.name"
                    placeholder="Ad Soyad"
                    required
                  />
                </div>
              </div>

              <div class="mb-3">
                <label for="register-email" class="form-label">E-posta</label>
                <div class="input-group">
                  <span class="input-group-text bg-transparent border-end-0">
                    <i class="bi bi-envelope"></i>
                  </span>
                  <input
                    type="email"
                    class="form-control border-start-0"
                    id="register-email"
                    v-model="registerForm.email"
                    placeholder="E-posta adresiniz"
                    required
                  />
                </div>
              </div>

              <div class="mb-3">
                <label for="register-username" class="form-label">Kullanıcı Adı</label>
                <div class="input-group">
                  <span class="input-group-text bg-transparent border-end-0">
                    <i class="bi bi-at"></i>
                  </span>
                  <input
                    type="text"
                    class="form-control border-start-0"
                    id="register-username"
                    v-model="registerForm.username"
                    placeholder="Kullanıcı adınız"
                    required
                  />
                </div>
              </div>

              <div class="mb-3">
                <label for="register-department" class="form-label">Departman</label>
                <div class="input-group">
                  <span class="input-group-text bg-transparent border-end-0">
                    <i class="bi bi-building"></i>
                  </span>
                  <select
                    class="form-select border-start-0"
                    id="register-department"
                    v-model="registerForm.department"
                    required
                  >
                    <option value="" disabled selected>Departmanınızı seçin</option>
                    <option value="Yönetim">Yönetim</option>
                    <option value="Teknik">Teknik</option>
                    <option value="Üretim">Üretim</option>
                    <option value="Satın Alma">Satın Alma</option>
                    <option value="Kalite Kontrol">Kalite Kontrol</option>
                    <option value="İnsan Kaynakları">İnsan Kaynakları</option>
                  </select>
                </div>
              </div>

              <div class="mb-3">
                <label for="register-password" class="form-label">Şifre</label>
                <div class="input-group">
                  <span class="input-group-text bg-transparent border-end-0">
                    <i class="bi bi-lock"></i>
                  </span>
                  <input
                    type="password"
                    class="form-control border-start-0"
                    id="register-password"
                    v-model="registerForm.password"
                    placeholder="Şifre (en az 6 karakter)"
                    required
                    minlength="6"
                  />
                </div>
              </div>

              <div class="mb-4">
                <label for="register-password-confirm" class="form-label">Şifre Tekrar</label>
                <div class="input-group">
                  <span class="input-group-text bg-transparent border-end-0">
                    <i class="bi bi-lock-fill"></i>
                  </span>
                  <input
                    type="password"
                    class="form-control border-start-0"
                    id="register-password-confirm"
                    v-model="registerForm.confirmPassword"
                    placeholder="Şifrenizi tekrar girin"
                    required
                  />
                </div>
                <div class="form-text text-danger" v-if="passwordMismatch">
                  <i class="bi bi-exclamation-triangle me-1"></i> Şifreler eşleşmiyor
                </div>
              </div>

              <div class="d-grid gap-2 mb-4">
                <button
                  type="submit"
                  class="btn btn-primary btn-lg"
                  :disabled="loading || passwordMismatch"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                  Kayıt Ol
                </button>
              </div>
            </form>

            <div class="text-center">
              <p class="mb-0">
                Zaten hesabınız var mı?
                <a href="#" @click.prevent="view = 'login'" class="ms-1 text-decoration-none fw-bold">
                  Giriş Yap
                </a>
              </p>
            </div>
          </div>

          <!-- Şifre Sıfırlama Formu -->
          <div v-else-if="view === 'forgot'">
            <h4 class="card-title text-center mb-4">Şifremi Unuttum</h4>
            <p class="text-muted text-center mb-4">E-posta adresinizi giriniz. Şifre sıfırlama bağlantısı gönderilecektir.</p>
            
            <form @submit.prevent="resetPassword">
              <div class="mb-4">
                <label for="forgot-email" class="form-label">E-posta</label>
                <div class="input-group input-group-lg">
                  <span class="input-group-text bg-transparent border-end-0">
                    <i class="bi bi-envelope"></i>
                  </span>
                  <input
                    type="email"
                    class="form-control border-start-0"
                    id="forgot-email"
                    v-model="forgotForm.email"
                    placeholder="E-posta adresiniz"
                    required
                  />
                </div>
              </div>

              <div class="d-grid gap-2 mb-4">
                <button
                  type="submit"
                  class="btn btn-primary btn-lg"
                  :disabled="loading"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                  Şifre Sıfırlama Bağlantısı Gönder
                </button>
              </div>
            </form>

            <div class="text-center">
              <p class="mb-0">
                <a href="#" @click.prevent="view = 'login'" class="text-decoration-none">
                  <i class="bi bi-arrow-left me-1"></i> Giriş sayfasına dön
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Alt Bilgi -->
      <div class="text-center text-muted mt-3 footer-info">
        <p class="mb-1">&copy; {{ new Date().getFullYear() }} METS - MehmetEndüstriyelTakip Sistemi</p>
        <p class="mb-0 small">v2.0.0</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useAuthStore } from '@/store/auth';

// Router ve Store
const router = useRouter();
const { toast } = useToast();
const authStore = useAuthStore();

// State
const view = ref('login');
const loading = ref(false);
const showPassword = ref(false);

// Forms
const loginForm = ref({
  email: '',
  password: '',
  rememberMe: false
});

const registerForm = ref({
  name: '',
  email: '',
  username: '',
  department: '',
  password: '',
  confirmPassword: ''
});

const forgotForm = ref({
  email: ''
});

// Computed
const passwordMismatch = computed(() =>
  registerForm.value.password !== '' &&
  registerForm.value.confirmPassword !== '' &&
  registerForm.value.password !== registerForm.value.confirmPassword
);

// Methods
const login = async () => {
  if (!loginForm.value.email || !loginForm.value.password) {
    toast.warning('Lütfen e-posta ve şifrenizi giriniz.');
    return;
  }
  
  loading.value = true;
  
  try {
    const result = await authStore.login({
      email: loginForm.value.email,
      password: loginForm.value.password,
      rememberMe: loginForm.value.rememberMe
    });
    
    if (result.success) {
      toast.success(`Hoş geldiniz, ${result.user.displayName || result.user.email}`);
      router.push('/');
    } else {
      toast.error(result.error || 'Giriş başarısız oldu. Lütfen bilgilerinizi kontrol ediniz.');
    }
  } catch (error) {
    toast.error('Giriş yapılırken bir hata oluştu');
    console.error('Giriş hatası:', error);
  } finally {
    loading.value = false;
  }
};

const register = async () => {
  if (passwordMismatch.value) {
    toast.warning('Şifreler eşleşmiyor. Lütfen kontrol ediniz.');
    return;
  }
  
  if (!registerForm.value.name ||
      !registerForm.value.email ||
      !registerForm.value.username ||
      !registerForm.value.department ||
      !registerForm.value.password) {
    toast.warning('Lütfen tüm alanları doldurunuz.');
    return;
  }
  
  loading.value = true;
  
  try {
    const result = await authStore.register({
      name: registerForm.value.name,
      email: registerForm.value.email,
      username: registerForm.value.username,
      department: registerForm.value.department,
      password: registerForm.value.password
    });
    
    if (result.success) {
      toast.success('Kayıt işlemi başarılı! Giriş yapabilirsiniz.');
      view.value = 'login';
      // Kayıt sonrası e-posta otomatik doldur
      loginForm.value.email = registerForm.value.email;
      registerForm.value = {
        name: '',
        email: '',
        username: '',
        department: '',
        password: '',
        confirmPassword: ''
      };
    } else {
      toast.error(result.error || 'Kayıt işlemi başarısız oldu. Lütfen tekrar deneyiniz.');
    }
  } catch (error) {
    toast.error('Kayıt olurken bir hata oluştu');
    console.error('Kayıt hatası:', error);
  } finally {
    loading.value = false;
  }
};

const resetPassword = async () => {
  if (!forgotForm.value.email) {
    toast.warning('Lütfen e-posta adresinizi giriniz.');
    return;
  }
  
  loading.value = true;
  
  try {
    const result = await authStore.resetPassword(forgotForm.value.email);
    
    if (result.success) {
      toast.success(`${forgotForm.value.email} adresine şifre sıfırlama bağlantısı gönderildi.`);
      view.value = 'login';
      forgotForm.value.email = '';
    } else {
      toast.error(result.error || 'Şifre sıfırlama işlemi başarısız oldu. Lütfen tekrar deneyiniz.');
    }
  } catch (error) {
    toast.error('Şifre sıfırlama işlemi sırasında bir hata oluştu');
    console.error('Şifre sıfırlama hatası:', error);
  } finally {
    loading.value = false;
  }
};

const loginWithGoogle = async () => {
  loading.value = true;
  
  try {
    const result = await authStore.loginWithGoogle();
    
    if (result.success) {
      toast.success(`Hoş geldiniz, ${result.user.displayName || result.user.email}`);
      router.push('/');
    } else {
      // Kullanıcı popup'ı kapattıysa sessizce başarısız
      if (result.code === 'auth/popup-closed-by-user') {
        console.log('Kullanıcı popup\'ı kapattı');
      } else {
        toast.error(result.error || 'Google ile giriş başarısız oldu. Lütfen tekrar deneyiniz.');
      }
    }
  } catch (error) {
    toast.error('Google ile giriş yapılırken bir hata oluştu');
    console.error('Google giriş hatası:', error);
  } finally {
    loading.value = false;
  }
};

const demoLogin = async () => {
  loading.value = true;
  
  try {
    const result = await authStore.demoLogin();
    
    if (result.success) {
      toast.info('Demo modunda giriş yapıldı. Tam yetkiye sahipsiniz.');
      router.push('/');
    } else {
      toast.error(result.error || 'Demo giriş başarısız oldu. Lütfen tekrar deneyiniz.');
    }
  } catch (error) {
    toast.error('Demo giriş yapılırken bir hata oluştu');
    console.error('Demo giriş hatası:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
@use "@/styles/base/variables" as vars;

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: #f8f9fa;
}

.login-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0d6efd20, #6610f220);
  z-index: 0;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: url('@/assets/images/sample-image.jpg') center/cover no-repeat;
    opacity: 0.05;
    z-index: -1;
  }
}

.login-wrapper {
  width: 100%;
  max-width: 450px;
  padding: 1.5rem;
  position: relative;
  z-index: 1;
}

.login-card {
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  
  .logo-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 1rem;
    
    .logo-img {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: contain;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      padding: 0.5rem;
      background: white;
    }
  }
  
  .brand-title {
    font-weight: 700;
    margin-bottom: 0.25rem;
    background: linear-gradient(45deg, #0d6efd, #6610f2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.input-group {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  overflow: hidden;
  
  .input-group-text {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .form-control {
    padding-left: 0.5rem;
    height: 48px;
    
    &:focus {
      box-shadow: none;
    }
  }
  
  .form-select {
    height: 48px;
    padding-left: 0.5rem;
  }
}

.social-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    border-top: 1px solid #dee2e6;
  }
  
  span {
    padding: 0 1rem;
    color: #6c757d;
    font-size: 0.875rem;
  }
}

.social-btn {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  i {
    font-size: 1.25rem;
  }
}

.footer-info {
  font-size: 0.875rem;
}

// Responsive
@media (max-width: 576px) {
  .login-wrapper {
    padding: 1rem;
  }
  
  .login-card {
    border-radius: 10px;
  }
  
  .card-body {
    padding: 1.5rem !important;
  }
}

// Dark theme
body.dark-mode {
  .login-container {
    background-color: #121212;
  }
  
  .login-bg {
    background: linear-gradient(135deg, #0d6efd10, #6610f210);
  }
  
  .login-card {
    background: rgba(36, 36, 36, 0.95);
  }
  
  .input-group {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }
  
  .social-divider {
    &::before,
    &::after {
      border-top: 1px solid #343a40;
    }
    
    span {
      color: #adb5bd;
    }
  }
}
</style>