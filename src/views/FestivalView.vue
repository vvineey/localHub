<template>
  <section class="section">
    <div class="container">
      <div class="page-title">
        <h1>{{ t('festivals.title') }}</h1>
        <p>{{ t('festivals.description') }}</p>
      </div>

      <div class="festival-layout">
        <div class="calendar panel">
          <div class="calendar-head">
            <h2>{{ t('festivals.monthTitle') }}</h2>
            <span class="badge amber">{{ t('festivals.mvp') }}</span>
          </div>
          <div class="weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
          <span v-for="blank in leadingBlanks" :key="`blank-${blank}`" class="blank-cell"></span>
          <button
            v-for="day in 31"
            :key="day"
            type="button"
            class="day-cell"
            :class="{ active: selectedDay === day, hasEvent: festivalsOn(day).length }"
            @click="selectedDay = day"
          >
            <span>{{ day }}</span>
            <small v-for="festival in visibleFestivalsOn(day)" :key="festival.id">{{ festival.name }}</small>
            <small v-if="hiddenFestivalsCount(day)" class="more-events">+{{ hiddenFestivalsCount(day) }}</small>
          </button>
        </div>

        <aside class="event-side">
          <div class="event-panel">
            <h2>{{ t('festivals.selectedEvents', { day: selectedDay }) }}</h2>
            <div v-if="selectedEvents.length" class="event-stack">
              <article v-for="festival in selectedEvents" :key="festival.id">
                <img :src="festival.image" :alt="festival.name" />
                <div>
                  <strong>{{ festival.name }}</strong>
                  <span>{{ festival.location }}</span>
                  <p>{{ festival.summary }}</p>
                </div>
              </article>
            </div>
            <p v-else class="muted">{{ t('festivals.noEvents') }}</p>
          </div>

          <div class="event-panel">
            <div class="event-panel-head">
              <h2>{{ t('festivals.allFestivals') }}</h2>
              <span>{{ festivalRangeLabel }}</span>
            </div>
            <div class="mini-list" :class="{ loading: isFestivalPageLoading }">
              <article v-for="festival in festivals" :key="festival.id">
                <span :style="{ background: festival.color }"></span>
                <div>
                  <strong>{{ festival.name }}</strong>
                  <small>{{ festival.date }} · {{ festival.location }}</small>
                </div>
              </article>
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
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { festivals as fallbackFestivals } from '../data/localhub'
import { fetchFestivals, fetchFestivalsPage } from '../services/localHubApi'

const { t, tm } = useI18n()
const FESTIVAL_PAGE_SIZE = 5
const MAX_DAY_EVENT_LABELS = 2
const weekdays = computed(() => tm('festivals.weekdays'))
const selectedDay = ref(20)
const calendarFestivals = ref([...fallbackFestivals])
const festivals = ref(fallbackFestivals.slice(0, FESTIVAL_PAGE_SIZE))
const totalFestivals = ref(fallbackFestivals.length)
const festivalPage = ref(1)
const isFestivalPageLoading = ref(false)
const leadingBlanks = Array.from({ length: new Date(2026, 6, 1).getDay() }, (_, index) => index)
let festivalPageRequestId = 0

const festivalsOn = (day) => calendarFestivals.value.filter((festival) => festival.days.includes(day))
const visibleFestivalsOn = (day) => festivalsOn(day).slice(0, MAX_DAY_EVENT_LABELS)
const hiddenFestivalsCount = (day) => Math.max(0, festivalsOn(day).length - MAX_DAY_EVENT_LABELS)
const selectedEvents = computed(() => festivalsOn(selectedDay.value))
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

watch(festivalPage, () => {
  loadFestivalPage()
})

onMounted(async () => {
  loadCalendarFestivals()
  loadFestivalPage()
})
</script>

<style scoped>
.festival-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 18px;
}

.calendar {
  display: grid;
  align-self: start;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  background: var(--line);
}

.calendar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  grid-column: 1 / -1;
  padding: 18px;
  background: var(--surface);
}

.calendar-head h2 {
  margin: 0;
}

.weekday,
.blank-cell,
.day-cell {
  min-height: 58px;
  background: var(--surface);
}

.weekday {
  display: grid;
  place-items: center;
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 850;
}

.day-cell {
  display: grid;
  align-content: start;
  gap: 5px;
  min-height: 108px;
  padding: 10px;
  color: var(--text);
  text-align: left;
}

.blank-cell {
  display: block;
}

.day-cell:hover,
.day-cell.active {
  background: var(--primary-soft);
}

.day-cell.hasEvent span {
  color: var(--primary);
  font-weight: 900;
}

.day-cell small {
  display: block;
  overflow: hidden;
  padding: 4px 6px;
  color: var(--on-primary);
  background: var(--primary);
  border-radius: 6px;
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.day-cell .more-events {
  color: var(--primary);
  background: var(--primary-soft);
}

.event-side {
  display: grid;
  align-content: start;
  gap: 14px;
}

.event-panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 18px;
}

.event-panel h2 {
  margin: 0 0 14px;
  font-size: 1.1rem;
}

.event-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.event-panel-head h2 {
  margin: 0;
}

.event-panel-head span {
  flex: 0 0 auto;
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 750;
  white-space: nowrap;
}

.event-stack {
  display: grid;
  gap: 12px;
}

.event-stack article {
  overflow: hidden;
  border-radius: var(--radius);
  background: var(--surface-soft);
}

.event-stack img {
  width: 100%;
  height: 140px;
  object-fit: cover;
}

.event-stack div {
  padding: 12px;
}

.event-stack strong,
.event-stack span {
  display: block;
}

.event-stack span,
.event-stack p {
  color: var(--muted);
  font-size: 0.86rem;
}

.event-stack p {
  margin: 8px 0 0;
  line-height: 1.55;
}

.mini-list {
  display: grid;
  gap: 12px;
}

.mini-list.loading {
  opacity: 0.55;
}

.mini-list article {
  display: flex;
  gap: 10px;
}

.mini-list article > span {
  width: 10px;
  min-height: 42px;
  border-radius: 999px;
}

.mini-list strong,
.mini-list small {
  display: block;
}

.mini-list small {
  margin-top: 4px;
  color: var(--muted);
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

@media (max-width: 980px) {
  .festival-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .day-cell {
    min-height: 76px;
    padding: 7px;
  }

  .day-cell small {
    display: none;
  }
}
</style>
