<template>
  <div class="modal fade" id="addUserModalComponent" tabindex="-1" aria-labelledby="addUserModalLabel" aria-hidden="true" ref="modalRef">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="addUserModalLabel">Yeni Kullanıcı Ekle</h5>
          <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="addUser">
            <div class="mb-3">
              <label for="userName" class="form-label">Ad Soyad</label>
              <input type="text" class="form-control" id="userName" v-model="userData.name" required>
            </div>
            <div class="mb-3">
              <label for="userEmail" class="form-label">E-posta</label>
              <input type="email" class="form-control" id="userEmail" v-model="userData.email" required>
            </div>
            <div class="mb-3">
              <label for="userDepartment" class="form-label">Departman</label>
              <select class="form-select" id="userDepartment" v-model="userData.department" required>
                <option value="" disabled>Seçiniz</option>
                <option>Satış</option>
                <option>Proje Yönetimi</option>
                <option>Elektrik Tasarım</option>
                <option>Mekanik Tasarım</option>
                <option>Satın Alma</option>
                <option>Mekanik Üretim</option>
                <option>İç Montaj</option>
                <option>Kablaj</option>
                <option>Genel Montaj</option>
                <option>Test</option>
                <option>Yönetim</option>
              </select>
            </div>
            <div class="mb-3">
              <label for="userRole" class="form-label">Rol</label>
              <select class="form-select" id="userRole" v-model="userData.role" required>
                 <option value="" disabled>Seçiniz</option>
                <option>Kullanıcı</option>
                <option>Yönetici</option>
                <option>Süper Yönetici</option>
              </select>
            </div>
            <div class="mb-3">
              <label for="userPassword" class="form-label">Şifre</label>
              <input type="password" class="form-control" id="userPassword" v-model="userData.password" required>
            </div>
            <div class="mb-3">
              <label for="userPasswordConfirm" class="form-label">Şifre Tekrar</label>
              <input type="password" class="form-control" id="userPasswordConfirm" v-model="userData.passwordConfirm" required>
            </div>
            <div class="mb-3">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="userActive" v-model="userData.isActive" checked>
                <label class="form-check-label" for="userActive">
                  Kullanıcı aktif
                </label>
              </div>
            </div>
             <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">Kapat</button>
          <button type="button" class="btn btn-primary" @click="addUser">Kullanıcı Ekle</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { Modal } from 'bootstrap';
// import userService from '@/services/user-service'; // Gerçek servis

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['close', 'user-added']);

const modalRef = ref(null);
let modalInstance = null;
const errorMessage = ref('');

const userData = ref({
  name: '',
  email: '',
  department: '',
  role: '',
  password: '',
  passwordConfirm: '',
  isActive: true
});

onMounted(() => {
  if (modalRef.value) {
    modalInstance = new Modal(modalRef.value);

    // Props'tan gelen show değerine göre modal'ı aç/kapa
    watch(() => props.show, (newValue) => {
        if (newValue) {
            resetForm();
            modalInstance?.show();
        } else {
            modalInstance?.hide();
        }
    });

    // Modal kapandığında emit yap
    modalRef.value.addEventListener('hidden.bs.modal', () => {
        emit('close');
    });
  }
});

onBeforeUnmount(() => {
  modalInstance?.dispose();
});

const resetForm = () => {
    userData.value = {
        name: '',
        email: '',
        department: '',
        role: '',
        password: '',
        passwordConfirm: '',
        isActive: true
    };
    errorMessage.value = '';
};

const closeModal = () => {
  emit('close'); // Parent'a kapatma olayını bildir
};

const addUser = async () => {
  errorMessage.value = ''; // Hata mesajını sıfırla
  if (userData.value.password !== userData.value.passwordConfirm) {
    errorMessage.value = 'Şifreler eşleşmiyor.';
    return;
  }
  if (!userData.value.name || !userData.value.email || !userData.value.department || !userData.value.role || !userData.value.password) {
      errorMessage.value = 'Lütfen tüm zorunlu alanları doldurun.';
      return;
  }

  console.log('Adding user:', userData.value);
  try {
      // const newUser = await userService.addUser({ ...userData.value }); // Şifre tekrarı gönderilmez
      // console.log('User added successfully:', newUser);
      // emit('user-added', newUser);
      alert('Kullanıcı başarıyla eklendi (simülasyon).');
      closeModal();
  } catch (error) {
      console.error('Kullanıcı eklenemedi:', error);
      errorMessage.value = 'Kullanıcı eklenirken bir hata oluştu: ' + (error.message || 'Bilinmeyen Hata');
      // alert('Kullanıcı eklenirken bir hata oluştu.');
  }
};
</script>

<style scoped>
/* İsteğe bağlı özel stiller */
</style> 