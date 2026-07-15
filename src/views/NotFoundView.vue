<template>
  <section class="section">
    <div class="container not-found panel">
      <MapPinned :size="42" />
      <h1>{{ t('common.notFoundTitle') }}</h1>
      <p>{{ t('common.notFoundDescription') }}</p>
      <RouterLink class="btn btn-primary" to="/">{{ t('common.goHome') }}</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { MapPinned } from '@lucide/vue'

const { t } = useI18n()
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
