<template>
  <section class="section">
    <div class="container">
      <div class="page-title">
        <h1>서울 지도 시각화</h1>
        <p>백엔드 서울 JSON 데이터의 좌표가 있는 장소를 지도 핀으로 확인합니다.</p>
      </div>

      <div class="map-layout">
        <div>
          <div class="chip-row map-filters">
            <button
              v-for="filter in filters"
              :key="filter.id"
              type="button"
              class="chip"
              :class="{ active: activeFilter === filter.id }"
              @click="activeFilter = filter.id"
            >
              {{ filter.label }}
            </button>
          </div>
          <MapPanel :pins="filteredPins" @select="selected = $event" />
        </div>

        <aside class="map-side">
          <h2>{{ selected ? selected.name : '선택한 핀 정보' }}</h2>
          <p v-if="!selected">지도 위 핀을 선택하면 이름과 분류가 표시됩니다.</p>
          <template v-else>
            <span class="badge">{{ labelFor(selected.type) }}</span>
            <p>백엔드 `/api/places`에서 불러온 좌표 데이터를 기준으로 표시합니다.</p>
          </template>
          <StatBars :items="stats" />
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import MapPanel from '../components/MapPanel.vue'
import StatBars from '../components/StatBars.vue'
import { mapPins as fallbackMapPins } from '../data/localhub'
import { fetchMapPins } from '../services/localHubApi'

const activeFilter = ref('all')
const selected = ref(null)
const mapPins = ref([...fallbackMapPins])

const filters = [
  { id: 'all', label: '전체' },
  { id: 'attraction', label: '관광지' },
  { id: 'nature', label: '자연' },
  { id: 'accommodation', label: '숙박' },
  { id: 'festival', label: '축제' },
  { id: 'shopping', label: '쇼핑' },
]

const filteredPins = computed(() =>
  activeFilter.value === 'all'
    ? mapPins.value
    : mapPins.value.filter((pin) => pin.type === activeFilter.value),
)

const stats = computed(() =>
  filters.slice(1).map((filter, index) => {
    const count = mapPins.value.filter((pin) => pin.type === filter.id).length
    return {
      label: filter.label,
      value: count,
      percent: Math.max(18, count * 20),
      color: ['#2563eb', '#10b981', '#06b6d4', '#f59e0b', '#8b5cf6'][index],
    }
  }),
)

function labelFor(type) {
  return filters.find((filter) => filter.id === type)?.label || type
}

onMounted(async () => {
  mapPins.value = await fetchMapPins()
})
</script>

<style scoped>
.map-layout {
  display: grid;
  grid-template-columns: 1fr 330px;
  gap: 18px;
}

.map-filters {
  margin-bottom: 12px;
}

.map-side {
  display: grid;
  align-content: start;
  gap: 14px;
}

.map-side h2 {
  margin: 0;
}

.map-side p {
  margin: 0;
  color: var(--muted);
  line-height: 1.65;
}

@media (max-width: 940px) {
  .map-layout {
    grid-template-columns: 1fr;
  }
}
</style>
