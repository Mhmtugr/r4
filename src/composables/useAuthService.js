import { ref } from 'vue';

/**
 * Auth hizmet kancası (hook)
 * Firebase ile kimlik doğrulama işlemlerini yönetir
 */
export function useAuthService() {
  // Firebase referansı (global)
  const firebase = window.firebase;
  
  // Auth durumu
  const authState = ref({
    isProcessing: false,
    lastError: null,
    currentProvider: null
  });

  /**
   * Kullanıcı girişi yap
   * @param {Object} credentials - Kullanıcı bilgileri
   * @returns {Promise} - Giriş işlemi sonucu
   */
  const login = async (credentials) => {
    try {
      authState.value.isProcessing = true;
      authState.value.lastError = null;
      
      const { email, password } = credentials;
      
      if (!email || !password) {
        return { success: false, error: 'E-posta ve şifre giriniz' };
      }
      
      // Standart admin kullanıcısı için sabit giriş
      if (email === 'admin' && password === 'admin') {
        const adminUser = {
          uid: 'admin',
          email: 'admin',
          displayName: 'Admin',
          role: 'admin',
          department: 'IT'
        };
        return { success: true, user: adminUser };
      }
      
      // Firebase ile giriş yap
      if (typeof firebase !== 'undefined' && firebase.auth) {
        try {
          const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
          const user = userCredential.user;
          
          // Kullanıcı bilgilerini Firestore'dan al
          const userData = await loadUserData(user);
          
          return { success: true, user: { ...user, ...userData } };
        } catch (authError) {
          console.error("Firebase giriş hatası:", authError);
          
          // Firebase kimlik doğrulama hatası
          let errorMessage = 'Giriş yapılırken bir hata oluştu.';
          
          if (authError.code) {
            switch(authError.code) {
              case 'auth/invalid-credential':
              case 'auth/user-not-found':
              case 'auth/wrong-password':
                errorMessage = 'E-posta adresi veya şifre hatalı.';
                break;
              case 'auth/user-disabled':
                errorMessage = 'Bu hesap devre dışı bırakıldı.';
                break;
              case 'auth/too-many-requests':
                errorMessage = 'Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.';
                break;
              case 'auth/network-request-failed':
                errorMessage = 'Ağ hatası. İnternet bağlantınızı kontrol edin.';
                break;
            }
          }
          
          authState.value.lastError = authError;
          
          return { success: false, error: errorMessage, code: authError.code };
        }
      } else {
        // Firebase yoksa demo giriş yap
        console.log("Firebase Auth bulunamadı, demo giriş yapılıyor");
        
        // Demo kullanıcısı oluştur
        const demoUser = {
          uid: 'demo-user',
          email: email || 'demo@elektrotrack.com',
          displayName: email?.split('@')[0] || 'Demo Kullanıcı',
          role: 'admin',
          department: 'Yönetim',
        };
        
        return { success: true, user: demoUser, demo: true };
      }
    } catch (error) {
      console.error("Giriş işlemi hatası:", error);
      authState.value.lastError = error;
      return { success: false, error: error.message };
    } finally {
      authState.value.isProcessing = false;
    }
  };

  /**
   * Google ile giriş yap
   * @returns {Promise} - Giriş işlemi sonucu
   */
  const loginWithGoogle = async () => {
    try {
      authState.value.isProcessing = true;
      authState.value.lastError = null;
      authState.value.currentProvider = 'google';
      
      if (typeof firebase !== 'undefined' && firebase.auth) {
        try {
          const provider = new firebase.auth.GoogleAuthProvider();
          const userCredential = await firebase.auth().signInWithPopup(provider);
          const user = userCredential.user;
          
          // Kullanıcı bilgilerini Firestore'dan al
          let userData = await loadUserData(user);
          
          // Eğer kullanıcı ilk defa giriş yapıyorsa Firestore'a kaydet
          if (!userData) {
            userData = {
              name: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
              lastLogin: new Date(),
              createdAt: new Date(),
            };
            
            await firebase.firestore().collection('users').doc(user.uid).set(userData, { merge: true });
          }
          
          return { success: true, user: { ...user, ...userData } };
        } catch (authError) {
          console.error("Google giriş hatası:", authError);
          
          let errorMessage = 'Google ile giriş yapılırken bir hata oluştu.';
          
          if (authError.code) {
            switch(authError.code) {
              case 'auth/popup-closed-by-user':
                // Kullanıcı popup'ı kapattıysa sessizce başarısız
                return { success: false, error: null, code: authError.code };
              case 'auth/account-exists-with-different-credential':
                errorMessage = 'Bu e-posta başka bir giriş yöntemiyle ilişkilendirilmiş.';
                break;
              case 'auth/cancelled-popup-request':
                errorMessage = 'Giriş işlemi iptal edildi.';
                break;
              case 'auth/network-request-failed':
                errorMessage = 'Ağ hatası. İnternet bağlantınızı kontrol edin.';
                break;
            }
          }
          
          authState.value.lastError = authError;
          
          return { success: false, error: errorMessage, code: authError.code };
        }
      } else {
        // Firebase yoksa demo giriş yap
        return demoLogin();
      }
    } catch (error) {
      console.error("Google giriş işlemi hatası:", error);
      authState.value.lastError = error;
      return { success: false, error: error.message };
    } finally {
      authState.value.isProcessing = false;
      authState.value.currentProvider = null;
    }
  };

  /**
   * Demo giriş işlemi
   * @returns {Object} - Demo kullanıcısı
   */
  const demoLogin = async () => {
    try {
      authState.value.isProcessing = true;
      
      // Demo kullanıcısı
      const demoUser = {
        uid: 'demo-user-1',
        email: 'demo@elektrotrack.com',
        displayName: 'Demo Kullanıcı',
        role: 'admin',
        department: 'Yönetim',
        demo: true
      };
      
      return { success: true, user: demoUser, demo: true };
    } catch (error) {
      console.error("Demo giriş hatası:", error);
      return { success: false, error: error.message };
    } finally {
      authState.value.isProcessing = false;
    }
  };

  /**
   * Şifre sıfırlama
   * @param {string} email - Kullanıcı e-posta adresi
   * @returns {Promise} - Şifre sıfırlama işlemi sonucu
   */
  const resetPassword = async (email) => {
    try {
      authState.value.isProcessing = true;
      authState.value.lastError = null;
      
      if (!email) {
        return { success: false, error: 'E-posta adresinizi giriniz' };
      }
      
      // Email formatını kontrol et
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, error: 'Geçerli bir e-posta adresi giriniz' };
      }
      
      // Firebase ile şifre sıfırlama e-postası gönder
      if (typeof firebase !== 'undefined' && firebase.auth) {
        try {
          await firebase.auth().sendPasswordResetEmail(email);
          return { success: true };
        } catch (authError) {
          console.error("Şifre sıfırlama hatası:", authError);
          
          let errorMessage = 'Şifre sıfırlama bağlantısı gönderilirken bir hata oluştu.';
          
          if (authError.code) {
            switch(authError.code) {
              case 'auth/user-not-found':
                errorMessage = 'Bu e-posta adresi ile kayıtlı bir kullanıcı bulunamadı.';
                break;
              case 'auth/invalid-email':
                errorMessage = 'Geçersiz e-posta adresi.';
                break;
              case 'auth/network-request-failed':
                errorMessage = 'Ağ hatası. İnternet bağlantınızı kontrol edin.';
                break;
            }
          }
          
          authState.value.lastError = authError;
          
          return { success: false, error: errorMessage, code: authError.code };
        }
      } else {
        // Demo modunda şifre sıfırlama
        console.log("Firebase Auth bulunamadı, demo şifre sıfırlama");
        return { success: true, demo: true };
      }
    } catch (error) {
      console.error("Şifre sıfırlama hatası:", error);
      authState.value.lastError = error;
      return { success: false, error: error.message };
    } finally {
      authState.value.isProcessing = false;
    }
  };

  /**
   * Kullanıcı kaydı yap
   * @param {Object} userData - Kullanıcı bilgileri
   * @returns {Promise} - Kayıt işlemi sonucu
   */
  const register = async (userData) => {
    try {
      authState.value.isProcessing = true;
      authState.value.lastError = null;
      
      const { name, email, username, department, password } = userData;
      
      // Validasyon kontrolleri
      if (!name || !email || !username || !department || !password) {
        return { success: false, error: 'Tüm alanları doldurunuz' };
      }
      
      // Şifre gücünü kontrol et
      if (password.length < 6) {
        return { success: false, error: 'Şifre en az 6 karakter olmalı' };
      }
      
      // Email formatını kontrol et
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, error: 'Geçerli bir e-posta adresi giriniz' };
      }
      
      // Firebase ile kullanıcı oluştur
      if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
        try {
          // Kullanıcı adı kontrolü - mevcut bir kullanıcı adı mı?
          const usernameQuery = await firebase.firestore().collection('users')
            .where('username', '==', username)
            .get();
          
          if (!usernameQuery.empty) {
            return { success: false, error: 'Bu kullanıcı adı zaten kullanımda' };
          }
          
          // Kullanıcı oluştur
          const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
          const user = userCredential.user;
          
          // Kullanıcı adını güncelle
          await user.updateProfile({
            displayName: name
          });
          
          // Kullanıcı bilgilerini Firestore'a kaydet
          await firebase.firestore().collection('users').doc(user.uid).set({
            name,
            email,
            username,
            department,
            role: 'user',
            createdAt: new Date(),
            lastLogin: new Date()
          });
          
          return { success: true, user };
        } catch (authError) {
          console.error("Kayıt hatası:", authError);
          
          let errorMessage = 'Kayıt işlemi sırasında bir hata oluştu.';
          
          if (authError.code) {
            switch(authError.code) {
              case 'auth/email-already-in-use':
                errorMessage = 'Bu e-posta adresi zaten kullanımda.';
                break;
              case 'auth/invalid-email':
                errorMessage = 'Geçersiz e-posta adresi.';
                break;
              case 'auth/weak-password':
                errorMessage = 'Şifre çok zayıf.';
                break;
              case 'auth/network-request-failed':
                errorMessage = 'Ağ hatası. İnternet bağlantınızı kontrol edin.';
                break;
            }
          }
          
          authState.value.lastError = authError;
          
          return { success: false, error: errorMessage, code: authError.code };
        }
      } else {
        // Demo modunda kayıt
        console.log("Firebase Auth bulunamadı, demo kayıt");
        return { success: true, demo: true };
      }
    } catch (error) {
      console.error("Kayıt hatası:", error);
      authState.value.lastError = error;
      return { success: false, error: error.message };
    } finally {
      authState.value.isProcessing = false;
    }
  };

  /**
   * Kullanıcı çıkışı yap
   * @returns {Promise} - Çıkış işlemi sonucu
   */
  const logout = async () => {
    try {
      authState.value.isProcessing = true;
      
      if (typeof firebase !== 'undefined' && firebase.auth) {
        await firebase.auth().signOut();
      }
      
      return { success: true };
    } catch (error) {
      console.error("Çıkış hatası:", error);
      return { success: false, error: error.message };
    } finally {
      authState.value.isProcessing = false;
    }
  };

  /**
   * Kullanıcı bilgilerini Firestore'dan al
   * @param {Object} user - Firebase kullanıcı nesnesi
   * @returns {Promise} - Firestore'dan alınan kullanıcı bilgisi
   */
  const loadUserData = async (user) => {
    if (!user || !user.uid) return null;
    
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      try {
        const doc = await firebase.firestore().collection('users').doc(user.uid).get();
        
        if (doc.exists) {
          return doc.data();
        } else {
          console.log('Kullanıcı veritabanında bulunamadı:', user.uid);
          return null;
        }
      } catch (error) {
        console.error("Kullanıcı bilgileri yükleme hatası:", error);
        return null;
      }
    }
    
    return null;
  };

  /**
   * Mevcut oturumu kontrol et
   * @returns {Promise} - Auth durumu
   */
  const checkAuth = async () => {
    return new Promise((resolve) => {
      if (typeof firebase !== 'undefined' && firebase.auth) {
        const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
          if (user) {
            // Kullanıcı girişli
            const userData = await loadUserData(user);
            unsubscribe();
            resolve({ isAuthenticated: true, user: { ...user, ...userData } });
          } else {
            // Kullanıcı girişli değil
            unsubscribe();
            resolve({ isAuthenticated: false, user: null });
          }
        });
      } else {
        // Firebase yok, demo mod kontrolü
        const shouldUseDemoMode = window.location.href.includes('demo=true');
        
        if (shouldUseDemoMode) {
          // Demo kullanıcısı oluştur
          const demoUser = {
            uid: 'demo-user',
            email: 'demo@elektrotrack.com',
            displayName: 'Demo Kullanıcı',
            role: 'admin',
            department: 'Yönetim',
            demo: true
          };
          
          resolve({ isAuthenticated: true, user: demoUser, demo: true });
        } else {
          resolve({ isAuthenticated: false, user: null });
        }
      }
    });
  };

  return {
    authState,
    login,
    loginWithGoogle,
    demoLogin,
    register,
    resetPassword,
    logout,
    checkAuth
  };
}