<template>
  <PageLoading v-if="isFestivalInitialLoading" />
  <section v-else class="section festival-section">
    <div class="container festival-container">
      <div class="page-title">
        <h1>{{ t('festivals.title') }}</h1>
        <p>{{ t('festivals.description') }}</p>
      </div>

      <div class="festival-page-stack">
        <section
          v-if="featuredFestivals.length"
          class="featured-festivals"
          @mouseenter="isFeaturedHovered = true"
          @mouseleave="isFeaturedHovered = false"
        >
          <div class="featured-controls" role="group" :aria-label="t('festivals.carouselControls')">
            <button
              type="button"
              class="featured-control"
              :title="t('festivals.carouselPrevious')"
              @click="moveFeatured(-1)"
            >
              <ChevronLeft :size="22" />
            </button>
            <button
              type="button"
              class="featured-control"
              :title="isFeaturedPaused ? t('festivals.carouselPlay') : t('festivals.carouselPause')"
              @click="toggleFeaturedRotation"
            >
              <Play v-if="isFeaturedPaused" :size="18" />
              <Pause v-else :size="18" />
            </button>
            <button
              type="button"
              class="featured-control"
              :title="t('festivals.carouselNext')"
              @click="moveFeatured(1)"
            >
              <ChevronRight :size="22" />
            </button>
          </div>

          <TransitionGroup :name="featuredTransitionName" tag="div" class="featured-grid">
            <RouterLink
              v-for="festival in featuredFestivals"
              :key="festival.id"
              class="featured-card"
              :to="`/places/${festival.id}`"
            >
              <img :src="festival.image" :alt="festival.name" />
              <div class="featured-overlay">
                <span>{{ festival.date }}</span>
                <h3>{{ festival.name }}</h3>
                <p>{{ festival.summary }}</p>
                <small><MapPin :size="15" /> {{ festival.location }}</small>
              </div>
            </RouterLink>
          </TransitionGroup>
        </section>

        <div class="calendar panel">
          <div class="calendar-head">
            <div>
              <h2>{{ t('festivals.monthTitle') }}</h2>
              <p>{{ t('festivals.calendarDescription') }}</p>
            </div>
          </div>

          <div class="weekday-row">
            <div class="weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
          </div>

          <div class="calendar-body">
            <div v-for="week in calendarWeeks" :key="week.index" class="calendar-week">
              <button
                v-for="day in week.days"
                :key="day.id"
                type="button"
                class="calendar-day"
                :class="{ active: selectedDay === day.value, 'has-event': day.events.length }"
                :style="{ gridColumn: `${day.column} / span 1` }"
                :disabled="!day.value"
                @click="openCalendarDay(day)"
              >
                <span>{{ day.value || '' }}</span>
                <small v-if="day.events.length">{{ t('festivals.eventCount', { count: day.events.length }) }}</small>
              </button>

              <RouterLink
                v-for="segment in week.segments"
                :key="segment.key"
                class="calendar-event"
                :style="calendarEventStyle(segment)"
                :title="`${segment.name} · ${segment.date}`"
                :to="`/places/${segment.id}`"
              >
                <CalendarDays :size="13" />
                <span>{{ segment.name }}</span>
              </RouterLink>

              <span
                v-if="week.hiddenCount"
                class="calendar-overflow"
                :style="calendarOverflowStyle(week.hiddenCount)"
              >
                {{ t('festivals.moreEvents', { count: week.hiddenCount }) }}
              </span>
            </div>
          </div>
        </div>

        <section class="event-panel all-festivals-panel">
          <div class="event-panel-head">
            <div>
              <h2>{{ t('festivals.allFestivals') }}</h2>
            </div>
            <span>{{ festivalRangeLabel }}</span>
          </div>

          <div class="all-festival-grid" :class="{ loading: isFestivalPageLoading }">
            <RouterLink
              v-for="festival in festivals"
              :key="festival.id"
              class="all-festival-card"
              :to="`/places/${festival.id}`"
            >
              <img :src="festival.image" :alt="festival.name" />
              <div>
                <span>{{ festival.date }}</span>
                <strong>{{ festival.name }}</strong>
                <p>{{ festival.location }}</p>
              </div>
            </RouterLink>
          </div>

          <div v-if="festivalPageCount > 1" class="festival-pagination">
            <div class="pagination-controls">
              <button
                class="icon-btn"
                type="button"
                :disabled="festivalPage === 1 || isFestivalPageLoading"
                :title="t('common.previous')"
                @click="festivalPage--"
              >
                <ChevronLeft :size="16" />
              </button>
              <button
                v-for="pageNumber in visibleFestivalPages"
                :key="pageNumber"
                type="button"
                class="page-btn"
                :class="{ active: festivalPage === pageNumber }"
                :disabled="isFestivalPageLoading"
                @click="festivalPage = pageNumber"
              >
                {{ pageNumber }}
              </button>
              <button
                class="icon-btn"
                type="button"
                :disabled="festivalPage === festivalPageCount || isFestivalPageLoading"
                :title="t('common.next')"
                @click="festivalPage++"
              >
                <ChevronRight :size="16" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Pause, Play } from '@lucide/vue'
import PageLoading from '../components/PageLoading.vue'
import { fetchFestivals, fetchFestivalsPage } from '../services/localHubApi'

const { t, tm } = useI18n()
const router = useRouter()
const FESTIVAL_PAGE_SIZE = 9
const FEATURED_CARD_COUNT = 3
const FEATURED_ROTATE_INTERVAL_MS = 4200
const CALENDAR_YEAR = 2026
const CALENDAR_MONTH_INDEX = 6
const CALENDAR_DAYS = 31
const MAX_WEEK_EVENT_ROWS = 4
const EVENT_COLORS = ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#06b6d4']

const weekdays = computed(() => tm('festivals.weekdays'))
const selectedDay = ref(1)
const calendarFestivals = ref([])
const festivals = ref([])
const totalFestivals = ref(0)
const festivalPage = ref(1)
const featuredOffset = ref(0)
const featuredSlideDirection = ref(1)
const isFeaturedPaused = ref(false)
const isFeaturedHovered = ref(false)
const isFestivalInitialLoading = ref(true)
const isFestivalPageLoading = ref(false)
let festivalPageRequestId = 0
let featuredRotateTimerId = null

const festivalSource = computed(() => {
  if (calendarFestivals.value.length) return calendarFestivals.value
  return festivals.value
})

const featuredFestivals = computed(() => {
  const source = festivalSource.value.filter((festival) => festival.image)
  if (!source.length) return []

  return Array.from({ length: Math.min(FEATURED_CARD_COUNT, source.length) }, (_, index) => {
    return source[(featuredOffset.value + index) % source.length]
  })
})

const featuredTransitionName = computed(() =>
  featuredSlideDirection.value >= 0 ? 'featured-forward' : 'featured-backward',
)

const calendarWeeks = computed(() => {
  const firstWeekday = new Date(CALENDAR_YEAR, CALENDAR_MONTH_INDEX, 1).getDay()
  const totalCells = Math.ceil((firstWeekday + CALENDAR_DAYS) / 7) * 7
  const weekCount = totalCells / 7

  return Array.from({ length: weekCount }, (_, weekIndex) => {
    const days = Array.from({ length: 7 }, (_, columnIndex) => {
      const value = weekIndex * 7 + columnIndex - firstWeekday + 1
      const inMonth = value >= 1 && value <= CALENDAR_DAYS
      const events = inMonth ? festivalsOn(value) : []

      return {
        id: `${weekIndex}-${columnIndex}`,
        value: inMonth ? value : null,
        column: columnIndex + 1,
        events,
      }
    })

    const weekDayValues = days.map((day) => day.value).filter(Boolean)
    const weekStart = Math.min(...weekDayValues)
    const weekEnd = Math.max(...weekDayValues)
    const rowEnds = []

    const candidates = festivalSource.value
      .map((festival, index) => {
        const eventDays = Array.isArray(festival.days)
          ? festival.days.filter((day) => day >= weekStart && day <= weekEnd)
          : []

        if (!eventDays.length) return null

        const startDay = Math.min(...eventDays)
        const endDay = Math.max(...eventDays)
        const startColumn = days.find((day) => day.value === startDay)?.column || 1
        const endColumn = days.find((day) => day.value === endDay)?.column || startColumn

        return {
          ...festival,
          key: `${festival.id}-${weekIndex}`,
          startColumn,
          span: endColumn - startColumn + 1,
          color: festival.color || EVENT_COLORS[index % EVENT_COLORS.length],
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.startColumn - b.startColumn || b.span - a.span || String(a.name).localeCompare(String(b.name)))

    const placedSegments = candidates.map((segment) => {
      const reusableRow = rowEnds.findIndex((endColumn) => endColumn < segment.startColumn)
      const row = reusableRow === -1 ? rowEnds.length : reusableRow
      rowEnds[row] = segment.startColumn + segment.span - 1
      return { ...segment, row }
    })

    const segments = placedSegments.filter((segment) => segment.row < MAX_WEEK_EVENT_ROWS)

    return {
      index: weekIndex,
      days,
      segments,
      hiddenCount: Math.max(0, placedSegments.length - segments.length),
    }
  })
})

const festivalPageCount = computed(() => Math.max(1, Math.ceil(totalFestivals.value / FESTIVAL_PAGE_SIZE)))

const visibleFestivalPages = computed(() => {
  const maxVisible = 5
  const start = Math.max(1, Math.min(festivalPage.value - 2, festivalPageCount.value - maxVisible + 1))
  const end = Math.min(festivalPageCount.value, start + maxVisible - 1)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

const festivalRangeLabel = computed(() => {
  if (!totalFestivals.value) return t('common.zeroShown')

  const start = (festivalPage.value - 1) * FESTIVAL_PAGE_SIZE + 1
  const end = Math.min(festivalPage.value * FESTIVAL_PAGE_SIZE, totalFestivals.value)

  return t('common.rangeShown', {
    start: start.toLocaleString(),
    end: end.toLocaleString(),
  })
})

function festivalsOn(day) {
  return festivalSource.value.filter((festival) => Array.isArray(festival.days) && festival.days.includes(day))
}

function calendarEventStyle(segment) {
  return {
    '--event-row': segment.row,
    '--event-color': segment.color,
    gridColumn: `${segment.startColumn} / span ${segment.span}`,
  }
}

function calendarOverflowStyle() {
  return {
    '--event-row': MAX_WEEK_EVENT_ROWS,
    gridColumn: '1 / -1',
  }
}

function shiftFeatured(step) {
  const sourceLength = festivalSource.value.length
  if (sourceLength <= 1) return

  featuredSlideDirection.value = step >= 0 ? 1 : -1
  featuredOffset.value = (featuredOffset.value + step + sourceLength) % sourceLength
}

function moveFeatured(step) {
  shiftFeatured(step)
}

function toggleFeaturedRotation() {
  isFeaturedPaused.value = !isFeaturedPaused.value
}

function openCalendarDay(day) {
  if (!day.value) return

  selectedDay.value = day.value

  if (day.events.length) {
    router.push(`/places/${day.events[0].id}`)
  }
}

async function loadCalendarFestivals() {
  calendarFestivals.value = await fetchFestivals()
}

async function loadFestivalPage() {
  const requestId = ++festivalPageRequestId
  isFestivalPageLoading.value = true

  try {
    const response = await fetchFestivalsPage({
      page: festivalPage.value,
      pageSize: FESTIVAL_PAGE_SIZE,
    })

    if (requestId !== festivalPageRequestId) return

    totalFestivals.value = response.pagination.total
    const nextPageCount = Math.max(1, Math.ceil(response.pagination.total / FESTIVAL_PAGE_SIZE))

    if (festivalPage.value > nextPageCount) {
      festivalPage.value = nextPageCount
      return
    }

    festivals.value = response.items
  } finally {
    if (requestId === festivalPageRequestId) {
      isFestivalPageLoading.value = false
    }
  }
}

function startFeaturedRotation() {
  if (featuredRotateTimerId) {
    window.clearInterval(featuredRotateTimerId)
  }

  featuredRotateTimerId = window.setInterval(() => {
    const sourceLength = festivalSource.value.length
    if (sourceLength > 1 && !isFeaturedPaused.value && !isFeaturedHovered.value) {
      shiftFeatured(1)
    }
  }, FEATURED_ROTATE_INTERVAL_MS)
}

watch(festivalPage, () => {
  loadFestivalPage()
})

watch(festivalSource, () => {
  featuredOffset.value = 0
})

onMounted(async () => {
  try {
    await Promise.all([loadCalendarFestivals(), loadFestivalPage()])
  } finally {
    isFestivalInitialLoading.value = false
    startFeaturedRotation()
  }
})

onBeforeUnmount(() => {
  if (featuredRotateTimerId) {
    window.clearInterval(featuredRotateTimerId)
  }
})
</script>

<style scoped>
.festival-page-stack {
  display: grid;
  gap: 22px;
}

.event-panel-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
}

.event-panel-head h2 {
  margin: 0;
  color: var(--text);
  font-size: 1.22rem;
  line-height: 1.28;
}

.event-panel-head p,
.calendar-head p {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

.featured-festivals {
  position: relative;
  display: grid;
  gap: 12px;
  overflow: hidden;
}

.featured-controls {
  justify-self: end;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.featured-control {
  display: inline-flex;
  align-items: center;
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

.featured-control:hover {
  background: var(--surface-soft);
  transform: translateY(-1px);
}

.featured-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: var(--featured-card-height);
  --featured-card-height: clamp(560px, 45vw, 735px);
  gap: 14px;
}

.featured-card {
  position: relative;
  overflow: hidden;
  height: var(--featured-card-height);
  min-height: 0;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

.featured-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition:
    filter 260ms ease,
    opacity 260ms ease,
    transform 320ms ease;
}

.featured-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: end;
  gap: 8px;
  padding: clamp(16px, 2vw, 24px);
  color: #fff;
  opacity: 0;
  background:
    linear-gradient(180deg, rgba(13, 17, 23, 0.06), rgba(13, 17, 23, 0.78)),
    rgba(13, 17, 23, 0.28);
  transform: translateY(10px);
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.featured-card:hover img,
.featured-card:focus-visible img {
  opacity: 0.5;
  filter: saturate(0.9);
  transform: scale(1.035);
}

.featured-card:hover .featured-overlay,
.featured-card:focus-visible .featured-overlay {
  opacity: 1;
  transform: translateY(0);
}

.featured-overlay span,
.featured-overlay small {
  font-size: 0.82rem;
  font-weight: 800;
}

.featured-overlay h3 {
  margin: 0;
  font-size: clamp(1.18rem, 1.8vw, 1.62rem);
  line-height: 1.25;
}

.featured-overlay p {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: rgba(255, 255, 255, 0.84);
  font-size: 0.92rem;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.featured-overlay small {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.86);
}

.featured-forward-move,
.featured-forward-enter-active,
.featured-forward-leave-active,
.featured-backward-move,
.featured-backward-enter-active,
.featured-backward-leave-active {
  transition:
    opacity 420ms ease,
    transform 420ms ease;
}

.featured-forward-leave-active,
.featured-backward-leave-active {
  position: absolute;
  top: 0;
  width: calc((100% - 28px) / 3);
  height: var(--featured-card-height);
}

.featured-forward-enter-from,
.featured-backward-leave-to {
  opacity: 0;
  transform: translateX(42px);
}

.featured-forward-leave-to,
.featured-backward-enter-from {
  opacity: 0;
  transform: translateX(-42px);
}

.calendar {
  overflow: hidden;
  background: var(--surface);
}

.calendar-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  background: var(--surface);
}

.calendar-head h2 {
  margin: 0;
  color: var(--text);
  font-size: 1.24rem;
}

.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  border-top: 1px solid var(--line);
}

.weekday {
  display: grid;
  place-items: center;
  min-height: 42px;
  color: var(--muted);
  border-right: 1px solid var(--line-soft);
  font-size: 0.82rem;
  font-weight: 850;
}

.weekday:last-child {
  border-right: 0;
}

.calendar-body {
  display: grid;
}

.calendar-week {
  position: relative;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  min-height: 148px;
  background: var(--surface);
  border-top: 1px solid var(--line);
}

.calendar-day {
  position: relative;
  z-index: 1;
  grid-row: 1;
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  min-height: 148px;
  padding: 10px;
  color: var(--text);
  background: transparent;
  border-right: 1px solid var(--line-soft);
  text-align: left;
  transition:
    background 160ms ease,
    color 160ms ease;
}

.calendar-day:nth-of-type(7n) {
  border-right: 0;
}

.calendar-day:disabled {
  cursor: default;
  background: var(--surface-soft);
}

.calendar-day:not(:disabled):hover,
.calendar-day.active {
  background: var(--primary-soft);
}

.calendar-day > span {
  color: var(--muted);
  font-weight: 850;
}

.calendar-day.has-event > span,
.calendar-day.active > span {
  color: var(--primary);
}

.calendar-day small {
  flex: 0 0 auto;
  color: var(--muted-light);
  font-size: 0.72rem;
  font-weight: 800;
}

.calendar-event,
.calendar-overflow {
  z-index: 5;
  grid-row: 1;
  align-self: start;
  min-width: 0;
  height: 24px;
  margin: 0 3px;
  margin-top: calc(38px + (var(--event-row) * 27px));
  border-radius: 5px;
  font-size: 0.74rem;
  font-weight: 850;
  line-height: 24px;
}

.calendar-event {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 8px;
  color: #fff;
  background: var(--event-color);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
  transition:
    filter 160ms ease,
    transform 160ms ease;
}

.calendar-event:hover {
  filter: brightness(1.04);
  transform: translateY(-1px);
}

.calendar-event span {
  overflow: hidden;
  min-width: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-event svg {
  flex: 0 0 auto;
}

.calendar-overflow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  background: var(--surface-soft);
  border: 1px solid var(--line-soft);
}

.event-panel {
  padding: 18px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

.event-panel-head {
  margin-bottom: 14px;
}

.event-panel-head > span {
  flex: 0 0 auto;
  color: var(--muted);
  font-size: 0.84rem;
  font-weight: 800;
  white-space: nowrap;
}

.all-festival-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.all-festival-grid.loading {
  opacity: 0.58;
}

.all-festival-card {
  display: grid;
  align-items: center;
  grid-template-columns: 124px minmax(0, 1fr);
  gap: 12px;
  min-height: 110px;
  padding: 10px;
  background: var(--surface-soft);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  transition:
    background 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;
}

.all-festival-card:hover {
  background: var(--surface);
  border-color: var(--line);
  transform: translateY(-2px);
}

.all-festival-card img {
  width: 124px;
  height: 88px;
  object-fit: cover;
  background: var(--placeholder);
  border-radius: var(--radius);
}

.all-festival-card div {
  min-width: 0;
}

.all-festival-card span,
.all-festival-card strong,
.all-festival-card p {
  display: block;
}

.all-festival-card span {
  color: var(--muted-light);
  font-size: 0.78rem;
  font-weight: 800;
}

.all-festival-card strong {
  overflow: hidden;
  margin-top: 6px;
  color: var(--text);
  font-size: 0.98rem;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.all-festival-card p {
  overflow: hidden;
  margin: 7px 0 0;
  color: var(--muted);
  font-size: 0.84rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.festival-pagination {
  display: grid;
  justify-items: center;
  margin-top: 16px;
}

.pagination-controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.page-btn {
  width: 36px;
  height: 36px;
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
.festival-pagination .icon-btn:disabled {
  opacity: 0.45;
}

@media (max-width: 1120px) {
  .all-festival-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 880px) {
  .featured-grid {
    grid-template-columns: 1fr;
    grid-auto-rows: var(--featured-card-height);
    --featured-card-height: 260px;
  }

  .featured-forward-leave-active,
  .featured-backward-leave-active {
    width: 100%;
  }

  .featured-card {
    height: var(--featured-card-height);
  }

  .calendar-week {
    min-height: 122px;
  }

  .calendar-day {
    min-height: 122px;
    padding: 8px;
  }

  .calendar-day small {
    display: none;
  }

  .calendar-event,
  .calendar-overflow {
    height: 22px;
    margin-top: calc(34px + (var(--event-row) * 24px));
    font-size: 0.68rem;
    line-height: 22px;
  }
}

@media (max-width: 680px) {
  .event-panel-head,
  .calendar-head {
    align-items: start;
    flex-direction: column;
  }

  .weekday {
    min-height: 34px;
    font-size: 0.74rem;
  }

  .calendar-week {
    min-height: 92px;
  }

  .calendar-day {
    min-height: 92px;
    padding: 6px;
  }

  .calendar-event,
  .calendar-overflow {
    display: none;
  }

  .all-festival-grid {
    grid-template-columns: 1fr;
  }

  .all-festival-card {
    grid-template-columns: 96px minmax(0, 1fr);
  }

  .all-festival-card img {
    width: 96px;
    height: 74px;
  }
}
</style>
