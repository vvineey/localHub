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
      class="local-pick-section"
      :aria-label="t('community.localPickAria')"
    >
      <div class="local-pick-header">
        <div>
          <span>{{ t('community.monthPick', { month: currentMonthLabel }) }}</span>
        </div>
      </div>

      <div ref="pickScroller" class="local-pick-viewport" @wheel="handlePickWheel">
        <div class="local-pick-track">
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
    </section>

    <section v-if="popularPosts.length" class="container community-container realtime-popular">
      <div class="realtime-popular-header">
        <div>
          <span>{{ t('community.realtimePopularKicker') }}</span>
          <h2>{{ t('community.realtimePopularTitle') }}</h2>
        </div>
        <span>{{ t('community.realtimePopularMetric') }}</span>
      </div>

      <div class="realtime-popular-list">
        <RouterLink
          v-for="(post, index) in popularPosts"
          :key="post.id"
          class="realtime-popular-row"
          :to="`/community/${post.id}`"
        >
          <strong>{{ index + 1 }}</strong>
          <div>
            <h3>{{ post.title }}</h3>
            <Transition name="realtime-comment" mode="out-in">
              <p v-if="activePopularComment(post)" :key="popularCommentKey(post)">
                <MessageCircle :size="14" />
                <b>{{ activePopularComment(post).author_name || t('community.anonymous') }}</b>
                {{ activePopularComment(post).content }}
              </p>
              <p v-else :key="popularCommentKey(post)">
                <MessageCircle :size="14" />
                {{ t('community.noComments') }}
              </p>
            </Transition>
          </div>
          <span>
            <Eye :size="14" />
            {{ post.views.toLocaleString() }}
          </span>
        </RouterLink>
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

      <div class="sort-row" role="group" :aria-label="t('community.sortAria')">
        <button
          v-for="option in sortOptions"
          :key="option.value"
          type="button"
          class="sort-button"
          :class="{ active: sortMode === option.value }"
          @click="sortMode = option.value"
        >
          <component :is="option.icon" :size="15" />
          {{ option.label }}
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
          <div v-if="commentPreview(post).length" class="post-comment-preview">
            <article
              v-for="(comment, index) in commentPreview(post)"
              :key="comment.id"
              class="preview-comment"
              :class="{ 'is-faded': index === 1 }"
            >
              <MessageCircle :size="14" />
              <p>
                <strong>{{ comment.author_name || t('community.anonymous') }}</strong>
                {{ comment.content }}
              </p>
            </article>
          </div>
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  MessageSquare,
  Search,
  TrendingUp,
} from '@lucide/vue'
import { places as fallbackLocalPickPlaces } from '../data/localhub'
import { fetchPlacesPage, fetchCommunityPosts, fetchPopularCommunityPosts, updateCommunityPost } from '../services/localHubApi'

const { locale, t, te } = useI18n()
const keyword = ref('')
const activeCategory = ref('전체')
const sortMode = ref('latest')
const page = ref(1)
const posts = ref([])
const popularPosts = ref([])
const activeCommentIndex = ref(0)
const localPickPlaces = ref([...fallbackLocalPickPlaces])
const isLocalPickReady = ref(true)
const pickScroller = ref(null)
const pageSize = 4
const COMMENT_ROTATE_INTERVAL_MS = 2800
let commentRotateTimerId = null
const basePostCategories = ['맛집/카페', '일정', '사진', '팁', '자연', '질문']

const currentMonthLabel = computed(() =>
  new Intl.DateTimeFormat(locale.value, { month: 'long' }).format(new Date()),
)

const localPickCards = computed(() => localPickPlaces.value.slice(0, 6))
const sortOptions = computed(() => [
  { value: 'latest', label: t('community.sortLatest'), icon: Clock },
  { value: 'popular', label: t('community.sortPopular'), icon: TrendingUp },
])

const postCategories = computed(() => [
  '전체',
  ...new Set([
    ...basePostCategories,
    ...posts.value.map((post) => post.category).filter(Boolean),
  ]),
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
    const { items } = await fetchCommunityPosts({ page: 1, pageSize: 100, sort: sortMode.value })
    posts.value = items.map((post) => ({ ...post, liked: false }))
  } catch {
    posts.value = []
  }
}

function commentPreview(post) {
  return Array.isArray(post.comment_preview) ? post.comment_preview.slice(0, 2) : []
}

function popularComments(post) {
  return Array.isArray(post.comment_preview)
    ? post.comment_preview.filter((comment) => comment?.content)
    : []
}

function activePopularComment(post) {
  const comments = popularComments(post)
  if (!comments.length) return null

  return comments[activeCommentIndex.value % comments.length]
}

function popularCommentKey(post) {
  const comment = activePopularComment(post)
  return comment ? `${post.id}-${comment.id}` : `${post.id}-empty`
}

function categoryLabel(category) {
  const key = `categoryLabels.${category}`
  return te(key) ? t(key) : category
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function handlePickWheel(event) {
  const scroller = pickScroller.value
  if (!scroller) return

  const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth
  if (maxScrollLeft <= 0) return

  const wheelDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX
  const isAtStart = scroller.scrollLeft <= 0
  const isAtEnd = scroller.scrollLeft >= maxScrollLeft - 1

  if ((wheelDelta < 0 && isAtStart) || (wheelDelta > 0 && isAtEnd)) return

  event.preventDefault()
  scroller.scrollLeft = clamp(scroller.scrollLeft + wheelDelta, 0, maxScrollLeft)
}

async function loadLocalPickPlaces() {
  try {
    const { items } = await fetchPlacesPage({
      page: 1,
      pageSize: 6,
      fallbackOnError: false,
    })

    if (items.length) {
      localPickPlaces.value = items
    }
  } catch {
    localPickPlaces.value = [...fallbackLocalPickPlaces]
  } finally {
    isLocalPickReady.value = true
  }
}

async function loadPopularPosts() {
  try {
    popularPosts.value = await fetchPopularCommunityPosts({ limit: 3 })
  } catch {
    popularPosts.value = []
  }
}

watch([keyword, activeCategory], () => {
  page.value = 1
})

watch(sortMode, async () => {
  page.value = 1
  await loadPosts()
})

onMounted(async () => {
  await Promise.all([loadPosts(), loadPopularPosts()])
  loadLocalPickPlaces()
  commentRotateTimerId = window.setInterval(() => {
    activeCommentIndex.value += 1
  }, COMMENT_ROTATE_INTERVAL_MS)
})

onBeforeUnmount(() => {
  if (commentRotateTimerId) {
    window.clearInterval(commentRotateTimerId)
  }
})
</script>

<style scoped>
.community-container {
  max-width: 860px;
}

.community-page {
  padding-top: 26px;
  padding-bottom: 28px;
}

.community-page .section-title {
  margin-bottom: 10px;
}

.community-page .section-title h1 {
  font-size: clamp(1.82rem, 2.8vw, 2.34rem);
}

.board-content {
  margin-top: 0;
}

.realtime-popular {
  margin-top: 0;
  margin-bottom: 22px;
}

.realtime-popular-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  padding: 0 2px 12px;
}

.realtime-popular-header span {
  color: var(--muted-light);
  font-size: 0.78rem;
  font-weight: 850;
}

.realtime-popular-header h2 {
  margin: 4px 0 0;
  color: var(--text);
  font-size: 1.18rem;
  line-height: 1.28;
}

.realtime-popular-list {
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

.realtime-popular-row {
  display: grid;
  align-items: center;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  gap: 12px;
  min-height: 78px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line-soft);
  transition:
    background 180ms ease,
    transform 180ms ease;
}

.realtime-popular-row:last-child {
  border-bottom: 0;
}

.realtime-popular-row:hover {
  background: var(--surface-soft);
  transform: translateX(3px);
}

.realtime-popular-row > strong {
  color: var(--primary);
  font-size: 1.18rem;
  font-weight: 900;
}

.realtime-popular-row div {
  min-width: 0;
}

.realtime-popular-row h3 {
  overflow: hidden;
  margin: 0;
  color: var(--text);
  font-size: 0.98rem;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.realtime-popular-row p,
.realtime-popular-row > span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--muted-light);
  font-size: 0.82rem;
  font-weight: 750;
}

.realtime-popular-row p {
  overflow: hidden;
  max-width: 100%;
  margin: 7px 0 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.realtime-popular-row p svg {
  flex: 0 0 auto;
}

.realtime-popular-row p b {
  flex: 0 0 auto;
  color: var(--muted);
  font-weight: 850;
}

.realtime-comment-enter-active,
.realtime-comment-leave-active {
  transition:
    opacity 360ms ease,
    filter 360ms ease,
    transform 360ms ease;
}

.realtime-comment-enter-from {
  opacity: 0;
  filter: blur(3px);
  transform: translateY(6px);
}

.realtime-comment-leave-to {
  opacity: 0;
  filter: blur(3px);
  transform: translateY(-6px);
}

.realtime-popular-row > span {
  justify-self: end;
}

.local-pick-section {
  position: relative;
  width: 100vw;
  margin: 0 0 clamp(22px, 3.4vh, 38px) calc(50% - 50vw);
  padding: clamp(20px, 3vh, 34px) 0 clamp(22px, 3.4vh, 38px);
  color: var(--text);
  background: var(--surface-strong);
}

.local-pick-header {
  display: grid;
  place-items: start;
  padding: 0 clamp(18px, 5vw, 72px);
  margin-bottom: 12px;
  text-align: left;
}

.local-pick-header span {
  display: block;
  color: var(--muted);
  font-size: 0.92rem;
  font-weight: 850;
}

.local-pick-viewport {
  overflow-x: auto;
  overflow-y: visible;
  width: 100%;
  overscroll-behavior-inline: contain;
  scrollbar-width: none;
}

.local-pick-viewport::-webkit-scrollbar {
  display: none;
}

.local-pick-track {
  display: flex;
  width: max-content;
  gap: clamp(28px, 3.8vw, 70px);
  padding: 0 clamp(18px, 5vw, 72px);
}

.local-pick-card {
  display: flex;
  flex: 0 0 clamp(360px, 27vw, 520px);
  flex-direction: column;
  gap: 12px;
  color: var(--text);
  scroll-snap-align: start;
}

.local-pick-card img {
  width: 100%;
  aspect-ratio: 1 / 0.68;
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
  font-size: clamp(1.08rem, 1.45vw, 1.42rem);
  line-height: 1.32;
}

.local-pick-card p {
  margin: 0;
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.55;
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

.sort-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.sort-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 13px;
  color: var(--muted);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  font-size: 0.86rem;
  font-weight: 850;
}

.sort-button.active {
  color: var(--on-primary);
  background: var(--primary);
  border-color: var(--primary);
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

.post-comment-preview {
  position: relative;
  display: grid;
  gap: 7px;
  padding: 0 18px 14px;
}

.post-comment-preview::after {
  position: absolute;
  right: 18px;
  bottom: 10px;
  left: 18px;
  height: 22px;
  pointer-events: none;
  content: '';
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), var(--surface));
}

:global([data-theme='dark']) .post-comment-preview::after {
  background: linear-gradient(180deg, rgba(5, 5, 5, 0), var(--surface));
}

.preview-comment {
  display: grid;
  align-items: start;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 8px;
  min-height: 38px;
  padding: 9px 10px;
  color: var(--muted);
  background: var(--surface-soft);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
}

.preview-comment.is-faded {
  opacity: 0.54;
  mask-image: linear-gradient(180deg, #000 48%, rgba(0, 0, 0, 0));
}

.preview-comment svg {
  margin-top: 2px;
  color: var(--muted-light);
}

.preview-comment p {
  overflow: hidden;
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-comment strong {
  margin-right: 6px;
  color: var(--text);
  font-weight: 850;
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
  .realtime-popular-header {
    align-items: start;
    flex-direction: column;
    gap: 6px;
  }

  .realtime-popular-row {
    grid-template-columns: 30px minmax(0, 1fr);
  }

  .realtime-popular-row > span {
    display: none;
  }

  .local-pick-section {
    margin-top: 2px;
    padding: 20px 0 28px;
  }

  .local-pick-track {
    gap: 22px;
    padding: 0 18px;
  }

  .local-pick-card {
    flex-basis: min(82vw, 360px);
  }

  .local-pick-card img {
    aspect-ratio: 1 / 0.76;
  }
}
</style>
