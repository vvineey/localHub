<template>
  <section class="section">
    <div class="container">
      <div class="page-title">
        <h1>서울 여행정보 탐색</h1>
        <p>{{ filteredPlaces.length }}개의 장소가 검색되었습니다.</p>
      </div>

      <div class="filter-row">
        <label class="search-row">
          <Search :size="17" />
          <input v-model="keyword" type="search" placeholder="장소명, 지역, 태그 검색" />
        </label>
        <div class="chip-row" aria-label="카테고리 필터">
          <button
            v-for="category in categories"
            :key="category"
            type="button"
            class="chip"
            :class="{ active: activeCategory === category }"
            @click="activeCategory = category"
          >
            {{ category }}
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="empty-state panel">
        <Search :size="38" />
        <p>백엔드 여행정보를 불러오는 중입니다.</p>
      </div>
      <div v-else-if="filteredPlaces.length" class="grid grid-3">
        <PlaceCard v-for="place in filteredPlaces" :key="place.id" :place="place" />
      </div>
      <div v-else class="empty-state panel">
        <Search :size="38" />
        <p>조건에 맞는 여행정보가 없습니다.</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Search } from '@lucide/vue'
import PlaceCard from '../components/PlaceCard.vue'
import {
  fallbackCategories,
  fetchCategories,
  fetchPlaces,
} from '../services/localHubApi'

const route = useRoute()
const keyword = ref(String(route.query.q || ''))
const activeCategory = ref('전체')
const categories = ref([...fallbackCategories])
const places = ref([])
const isLoading = ref(true)

watch(
  () => route.query.q,
  (value) => {
    keyword.value = String(value || '')
  },
)

const filteredPlaces = computed(() => {
  const normalized = keyword.value.trim().toLowerCase()
  return places.value.filter((place) => {
    const matchKeyword =
      !normalized ||
      [place.name, place.category, place.district, place.address, place.summary, ...place.tags]
        .join(' ')
        .toLowerCase()
        .includes(normalized)
    const matchCategory = activeCategory.value === '전체' || place.category === activeCategory.value
    return matchKeyword && matchCategory
  })
})

onMounted(async () => {
  try {
    const [loadedPlaces, loadedCategories] = await Promise.all([fetchPlaces(), fetchCategories()])
    places.value = loadedPlaces
    categories.value = loadedCategories
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.filter-row {
  display: grid;
  gap: 12px;
  margin-bottom: 22px;
}
</style>
