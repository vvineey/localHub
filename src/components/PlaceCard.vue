<template>
  <RouterLink class="place-card card" :to="`/places/${place.id}`">
    <div class="place-image">
      <img :src="place.image" :alt="place.name" loading="lazy" />
      <span class="badge">{{ categoryLabel(place.category) }}</span>
    </div>
    <div class="place-body">
      <h3>{{ place.name }}</h3>
      <p class="place-location"><MapPin :size="13" /> {{ place.district }}</p>
      <p class="line-clamp">{{ place.summary }}</p>
      <div class="place-meta">
        <span><Star :size="14" fill="currentColor" /> {{ place.rating }}</span>
        <span>{{ place.reviews.toLocaleString() }} {{ t('place.reviews') }}</span>
      </div>
    </div>
  </RouterLink>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { MapPin, Star } from '@lucide/vue'

defineProps({
  place: {
    type: Object,
    required: true,
  },
})

const { t, te } = useI18n()

function categoryLabel(category) {
  const key = `categoryLabels.${category}`
  return te(key) ? t(key) : category
}
</script>

<style scoped>
.place-card {
  display: block;
  overflow: hidden;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;
}

.place-card:hover {
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}

.place-image {
  position: relative;
  height: 178px;
  overflow: hidden;
  background: var(--placeholder);
}

.place-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 240ms ease;
}

.place-card:hover img {
  transform: scale(1.04);
}

.place-image .badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: var(--floating-surface);
  backdrop-filter: blur(8px);
}

.place-body {
  padding: 14px;
}

.place-body h3 {
  margin: 0 0 6px;
  font-size: 1rem;
}

.place-location {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0 0 9px;
  color: var(--muted);
  font-size: 0.84rem;
}

.place-body > .line-clamp {
  min-height: 42px;
  margin: 0;
  color: var(--muted);
  font-size: 0.86rem;
  line-height: 1.55;
}

.place-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 14px;
  color: var(--muted-light);
  font-size: 0.82rem;
}

.place-meta span:first-child {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--amber);
  font-weight: 900;
}
</style>
