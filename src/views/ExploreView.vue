<template>
  <PageLoading v-if="isInitialLoading" />
  <section v-else class="section">
    <div class="container">
      <div class="page-title">
        <h1>{{ t('explore.title') }}</h1>
        <p>{{ t('explore.count', { count: totalPlaces.toLocaleString() }) }}</p>
      </div>

      <div class="filter-row">
        <label class="search-row">
          <Search :size="17" />
          <input v-model="keyword" type="search" :placeholder="t('explore.searchPlaceholder')" />
        </label>
        <div class="chip-row" :aria-label="t('explore.categoryFilter')">
          <button
            v-for="category in categoryFilters"
            :key="category.label"
            type="button"
            class="chip"
            :class="{ active: activeCategory === category.label }"
            @click="activeCategory = category.label"
          >
            {{ categoryLabel(category.label) }}
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="empty-state panel">
        <Search :size="38" />
        <p>{{ t('explore.loading') }}</p>
      </div>
      <div v-else-if="places.length" class="grid grid-3">
        <PlaceCard v-for="place in places" :key="place.id" :place="place" />
      </div>
      <div v-else class="empty-state panel">
        <Search :size="38" />
        <p>{{ t('explore.empty') }}</p>
      </div>

      <div v-if="pageCount > 1" class="explore-pagination">
        <p>{{ rangeLabel }}</p>
        <div class="pagination-controls">
          <button class="icon-btn" type="button" :disabled="page === 1 || isLoading" :title="t('common.previous')" @click="page--">
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
            :title="t('common.next')"
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
import { useI18n } from 'vue-i18n'
import { ChevronLeft, ChevronRight, Search } from '@lucide/vue'
import PageLoading from '../components/PageLoading.vue'
import PlaceCard from '../components/PlaceCard.vue'
import {
  fetchPlacesPage,
  placeCategoryFilters,
} from '../services/localHubApi'

const route = useRoute()
const { t, te } = useI18n()
const keyword = ref(String(route.query.q || ''))
const activeCategory = ref('전체')
const categoryFilters = placeCategoryFilters
const places = ref([])
const totalPlaces = ref(0)
const page = ref(1)
const isLoading = ref(true)
const isInitialLoading = ref(true)
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
  if (!totalPlaces.value) return t('common.zeroShown')
  const start = (page.value - 1) * pageSize + 1
  const end = Math.min(page.value * pageSize, totalPlaces.value)
  return t('common.rangeShown', {
    start: start.toLocaleString(),
    end: end.toLocaleString(),
  })
})

function categoryLabel(category) {
  const key = `categoryLabels.${category}`
  return te(key) ? t(key) : category
}

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
      isInitialLoading.value = false
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
