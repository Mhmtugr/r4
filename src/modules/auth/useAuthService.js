/**
 * useAuthService.js
 * Firebase kimlik doğrulama işlevleri için composable
 */

import { ref } from 'vue';
import { useToast } from '@/composables/useToast';

export function useAuthService() {
  const { showToast } = useToast();
  
  // Auth state
  const isProcessing = ref(false);
  const lastError = ref(null);
  const currentProvider = ref(null);
  const currentUser = ref(null);
  
  /**
   * Kullanıcı girişi yap
   * @param {string} email - Kullanıcı e-posta adresi
   * @param {string} password - Kullanıcı şifresi
   * @returns {Promise} - Giriş işlemi sonucu
   */
  async function login(email = null, password = null) {
    try {
      // İşlem durumunu güncelle
      isProcessing.value = true;
      lastError.value = null;
      
      if(!email || !password) {
        showToast('E-posta ve şifre giriniz', 'warning');
        isProcessing.value = false;
        return { success: false, error: 'E-posta ve şifre giriniz' };
      }
      
      // Firebase ile giriş yap
      if (typeof firebase !== 'undefined' && firebase.auth) {
        try {
          const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
          const user = userCredential.user;
          
          console.log("Firebase ile giriş başarılı:", user.email);
          
          // Kullanıcı bilgilerini Firestore'dan al
          await loadUserData(user);
          
          // Giriş başarılı mesajı
          showToast(`Hoş geldiniz, ${user.displayName || user.email}`, 'success');
          
          // Auth durumunu güncelle
          isProcessing.value = false;
          currentUser.value = user;
          
          return { success: true, user };
        } catch (authError) {
          console.error("Firebase giriş hatası:", authError);
          
          // Auth durumunu güncelle
          isProcessing.value = false;
          lastError.value = authError;
          
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
          
          showToast(errorMessage, 'error');
          
          // Firebase bağlantı sorunu varsa demo moda geç
          if (authError.code === 'auth/network-request-failed' || authError.code === 'auth/internal-error') {
            enableDemoModeWithLoginPrompt(email);
          }
          
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
          role: 'admin'
        };
        
        // Demo giriş mesajı göster
        showToast('Demo modunda giriş yapıldı', 'info');
        
        // Auth durumunu güncelle
        isProcessing.value = false;
        currentUser.value = demoUser;
        
        return { success: true, user: demoUser, demo: true };
      }
    } catch (error) {
      console.error("Giriş işlemi hatası:", error);
      
      // Auth durumunu güncelle
      isProcessing.value = false;
      lastError.value = error;
      
      showToast('Giriş yapılırken bir hata oluştu', 'error');
      
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Kullanıcı çıkışı yap
   */
  async function logout() {
    try {
      // İşlem durumunu güncelle
      isProcessing.value = true;
      lastError.value = null;
      
      // Firebase ile çıkış yap
      if (typeof firebase !== 'undefined' && firebase.auth) {
        try {
          await firebase.auth().signOut();
          
          showToast('Başarıyla çıkış yapıldı', 'success');
        } catch (authError) {
          console.error("Çıkış hatası:", authError);
          showToast('Çıkış yapılırken bir hata oluştu', 'error');
        }
      } else {
        // Demo modunda çıkış
        showToast('Demo modundan çıkış yapıldı', 'info');
      }
      
      // Kullanıcı değişkenini temizle
      currentUser.value = null;
      
      // Auth durumunu güncelle
      isProcessing.value = false;
      
      return { success: true };
    } catch (error) {
      console.error("Çıkış hatası:", error);
      
      // Auth durumunu güncelle
      isProcessing.value = false;
      lastError.value = error;
      
      showToast('Çıkış yapılırken bir hata oluştu', 'error');
      
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Şifre sıfırlama
   * @param {string} email - Kullanıcı e-posta adresi
   * @returns {Promise} - Şifre sıfırlama işlemi sonucu
   */
  async function resetPassword(email = null) {
    try {
      // İşlem durumunu güncelle
      isProcessing.value = true;
      lastError.value = null;
      
      if(!email) {
        showToast('E-posta adresinizi giriniz', 'warning');
        isProcessing.value = false;
        return { success: false, error: 'E-posta adresinizi giriniz' };
      }
      
      // Email formatını kontrol et
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if(!emailRegex.test(email)) {
        showToast('Geçerli bir e-posta adresi giriniz', 'warning');
        isProcessing.value = false;
        return { success: false, error: 'Geçerli bir e-posta adresi giriniz' };
      }
      
      // Firebase ile şifre sıfırlama e-postası gönder
      if (typeof firebase !== 'undefined' && firebase.auth) {
        try {
          await firebase.auth().sendPasswordResetEmail(email);
          
          showToast(`${email} adresine şifre sıfırlama bağlantısı gönderildi.`, 'success');
          
          // Auth durumunu güncelle
          isProcessing.value = false;
          
          return { success: true };
        } catch (authError) {
          console.error("Şifre sıfırlama hatası:", authError);
          
          // Auth durumunu güncelle
          isProcessing.value = false;
          lastError.value = authError;
          
          let errorMessage = 'Şifre sıfırlama bağlantısı gönderilirken bir hata oluştu.';
          
          if (authError.code) {
            switch(authError.code) {
              case 'auth/user-not-found':
                errorMessage = 'Bu e-posta adresi ile kayıtlı bir kullanıcı bulunamadı.';
                break;
              case 'auth/invalid-email':
                errorMessage = 'Geçersiz e-posta adresi.';
                break;
            }
          }
          
          showToast(errorMessage, 'error');
          
          return { success: false, error: errorMessage, code: authError.code };
        }
      } else {
        // Demo modunda şifre sıfırlama
        console.log("Firebase Auth bulunamadı, demo şifre sıfırlama");
        
        showToast('Demo modunda şifre sıfırlama işlemi gerçekleştirildi', 'info');
        
        // Auth durumunu güncelle
        isProcessing.value = false;
        
        return { success: true, demo: true };
      }
    } catch (error) {
      console.error("Şifre sıfırlama hatası:", error);
      
      // Auth durumunu güncelle
      isProcessing.value = false;
      lastError.value = error;
      
      showToast('Şifre sıfırlama işlemi sırasında bir hata oluştu', 'error');
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Demo modu ile giriş yapma
   * @param {string} email - Kullanıcı e-posta adresi (opsiyonel)
   */
  function enableDemoModeWithLoginPrompt(email = 'demo@elektrotrack.com') {
    setTimeout(() => {
      const shouldSwitchToDemo = confirm("Firebase bağlantısı kurulamadı. Demo modunda devam etmek ister misiniz?");
      if (shouldSwitchToDemo) {
        // Demo kullanıcısını oluştur ve login et
        demoLogin(email);
      }
    }, 500);
  }

  /**
   * Demo giriş işlemi
   * @param {string} email - Demo kullanıcı e-postası
   * @returns {Object} - Demo kullanıcısı
   */
  function demoLogin(email = 'demo@elektrotrack.com') {
    // Demo kullanıcısı
    const demoUser = {
      uid: 'demo-user-1',
      email: email,
      displayName: email.split('@')[0] || 'Demo Kullanıcı',
      role: 'admin',
      department: 'Yönetim'
    };
    
    // Demo giriş mesajı göster
    showToast('Demo modunda giriş yapıldı', 'info');
    
    // Auth durumunu güncelle
    currentUser.value = demoUser;
    
    return demoUser;
  }
  
  /**
   * Kullanıcı bilgilerini Firebase'den al ve yükle
   * @param {Object} user - Firebase kullanıcı objesi
   * @returns {Promise} - Kullanıcı verileri
   */
  async function loadUserData(user) {
    try {
      if (!user || !user.uid) {
        console.warn("Geçerli bir kullanıcı sağlanmadı");
        return null;
      }
      
      if (!firebase || !firebase.firestore) {
        console.warn("Firebase Firestore bulunamadı, kullanıcı bilgileri alınamadı");
        return null;
      }
      
      const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        
        // Kullanıcı bilgilerini mevcut değişkene ata
        currentUser.value = {
          ...user,
          ...userData
        };
        
        // Son giriş zamanını güncelle
        firebase.firestore().collection('users').doc(user.uid).update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(error => {
          console.warn("Son giriş zamanı güncellenemedi:", error);
        });
        
        return userData;
      } else {
        console.warn("Kullanıcı verisi bulunamadı, oluşturuluyor");
        
        // Kullanıcı verisini oluştur
        const newUserData = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
          role: 'user'
        };
        
        // Firestore'a kaydet
        await firebase.firestore().collection('users').doc(user.uid).set(newUserData);
        
        // Kullanıcı değişkenine ata
        currentUser.value = {
          ...user,
          ...newUserData
        };
        
        return newUserData;
      }
    } catch (error) {
      console.error("Kullanıcı verileri yüklenirken hata:", error);
      return null;
    }
  }

  /**
   * Kullanıcının rolünü kontrol et (admin, manager, user vb.)
   * @param {string} requiredRole - Gerekli rol
   * @returns {boolean} - Kullanıcının gerekli role sahip olup olmadığı
   */
  function checkUserRole(requiredRole) {
    // Geçerli kullanıcıyı kontrol et
    if (!currentUser.value) {
      console.warn("Oturum açmış kullanıcı yok");
      return false;
    }
    
    // Kullanıcı rolünü al
    const userRole = currentUser.value.role || 'user';
    
    // Admin her şeyi yapabilir
    if (userRole === 'admin') {
      return true;
    }
    
    // Rol hiyerarşisi
    const roleHierarchy = {
      'admin': 100,
      'manager': 80,
      'supervisor': 60,
      'editor': 40,
      'user': 20,
      'guest': 10
    };
    
    // Rol puanlarını kontrol et
    const userRoleScore = roleHierarchy[userRole] || 0;
    const requiredRoleScore = roleHierarchy[requiredRole] || 100;
    
    return userRoleScore >= requiredRoleScore;
  }
  
  /**
   * Kullanıcı kaydı yap
   * @param {Object} userData - Kullanıcı bilgileri (email, password, name, vb.)
   * @returns {Promise} - Kayıt işlemi sonucu
   */
  async function register(userData) {
    try {
      // İşlem durumunu güncelle
      isProcessing.value = true;
      lastError.value = null;
      
      // Validasyon kontrolleri
      if(!userData.name || !userData.email || !userData.password || !userData.confirmPassword) {
        showToast('Tüm alanları doldurunuz', 'warning');
        isProcessing.value = false;
        return { success: false, error: 'Tüm alanları doldurunuz' };
      }
      
      if(userData.password !== userData.confirmPassword) {
        showToast('Şifreler eşleşmiyor', 'warning');
        isProcessing.value = false;
        return { success: false, error: 'Şifreler eşleşmiyor' };
      }
      
      // Email formatını kontrol et
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if(!emailRegex.test(userData.email)) {
        showToast('Geçerli bir e-posta adresi giriniz', 'warning');
        isProcessing.value = false;
        return { success: false, error: 'Geçerli bir e-posta adresi giriniz' };
      }
      
      // Firebase ile kullanıcı oluştur
      if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
        try {
          // Kullanıcı adı kontrolü - mevcut bir kullanıcı adı mı?
          if (userData.username) {
            const usernameQuery = await firebase.firestore().collection('users')
              .where('username', '==', userData.username)
              .get();
            
            if (!usernameQuery.empty) {
              showToast('Bu kullanıcı adı zaten kullanımda', 'warning');
              isProcessing.value = false;
              return { success: false, error: 'Bu kullanıcı adı zaten kullanımda' };
            }
          }
          
          // Kullanıcı oluştur
          const userCredential = await firebase.auth().createUserWithEmailAndPassword(userData.email, userData.password);
          const user = userCredential.user;
          
          // Kullanıcı bilgilerini Firestore'a kaydet
          await firebase.firestore().collection('users').doc(user.uid).set({
            name: userData.name,
            email: userData.email,
            username: userData.username || userData.email.split('@')[0],
            department: userData.department || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            role: 'user', // Varsayılan rol
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
          });
          
          // Displayname güncelle
          await user.updateProfile({
            displayName: userData.name
          });
          
          showToast('Kayıt işlemi başarılı! Giriş yapabilirsiniz.', 'success');
          
          // Auth durumunu güncelle
          isProcessing.value = false;
          
          return { success: true, user };
        } catch (authError) {
          console.error("Firebase kayıt hatası:", authError);
          
          // Auth durumunu güncelle
          isProcessing.value = false;
          lastError.value = authError;
          
          let errorMessage = 'Kayıt olurken bir hata oluştu.';
          
          if (authError.code) {
            switch(authError.code) {
              case 'auth/email-already-in-use':
                errorMessage = 'Bu e-posta adresi zaten kullanımda.';
                break;
              case 'auth/invalid-email':
                errorMessage = 'Geçersiz e-posta adresi.';
                break;
              case 'auth/weak-password':
                errorMessage = 'Şifre çok zayıf, daha güçlü bir şifre seçin.';
                break;
            }
          }
          
          showToast(errorMessage, 'error');
          
          return { success: false, error: errorMessage, code: authError.code };
        }
      } else {
        // Firebase yoksa demo kayıt yap
        console.log("Firebase Auth bulunamadı, demo kayıt yapılıyor");
        
        showToast('Demo modunda kayıt işlemi şu an desteklenmiyor.', 'info');
        
        // Auth durumunu güncelle
        isProcessing.value = false;
        
        return { success: false, demo: true, error: 'Demo modunda kayıt işlemi desteklenmiyor' };
      }
    } catch (error) {
      console.error("Kayıt hatası:", error);
      
      // Auth durumunu güncelle
      isProcessing.value = false;
      lastError.value = error;
      
      showToast('Kayıt olurken bir hata oluştu', 'error');
      return { success: false, error: error.message };
    }
  }
  
  return {
    // State
    isProcessing,
    lastError,
    currentProvider,
    currentUser,
    
    // Methods
    login,
    logout,
    resetPassword,
    register,
    demoLogin,
    checkUserRole,
    loadUserData
  };
}