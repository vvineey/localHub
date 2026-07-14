<template>
  <section class="section">
    <div class="container">
      <div class="page-title">
        <h1>서울 지도 시각화</h1>
        <p>좌표가 있는 관광지, 자연, 숙박, 축제 데이터를 지도 핀으로 확인합니다.</p>
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
            <p>FastAPI locations 테이블의 좌표 필드를 연결하면 이 영역에 상세 정보와 링크를 추가할 수 있습니다.</p>
          </template>
          <StatBars :items="stats" />
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import MapPanel from '../components/MapPanel.vue'
import StatBars from '../components/StatBars.vue'
import { mapPins } from '../data/localhub'

const activeFilter = ref('all')
const selected = ref(null)

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
    ? mapPins
    : mapPins.filter((pin) => pin.type === activeFilter.value),
)

const stats = computed(() =>
  filters.slice(1).map((filter, index) => {
    const count = mapPins.filter((pin) => pin.type === filter.id).length
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
