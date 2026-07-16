<template>
  <PageLoading v-if="isHomeLoading" />
  <div v-else>
    <section class="hero">
      <div class="hero-slides" aria-hidden="true">
        <img
          v-for="(image, index) in heroImages"
          :key="image.src"
          class="hero-slide"
          :class="{ 'is-active': index === activeHeroIndex }"
          :src="image.src"
          :alt="image.alt"
          :loading="index === 0 ? 'eager' : 'lazy'"
        />
      </div>
      <div class="hero-overlay"></div>
      <div class="hero-content container">
        <span class="eyebrow"><Sparkles :size="15" /> {{ t('home.eyebrow') }}</span>
        <h1>Local-in</h1>
        <p>{{ t('home.heroCopy') }}</p>
        <form class="hero-search" @submit.prevent="goSearch">
          <Search :size="20" />
          <input v-model="keyword" type="search" :placeholder="t('home.searchPlaceholder')" />
          <button class="btn btn-primary" type="submit">{{ t('common.search') }}</button>
        </form>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="quick-stats">
          <div v-for="stat in stats" :key="stat.label" class="stat-card">
            <component :is="stat.icon" :size="22" />
            <strong>{{ stat.value }}</strong>
            <span>{{ stat.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section popular-scroll-section">
      <div class="container popular-showcase">
        <aside class="popular-copy" aria-live="polite">
          <div class="popular-copy-inner">
            <div class="popular-progress" :aria-label="t('home.progressLabel')">
              <span
                v-for="(place, index) in showcasePlaces"
                :key="place.id"
                :class="{ 'is-active': index === activeShowcaseIndex }"
              ></span>
            </div>

            <div class="popular-text">
              <span class="popular-count">
                {{ formattedActiveShowcaseIndex }} / {{ formattedShowcaseTotal }}
              </span>
              <span class="popular-kicker">{{ t('home.localPick') }}</span>
              <h3 v-html="t('home.todayTitle')"></h3>
              <Transition name="place-chip" mode="out-in">
                <p :key="activeShowcasePlace.id" class="popular-place-name">
                  <span>{{ activeShowcasePlace.name }}</span>
                </p>
              </Transition>
              <p class="popular-summary">{{ activeShowcasePlace.summary }}</p>
              <div class="popular-meta">
                <span><MapPin :size="16" /> {{ activeShowcasePlace.district }}</span>
                <span><Star :size="16" fill="currentColor" /> {{ activeShowcasePlace.rating }}</span>
              </div>
              <RouterLink class="btn btn-secondary" to="/explore">
                {{ t('common.viewAll') }} <ArrowRight :size="16" />
              </RouterLink>
            </div>
          </div>
        </aside>

        <div class="popular-visuals">
          <article
            v-for="(place, index) in showcasePlaces"
            :key="place.id"
            :ref="(el) => setShowcaseCardRef(el, index)"
            class="popular-visual-card"
            :class="{ 'is-active': index === activeShowcaseIndex }"
            :data-index="index"
          >
            <RouterLink class="popular-visual-link" :to="`/places/${place.id}`">
              <img :src="place.image" :alt="place.name" loading="lazy" />
              <div class="popular-visual-overlay">
                <span>{{ categoryLabel(place.category) }}</span>
                <strong>{{ place.name }}</strong>
              </div>
            </RouterLink>
          </article>
        </div>
      </div>
    </section>

    <section class="section split-band hot-post-band">
      <div class="container hot-post-layout">
        <div class="hot-post-copy">
          <span class="badge green">{{ t('home.hotPostsBadge') }}</span>
          <h2>{{ t('home.hotPostsTitle') }}</h2>
          <p v-html="t('home.hotPostsCopy')"></p>
          <RouterLink class="btn btn-primary" to="/community">
            {{ t('home.viewHotPosts') }} <ArrowRight :size="16" />
          </RouterLink>
        </div>

        <div class="hot-post-panel" :aria-label="t('home.hotPostsAria')">
          <div class="hot-post-header">
            <strong>{{ t('home.hotPostsNow') }}</strong>
          </div>
          <div v-if="popularPostsLoading" class="hot-post-state">
            {{ t('home.hotPostsLoading') }}
          </div>
          <div v-else-if="popularPostsError" class="hot-post-state">
            {{ t('home.hotPostsError') }}
          </div>
          <div v-else-if="homePopularPosts.length === 0" class="hot-post-state">
            {{ t('home.hotPostsEmpty') }}
          </div>
          <template v-else>
            <RouterLink
              v-for="(post, index) in homePopularPosts"
              :key="post.id"
              class="hot-post-row"
              :to="`/community/${post.id}`"
            >
              <span class="hot-post-rank">{{ index + 1 }}</span>
              <div class="hot-post-body">
                <strong class="hot-post-title">{{ post.title }}</strong>
                <Transition name="hot-comment" mode="out-in">
                  <span :key="commentKey(post)" class="hot-post-comment">
                    <MessageSquare :size="14" />
                    <template v-if="activeComment(post)">
                      <b>{{ activeComment(post).author_name || t('community.anonymous') }}</b>
                      {{ activeComment(post).content }}
                    </template>
                    <template v-else>
                      {{ t('home.hotPostsNoComment') }}
                    </template>
                  </span>
                </Transition>
              </div>
              <ArrowUpRight :size="18" />
            </RouterLink>
          </template>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container home-bottom">
        <div
          class="home-festival-section"
          @mouseenter="isHomeFestivalHovered = true"
          @mouseleave="isHomeFestivalHovered = false"
        >
          <div class="section-title compact">
            <div>
              <h2>{{ t('festivals.title') }}</h2>
              <p>{{ t('home.monthlyFestivalCopy') }}</p>
            </div>
            <div class="home-festival-actions">
              <RouterLink class="btn btn-ghost" to="/festivals">{{ t('home.calendar') }}</RouterLink>
              <div class="home-festival-controls" role="group" :aria-label="t('festivals.carouselControls')">
                <button
                  type="button"
                  class="home-festival-control"
                  :title="t('festivals.carouselPrevious')"
                  @click="moveHomeFestivals(-1)"
                >
                  <ChevronLeft :size="22" />
                </button>
                <button
                  type="button"
                  class="home-festival-control"
                  :title="isHomeFestivalPaused ? t('festivals.carouselPlay') : t('festivals.carouselPause')"
                  @click="toggleHomeFestivalRotation"
                >
                  <Play v-if="isHomeFestivalPaused" :size="18" />
                  <Pause v-else :size="18" />
                </button>
                <button
                  type="button"
                  class="home-festival-control"
                  :title="t('festivals.carouselNext')"
                  @click="moveHomeFestivals(1)"
                >
                  <ChevronRight :size="22" />
                </button>
              </div>
            </div>
          </div>
          <TransitionGroup :name="homeFestivalTransitionName" tag="div" class="home-festival-grid">
            <RouterLink
              v-for="festival in homeFestivalCards"
              :key="festival.id"
              class="home-festival-card"
              :to="`/places/${festival.id}`"
            >
              <img :src="festival.image" :alt="festival.name" />
              <div class="home-festival-overlay">
                <span>{{ festivalDateLabel(festival) }}</span>
                <strong>{{ festival.name }}</strong>
                <p>{{ festivalPlaceLabel(festival) }}</p>
              </div>
            </RouterLink>
          </TransitionGroup>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowRight, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Map, MapPin, MessageCircle, MessageSquare, Pause, Play, Search, Sparkles, Star, Users } from '@lucide/vue'
import PageLoading from '../components/PageLoading.vue'
import { fetchDashboardData, fetchCommunityPosts, fetchFestivals, fetchPlaces, fetchPopularCommunityPosts } from '../services/localHubApi'

const HERO_SLIDE_INTERVAL_MS = 2000
const COMMENT_ROTATE_INTERVAL_MS = 2800
const HOME_FESTIVAL_CARD_COUNT = 5
const HOME_FESTIVAL_ROTATE_INTERVAL_MS = 4200

const { t, te } = useI18n()
const router = useRouter()
const keyword = ref('')
const activeHeroIndex = ref(0)
const communityPostsCount = ref(0)
const dashboardStats = ref({
  place_count: 0,
  festival_count: 0,
  community_posts_count: 0,
  type_counts: {
    attraction: 0,
    nature: 0,
    accommodation: 0,
  },
})
const activeShowcaseIndex = ref(0)
const activeCommentIndex = ref(0)
const homeFestivalOffset = ref(0)
const homeFestivalSlideDirection = ref(1)
const isHomeFestivalPaused = ref(false)
const isHomeFestivalHovered = ref(false)
const showcaseCardRefs = ref([])
const homePlaces = ref([])
const homeFestivals = ref([])
const homePopularPosts = ref([])
const isHomeLoading = ref(true)
const popularPostsLoading = ref(true)
const popularPostsError = ref(false)
let heroSlideTimerId = null
let commentRotateTimerId = null
let homeFestivalRotateTimerId = null
let showcaseObserver = null

const heroImages = [
  { src: 'https://tong.visitkorea.or.kr/cms/resource_photo/46/3551346_image2_1.jpg', alt: '양화한강공원' },
  { src: 'https://tong.visitkorea.or.kr/cms/resource/95/3530095_image2_1.jpg', alt: '효사정' },
  { src: 'https://tong.visitkorea.or.kr/cms/resource/26/3403926_image2_1.JPG', alt: '허브체험공원' },
  { src: 'https://tong.visitkorea.or.kr/cms/resource_photo/90/3525890_image2_1.JPG', alt: '진관사(서울)' },
  { src: 'https://tong.visitkorea.or.kr/cms/resource_photo/99/3580599_image2_1.jpg', alt: '서울숲' },
  { src: 'https://tong.visitkorea.or.kr/cms/resource_photo/34/3538134_image2_1.jpg', alt: '청계천' },
  { src: 'https://tong.visitkorea.or.kr/cms/resource_photo/10/2907610_image2_1.jpg', alt: '석촌호수' },
  { src: 'https://tong.visitkorea.or.kr/cms/resource/02/3304402_image2_1.jpg', alt: '북촌 8경' },
  { src: 'https://tong.visitkorea.or.kr/cms/resource_photo/63/3580663_image2_1.jpg', alt: '이화벽화마을' },
  { src: 'https://tong.visitkorea.or.kr/cms/resource_photo/23/4063023_image2_1.jpg', alt: '하늘공원' },
  { src: 'https://tong.visitkorea.or.kr/cms/resource/04/3566904_image2_1.jpg', alt: '수락산 당고개지구 공원' },
  { src: 'https://tong.visitkorea.or.kr/cms/resource/65/3463465_image2_1.jpg', alt: '춘풍양조장' },
  { src: 'https://tong.visitkorea.or.kr/cms/resource/07/4061307_image2_1.jpg', alt: '반포한강공원' },
  { src: 'https://tong.visitkorea.or.kr/cms/resource/00/3304300_image2_1.jpg', alt: '롯데월드 어드벤처' },
  { src: 'https://tong.visitkorea.or.kr/cms/resource/84/4070284_image2_1.jpg', alt: '서해금빛열차' },
  { src: 'https://tong.visitkorea.or.kr/cms/resource/27/3535027_image2_1.jpg', alt: '용산공원 부분개방부지' },
  { src: 'https://tong.visitkorea.or.kr/cms/resource/92/4065492_image2_1.jpg', alt: '[종로둘레길 3코스] 낙산 코스' },
  { src: 'https://tong.visitkorea.or.kr/cms/resource/97/3570497_image2_1.jpg', alt: '신선경과 류인호 묘역' },
  { src: 'https://tong.visitkorea.or.kr/cms/resource/19/4064219_image2_1.jpg', alt: '수국사(서울)' },
  { src: 'https://tong.visitkorea.or.kr/cms/resource/55/4063655_image2_1.jpg', alt: '문래창작촌' },
]

const stats = computed(() => [
  { label: t('home.statsPlaces'), value: dashboardStats.value.place_count.toLocaleString(), icon: Map },
  { label: t('home.statsFestivals'), value: dashboardStats.value.festival_count.toLocaleString(), icon: CalendarDays },
  { label: t('home.statsReviews'), value: dashboardStats.value.community_posts_count.toLocaleString(), icon: Users },
  { label: t('home.statsAi'), value: 5, icon: MessageCircle },
])

const showcasePlaces = computed(() => homePlaces.value.slice(0, 3))
const homeFestivalSource = computed(() => homeFestivals.value.filter((festival) => festival.image))
const homeFestivalCards = computed(() => {
  const source = homeFestivalSource.value
  if (!source.length) return []

  return Array.from({ length: Math.min(HOME_FESTIVAL_CARD_COUNT, source.length) }, (_, index) => {
    return source[(homeFestivalOffset.value + index) % source.length]
  })
})
const homeFestivalTransitionName = computed(() =>
  homeFestivalSlideDirection.value >= 0 ? 'home-festival-forward' : 'home-festival-backward',
)
const activeShowcasePlace = computed(
  () => showcasePlaces.value[activeShowcaseIndex.value] ?? showcasePlaces.value[0] ?? {},
)
const formattedActiveShowcaseIndex = computed(() =>
  String(activeShowcaseIndex.value + 1).padStart(2, '0'),
)
const formattedShowcaseTotal = computed(() => String(showcasePlaces.value.length).padStart(2, '0'))

function categoryLabel(category) {
  const key = `categoryLabels.${category}`
  return te(key) ? t(key) : category
}

function setShowcaseCardRef(element, index) {
  if (element) {
    showcaseCardRefs.value[index] = element
  }
}

function postComments(post) {
  return Array.isArray(post.comment_preview)
    ? post.comment_preview.filter((comment) => comment?.content)
    : []
}

function activeComment(post) {
  const comments = postComments(post)
  if (!comments.length) return null
  return comments[activeCommentIndex.value % comments.length]
}

function commentKey(post) {
  const comment = activeComment(post)
  return comment ? `${post.id}-${comment.id}` : `${post.id}-no-comment`
}

function festivalDateLabel(festival) {
  return festival.date || festival.eventStartDate || '일정 준비 중'
}

function festivalPlaceLabel(festival) {
  return festival.location || festival.eventPlace || festival.address || festival.district || '장소 준비 중'
}

async function completeHomeFestivals(festivals) {
  const needsFestivalList = festivals.length < 5 || festivals.some((festival) => !festival.date || !festival.location)

  if (!needsFestivalList) {
    return festivals
  }

  try {
    const fetchedFestivals = await fetchFestivals()
    return fetchedFestivals.length ? fetchedFestivals : festivals
  } catch {
    return festivals
  }
}

function shiftHomeFestivals(step) {
  const sourceLength = homeFestivalSource.value.length
  if (sourceLength <= 1) return

  homeFestivalSlideDirection.value = step >= 0 ? 1 : -1
  homeFestivalOffset.value = (homeFestivalOffset.value + step + sourceLength) % sourceLength
}

function moveHomeFestivals(step) {
  shiftHomeFestivals(step)
}

function toggleHomeFestivalRotation() {
  isHomeFestivalPaused.value = !isHomeFestivalPaused.value
}

function startHomeFestivalRotation() {
  if (homeFestivalRotateTimerId) {
    window.clearInterval(homeFestivalRotateTimerId)
  }

  homeFestivalRotateTimerId = window.setInterval(() => {
    if (
      homeFestivalSource.value.length > 1 &&
      !isHomeFestivalPaused.value &&
      !isHomeFestivalHovered.value
    ) {
      shiftHomeFestivals(1)
    }
  }, HOME_FESTIVAL_ROTATE_INTERVAL_MS)
}

function observeShowcaseCards() {
  if ('IntersectionObserver' in window) {
    if (showcaseObserver) {
      showcaseObserver.disconnect()
    }

    showcaseObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visibleEntry) {
          activeShowcaseIndex.value = Number(visibleEntry.target.dataset.index)
        }
      },
      {
        rootMargin: '-28% 0px -38% 0px',
        threshold: [0.2, 0.4, 0.6, 0.8],
      },
    )

    showcaseCardRefs.value.forEach((element) => {
      showcaseObserver.observe(element)
    })
  }
}

async function loadHomeData() {
  try {
    const { places, festivals, stats } = await fetchDashboardData()
    homePlaces.value = places
    homeFestivals.value = await completeHomeFestivals(festivals)
    dashboardStats.value = stats
    communityPostsCount.value = stats.community_posts_count
  } catch {
    homePlaces.value = await fetchPlaces()
    homeFestivals.value = await fetchFestivals()
    try {
      const { pagination } = await fetchCommunityPosts({ page: 1, pageSize: 1 })
      communityPostsCount.value = pagination.total ?? 0
    } catch {
      communityPostsCount.value = 0
    }
    dashboardStats.value = {
      place_count: homePlaces.value.length,
      festival_count: homeFestivals.value.length,
      community_posts_count: communityPostsCount.value,
      type_counts: {
        attraction: homePlaces.value.filter((item) => item.type === 'attraction').length,
        nature: homePlaces.value.filter((item) => item.type === 'nature').length,
        accommodation: homePlaces.value.filter((item) => item.type === 'accommodation').length,
      },
    }
  }

  activeShowcaseIndex.value = 0
  homeFestivalOffset.value = 0
  await nextTick()
  observeShowcaseCards()
}

async function loadPopularPosts() {
  popularPostsLoading.value = true
  popularPostsError.value = false

  try {
    homePopularPosts.value = await fetchPopularCommunityPosts({ limit: 5 })
    activeCommentIndex.value = 0
  } catch {
    homePopularPosts.value = []
    popularPostsError.value = true
  } finally {
    popularPostsLoading.value = false
  }
}

async function loadInitialHome() {
  isHomeLoading.value = true
  await Promise.all([loadHomeData(), loadPopularPosts()])
  isHomeLoading.value = false
}

onMounted(() => {
  if (heroImages.length > 1) {
    heroSlideTimerId = window.setInterval(() => {
      activeHeroIndex.value = (activeHeroIndex.value + 1) % heroImages.length
    }, HERO_SLIDE_INTERVAL_MS)
  }

  commentRotateTimerId = window.setInterval(() => {
    activeCommentIndex.value += 1
  }, COMMENT_ROTATE_INTERVAL_MS)

  startHomeFestivalRotation()
  loadInitialHome()
})

onBeforeUnmount(() => {
  if (heroSlideTimerId) {
    window.clearInterval(heroSlideTimerId)
  }

  if (commentRotateTimerId) {
    window.clearInterval(commentRotateTimerId)
  }

  if (homeFestivalRotateTimerId) {
    window.clearInterval(homeFestivalRotateTimerId)
  }

  if (showcaseObserver) {
    showcaseObserver.disconnect()
  }
})

function goSearch() {
  router.push({ path: '/explore', query: { q: keyword.value } })
}
</script>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  min-height: 560px;
  color: #fff;
}

.hero-slides,
.hero-slide,
.hero-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hero-slides {
  overflow: hidden;
  background: #0d1117;
}

.hero-slide {
  object-fit: cover;
  opacity: 0;
  transform: scale(1.025);
  transition:
    opacity 900ms ease,
    transform 2200ms ease;
}

.hero-slide.is-active {
  opacity: 1;
  transform: scale(1);
}

.hero-overlay {
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.14), rgba(15, 23, 42, 0.28)),
    linear-gradient(90deg, rgba(15, 23, 42, 0.32), rgba(15, 23, 42, 0.04));
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  min-height: 560px;
  flex-direction: column;
  justify-content: center;
  padding: 48px 0;
}

.hero h1 {
  max-width: 760px;
  margin: 18px 0 14px;
  font-size: clamp(3.55rem, 8vw, 6.8rem);
  line-height: 1.02;
  letter-spacing: 0;
}

.hero p {
  max-width: 620px;
  margin: 0 0 28px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 1.08rem;
  line-height: 1.65;
}

.hero-search {
  display: flex;
  align-items: center;
  gap: 12px;
  width: min(700px, 100%);
  min-height: 64px;
  padding: 8px 8px 8px 18px;
  color: rgba(255, 255, 255, 0.86);
  background: rgba(255, 255, 255, 0.13);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 22px 58px rgba(13, 17, 23, 0.26);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
}

.hero-search svg {
  color: rgba(255, 255, 255, 0.86);
}

.hero-search input {
  flex: 1;
  min-width: 0;
  color: #fff;
  background: transparent;
  border: 0;
  outline: 0;
  appearance: none;
  caret-color: #fff;
}

.hero-search input::placeholder {
  color: rgba(255, 255, 255, 0.58);
}

.hero-search .btn {
  min-width: 72px;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 12px 28px rgba(13, 17, 23, 0.16);
}

.hero-search .btn:hover {
  background: rgba(255, 255, 255, 0.96);
}

.hero-search input::-webkit-search-cancel-button,
.hero-search input::-webkit-search-decoration {
  appearance: none;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: -78px;
  position: relative;
  z-index: 2;
}

.stat-card {
  display: grid;
  gap: 5px;
  padding: 18px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.stat-card svg {
  color: var(--primary);
}

.stat-card strong {
  font-size: 1.8rem;
}

.stat-card span {
  color: var(--muted);
  font-size: 0.88rem;
}

.popular-scroll-section {
  padding: 86px 0;
  background: var(--surface-strong);
}

.popular-showcase {
  display: grid;
  grid-template-columns: minmax(260px, 0.72fr) minmax(0, 1.28fr);
  gap: 42px;
  align-items: start;
}

.popular-copy {
  position: sticky;
  top: 96px;
  display: flex;
  align-items: center;
  min-height: calc(100vh - 124px);
}

.popular-copy-inner {
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  gap: 22px;
  width: 100%;
}

.popular-progress {
  display: grid;
  gap: 17px;
  align-content: start;
  padding-top: 18px;
}

.popular-progress span {
  display: block;
  width: 58px;
  height: 4px;
  background: #d6d8dc;
  border-radius: 999px;
  transition:
    width 420ms ease,
    background 420ms ease,
    opacity 420ms ease;
}

.popular-progress span.is-active {
  width: 76px;
  background: var(--text);
}

.popular-text {
  min-height: 360px;
}

.popular-count {
  display: block;
  margin-bottom: 12px;
  color: var(--primary);
  font-size: 0.84rem;
  font-weight: 850;
}

.popular-kicker {
  display: block;
  margin-bottom: 12px;
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.08em;
}

.popular-text h3 {
  margin: 0;
  color: var(--text);
  font-size: clamp(1.58rem, 2.35vw, 2.42rem);
  line-height: 1.16;
  letter-spacing: 0;
}

.popular-place-name {
  width: fit-content;
  max-width: min(100%, 440px);
  margin: 16px 0 0;
  color: var(--text);
  font-size: clamp(1.36rem, 2.24vw, 2.28rem);
  line-height: 1.14;
  font-weight: 760;
  letter-spacing: 0;
}

.popular-place-name span {
  display: inline-flex;
  max-width: 100%;
  padding: 10px 16px 11px;
  background: rgba(255, 255, 255, 0.48);
  border: 1px solid rgba(255, 255, 255, 0.66);
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.56),
    0 18px 42px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
}

.popular-summary {
  max-width: 430px;
  margin: 24px 0 18px;
  color: var(--muted);
  font-size: 0.98rem;
  line-height: 1.72;
}

.popular-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 22px;
  color: var(--muted);
  font-size: 0.92rem;
  font-weight: 750;
}

.popular-meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.popular-meta span:last-child {
  color: var(--amber);
}

.place-chip-enter-active,
.place-chip-leave-active {
  transition:
    opacity 560ms ease,
    transform 560ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 560ms ease;
}

.place-chip-enter-from {
  opacity: 0;
  filter: blur(5px);
  transform: translateY(18px);
}

.place-chip-leave-to {
  opacity: 0;
  filter: blur(5px);
  transform: translateY(-12px);
}

:global([data-theme='dark']) .popular-place-name span {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.22);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 22px 46px rgba(13, 17, 23, 0.38);
}

.popular-visuals {
  display: grid;
  gap: 28px;
}

.popular-visual-card {
  min-height: min(68vh, 560px);
  opacity: 0.52;
  transform: translateY(18px) scale(0.985);
  transition:
    opacity 720ms ease,
    transform 720ms cubic-bezier(0.22, 1, 0.36, 1);
}

.popular-visual-card.is-active {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.popular-visual-link {
  position: relative;
  display: block;
  height: 100%;
  min-height: inherit;
  overflow: hidden;
  background: var(--placeholder);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
}

.popular-visual-link img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.02);
  transition: transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
}

.popular-visual-card.is-active img {
  transform: scale(1);
}

.popular-visual-overlay {
  position: absolute;
  inset: auto 0 0;
  display: grid;
  gap: 9px;
  padding: 86px 30px 28px;
  color: #fff;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0), rgba(15, 23, 42, 0.7));
}

.popular-visual-overlay span {
  width: fit-content;
  padding: 7px 10px;
  color: var(--primary);
  background: var(--floating-surface);
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 850;
}

.popular-visual-overlay strong {
  font-size: clamp(1.8rem, 3.3vw, 3.35rem);
  line-height: 1.04;
  letter-spacing: 0;
}

.split-band {
  background: var(--surface-strong);
}

.hot-post-band {
  padding: 76px 0;
}

.hot-post-layout {
  display: grid;
  align-items: center;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 34px;
}

.hot-post-copy h2 {
  margin: 16px 0 12px;
  font-size: 2.2rem;
  line-height: 1.16;
}

.hot-post-copy p {
  max-width: 520px;
  margin: 0 0 22px;
  color: var(--muted);
  line-height: 1.7;
}

.hot-post-panel {
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.hot-post-header,
.hot-post-row {
  display: grid;
  align-items: center;
  grid-template-columns: 52px minmax(0, 1fr) 24px;
  gap: 12px;
}

.hot-post-header {
  padding: 18px 20px;
  color: var(--muted);
  border-bottom: 1px solid var(--line-soft);
  font-size: 0.88rem;
}

.hot-post-header strong {
  grid-column: 1 / 3;
  color: var(--text);
  font-size: 1rem;
}

.hot-post-header span {
  justify-self: end;
  color: var(--muted-light);
  font-size: 0.78rem;
}

.hot-post-state {
  padding: 34px 20px;
  color: var(--muted);
  border-bottom: 1px solid var(--line-soft);
  font-size: 0.92rem;
  font-weight: 750;
  text-align: center;
}

.hot-post-row {
  min-height: 92px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line-soft);
  transition:
    background 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

.hot-post-row:last-child {
  border-bottom: 0;
}

.hot-post-row:hover {
  color: var(--primary);
  background: var(--surface-soft);
  transform: translateX(3px);
}

.hot-post-rank {
  color: var(--primary);
  font-size: 1.24rem;
  font-weight: 850;
}

.hot-post-body {
  min-width: 0;
}

.hot-post-title {
  display: block;
  overflow: hidden;
  color: var(--text);
  font-size: 1.02rem;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hot-post-comment {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  min-height: 22px;
  margin-top: 8px;
  color: var(--muted-light);
  font-size: 0.82rem;
  font-weight: 750;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hot-post-comment svg {
  flex: 0 0 auto;
}

.hot-post-comment b {
  flex: 0 0 auto;
  color: var(--muted);
  font-weight: 850;
}

.hot-post-row > svg {
  color: var(--muted-light);
}

.hot-post-row:hover .hot-post-title,
.hot-post-row:hover > svg {
  color: var(--primary);
}

.hot-comment-enter-active,
.hot-comment-leave-active {
  transition:
    opacity 360ms ease,
    transform 360ms ease,
    filter 360ms ease;
}

.hot-comment-enter-from {
  opacity: 0;
  filter: blur(3px);
  transform: translateY(6px);
}

.hot-comment-leave-to {
  opacity: 0;
  filter: blur(3px);
  transform: translateY(-6px);
}

.home-bottom {
  display: grid;
  gap: 18px;
}

.compact {
  margin-bottom: 14px;
}

.home-festival-section {
  display: grid;
  gap: 12px;
  overflow: hidden;
}

.home-festival-actions,
.home-festival-controls,
.home-festival-control {
  display: inline-flex;
  align-items: center;
}

.home-festival-actions {
  justify-content: end;
  gap: 10px;
}

.home-festival-controls {
  gap: 4px;
}

.home-festival-control {
  justify-content: center;
  width: 34px;
  height: 34px;
  color: var(--text);
  background: transparent;
  border-radius: 999px;
  transition:
    background 160ms ease,
    transform 160ms ease;
}

.home-festival-control:hover {
  background: var(--surface-soft);
  transform: translateY(-1px);
}

.home-festival-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--home-festival-columns), minmax(0, 1fr));
  grid-auto-rows: var(--home-festival-card-height);
  --home-festival-columns: 5;
  --home-festival-card-height: 360px;
  --home-festival-leave-width: calc((100% - 56px) / 5);
  gap: var(--home-festival-gap);
  --home-festival-gap: 14px;
}

.home-festival-card {
  position: relative;
  overflow: hidden;
  height: var(--home-festival-card-height);
  min-height: 0;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

.home-festival-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition:
    filter 260ms ease,
    opacity 260ms ease,
    transform 320ms ease;
}

.home-festival-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: end;
  gap: 8px;
  padding: 18px;
  color: #fff;
  opacity: 0;
  background:
    linear-gradient(180deg, rgba(13, 17, 23, 0.04), rgba(13, 17, 23, 0.82)),
    rgba(13, 17, 23, 0.3);
  transform: translateY(10px);
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.home-festival-card:hover img,
.home-festival-card:focus-visible img {
  opacity: 0.5;
  filter: saturate(0.9);
  transform: scale(1.035);
}

.home-festival-card:hover .home-festival-overlay,
.home-festival-card:focus-visible .home-festival-overlay {
  opacity: 1;
  transform: translateY(0);
}

.home-festival-overlay span {
  color: rgba(255, 255, 255, 0.86);
  font-size: 0.82rem;
  font-weight: 850;
}

.home-festival-overlay strong {
  display: -webkit-box;
  overflow: hidden;
  color: #fff;
  font-size: clamp(1.04rem, 1.25vw, 1.34rem);
  line-height: 1.28;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.home-festival-overlay p {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.9rem;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.home-festival-forward-move,
.home-festival-forward-enter-active,
.home-festival-forward-leave-active,
.home-festival-backward-move,
.home-festival-backward-enter-active,
.home-festival-backward-leave-active {
  transition:
    opacity 420ms ease,
    transform 420ms ease;
}

.home-festival-forward-leave-active,
.home-festival-backward-leave-active {
  position: absolute;
  top: 0;
  width: var(--home-festival-leave-width);
  height: var(--home-festival-card-height);
}

.home-festival-forward-enter-from,
.home-festival-backward-leave-to {
  opacity: 0;
  transform: translateX(42px);
}

.home-festival-forward-leave-to,
.home-festival-backward-enter-from {
  opacity: 0;
  transform: translateX(-42px);
}

@media (max-width: 900px) {
  .quick-stats,
  .popular-showcase,
  .hot-post-layout,
  .home-bottom {
    grid-template-columns: 1fr;
  }

  .quick-stats {
    margin-top: -48px;
  }

  .popular-scroll-section {
    padding: 62px 0;
  }

  .popular-copy {
    position: relative;
    top: auto;
    min-height: auto;
  }

  .popular-copy-inner {
    grid-template-columns: 56px minmax(0, 1fr);
  }

  .popular-text {
    min-height: auto;
  }

  .popular-summary {
    margin-top: 24px;
  }

  .popular-visual-card {
    min-height: 430px;
  }

  .home-festival-grid {
    --home-festival-columns: 2;
    --home-festival-card-height: 320px;
    --home-festival-leave-width: calc((100% - 14px) / 2);
  }
}

@media (max-width: 620px) {
  .hero,
  .hero-content {
    min-height: 520px;
  }

  .hero-search {
    align-items: stretch;
    flex-direction: column;
    padding: 14px;
  }

  .hero-search svg {
    display: none;
  }

  .hero-search input,
  .hero-search button {
    width: 100%;
  }

  .popular-copy-inner {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .popular-progress {
    grid-template-columns: repeat(3, auto);
    gap: 10px;
    padding-top: 0;
  }

  .popular-progress span,
  .popular-progress span.is-active {
    width: 48px;
  }

  .popular-text h3 {
    font-size: 2rem;
  }

  .popular-place-name {
    font-size: 1.58rem;
  }

  .popular-visual-card {
    min-height: 360px;
  }

  .popular-visual-overlay {
    padding: 76px 18px 20px;
  }

  .hot-post-band {
    padding: 54px 0;
  }

  .hot-post-header,
  .hot-post-row {
    grid-template-columns: 34px minmax(0, 1fr) 20px;
    gap: 10px;
    padding-right: 14px;
    padding-left: 14px;
  }

  .hot-post-title {
    white-space: normal;
  }

  .home-festival-grid {
    --home-festival-columns: 1;
    --home-festival-card-height: 380px;
    --home-festival-leave-width: 100%;
  }

  .home-festival-actions {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
