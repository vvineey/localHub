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
        <span class="eyebrow"><Sparkles :size="15" /> 현지인의 추천 장소로 시작하는 서울 여행</span>
        <h1>Local-In</h1>
        <p>익숙한 코스보다 오늘 머물기 좋은 동네와 생생한 후기를 먼저 만나보세요.</p>
        <form class="hero-search" @submit.prevent="goSearch">
          <Search :size="20" />
          <input v-model="keyword" type="search" placeholder="동네, 분위기, 현지 추천 검색" />
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
            <div class="popular-progress" aria-label="오늘의 현지 추천 위치">
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
              <span class="popular-kicker">LOCAL PICK</span>
              <h3>현지인이 추천하는<br />오늘의 관광지</h3>
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
                전체 보기 <ArrowRight :size="16" />
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
          <span class="badge green">동네별 큐레이션</span>
          <h2>현지인의 추천 장소를 지도 위에서 자연스럽게 이어보세요</h2>
          <p>
            카페, 산책길, 축제, 숙소를 지역별로 묶어 오늘 일정에 맞는 이동 동선을 빠르게
            확인할 수 있습니다.
          </p>
          <RouterLink class="btn btn-primary" to="/map">
            지도에서 보기 <Map :size="16" />
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
              <h2>이번 달 동네 축제</h2>
              <p>지금 가기 좋은 서울 행사를 골라봅니다.</p>
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
              <h2>현지 추천 지표</h2>
              <p>장소 유형과 후기 흐름을 한눈에 봅니다.</p>
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
  { label: '현지 추천 장소', value: homePlaces.value.length.toLocaleString(), icon: Map },
  { label: '동네 축제 일정', value: homeFestivals.value.length.toLocaleString(), icon: CalendarDays },
  { label: '여행자 후기', value: community.state.posts.length, icon: Users },
  { label: 'AI 큐레이션', value: 5, icon: MessageCircle },
])

const barItems = computed(() => [
  {
    label: '추천 장소',
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
  background: #000;
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
  font-size: clamp(2.85rem, 6vw, 4.85rem);
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
  color: var(--muted);
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.28);
}

.hero-search input {
  flex: 1;
  min-width: 0;
  color: var(--text);
  background: transparent;
  border: 0;
  outline: 0;
  appearance: none;
  caret-color: var(--text);
}

.hero-search input::placeholder {
  color: var(--muted-light);
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
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.62),
    0 18px 42px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(18px) saturate(150%);
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
    0 22px 46px rgba(0, 0, 0, 0.38);
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

  .festival-row {
    grid-template-columns: 92px 1fr;
  }

  .festival-row img {
    width: 92px;
  }
}
</style>
