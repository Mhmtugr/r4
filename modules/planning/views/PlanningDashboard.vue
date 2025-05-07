<template>
  <div class="planning-dashboard">
    <h1>Planlama Paneli</h1>
    <p>Bu bölüm, siparişlere göre üretim planlaması, termin tarihleri yönetimi ve kaynak atamaları için kullanılacaktır.</p>
    <div class="alert alert-info" role="alert">
      Üretim planlama modülü yakında aktif olacaktır.
    </div>
  </div>
</template>

<script setup>
// İleride buraya planlama takvimi, kapasite analizleri ve sipariş önceliklendirme araçları eklenecek.
import { ref, onMounted } from 'vue';

// const planningSchedule = ref(null);

// onMounted(async () => {
//   // API'dan planlama verileri çekme işlemleri burada yapılacak
//   // planningSchedule.value = await fetchPlanningSchedule();
// });
</script>

<style scoped>
.planning-dashboard {
  padding: 1rem;
}
</style>