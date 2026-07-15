<template>
  <section class="section community-page">
    <div class="container community-container">
      <div class="section-title">
        <div>
          <h1>{{ t('community.title') }}</h1>
          <p>{{ t('community.description') }}</p>
        </div>
      </div>
    </div>

    <section
      v-if="isLocalPickReady && localPickCards.length"
      ref="pickSection"
      class="local-pick-section"
      :style="{ '--pick-scroll-distance': `${pickScrollDistance}px` }"
      :aria-label="t('community.localPickAria')"
    >
      <div class="local-pick-sticky">
        <div class="local-pick-header">
          <div>
            <span>{{ t('community.monthPick', { month: currentMonthLabel }) }}</span>
          </div>
        </div>

        <div class="local-pick-viewport">
          <div
            ref="pickTrack"
            class="local-pick-track"
            :style="{ transform: `translate3d(${-pickTranslateX}px, 0, 0)` }"
          >
            <RouterLink
              v-for="pick in localPickCards"
              :key="pick.id"
              class="local-pick-card"
              :to="`/places/${pick.id}`"
              draggable="false"
            >
              <img :src="pick.image" :alt="pick.name" draggable="false" />
              <div class="local-pick-card-body">
                <div>
                  <span>{{ categoryLabel(pick.category) }}</span>
                  <span>{{ pick.district }}</span>
                </div>
                <h3>{{ pick.name }}</h3>
                <p>{{ pick.summary }}</p>
              </div>
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <div class="container community-container board-content">
      <div class="search-row board-search">
        <Search :size="17" />
        <input v-model="keyword" type="search" :placeholder="t('community.searchPlaceholder')" />
      </div>

      <div class="chip-row">
        <button
          v-for="category in postCategories"
          :key="category"
          type="button"
          class="chip"
          :class="{ active: activeCategory === category }"
          @click="activeCategory = category"
        >
          {{ categoryLabel(category) }}
        </button>
      </div>

      <div class="post-list">
        <article v-for="post in pagedPosts" :key="post.id" class="post-card card">
          <RouterLink :to="`/community/${post.id}`" class="post-main">
            <div>
              <span class="badge">{{ categoryLabel(post.category) }}</span>
              <time>{{ post.date }}</time>
            </div>
            <h2>{{ post.title }}</h2>
            <p class="line-clamp">{{ post.content }}</p>
          </RouterLink>
          <div class="post-meta">
            <button type="button" :title="post.liked ? '좋아요 취소' : '좋아요'" @click="toggleLike(post.id)">
              <Heart :size="15" :fill="post.liked ? 'currentColor' : 'none'" />
              {{ post.likes }}
            </button>
            <span><Eye :size="15" /> {{ post.views.toLocaleString() }}</span>
            <span><MessageSquare :size="15" /> {{ post.comments }}</span>
          </div>
        </article>
      </div>

      <div v-if="filteredPosts.length === 0" class="empty-state panel">
        <MessageSquare :size="38" />
        <p>{{ t('community.empty') }}</p>
      </div>

      <div v-if="pageCount > 1" class="pagination">
        <button class="icon-btn" type="button" :disabled="page === 1" :title="t('common.previous')" @click="page--">
          <ChevronLeft :size="16" />
        </button>
        <button
          v-for="pageNumber in pageCount"
          :key="pageNumber"
          type="button"
          class="page-btn"
          :class="{ active: page === pageNumber }"
          @click="page = pageNumber"
        >
          {{ pageNumber }}
        </button>
        <button class="icon-btn" type="button" :disabled="page === pageCount" :title="t('common.next')" @click="page++">
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  MessageSquare,
  Search,
} from '@lucide/vue'
import { places as fallbackLocalPickPlaces } from '../data/localhub'
import { fetchPlacesPage, fetchCommunityPosts } from '../services/localHubApi'

const { locale, t, te } = useI18n()
const keyword = ref('')
const activeCategory = ref('전체')
const page = ref(1)
const posts = ref([])
const localPickPlaces = ref([])
const isLocalPickReady = ref(false)
const pickSection = ref(null)
const pickTrack = ref(null)
const pickTranslateX = ref(0)
const pickScrollDistance = ref(0)
const pageSize = 4
let pickResizeObserver = null

const currentMonthLabel = computed(() =>
  new Intl.DateTimeFormat(locale.value, { month: 'long' }).format(new Date()),
)

const localPickCards = computed(() => localPickPlaces.value.slice(0, 6))

const postCategories = computed(() => [
  '전체',
  ...new Set(posts.value.map((post) => post.category)),
])

const filteredPosts = computed(() => {
  const normalized = keyword.value.trim().toLowerCase()
  return posts.value.filter((post) => {
    const matchKeyword =
      !normalized || [post.title, post.content, post.category].join(' ').toLowerCase().includes(normalized)
    const matchCategory = activeCategory.value === '전체' || post.category === activeCategory.value
    return matchKeyword && matchCategory
  })
})

const pageCount = computed(() => Math.ceil(filteredPosts.value.length / pageSize))
const pagedPosts = computed(() =>
  filteredPosts.value.slice((page.value - 1) * pageSize, page.value * pageSize),
)

async function toggleLike(postId) {
  const index = posts.value.findIndex((post) => post.id === Number(postId))
  if (index === -1) return

  const post = posts.value[index]
  const liked = !post.liked
  const newLikes = (post.likes || 0) + (liked ? 1 : -1)
  post.liked = liked
  post.likes = newLikes

  try {
    await updateCommunityPost(postId, { likes: newLikes })
  } catch {
    post.liked = !liked
    post.likes = (post.likes || 0) + (liked ? -1 : 1)
  }
}

async function loadPosts() {
  try {
    const { items } = await fetchCommunityPosts({ page: 1, pageSize: 100 })
    posts.value = items.map((post) => ({ ...post, liked: false }))
  } catch {
    posts.value = []
  }
}

function categoryLabel(category) {
  const key = `categoryLabels.${category}`
  return te(key) ? t(key) : category
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function updatePickScroll() {
  const section = pickSection.value
  if (!section) return

  const stickyTop = window.matchMedia('(max-width: 720px)').matches ? 58 : 64
  const start = section.offsetTop - stickyTop
  const progress = window.scrollY - start
  pickTranslateX.value = clamp(progress, 0, pickScrollDistance.value)
}

function measurePickScroll() {
  const track = pickTrack.value
  if (!track) return

  pickScrollDistance.value = Math.max(0, track.scrollWidth - window.innerWidth + 48)
  updatePickScroll()
}

function observePickTrack() {
  if (!('ResizeObserver' in window) || !pickTrack.value) return

  pickResizeObserver?.disconnect()
  pickResizeObserver = new ResizeObserver(measurePickScroll)
  pickResizeObserver.observe(pickTrack.value)
}

async function loadLocalPickPlaces() {
  const { items } = await fetchPlacesPage({
    page: 1,
    pageSize: 6,
    fallbackOnError: false,
  })

  localPickPlaces.value = items
  isLocalPickReady.value = true
  await nextTick()
  measurePickScroll()
  observePickTrack()
}

watch([keyword, activeCategory], () => {
  page.value = 1
})

onMounted(async () => {
  await nextTick()
  measurePickScroll()
  window.addEventListener('scroll', updatePickScroll, { passive: true })
  window.addEventListener('resize', measurePickScroll)

  await loadPosts()
  loadLocalPickPlaces()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updatePickScroll)
  window.removeEventListener('resize', measurePickScroll)
  pickResizeObserver?.disconnect()
})
</script>

<style scoped>
.community-container {
  max-width: 860px;
}

.community-page {
  padding-top: 34px;
  padding-bottom: 30px;
}

.community-page .section-title {
  margin-bottom: 10px;
}

.community-page .section-title h1 {
  font-size: clamp(1.92rem, 3vw, 2.48rem);
}

.board-content {
  margin-top: 0;
}

.local-pick-section {
  --pick-sticky-height: clamp(500px, 54vh, 640px);
  position: relative;
  width: 100vw;
  min-height: calc(var(--pick-sticky-height) + var(--pick-scroll-distance));
  margin: 0 0 2px calc(50% - 50vw);
  color: var(--text);
  background: var(--surface-strong);
}

.local-pick-sticky {
  position: sticky;
  top: 64px;
  display: flex;
  overflow: hidden;
  height: var(--pick-sticky-height);
  min-height: 500px;
  flex-direction: column;
  justify-content: flex-start;
  gap: 12px;
  padding: clamp(24px, 3.8vh, 42px) 0 clamp(22px, 3.6vh, 38px);
}

.local-pick-header {
  display: grid;
  place-items: start;
  padding: 0 max(24px, calc((100vw - 1180px) / 2));
  text-align: left;
}

.local-pick-header span {
  display: block;
  color: var(--muted);
  font-size: 0.92rem;
  font-weight: 850;
}

.local-pick-viewport {
  overflow: hidden;
  width: 100%;
}

.local-pick-track {
  display: flex;
  width: max-content;
  gap: clamp(28px, 4.5vw, 72px);
  padding: 0 max(24px, calc((100vw - 1180px) / 2));
  will-change: transform;
}

.local-pick-card {
  display: flex;
  flex: 0 0 clamp(280px, 27vw, 430px);
  flex-direction: column;
  gap: 13px;
  color: var(--text);
}

.local-pick-card img {
  width: 100%;
  aspect-ratio: 1 / 0.92;
  object-fit: cover;
  background: var(--placeholder);
  border-radius: var(--radius);
  pointer-events: none;
}

.local-pick-card-body {
  display: grid;
  gap: 8px;
}

.local-pick-card-body > div {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.local-pick-card-body span {
  display: inline-flex;
  align-items: center;
  min-height: 23px;
  padding: 0 8px;
  color: var(--text);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 850;
}

.local-pick-card h3 {
  margin: 0;
  color: var(--text);
  font-size: clamp(1.05rem, 1.6vw, 1.34rem);
  line-height: 1.34;
}

.local-pick-card p {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--muted);
  font-size: 0.84rem;
  line-height: 1.55;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

:global([data-theme='dark']) .local-pick-section {
  color: #fff;
  background: #000;
}

:global([data-theme='dark']) .local-pick-header span {
  color: #bdbdbd;
}

:global([data-theme='dark']) .local-pick-card {
  color: #fff;
}

:global([data-theme='dark']) .local-pick-card img {
  background: #111;
}

:global([data-theme='dark']) .local-pick-card-body span {
  color: #f5f5f5;
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.18);
}

:global([data-theme='dark']) .local-pick-card h3 {
  color: #fff;
}

:global([data-theme='dark']) .local-pick-card p {
  color: rgba(255, 255, 255, 0.64);
}

.board-search {
  margin-bottom: 12px;
}

.post-list {
  display: grid;
  gap: 12px;
  margin-top: 20px;
}

.post-card {
  overflow: hidden;
}

.post-main {
  display: grid;
  gap: 10px;
  padding: 18px;
}

.post-main > div {
  display: flex;
  align-items: center;
  gap: 10px;
}

.post-main time {
  color: var(--muted-light);
  font-size: 0.8rem;
}

.post-main h2 {
  margin: 0;
  font-size: 1.06rem;
}

.post-main p {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.58;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 12px 18px;
  color: var(--muted-light);
  border-top: 1px solid var(--line-soft);
  font-size: 0.84rem;
}

.post-meta button,
.post-meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: inherit;
  background: transparent;
}

.post-meta button:hover {
  color: var(--primary);
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
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

@media (max-width: 620px) {
  .local-pick-section {
    --pick-sticky-height: clamp(480px, 72vh, 540px);
    min-height: calc(var(--pick-sticky-height) + var(--pick-scroll-distance));
    margin-top: 2px;
  }

  .local-pick-sticky {
    top: 58px;
    height: var(--pick-sticky-height);
    min-height: 480px;
    gap: 12px;
    padding: 24px 0 30px;
  }

  .local-pick-track {
    gap: 22px;
    padding: 0 18px;
  }

  .local-pick-card {
    flex-basis: min(78vw, 310px);
  }
}
</style>
