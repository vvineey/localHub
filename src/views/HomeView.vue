<template>
  <div>
    <section class="hero">
      <img
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1800&q=84"
        alt="서울과 산 능선이 보이는 여행 풍경"
      />
      <div class="hero-overlay"></div>
      <div class="hero-content container">
        <span class="eyebrow"><Sparkles :size="15" /> AI 기반 서울 여행 커뮤니티</span>
        <h1>LocalHub Seoul</h1>
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

    <section class="section">
      <div class="container">
        <div class="section-title">
          <div>
            <h2>인기 관광지</h2>
            <p>예시 사이트의 카드형 탐색 흐름을 서울 MVP 데이터로 구성했습니다.</p>
          </div>
          <RouterLink class="btn btn-secondary" to="/explore">
            전체 보기 <ArrowRight :size="16" />
          </RouterLink>
        </div>
        <div class="grid grid-3">
          <PlaceCard v-for="place in places.slice(0, 3)" :key="place.id" :place="place" />
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
        <MapPanel :pins="mapPins.slice(0, 7)" @select="selectedPin = $event" />
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
              v-for="festival in festivals.slice(0, 3)"
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
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ArrowRight, CalendarDays, Map, MessageCircle, Search, Sparkles, Users } from '@lucide/vue'
import MapPanel from '../components/MapPanel.vue'
import PlaceCard from '../components/PlaceCard.vue'
import StatBars from '../components/StatBars.vue'
import { festivals, mapPins, places } from '../data/localhub'
import { useCommunityStore } from '../stores/community'

const router = useRouter()
const keyword = ref('')
const selectedPin = ref(null)
const community = useCommunityStore()

const stats = computed(() => [
  { label: '관광/숙박 데이터', value: places.length, icon: Map },
  { label: '축제 일정', value: festivals.length, icon: CalendarDays },
  { label: '커뮤니티 후기', value: community.state.posts.length, icon: Users },
  { label: 'AI 질의 유형', value: 5, icon: MessageCircle },
])

const barItems = computed(() => [
  { label: '관광지', value: places.filter((item) => item.type === 'attraction').length, percent: 84, color: '#2563eb' },
  { label: '자연/산책', value: places.filter((item) => item.type === 'nature').length, percent: 48, color: '#10b981' },
  { label: '숙박', value: places.filter((item) => item.type === 'accommodation').length, percent: 32, color: '#06b6d4' },
  { label: '후기', value: community.state.posts.length, percent: 68, color: '#f59e0b' },
])

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

.hero img,
.hero-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hero img {
  object-fit: cover;
}

.hero-overlay {
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.46), rgba(15, 23, 42, 0.74)),
    linear-gradient(90deg, rgba(15, 23, 42, 0.58), rgba(15, 23, 42, 0.1));
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
  .split-layout,
  .home-bottom {
    grid-template-columns: 1fr;
  }

  .quick-stats {
    margin-top: -48px;
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

  .festival-row {
    grid-template-columns: 92px 1fr;
  }

  .festival-row img {
    width: 92px;
  }
}
</style>
