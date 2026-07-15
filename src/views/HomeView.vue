<template>
  <div>
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
        <span class="eyebrow"><Sparkles :size="15" /> AI 기반 서울 여행 커뮤니티</span>
        <h1>LocalHub</h1>
        <p>서울 관광지, 축제, 숙박, 익명 여행 후기를 하나의 SPA에서 탐색하세요.</p>
        <form class="hero-search" @submit.prevent="goSearch">
          <Search :size="20" />
          <input v-model="keyword" type="search" placeholder="관광지, 축제, 후기 검색" />
          <button class="btn btn-primary" type="submit">검색</button>
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
            <div class="popular-progress" aria-label="인기 관광지 위치">
              <span
                v-for="(place, index) in showcasePlaces"
                :key="place.id"
                :class="{ 'is-active': index === activeShowcaseIndex }"
              ></span>
            </div>

            <Transition name="popular-fade" mode="out-in">
              <div :key="activeShowcasePlace.id" class="popular-text">
                <span class="popular-count">
                  {{ formattedActiveShowcaseIndex }} / {{ formattedShowcaseTotal }}
                </span>
                <h3>인기 관광지</h3>
                <p class="popular-place-name">{{ activeShowcasePlace.name }}</p>
                <p class="popular-summary">{{ activeShowcasePlace.summary }}</p>
                <div class="popular-meta">
                  <span><MapPin :size="16" /> {{ activeShowcasePlace.district }}</span>
                  <span><Star :size="16" fill="currentColor" /> {{ activeShowcasePlace.rating }}</span>
                </div>
                <RouterLink class="btn btn-secondary" to="/explore">
                  전체 보기 <ArrowRight :size="16" />
                </RouterLink>
              </div>
            </Transition>
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
                <span>{{ place.category }}</span>
                <strong>{{ place.name }}</strong>
              </div>
            </RouterLink>
          </article>
        </div>
      </div>
    </section>

    <section class="section split-band">
      <div class="container split-layout">
        <div>
          <span class="badge green">지도 시각화</span>
          <h2>카테고리별 핀으로 서울 여행 동선을 빠르게 확인</h2>
          <p>
            RFP의 선택 기능 중 구현 난이도 대비 임팩트가 큰 지도 시각화를 CSS 기반
            인터랙션으로 구성했습니다. FastAPI에서 좌표 데이터를 내려주면 동일한 구조로
            교체할 수 있습니다.
          </p>
          <RouterLink class="btn btn-primary" to="/map">
            지도 열기 <Map :size="16" />
          </RouterLink>
        </div>
        <MapPanel :pins="homeMapPins.slice(0, 7)" @select="selectedPin = $event" />
      </div>
    </section>

    <section class="section">
      <div class="container home-bottom">
        <div>
          <div class="section-title compact">
            <div>
              <h2>이번 달 축제</h2>
              <p>7월 일정 중심으로 빠르게 비교합니다.</p>
            </div>
            <RouterLink class="btn btn-ghost" to="/festivals">캘린더</RouterLink>
          </div>
          <div class="festival-list">
            <RouterLink
              v-for="festival in homeFestivals.slice(0, 3)"
              :key="festival.id"
              class="festival-row card"
              to="/festivals"
            >
              <img :src="festival.image" :alt="festival.name" />
              <div>
                <strong>{{ festival.name }}</strong>
                <span>{{ festival.date }} · {{ festival.location }}</span>
              </div>
            </RouterLink>
          </div>
        </div>

        <div>
          <div class="section-title compact">
            <div>
              <h2>데이터 대시보드</h2>
              <p>발표용 현황 그래프입니다.</p>
            </div>
          </div>
          <StatBars :items="barItems" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ArrowRight, CalendarDays, Map, MapPin, MessageCircle, Search, Sparkles, Star, Users } from '@lucide/vue'
import MapPanel from '../components/MapPanel.vue'
import StatBars from '../components/StatBars.vue'
import { festivals as fallbackFestivals, mapPins as fallbackMapPins, places as fallbackPlaces } from '../data/localhub'
import { fetchFestivals, fetchMapPins, fetchPlaces } from '../services/localHubApi'
import { useCommunityStore } from '../stores/community'

const HERO_SLIDE_INTERVAL_MS = 2000

const router = useRouter()
const keyword = ref('')
const selectedPin = ref(null)
const community = useCommunityStore()
const activeHeroIndex = ref(0)
const activeShowcaseIndex = ref(0)
const showcaseCardRefs = ref([])
const homePlaces = ref([...fallbackPlaces])
const homeFestivals = ref([...fallbackFestivals])
const homeMapPins = ref([...fallbackMapPins])
let heroSlideTimerId = null
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
  { label: '관광/숙박 데이터', value: homePlaces.value.length.toLocaleString(), icon: Map },
  { label: '축제 일정', value: homeFestivals.value.length.toLocaleString(), icon: CalendarDays },
  { label: '커뮤니티 후기', value: community.state.posts.length, icon: Users },
  { label: 'AI 질의 유형', value: 5, icon: MessageCircle },
])

const barItems = computed(() => [
  {
    label: '관광지',
    value: homePlaces.value.filter((item) => item.type === 'attraction').length,
    percent: 84,
    color: '#2563eb',
  },
  {
    label: '자연/산책',
    value: homePlaces.value.filter((item) => item.type === 'nature').length,
    percent: 48,
    color: '#10b981',
  },
  {
    label: '숙박',
    value: homePlaces.value.filter((item) => item.type === 'accommodation').length,
    percent: 32,
    color: '#06b6d4',
  },
  { label: '후기', value: community.state.posts.length, percent: 68, color: '#f59e0b' },
])

const showcasePlaces = computed(() => homePlaces.value.slice(0, 3))
const activeShowcasePlace = computed(
  () => showcasePlaces.value[activeShowcaseIndex.value] ?? showcasePlaces.value[0],
)
const formattedActiveShowcaseIndex = computed(() =>
  String(activeShowcaseIndex.value + 1).padStart(2, '0'),
)
const formattedShowcaseTotal = computed(() => String(showcasePlaces.value.length).padStart(2, '0'))

function setShowcaseCardRef(element, index) {
  if (element) {
    showcaseCardRefs.value[index] = element
  }
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
  const [places, festivals, pins] = await Promise.all([
    fetchPlaces(),
    fetchFestivals(),
    fetchMapPins({ max: 24 }),
  ])

  homePlaces.value = places
  homeFestivals.value = festivals
  homeMapPins.value = pins
  activeShowcaseIndex.value = 0
  await nextTick()
  observeShowcaseCards()
}

onMounted(() => {
  if (heroImages.length > 1) {
    heroSlideTimerId = window.setInterval(() => {
      activeHeroIndex.value = (activeHeroIndex.value + 1) % heroImages.length
    }, HERO_SLIDE_INTERVAL_MS)
  }

  observeShowcaseCards()
  loadHomeData()
})

onBeforeUnmount(() => {
  if (heroSlideTimerId) {
    window.clearInterval(heroSlideTimerId)
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
  background: #0f172a;
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
  font-size: clamp(3rem, 7vw, 5.5rem);
  line-height: 0.96;
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
  color: var(--muted);
  background: #fff;
  border-radius: var(--radius);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.28);
}

.hero-search input {
  flex: 1;
  min-width: 0;
  color: var(--text);
  border: 0;
  outline: 0;
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
  background: #fff;
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
  background: #fff;
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
  grid-template-columns: 82px minmax(0, 1fr);
  gap: 24px;
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
  background: #111827;
}

.popular-text {
  min-height: 390px;
}

.popular-count {
  display: block;
  margin-bottom: 16px;
  color: var(--primary);
  font-size: 0.84rem;
  font-weight: 850;
}

.popular-text h3 {
  margin: 0;
  color: var(--text);
  font-size: clamp(2.6rem, 5vw, 4.8rem);
  line-height: 0.98;
}

.popular-place-name {
  margin: 12px 0 0;
  color: #60646c;
  font-size: clamp(2rem, 4.1vw, 3.8rem);
  line-height: 1.05;
}

.popular-summary {
  max-width: 430px;
  margin: 58px 0 18px;
  color: #4b5563;
  font-size: 1.02rem;
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

.popular-fade-enter-active,
.popular-fade-leave-active {
  transition:
    opacity 560ms ease,
    transform 560ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 560ms ease;
}

.popular-fade-enter-from {
  opacity: 0;
  filter: blur(5px);
  transform: translateY(18px);
}

.popular-fade-leave-to {
  opacity: 0;
  filter: blur(5px);
  transform: translateY(-12px);
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
  background: #e5e7eb;
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
  background: rgba(255, 255, 255, 0.92);
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 850;
}

.popular-visual-overlay strong {
  font-size: clamp(2rem, 4vw, 4.2rem);
  line-height: 0.98;
}

.split-band {
  background: #ffffff;
}

.split-layout {
  display: grid;
  align-items: center;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 28px;
}

.split-layout h2 {
  margin: 16px 0 12px;
  font-size: 2.2rem;
  line-height: 1.16;
}

.split-layout p {
  max-width: 520px;
  margin: 0 0 22px;
  color: var(--muted);
  line-height: 1.7;
}

.home-bottom {
  display: grid;
  grid-template-columns: 1fr 0.85fr;
  gap: 24px;
}

.compact {
  margin-bottom: 14px;
}

.festival-list {
  display: grid;
  gap: 10px;
}

.festival-row {
  display: grid;
  align-items: center;
  grid-template-columns: 112px 1fr;
  gap: 14px;
  overflow: hidden;
  padding: 10px;
}

.festival-row img {
  width: 112px;
  height: 74px;
  object-fit: cover;
  border-radius: var(--radius);
}

.festival-row strong,
.festival-row span {
  display: block;
}

.festival-row span {
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.86rem;
}

@media (max-width: 900px) {
  .quick-stats,
  .popular-showcase,
  .split-layout,
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
    grid-template-columns: 68px minmax(0, 1fr);
  }

  .popular-text {
    min-height: auto;
  }

  .popular-summary {
    margin-top: 30px;
  }

  .popular-visual-card {
    min-height: 430px;
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
    font-size: 2.4rem;
  }

  .popular-place-name {
    font-size: 2rem;
  }

  .popular-visual-card {
    min-height: 360px;
  }

  .popular-visual-overlay {
    padding: 76px 18px 20px;
  }

  .festival-row {
    grid-template-columns: 92px 1fr;
  }

  .festival-row img {
    width: 92px;
  }
}
</style>
