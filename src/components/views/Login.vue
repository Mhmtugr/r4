<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-logo-container">
        <img src="@/assets/images/logo.png" alt="METS Logo" class="login-logo" />
      </div>
      <div class="login-form-container">
        <h1 class="login-title">{{ isRegistering ? 'Kayıt Ol' : 'Giriş Yap' }}</h1>
        <div v-if="authError && !isRegistering" class="alert alert-danger">
          {{ authError }}
        </div>
        <div v-if="registerError && isRegistering" class="alert alert-danger">
          {{ registerError }}
        </div>

        <form v-if="!isRegistering" @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="email">E-posta</label>
            <input
              type="text"
              id="email"
              v-model="credentials.email"
              class="form-control"
              required
              placeholder="ornek@sirket.com"
            />
          </div>

          <div class="form-group">
            <label for="password">Şifre</label>
            <div class="password-input-container">
              <input
                :type="showPassword ? 'text' : 'password'"
                id="password"
                v-model="credentials.password"
                class="form-control"
                required
                placeholder="******"
              />
              <button 
                type="button" 
                class="password-toggle-btn"
                @click="togglePasswordVisibility"
              >
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
          </div>

          <div class="form-check mb-3">
            <input 
              type="checkbox" 
              class="form-check-input" 
              id="rememberMe" 
              v-model="credentials.rememberMe"
            />
            <label class="form-check-label" for="rememberMe">Beni hatırla</label>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary login-btn w-100"
            :disabled="isLoading"
          >
            <span v-if="isLoading">
              <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              Giriş yapılıyor...
            </span>
            <span v-else>Giriş Yap</span>
          </button>
        </form>

        <form v-else @submit.prevent="handleRegister" class="register-form">
          <div class="form-group">
            <label for="name">Ad Soyad</label>
            <input
              type="text"
              id="name"
              v-model="registerData.name"
              class="form-control"
              required
              placeholder="Ad Soyad"
            />
          </div>

          <div class="form-group">
            <label for="email">E-posta</label>
            <input
              type="text"
              id="email"
              v-model="registerData.email"
              class="form-control"
              required
              placeholder="ornek@sirket.com"
            />
          </div>

          <div class="form-group">
            <label for="username">Kullanıcı Adı</label>
            <input
              type="text"
              id="username"
              v-model="registerData.username"
              class="form-control"
              required
              placeholder="Kullanıcı Adı"
            />
          </div>

          <div class="form-group">
            <label for="department">Departman</label>
            <input
              type="text"
              id="department"
              v-model="registerData.department"
              class="form-control"
              required
              placeholder="Departman"
            />
          </div>

          <div class="form-group">
            <label for="password">Şifre</label>
            <div class="password-input-container">
              <input
                :type="showPassword ? 'text' : 'password'"
                id="password"
                v-model="registerData.password"
                class="form-control"
                required
                placeholder="******"
              />
              <button 
                type="button" 
                class="password-toggle-btn"
                @click="togglePasswordVisibility"
              >
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary register-btn w-100"
            :disabled="isLoading"
          >
            <span v-if="isLoading">
              <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              Kayıt yapılıyor...
            </span>
            <span v-else>Kayıt Ol</span>
          </button>
        </form>

        <div class="login-footer">
          <a href="#" @click.prevent="toggleRegister">
            {{ isRegistering ? 'Giriş Yap' : 'Kayıt Ol' }}
          </a>
          <a v-if="!isRegistering" href="#" @click.prevent="forgotPassword">Şifremi Unuttum</a>
        </div>
      </div>
    </div>

    <div class="login-version">
      <span>METS v2.0.0</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const authStore = useAuthStore();

const credentials = reactive({
  email: '',
  password: '',
  rememberMe: false
});

const authError = ref('');
const isLoading = ref(false);
const showPassword = ref(false);
const isRegistering = ref(false);
const registerData = reactive({ name: '', email: '', username: '', department: '', password: '' });
const registerError = ref('');

const handleLogin = async () => {
  try {
    isLoading.value = true;
    authError.value = '';
    
    // call authStore.login with credentials object and handle result
    const result = await authStore.login(credentials);
    if (!result.success) {
      authError.value = result.error || 'E-posta veya şifre hatalı.';
      return;
    }
    // Yönlendirme kontrolü - eğer belirli bir sayfadan yönlendirme varsa oraya git
    const redirectPath = router.currentRoute.value.query.redirect || '/';
    router.push(redirectPath);
  } catch (error) {
    console.error('Login error:', error);
    authError.value = error.message || 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.';
  } finally {
    isLoading.value = false;
  }
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const forgotPassword = async () => {
  if (!credentials.email) {
    authError.value = 'Lütfen şifre sıfırlama için email adresinizi giriniz.';
    return;
  }
  
  try {
    isLoading.value = true;
    await authStore.resetPassword(credentials.email);
    alert('Şifre sıfırlama bağlantısı email adresinize gönderildi.');
  } catch (error) {
    authError.value = 'Şifre sıfırlama bağlantısı gönderilemedi. Lütfen tekrar deneyin.';
    console.error('Password reset error:', error);
  } finally {
    isLoading.value = false;
  }
};

// Toggle between login and register views
const toggleRegister = () => {
  isRegistering.value = !isRegistering.value;
  authError.value = '';
  registerError.value = '';
};

// Handle user registration
const handleRegister = async () => {
  try {
    isLoading.value = true;
    registerError.value = '';
    const result = await authStore.register(registerData);
    if (!result.success) {
      registerError.value = result.error || 'Kayıt sırasında hata oluştu.';
    }
    // On success, authStore.register navigates to '/'
  } catch (error) {
    console.error('Register error:', error);
    registerError.value = error.message || 'Kayıt yapılamadı.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  position: relative;
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  box-shadow: 0 0 20px rgba(0,0,0,0.1);
  border-radius: 10px;
  background-color: white;
}

.login-logo-container {
  text-align: center;
  margin-bottom: 20px;
}

.login-logo {
  max-width: 150px;
  height: auto;
}

.login-title {
  font-size: 1.8rem;
  text-align: center;
  margin-bottom: 30px;
  color: var(--primary-color, #0d6efd);
}

.login-form-container {
  padding: 0 15px;
}

.form-group {
  margin-bottom: 20px;
}

.login-btn {
  padding: 10px;
  font-weight: 500;
}

.register-btn {
  padding: 10px;
  font-weight: 500;
}

.login-footer {
  margin-top: 20px;
  text-align: center;
}

.login-footer a {
  color: var(--primary-color, #0d6efd);
  text-decoration: none;
}

.login-footer a:hover {
  text-decoration: underline;
}

.password-input-container {
  position: relative;
}

.password-toggle-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
}

.login-version {
  position: absolute;
  bottom: 10px;
  right: 10px;
  font-size: 0.8rem;
  color: #6c757d;
}

@media (max-width: 576px) {
  .login-container {
    box-shadow: none;
  }
}
</style>