<template>
  <PageLoading v-if="isMapLoading" />
  <section v-else class="section">
    <div class="container">
      <div class="page-title">
        <h1>{{ t('map.title') }}</h1>
        <p>{{ t('map.description') }}</p>
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
            <span class="count-pill">{{ t('common.itemsShown', { count: filteredPins.length.toLocaleString() }) }}</span>
          </div>
          <p class="map-hint">{{ t('map.clickHint') }}</p>
          <MapPanel :pins="filteredPins" :userLocation="userLocation" @select="handleSelect" @mapclick="handleMapClick" />
        </div>

        <aside class="map-side">
          <div class="pin-detail panel">
            <span v-if="selected" class="badge">{{ labelFor(selected.type) }}</span>
            <h2>{{ selected ? selected.name : t('map.selectedTitle') }}</h2>
            <p v-if="!selected">
              {{ t('map.selectHelp') }}
            </p>
            <template v-else>
              <p>{{ selected.summary || t('map.fallbackSummary') }}</p>
              <dl class="pin-meta">
                <div>
                  <dt>{{ t('map.address') }}</dt>
                  <dd>{{ selected.address || t('map.noAddress') }}</dd>
                </div>
                <div>
                  <dt>{{ t('map.district') }}</dt>
                  <dd>{{ regionLabel }}</dd>
                </div>
                <div>
                  <dt>{{ t('map.coordinate') }}</dt>
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
import { useI18n } from 'vue-i18n'
import PageLoading from '../components/PageLoading.vue'
import MapPanel from '../components/MapPanel.vue'
import StatBars from '../components/StatBars.vue'
import { fetchAdministrativeDistrict, formatAdministrativeDistrict } from '../services/kakaoMapApi'
import { fetchMapPins } from '../services/localHubApi'

const activeFilter = ref('all')
const { t } = useI18n()
const selected = ref(null)
const selectedRegion = ref(null)
const selectedRegionError = ref('')
const selectedRegionLoading = ref(false)
const mapPins = ref([])
const isMapLoading = ref(true)
const userLocation = ref(null)
let regionRequestId = 0

const filters = computed(() => [
  { id: 'all', label: t('categories.all') },
  { id: 'attraction', label: t('categories.attraction') },
  { id: 'restaurant', label: t('categories.restaurant') },
  { id: 'nature', label: t('categories.nature') },
  { id: 'accommodation', label: t('categories.accommodation') },
  { id: 'festival', label: t('categories.festival') },
  { id: 'shopping', label: t('categories.shopping') },
])

const filteredPins = computed(() =>
  activeFilter.value === 'all'
    ? mapPins.value
    : mapPins.value.filter((pin) => pin.type === activeFilter.value),
)

const stats = computed(() =>
  filters.value.slice(1).map((filter) => ({
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
  if (selectedRegionLoading.value) return t('map.regionLoading')
  if (selectedRegion.value) return formatAdministrativeDistrict(selectedRegion.value)
  if (selectedRegionError.value) return selectedRegionError.value
  return t('map.noRegion')
})

const coordinateLabel = computed(() =>
  selected.value && Number.isFinite(selected.value.lat) && Number.isFinite(selected.value.lng)
    ? `${selected.value.lat.toFixed(5)}, ${selected.value.lng.toFixed(5)}`
    : t('map.noCoordinate'),
)

function labelFor(type) {
  return filters.value.find((filter) => filter.id === type)?.label || type
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRadians = (degree) => (degree * Math.PI) / 180
  const R = 6371
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function sortPinsByLocation(location) {
  if (!location || !Array.isArray(mapPins.value)) return

  const { lat: userLat, lng: userLng } = location
  if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) return

  mapPins.value = [...mapPins.value].sort((a, b) => {
    const distA = haversineDistance(userLat, userLng, Number(a.lat), Number(a.lng))
    const distB = haversineDistance(userLat, userLng, Number(b.lat), Number(b.lng))
    return distA - distB
  })
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation unavailable'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude })
      },
      (error) => reject(error),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  })
}

async function handleMapClick() {
  try {
    const location = await getCurrentPosition()
    userLocation.value = location
    sortPinsByLocation(location)
  } catch (error) {
    console.warn('현재 위치를 가져올 수 없습니다.', error)
  }
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
    selectedRegionError.value = region ? '' : t('map.noRegionResult')
  } catch {
    if (requestId !== regionRequestId) return
    selectedRegionError.value = t('map.kakaoRequired')
  } finally {
    if (requestId === regionRequestId) {
      selectedRegionLoading.value = false
    }
  }
}

onMounted(async () => {
  try {
    mapPins.value = await fetchMapPins({ max: 360 })
  } finally {
    isMapLoading.value = false
  }
})
</script>

<style scoped>
.map-hint {
  margin: 0 0 12px;
  color: var(--muted);
  font-size: 0.94rem;
}

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
  color: var(--primary);
  background: var(--primary-soft);
  border: 1px solid var(--line);
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
  color: var(--muted);
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
