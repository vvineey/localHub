<template>
  <div class="stat-bars panel">
    <div v-for="item in items" :key="item.label" class="bar-row">
      <div class="bar-label">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
      <div class="bar-track">
        <span :style="{ width: `${item.percent}%`, background: item.color }"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
  },
})
</script>

<style scoped>
.stat-bars {
  display: grid;
  gap: 15px;
  padding: 18px;
}

.bar-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  color: var(--muted);
  font-size: 0.86rem;
}

.bar-label strong {
  color: var(--text);
}

.bar-track {
  overflow: hidden;
  height: 9px;
  background: var(--line-soft);
  border-radius: 999px;
}

.bar-track span {
  display: block;
  height: 100%;
  border-radius: 999px;
}
</style>
