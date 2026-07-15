<template>
  <section class="section">
    <div class="container">
      <div class="page-title">
        <h1>서울 여행정보 탐색</h1>
        <p>{{ totalPlaces.toLocaleString() }}개의 장소가 검색되었습니다.</p>
      </div>

      <div class="filter-row">
        <label class="search-row">
          <Search :size="17" />
          <input v-model="keyword" type="search" placeholder="장소명, 지역, 태그 검색" />
        </label>
        <div class="chip-row" aria-label="카테고리 필터">
          <button
            v-for="category in categoryFilters"
            :key="category.label"
            type="button"
            class="chip"
            :class="{ active: activeCategory === category.label }"
            @click="activeCategory = category.label"
          >
            {{ category.label }}
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="empty-state panel">
        <Search :size="38" />
        <p>백엔드 여행정보를 불러오는 중입니다.</p>
      </div>
      <div v-else-if="places.length" class="grid grid-3">
        <PlaceCard v-for="place in places" :key="place.id" :place="place" />
      </div>
      <div v-else class="empty-state panel">
        <Search :size="38" />
        <p>조건에 맞는 여행정보가 없습니다.</p>
      </div>

      <div v-if="pageCount > 1" class="explore-pagination">
        <p>{{ rangeLabel }}</p>
        <div class="pagination-controls">
          <button class="icon-btn" type="button" :disabled="page === 1 || isLoading" title="이전" @click="page--">
            <ChevronLeft :size="16" />
          </button>
          <button
            v-for="pageNumber in visiblePages"
            :key="pageNumber"
            type="button"
            class="page-btn"
            :class="{ active: page === pageNumber }"
            :disabled="isLoading"
            @click="page = pageNumber"
          >
            {{ pageNumber }}
          </button>
          <button
            class="icon-btn"
            type="button"
            :disabled="page === pageCount || isLoading"
            title="다음"
            @click="page++"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeft, ChevronRight, Search } from '@lucide/vue'
import PlaceCard from '../components/PlaceCard.vue'
import {
  fetchPlacesPage,
  placeCategoryFilters,
} from '../services/localHubApi'

const route = useRoute()
const keyword = ref(String(route.query.q || ''))
const activeCategory = ref('전체')
const categoryFilters = placeCategoryFilters
const places = ref([])
const totalPlaces = ref(0)
const page = ref(1)
const isLoading = ref(true)
const pageSize = 9
let searchTimerId = null
let placesRequestId = 0

watch(
  () => route.query.q,
  (value) => {
    keyword.value = String(value || '')
  },
)

const pageCount = computed(() => Math.max(1, Math.ceil(totalPlaces.value / pageSize)))

const visiblePages = computed(() => {
  const maxVisible = 5
  const start = Math.max(1, Math.min(page.value - 2, pageCount.value - maxVisible + 1))
  const end = Math.min(pageCount.value, start + maxVisible - 1)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

const rangeLabel = computed(() => {
  if (!totalPlaces.value) return '0개 표시'
  const start = (page.value - 1) * pageSize + 1
  const end = Math.min(page.value * pageSize, totalPlaces.value)
  return `${start.toLocaleString()}-${end.toLocaleString()}개 표시`
})

async function loadPlaces() {
  const requestId = ++placesRequestId
  isLoading.value = true

  try {
    const response = await fetchPlacesPage({
      keyword: keyword.value,
      category: activeCategory.value,
      page: page.value,
      pageSize,
    })

    if (requestId !== placesRequestId) return

    places.value = response.items
    totalPlaces.value = response.pagination.total
  } finally {
    if (requestId === placesRequestId) {
      isLoading.value = false
    }
  }
}

function resetAndLoad({ debounce = false } = {}) {
  if (page.value !== 1) {
    page.value = 1
    return
  }

  if (!debounce) {
    loadPlaces()
    return
  }

  window.clearTimeout(searchTimerId)
  searchTimerId = window.setTimeout(loadPlaces, 280)
}

watch(keyword, () => {
  resetAndLoad({ debounce: true })
})

watch(activeCategory, () => {
  resetAndLoad()
})

watch(page, () => {
  loadPlaces()
})

onMounted(() => {
  loadPlaces()
})

onBeforeUnmount(() => {
  window.clearTimeout(searchTimerId)
})
</script>

<style scoped>
.filter-row {
  display: grid;
  gap: 12px;
  margin-bottom: 22px;
}

.explore-pagination {
  display: grid;
  justify-items: center;
  gap: 12px;
  margin-top: 28px;
}

.explore-pagination p {
  margin: 0;
  color: var(--muted);
  font-size: 0.86rem;
  font-weight: 750;
}

.pagination-controls {
  display: flex;
  gap: 8px;
}

.page-btn {
  width: 40px;
  height: 40px;
  color: var(--muted);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  font-weight: 800;
}

.page-btn.active {
  color: var(--on-primary);
  background: var(--primary);
  border-color: var(--primary);
}

.page-btn:disabled,
.pagination-controls .icon-btn:disabled {
  opacity: 0.45;
}
</style>
