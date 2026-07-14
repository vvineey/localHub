<template>
  <section class="section">
    <div class="container not-found panel">
      <MapPinned :size="42" />
      <h1>페이지를 찾을 수 없습니다</h1>
      <p>요청한 화면이 없거나 삭제되었습니다.</p>
      <RouterLink class="btn btn-primary" to="/">홈으로 이동</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { MapPinned } from '@lucide/vue'
</script>

<style scoped>
.not-found {
  display: grid;
  place-items: center;
  gap: 12px;
  min-height: 360px;
  padding: 40px 16px;
  text-align: center;
}

.not-found svg {
  color: var(--primary);
}

.not-found h1,
.not-found p {
  margin: 0;
}

.not-found p {
  color: var(--muted);
}
</style>
