<template>
  <div class="map-panel">
    <div class="map-canvas" role="img" aria-label="서울 주요 관광지와 축제 위치 지도">
      <div class="river river-a"></div>
      <div class="river river-b"></div>
      <div class="map-label north">북한산</div>
      <div class="map-label river-label">한강</div>
      <button
        v-for="pin in pins"
        :key="pin.id"
        class="map-pin"
        type="button"
        :style="{ left: `${pin.x}%`, top: `${pin.y}%`, '--pin-color': pin.color }"
        :aria-label="pin.name"
        :title="pin.name"
        @click="$emit('select', pin)"
      >
        <MapPin :size="18" fill="currentColor" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { MapPin } from '@lucide/vue'

defineProps({
  pins: {
    type: Array,
    required: true,
  },
})

defineEmits(['select'])
</script>

<style scoped>
.map-panel {
  overflow: hidden;
  min-height: 460px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background:
    linear-gradient(135deg, rgba(16, 185, 129, 0.12), transparent 42%),
    linear-gradient(220deg, rgba(37, 99, 235, 0.13), transparent 45%),
    #eef6f3;
}

.map-canvas {
  position: relative;
  min-height: 460px;
  isolation: isolate;
}

.map-canvas::before,
.map-canvas::after {
  position: absolute;
  z-index: 0;
  content: '';
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 38% 62% 48% 52%;
}

.map-canvas::before {
  top: 11%;
  left: 13%;
  width: 34%;
  height: 28%;
}

.map-canvas::after {
  right: 10%;
  bottom: 18%;
  width: 40%;
  height: 36%;
}

.river {
  position: absolute;
  z-index: 1;
  left: -8%;
  right: -8%;
  height: 34px;
  background: rgba(6, 182, 212, 0.28);
  border: 1px solid rgba(6, 182, 212, 0.25);
  transform: rotate(-8deg);
}

.river-a {
  top: 51%;
}

.river-b {
  top: 57%;
  height: 18px;
  opacity: 0.48;
}

.map-label {
  position: absolute;
  z-index: 2;
  padding: 5px 8px;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 800;
}

.north {
  top: 14%;
  left: 24%;
}

.river-label {
  top: 54%;
  left: 50%;
}

.map-pin {
  position: absolute;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--pin-color);
  background: #fff;
  border: 2px solid currentColor;
  border-radius: 999px;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.16);
  transform: translate(-50%, -50%);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;
}

.map-pin:hover {
  box-shadow: 0 16px 28px rgba(15, 23, 42, 0.2);
  transform: translate(-50%, -58%);
}

@media (max-width: 720px) {
  .map-panel,
  .map-canvas {
    min-height: 360px;
  }
}
</style>
