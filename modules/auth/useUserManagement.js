/**
 * useUserManagement.js
 * Kullanıcı yönetimi işlevleri için composable
 */

import { ref } from 'vue';
import { useToast } from '@/composables/useToast';

export function useUserManagement() {
  const { showToast } = useToast();
  
  // Process state
  const isProcessing = ref(false);
  const lastError = ref(null);
  
  /**
   * Kullanıcı bilgilerini güncelleme
   * @param {Object} userData - Güncellenecek kullanıcı bilgileri
   * @returns {Promise} - Güncelleme işlemi sonucu
   */
  async function updateProfile(userData) {
    try {
      // İşlem durumunu güncelle
      isProcessing.value = true;
      lastError.value = null;
      
      // Firebase kontrolü
      if (!firebase || !firebase.firestore) {
        showToast('Demo modunda profil güncelleme işlemi mevcut değil', 'info');
        isProcessing.value = false;
        return { success: false, error: 'Demo modunda profil güncelleme işlemi mevcut değil' };
      }
      
      // Geçerli kullanıcıyı al
      const user = firebase.auth().currentUser;
      if (!user) {
        showToast('Kullanıcı oturumu bulunamadı', 'error');
        isProcessing.value = false;
        return { success: false, error: 'Kullanıcı oturumu bulunamadı' };
      }
      
      // Sadece izin verilen alanları güncelle
      const allowedFields = ['name', 'department', 'phone', 'photoURL'];
      const updateData = {};
      
      for (const field of allowedFields) {
        if (userData[field] !== undefined) {
          updateData[field] = userData[field];
        }
      }
      
      // Son güncelleme zamanını ekle
      updateData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      
      // Kullanıcı bilgilerini güncelle
      await firebase.firestore().collection('users').doc(user.uid).update(updateData);
      
      // Displayname güncelle (Firebase Auth)
      if (userData.name) {
        try {
          await user.updateProfile({
            displayName: userData.name,
            ...(userData.photoURL ? { photoURL: userData.photoURL } : {})
          });
        } catch (profileError) {
          console.warn("DisplayName güncellenemedi:", profileError);
        }
      }
      
      // Eğer e-posta değiştirilmişse (özellikle izin verilmişse)
      if (userData.email && userData.email !== user.email && userData.allowEmailChange) {
        try {
          await user.updateEmail(userData.email);
          updateData.email = userData.email;
          
          // E-posta doğrulama gönder
          await user.sendEmailVerification();
          
          showToast('E-posta adresiniz güncellendi ve doğrulama e-postası gönderildi', 'info');
        } catch (emailError) {
          console.error("E-posta güncellenirken hata:", emailError);
          showToast('E-posta güncellenirken bir hata oluştu: ' + (emailError.message || emailError), 'error');
        }
      }
      
      showToast('Profil bilgileriniz başarıyla güncellendi', 'success');
      
      // İşlem durumunu güncelle
      isProcessing.value = false;
      
      return { success: true, updatedData: updateData };
    } catch (error) {
      console.error("Profil güncelleme hatası:", error);
      
      // İşlem durumunu güncelle
      isProcessing.value = false;
      lastError.value = error;
      
      showToast('Profil güncellenirken bir hata oluştu: ' + error.message, 'error');
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Şifre değiştirme
   * @param {string} currentPassword - Mevcut şifre
   * @param {string} newPassword - Yeni şifre
   * @returns {Promise} - Şifre değiştirme işlemi sonucu
   */
  async function changePassword(currentPassword, newPassword) {
    try {
      // İşlem durumunu güncelle
      isProcessing.value = true;
      lastError.value = null;
      
      // Firebase kontrolü
      if (!firebase || !firebase.auth) {
        showToast('Demo modunda şifre değiştirme işlemi mevcut değil', 'info');
        isProcessing.value = false;
        return { success: false, error: 'Demo modunda şifre değiştirme işlemi mevcut değil' };
      }
      
      // Geçerli kullanıcıyı al
      const user = firebase.auth().currentUser;
      if (!user) {
        showToast('Kullanıcı oturumu bulunamadı', 'error');
        isProcessing.value = false;
        return { success: false, error: 'Kullanıcı oturumu bulunamadı' };
      }
      
      // Mevcut şifreyi doğrula
      const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
      
      // Kullanıcıyı yeniden doğrula
      await user.reauthenticateWithCredential(credential);
      
      // Şifreyi güncelle
      await user.updatePassword(newPassword);
      
      showToast('Şifreniz başarıyla güncellendi', 'success');
      
      // İşlem durumunu güncelle
      isProcessing.value = false;
      
      return { success: true };
    } catch (error) {
      console.error("Şifre değiştirme hatası:", error);
      
      // İşlem durumunu güncelle
      isProcessing.value = false;
      lastError.value = error;
      
      // Hata mesajına göre kullanıcıya bilgi ver
      let errorMessage = 'Şifre değiştirilirken bir hata oluştu.';
      
      if (error.code) {
        switch(error.code) {
          case 'auth/wrong-password':
            errorMessage = 'Mevcut şifreniz hatalı.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Yeni şifre çok zayıf, daha güçlü bir şifre seçin.';
            break;
          case 'auth/requires-recent-login':
            errorMessage = 'Bu işlem için yakın zamanda giriş yapmanız gerekiyor. Lütfen çıkış yapıp tekrar giriş yapın.';
            break;
        }
      }
      
      showToast(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  }
  
  /**
   * Kullanıcı hesabını sil
   * @param {string} password - Doğrulama için şifre (email provider için)
   * @returns {Promise} - Hesap silme işlemi sonucu
   */
  async function deleteAccount(password = null) {
    try {
      // Kullanıcı onayı
      const confirmDelete = confirm("Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.");
      if (!confirmDelete) {
        return { success: false, error: 'İşlem iptal edildi' };
      }
      
      // İşlem durumunu güncelle
      isProcessing.value = true;
      lastError.value = null;
      
      // Firebase kontrolü
      if (!firebase || !firebase.auth) {
        showToast('Demo modunda hesap silme işlemi mevcut değil', 'info');
        isProcessing.value = false;
        return { success: false, error: 'Demo modunda hesap silme işlemi mevcut değil' };
      }
      
      // Geçerli kullanıcıyı al
      const user = firebase.auth().currentUser;
      if (!user) {
        showToast('Kullanıcı oturumu bulunamadı', 'error');
        isProcessing.value = false;
        return { success: false, error: 'Kullanıcı oturumu bulunamadı' };
      }
      
      // Eğer email/password ile giriş yapıldıysa, şifre doğrulaması yap
      if (user.providerData.some(provider => provider.providerId === 'password') && password) {
        // Mevcut şifreyi doğrula
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
        
        // Kullanıcıyı yeniden doğrula
        await user.reauthenticateWithCredential(credential);
      } else if (user.providerData.some(provider => provider.providerId === 'password') && !password) {
        // Email provider ama şifre sağlanmadı
        showToast('Hesabınızı silmek için şifrenizi giriniz', 'warning');
        isProcessing.value = false;
        return { success: false, error: 'Şifre gerekli', requiresPassword: true };
      }
      
      // Firestore'dan kullanıcı verilerini sil
      if (firebase.firestore) {
        try {
          await firebase.firestore().collection('users').doc(user.uid).delete();
          console.log("Kullanıcı Firestore verileri silindi");
        } catch (firestoreError) {
          console.warn("Kullanıcı Firestore verileri silinirken hata:", firestoreError);
        }
      }
      
      // Kullanıcı hesabını sil
      await user.delete();
      
      showToast('Hesabınız başarıyla silindi', 'success');
      
      // İşlem durumunu güncelle
      isProcessing.value = false;
      
      return { success: true };
    } catch (error) {
      console.error("Hesap silme hatası:", error);
      
      // İşlem durumunu güncelle
      isProcessing.value = false;
      lastError.value = error;
      
      let errorMessage = 'Hesap silinirken bir hata oluştu.';
      
      if (error.code) {
        switch(error.code) {
          case 'auth/wrong-password':
            errorMessage = 'Şifreniz hatalı.';
            break;
          case 'auth/requires-recent-login':
            errorMessage = 'Bu işlem için yakın zamanda giriş yapmanız gerekiyor. Lütfen çıkış yapıp tekrar giriş yapın.';
            break;
        }
      }
      
      showToast(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  }
  
  /**
   * Google ile giriş
   * @returns {Promise} - Google ile giriş işlemi sonucu
   */
  async function loginWithGoogle() {
    try {
      // İşlem durumunu güncelle
      isProcessing.value = true;
      lastError.value = null;
      
      // Firebase kontrolü
      if (!firebase || !firebase.auth) {
        showToast('Demo modunda sosyal giriş desteklenmiyor', 'info');
        isProcessing.value = false;
        return { success: false, error: 'Demo modunda sosyal giriş desteklenmiyor' };
      }
      
      // Google auth provider
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      // Google ile giriş yap
      const result = await firebase.auth().signInWithPopup(provider);
      const user = result.user;
      
      console.log("Google ile giriş başarılı:", user.email);
      
      showToast(`Hoş geldiniz, ${user.displayName || user.email}`, 'success');
      
      // İşlem durumunu güncelle
      isProcessing.value = false;
      
      return { success: true, user };
    } catch (error) {
      console.error("Google giriş hatası:", error);
      
      // İşlem durumunu güncelle
      isProcessing.value = false;
      lastError.value = error;
      
      // Eğer kullanıcı popup'ı kapattıysa
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Kullanıcı popup'ı kapattı");
        return { success: false, error: 'İşlem iptal edildi', code: error.code };
      }
      
      showToast('Google ile giriş yapılırken bir hata oluştu', 'error');
      return { success: false, error: error.message };
    }
  }

  return {
    // State
    isProcessing,
    lastError,
    
    // Methods
    updateProfile,
    changePassword,
    deleteAccount,
    loginWithGoogle
  };
}