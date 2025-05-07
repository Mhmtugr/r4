<template>
  <div class="blank-layout">
    <main class="blank-content">
      <slot></slot>
    </main>
    <Notifications />
  </div>
</template>

<script setup>
import Notifications from '@/components/ui/Notifications.vue';
</script>

<style lang="scss">
@use "@/styles/base/variables" as vars;

.blank-layout {
  min-height: 100vh;
  display: flex;
  
  .blank-content {
    flex: 1;
    width: 100%;
  }
}
</style>