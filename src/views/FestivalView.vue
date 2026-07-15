<template>
  <section class="section">
    <div class="container">
      <div class="page-title">
        <h1>축제 캘린더</h1>
        <p>백엔드 서울 축제공연행사 데이터를 함께 확인합니다.</p>
      </div>

      <div class="festival-layout">
        <div class="calendar panel">
          <div class="calendar-head">
            <h2>2026년 7월</h2>
            <span class="badge amber">MVP 선택 기능</span>
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
            <small v-for="festival in festivalsOn(day)" :key="festival.id">{{ festival.name }}</small>
          </button>
        </div>

        <aside class="event-side">
          <div class="event-panel">
            <h2>{{ selectedDay }}일 행사</h2>
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
            <p v-else class="muted">선택한 날짜의 행사가 없습니다.</p>
          </div>

          <div class="event-panel">
            <h2>전체 축제</h2>
            <div class="mini-list">
              <article v-for="festival in festivals" :key="festival.id">
                <span :style="{ background: festival.color }"></span>
                <div>
                  <strong>{{ festival.name }}</strong>
                  <small>{{ festival.date }} · {{ festival.location }}</small>
                </div>
              </article>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { festivals as fallbackFestivals } from '../data/localhub'
import { fetchFestivals } from '../services/localHubApi'

const weekdays = ['일', '월', '화', '수', '목', '금', '토']
const selectedDay = ref(20)
const festivals = ref([...fallbackFestivals])
const leadingBlanks = Array.from({ length: new Date(2026, 6, 1).getDay() }, (_, index) => index)

const festivalsOn = (day) => festivals.value.filter((festival) => festival.days.includes(day))
const selectedEvents = computed(() => festivalsOn(selectedDay.value))

onMounted(async () => {
  festivals.value = await fetchFestivals()
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
  background: #fff;
}

.calendar-head h2 {
  margin: 0;
}

.weekday,
.blank-cell,
.day-cell {
  min-height: 58px;
  background: #fff;
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
  color: #fff;
  background: var(--primary);
  border-radius: 6px;
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-side {
  display: grid;
  align-content: start;
  gap: 14px;
}

.event-panel {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 18px;
}

.event-panel h2 {
  margin: 0 0 14px;
  font-size: 1.1rem;
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
