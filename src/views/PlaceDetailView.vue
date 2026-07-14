<template>
  <section class="section" v-if="place">
    <div class="container detail-layout">
      <div>
        <RouterLink class="back-link" to="/explore"><ArrowLeft :size="16" /> 탐색으로</RouterLink>
        <article class="place-detail panel">
          <img :src="place.image" :alt="place.name" />
          <div class="detail-body">
            <span class="badge">{{ place.category }}</span>
            <h1>{{ place.name }}</h1>
            <p>{{ place.summary }}</p>
            <div class="tag-row">
              <span v-for="tag in place.tags" :key="tag">#{{ tag }}</span>
            </div>
          </div>
        </article>
      </div>

      <aside class="side-info">
        <div class="panel info-panel">
          <h2>방문 정보</h2>
          <p><MapPin :size="16" /> {{ place.address }}</p>
          <p><Clock :size="16" /> {{ place.hours }}</p>
          <p><Ticket :size="16" /> {{ place.price }}</p>
          <p><Star :size="16" /> 평점 {{ place.rating }} · 후기 {{ place.reviews.toLocaleString() }}개</p>
        </div>
        <div class="panel info-panel">
          <h2>근처 추천</h2>
          <RouterLink
            v-for="nearby in nearbyPlaces"
            :key="nearby.id"
            :to="`/places/${nearby.id}`"
            class="nearby-row"
          >
            <img :src="nearby.image" :alt="nearby.name" />
            <span>{{ nearby.name }}</span>
          </RouterLink>
        </div>
      </aside>
    </div>
  </section>
  <NotFoundView v-else />
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft, Clock, MapPin, Star, Ticket } from '@lucide/vue'
import { places } from '../data/localhub'
import NotFoundView from './NotFoundView.vue'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
})

const place = computed(() => places.find((item) => item.id === Number(props.id)))
const nearbyPlaces = computed(() =>
  places.filter((item) => item.id !== Number(props.id)).slice(0, 3),
)
</script>

<style scoped>
.detail-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 14px;
  color: var(--muted);
  font-weight: 750;
}

.place-detail {
  overflow: hidden;
}

.place-detail > img {
  width: 100%;
  height: 430px;
  object-fit: cover;
}

.detail-body {
  padding: 24px;
}

h1 {
  margin: 14px 0 12px;
  font-size: 2.4rem;
}

.detail-body p {
  margin: 0;
  color: var(--muted);
  line-height: 1.75;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.tag-row span {
  padding: 7px 10px;
  color: var(--primary);
  background: var(--primary-soft);
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 800;
}

.side-info {
  display: grid;
  align-content: start;
  gap: 14px;
}

.info-panel {
  padding: 18px;
}

.info-panel h2 {
  margin: 0 0 14px;
  font-size: 1rem;
}

.info-panel p {
  display: flex;
  gap: 9px;
  margin: 0;
  padding: 11px 0;
  color: var(--muted);
  border-top: 1px solid var(--line-soft);
  font-size: 0.9rem;
  line-height: 1.45;
}

.nearby-row {
  display: grid;
  align-items: center;
  grid-template-columns: 72px 1fr;
  gap: 10px;
  padding: 9px 0;
  border-top: 1px solid var(--line-soft);
  font-weight: 800;
}

.nearby-row img {
  width: 72px;
  height: 48px;
  object-fit: cover;
  border-radius: var(--radius);
}

@media (max-width: 900px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .place-detail > img {
    height: 300px;
  }
}
</style>
