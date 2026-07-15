<template>
  <section class="section">
    <div class="container">
      <div class="page-title">
        <h1>서울 관광지·맛집 지도</h1>
        <p>백엔드 서울 데이터의 좌표를 Kakao Maps 핀으로 표시하고 Kakao Local 행정동 정보를 연결합니다.</p>
      </div>

      <div class="map-layout">
        <div>
          <div class="map-toolbar">
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
            <span class="count-pill">{{ filteredPins.length.toLocaleString() }}개 표시</span>
          </div>
          <MapPanel :pins="filteredPins" @select="handleSelect" />
        </div>

        <aside class="map-side">
          <div class="pin-detail panel">
            <span v-if="selected" class="badge">{{ labelFor(selected.type) }}</span>
            <h2>{{ selected ? selected.name : '선택한 핀 정보' }}</h2>
            <p v-if="!selected">
              지도 위 핀을 선택하면 장소 정보와 Kakao Local 행정동 조회 결과가 표시됩니다.
            </p>
            <template v-else>
              <p>{{ selected.summary || '서울 장소 좌표 데이터입니다.' }}</p>
              <dl class="pin-meta">
                <div>
                  <dt>주소</dt>
                  <dd>{{ selected.address || '주소 미제공' }}</dd>
                </div>
                <div>
                  <dt>행정동</dt>
                  <dd>{{ regionLabel }}</dd>
                </div>
                <div>
                  <dt>좌표</dt>
                  <dd>{{ coordinateLabel }}</dd>
                </div>
              </dl>
            </template>
          </div>
          <StatBars :items="statBars" />
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
import { fetchAdministrativeDistrict, formatAdministrativeDistrict } from '../services/kakaoMapApi'
import { fetchMapPins } from '../services/localHubApi'

const activeFilter = ref('all')
const selected = ref(null)
const selectedRegion = ref(null)
const selectedRegionError = ref('')
const selectedRegionLoading = ref(false)
const mapPins = ref([...fallbackMapPins])
let regionRequestId = 0

const filters = [
  { id: 'all', label: '전체' },
  { id: 'attraction', label: '관광지' },
  { id: 'restaurant', label: '맛집' },
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
  filters.slice(1).map((filter) => ({
    ...filter,
    count: mapPins.value.filter((pin) => pin.type === filter.id).length,
  })),
)

const statBars = computed(() => {
  const maxCount = Math.max(...stats.value.map((item) => item.count), 1)
  const colors = {
    attraction: '#2563eb',
    restaurant: '#ef4444',
    nature: '#10b981',
    accommodation: '#06b6d4',
    festival: '#f59e0b',
    shopping: '#8b5cf6',
  }

  return stats.value.map((item) => ({
    label: item.label,
    value: item.count,
    percent: item.count ? Math.max(8, Math.round((item.count / maxCount) * 100)) : 0,
    color: colors[item.id],
  }))
})

const regionLabel = computed(() => {
  if (selectedRegionLoading.value) return '조회 중'
  if (selectedRegion.value) return formatAdministrativeDistrict(selectedRegion.value)
  if (selectedRegionError.value) return selectedRegionError.value
  return '행정동 정보 없음'
})

const coordinateLabel = computed(() =>
  selected.value && Number.isFinite(selected.value.lat) && Number.isFinite(selected.value.lng)
    ? `${selected.value.lat.toFixed(5)}, ${selected.value.lng.toFixed(5)}`
    : '좌표 미제공',
)

function labelFor(type) {
  return filters.find((filter) => filter.id === type)?.label || type
}

async function handleSelect(pin) {
  selected.value = pin
  selectedRegion.value = null
  selectedRegionError.value = ''
  selectedRegionLoading.value = true

  const requestId = ++regionRequestId

  try {
    const region = await fetchAdministrativeDistrict(pin)
    if (requestId !== regionRequestId) return

    selectedRegion.value = region
    selectedRegionError.value = region ? '' : '조회 결과 없음'
  } catch {
    if (requestId !== regionRequestId) return
    selectedRegionError.value = 'Kakao API 설정 필요'
  } finally {
    if (requestId === regionRequestId) {
      selectedRegionLoading.value = false
    }
  }
}

onMounted(async () => {
  mapPins.value = await fetchMapPins({ max: 360 })
})
</script>

<style scoped>
.map-layout {
  display: grid;
  grid-template-columns: 1fr 330px;
  gap: 18px;
}

.map-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.map-filters {
  flex: 1;
}

.count-pill {
  flex: 0 0 auto;
  padding: 8px 12px;
  color: #475569;
  background: #eef2ff;
  border: 1px solid #dbeafe;
  border-radius: 999px;
  font-size: 0.84rem;
  font-weight: 800;
}

.map-side {
  display: grid;
  align-content: start;
  gap: 14px;
}

.pin-detail {
  display: grid;
  gap: 14px;
  padding: 18px;
}

.map-side h2 {
  margin: 0;
  font-size: 1.25rem;
}

.map-side p {
  margin: 0;
  color: var(--muted);
  line-height: 1.65;
}

.pin-meta {
  display: grid;
  gap: 12px;
  margin: 0;
}

.pin-meta div {
  display: grid;
  gap: 4px;
  padding-top: 12px;
  border-top: 1px solid var(--line-soft);
}

.pin-meta dt {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
}

.pin-meta dd {
  margin: 0;
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.45;
}

@media (max-width: 940px) {
  .map-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .map-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .count-pill {
    width: fit-content;
  }
}
</style>
