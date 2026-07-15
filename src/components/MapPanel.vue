<template>
  <div class="map-panel">
    <div ref="mapElement" class="kakao-map" :aria-label="t('map.panelAria')"></div>
    <div v-if="statusMessage" class="map-status">
      <strong>{{ statusTitle }}</strong>
      <span>{{ statusMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { hasKakaoMapAppKey, loadKakaoMapsSdk } from '../services/kakaoMapSdk'

const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 }
const TYPE_STYLES = {
  attraction: { color: '#2563eb', labelKey: 'categories.attraction' },
  restaurant: { color: '#ef4444', labelKey: 'categories.restaurant' },
  nature: { color: '#10b981', labelKey: 'categories.nature' },
  accommodation: { color: '#06b6d4', labelKey: 'categories.accommodation' },
  festival: { color: '#f59e0b', labelKey: 'categories.festival' },
  shopping: { color: '#8b5cf6', labelKey: 'categories.shopping' },
}

const props = defineProps({
  pins: {
    type: Array,
    required: true,
  },
  userLocation: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['select', 'mapclick'])
const { locale, t } = useI18n()
const mapElement = ref(null)
const map = shallowRef(null)
const kakaoMaps = shallowRef(null)
const overlays = shallowRef([])
const locationMarker = shallowRef(null)
const activeOverlay = shallowRef(null)
const statusState = ref(hasKakaoMapAppKey() ? 'loading' : 'missingKey')
const statusTitle = computed(() => {
  if (statusState.value === 'loading') return t('map.loadingTitle')
  if (statusState.value === 'missingKey') return t('map.keyRequiredTitle')
  return ''
})
const statusMessage = computed(() => {
  if (statusState.value === 'loading') return t('map.loading')
  if (statusState.value === 'missingKey') return t('map.keyRequiredMessage')
  return ''
})

const coordinatePins = computed(() =>
  props.pins
    .map((pin) => ({
      ...pin,
      lat: Number(pin.lat ?? pin.latitude),
      lng: Number(pin.lng ?? pin.longitude),
    }))
    .filter((pin) => Number.isFinite(pin.lat) && Number.isFinite(pin.lng)),
)

function styleFor(type) {
  return TYPE_STYLES[type] || TYPE_STYLES.attraction
}

function clearOverlays() {
  overlays.value.forEach((overlay) => overlay.setMap(null))
  overlays.value = []
  activeOverlay.value = null

  if (locationMarker.value) {
    locationMarker.value.setMap(null)
    locationMarker.value = null
  }
}

function renderLocationMarker() {
  if (!kakaoMaps.value || !map.value) return

  if (locationMarker.value) {
    locationMarker.value.setMap(null)
    locationMarker.value = null
  }

  const lat = Number(props.userLocation?.lat)
  const lng = Number(props.userLocation?.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

  const position = new kakaoMaps.value.LatLng(lat, lng)
  locationMarker.value = new kakaoMaps.value.Marker({
    map: map.value,
    position,
    title: t('map.currentLocationMarker'),
  })
}

function createPinElement(pin) {
  const style = styleFor(pin.type)
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'kakao-pin'
  button.setAttribute('aria-label', pin.name)
  button.style.setProperty('--pin-color', pin.color || style.color)

  const dot = document.createElement('span')
  dot.className = 'kakao-pin-dot'

  const label = document.createElement('span')
  label.className = 'kakao-pin-label'
  label.textContent = pin.name

  const type = document.createElement('span')
  type.className = 'kakao-pin-type'
  type.textContent = t(style.labelKey)

  label.appendChild(type)
  button.append(dot, label)

  return button
}

function activateOverlay(overlay) {
  activeOverlay.value?.getContent()?.classList.remove('active')
  activeOverlay.value = overlay
  activeOverlay.value?.getContent()?.classList.add('active')
}

function fitMapToPins() {
  if (!kakaoMaps.value || !map.value || !coordinatePins.value.length) return

  const bounds = new kakaoMaps.value.LatLngBounds()
  const userLat = Number(props.userLocation?.lat)
  const userLng = Number(props.userLocation?.lng)
  const hasUserLocation = Number.isFinite(userLat) && Number.isFinite(userLng)

  if (hasUserLocation) {
    // 1. 기준점이 되는 '내 위치'를 먼저 포함합니다.
    bounds.extend(new kakaoMaps.value.LatLng(userLat, userLng))

    // 2. 내 위치 기준으로 가장 가까운 순서대로 핀들을 정렬합니다.
    const sortedPins = [...coordinatePins.value].sort((a, b) => {
      const distA = Math.pow(a.lat - userLat, 2) + Math.pow(a.lng - userLng, 2)
      const distB = Math.pow(b.lat - userLat, 2) + Math.pow(b.lng - userLng, 2)
      return distA - distB
    })

    // 3. 가장 가까운 3개의 핀만 바운드(화면 영역) 계산에 넣습니다.
    // (더 멀리 있는 핀들은 지도에는 그려져 있지만, 첫 화면에서는 안 보이고 드래그해야 보입니다.)
    const closestPins = sortedPins.slice(0, 3)
    closestPins.forEach((pin) => {
      bounds.extend(new kakaoMaps.value.LatLng(pin.lat, pin.lng))
    })
  } else {
    // 만약 내 위치 정보가 아직 없거나 가져오지 못했다면, 기본적으로 모든 핀이 다 보이게 맞춥니다.
    coordinatePins.value.forEach((pin) => {
      bounds.extend(new kakaoMaps.value.LatLng(pin.lat, pin.lng))
    })
  }

  // 여백(Padding)을 48px 주어 화면 가장자리에 너무 붙지 않게 영역을 맞춥니다.
  map.value.setBounds(bounds, 48, 48, 48, 48)
}

function renderOverlays() {
  if (!kakaoMaps.value || !map.value) return

  clearOverlays()

  coordinatePins.value.forEach((pin, index) => {
    const position = new kakaoMaps.value.LatLng(pin.lat, pin.lng)
    const content = createPinElement(pin)
    const overlay = new kakaoMaps.value.CustomOverlay({
      content,
      position,
      xAnchor: 0.5,
      yAnchor: 1.05,
      zIndex: 10 + index,
    })

    content.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      activateOverlay(overlay)
      map.value.panTo(position)
      emit('select', pin)
    })

    overlay.setMap(map.value)
    overlays.value = [...overlays.value, overlay]
  })

  renderLocationMarker()
  fitMapToPins()
}

function initializeMap(kakao) {
  if (map.value || !mapElement.value) return

  kakaoMaps.value = kakao.maps
  map.value = new kakaoMaps.value.Map(mapElement.value, {
    center: new kakaoMaps.value.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng),
    level: 8,
  })

  map.value.addControl(new kakaoMaps.value.ZoomControl(), kakaoMaps.value.ControlPosition.RIGHT)
  map.value.addControl(new kakaoMaps.value.MapTypeControl(), kakaoMaps.value.ControlPosition.TOPRIGHT)
  map.value.addListener('click', () => emit('mapclick'))
  statusState.value = ''
  renderOverlays()
}

onMounted(async () => {
  await nextTick()

  try {
    const kakao = await loadKakaoMapsSdk()
    initializeMap(kakao)
  } catch {
    statusState.value = 'missingKey'
  }
})

// 1. 핀 목록이나 다국어(locale)가 변경될 때만 마커들을 새로 그립니다.
watch([coordinatePins, locale], () => {
  renderOverlays()
}, { flush: 'post' })

// 2. 사용자의 현재 위치가 감지되거나 변경되면, 지도를 즉시 가까운 곳 위주로 줌인합니다.
watch(
  () => [props.userLocation?.lat, props.userLocation?.lng],
  ([newLat, newLng]) => {
    const lat = Number(newLat)
    const lng = Number(newLng)
    
    // 유효한 좌표가 들어왔을 때만 실행합니다.
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      renderLocationMarker()
      fitMapToPins()
    }
  },
  { flush: 'post', immediate: true }
)

onBeforeUnmount(() => {
  clearOverlays()
  map.value = null
  kakaoMaps.value = null
})
</script>

<style scoped>
.map-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--map-panel-bg);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.kakao-map {
  width: 100%;
  height: min(64vh, 620px);
  min-height: 500px;
}

.map-status {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  place-content: center;
  gap: 8px;
  padding: 28px;
  text-align: center;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(239, 68, 68, 0.08)),
    var(--map-status-bg);
  backdrop-filter: blur(6px);
}

.map-status strong {
  font-size: 1.08rem;
}

.map-status span {
  max-width: 360px;
  color: var(--muted);
  line-height: 1.55;
}

:global(.kakao-pin) {
  display: inline-flex;
  align-items: center;
  max-width: 220px;
  min-height: 34px;
  gap: 7px;
  padding: 6px 10px 6px 7px;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.26);
  border-radius: 999px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.18);
  cursor: pointer;
  font: inherit;
  transform: translateY(0);
  transition:
    box-shadow 180ms ease,
    transform 180ms ease,
    border-color 180ms ease;
  white-space: nowrap;
}

:global(.kakao-pin:hover),
:global(.kakao-pin.active) {
  border-color: color-mix(in srgb, var(--pin-color) 42%, #ffffff);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.24);
  transform: translateY(-5px);
}

:global(.kakao-pin-dot) {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  background: var(--pin-color);
  border: 3px solid #fff;
  border-radius: 999px;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--pin-color) 28%, transparent);
}

:global(.kakao-pin-label) {
  overflow: hidden;
  display: inline-grid;
  max-width: 0;
  opacity: 0;
  transition:
    max-width 180ms ease,
    opacity 180ms ease;
}

:global(.kakao-pin:hover .kakao-pin-label),
:global(.kakao-pin.active .kakao-pin-label) {
  max-width: 168px;
  opacity: 1;
}

:global(.kakao-pin-label) {
  color: #0f172a;
  font-size: 0.84rem;
  font-weight: 900;
  line-height: 1.2;
  text-overflow: ellipsis;
}

:global(.kakao-pin-type) {
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 800;
}

:global([data-theme='dark'] .kakao-pin) {
  color: #0a0a0a;
  background: rgba(255, 255, 255, 0.94);
  border-color: rgba(255, 255, 255, 0.22);
}

:global([data-theme='dark'] .kakao-pin-label) {
  color: #0a0a0a;
}

:global([data-theme='dark'] .kakao-pin-type) {
  color: #525252;
}

@media (max-width: 720px) {
  .kakao-map {
    min-height: 360px;
  }
}
</style>
