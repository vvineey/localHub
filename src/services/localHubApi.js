import {
  categories as fallbackCategories,
  festivals as fallbackFestivals,
  mapPins as fallbackMapPins,
  places as fallbackPlaces,
} from '../data/localhub'
import { getPosts } from '../stores/community'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const PAGE_SIZE = 100
export const placeCategoryFilters = [
  { label: '전체', contentTypeId: null },
  { label: '관광지', contentTypeId: 12 },
  { label: '레포츠', contentTypeId: 28 },
  { label: '문화시설', contentTypeId: 14 },
  { label: '쇼핑', contentTypeId: 38 },
  { label: '숙박', contentTypeId: 32 },
  { label: '여행코스', contentTypeId: 25 },
  { label: '축제공연행사', contentTypeId: 15 },
]
const SEOUL_BOUNDS = {
  minLng: 126.75,
  maxLng: 127.2,
  minLat: 37.42,
  maxLat: 37.72,
}

let placesCache = null
let placesPromise = null

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function isRestaurantPlace(place = {}) {
  return [place.content_type_name, place.title, place.cat3_name, place.addr1]
    .filter(Boolean)
    .join(' ')
    .match(/음식|맛집|식당|카페|커피|레스토랑|한식|분식|고기|치킨|맥주|양조장/)
}

function typeFor(contentTypeName = '', place = {}) {
  if (isRestaurantPlace(place)) return 'restaurant'
  if (contentTypeName.includes('숙박')) return 'accommodation'
  if (contentTypeName.includes('축제')) return 'festival'
  if (contentTypeName.includes('쇼핑')) return 'shopping'
  if (contentTypeName.includes('레포츠') || contentTypeName.includes('여행코스')) return 'nature'
  return 'attraction'
}

function colorForType(type) {
  if (type === 'restaurant') return '#ef4444'
  if (type === 'accommodation') return '#06b6d4'
  if (type === 'nature') return '#10b981'
  if (type === 'festival') return '#f59e0b'
  if (type === 'shopping') return '#8b5cf6'
  return '#2563eb'
}

function fallbackImageFor(place) {
  return fallbackPlaces[(Number(place.id) || 1) % fallbackPlaces.length]?.image || fallbackPlaces[0].image
}

function coordinatePercent(place) {
  if (Number.isFinite(place.longitude) && Number.isFinite(place.latitude)) {
    return {
      x: clamp(
        ((place.longitude - SEOUL_BOUNDS.minLng) / (SEOUL_BOUNDS.maxLng - SEOUL_BOUNDS.minLng)) * 100,
        6,
        94,
      ),
      y: clamp(
        ((SEOUL_BOUNDS.maxLat - place.latitude) / (SEOUL_BOUNDS.maxLat - SEOUL_BOUNDS.minLat)) * 100,
        6,
        94,
      ),
    }
  }

  const seed = Number(place.id) || 1
  return {
    x: 12 + ((seed * 17) % 76),
    y: 14 + ((seed * 23) % 72),
  }
}

function coordinateFromPercent(pin) {
  const x = Number.isFinite(pin.x) ? pin.x : 50
  const y = Number.isFinite(pin.y) ? pin.y : 50

  return {
    lng: SEOUL_BOUNDS.minLng + (x / 100) * (SEOUL_BOUNDS.maxLng - SEOUL_BOUNDS.minLng),
    lat: SEOUL_BOUNDS.maxLat - (y / 100) * (SEOUL_BOUNDS.maxLat - SEOUL_BOUNDS.minLat),
  }
}

function mapApiPlace(place) {
  const category = place.content_type_name || '관광지'
  const type = typeFor(category, place)
  const image = place.first_image_url || place.thumbnail_url || fallbackImageFor(place)
  const district = place.district_name || '서울'
  const address = place.addr1 || '주소 미제공'
  const name = place.title || '서울 여행지'
  const longitude = Number(place.longitude)
  const latitude = Number(place.latitude)
  const coordinate = coordinatePercent({ ...place, longitude, latitude })

  return {
    id: place.id,
    contentId: place.content_id,
    name,
    category,
    district,
    address,
    rating: Number((4.2 + ((Number(place.id) || 1) % 7) / 10).toFixed(1)),
    reviews: 120 + ((Number(place.id) || 1) * 37) % 4800,
    hours: '운영 정보 미제공',
    price: '요금 정보 미제공',
    type,
    x: coordinate.x,
    y: coordinate.y,
    image,
    summary: `${name}은(는) ${district}의 ${category} 여행정보입니다. ${address}`,
    tags: [category, district].filter(Boolean),
    longitude: Number.isFinite(longitude) ? longitude : null,
    latitude: Number.isFinite(latitude) ? latitude : null,
  }
}

async function requestJson(path) {
  if (!API_BASE_URL || API_BASE_URL === 'mock') {
    throw new Error('Mock API mode')
  }

  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }
  return response.json()
}

function matchesPlace(place, keyword, category) {
  const normalized = keyword.trim().toLowerCase()
  const matchesKeyword =
    !normalized ||
    [place.name, place.category, place.district, place.address, place.summary, ...place.tags]
      .join(' ')
      .toLowerCase()
      .includes(normalized)
  const matchesCategory =
    category === '전체' ||
    place.category === category ||
    (category === '관광지' && place.type === 'attraction') ||
    (category === '레포츠' && place.type === 'nature') ||
    (category === '숙박' && place.type === 'accommodation') ||
    (category === '쇼핑' && place.type === 'shopping') ||
    (category === '축제공연행사' && place.type === 'festival')
  return matchesKeyword && matchesCategory
}

function contentTypeIdFor(category) {
  return placeCategoryFilters.find((item) => item.label === category)?.contentTypeId ?? null
}

function normalizePagination(pagination, fallbackPage, fallbackSize, fallbackTotal) {
  const page = Number(pagination?.page)
  const size = Number(pagination?.size)
  const total = Number(pagination?.total)

  return {
    page: Number.isFinite(page) && page > 0 ? page : fallbackPage,
    size: Number.isFinite(size) && size > 0 ? size : fallbackSize,
    total: Number.isFinite(total) && total >= 0 ? total : fallbackTotal,
  }
}

async function loadApiPlaces() {
  if (placesCache) return placesCache
  if (placesPromise) return placesPromise

  placesPromise = (async () => {
    try {
      const items = []
      let skip = 0

      while (true) {
        const payload = await requestJson(`/places?skip=${skip}&limit=${PAGE_SIZE}`)
        const pageItems = Array.isArray(payload.items) ? payload.items : []
        items.push(...pageItems.map(mapApiPlace))

        if (pageItems.length < PAGE_SIZE) break
        skip += PAGE_SIZE
      }

      placesCache = items.length ? items : fallbackPlaces
    } catch {
      placesCache = fallbackPlaces
    }

    return placesCache
  })()

  return placesPromise
}

export async function fetchPlaces({ keyword = '', category = '전체' } = {}) {
  const places = await loadApiPlaces()
  return places.filter((place) => matchesPlace(place, keyword, category))
}

export async function fetchPlacesPage({
  keyword = '',
  category = '전체',
  page = 1,
  pageSize = 9,
  fallbackOnError = true,
} = {}) {
  const safePage = Math.max(1, Number(page) || 1)
  const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 9))
  const skip = (safePage - 1) * safePageSize
  const contentTypeId = contentTypeIdFor(category)

  try {
    const params = new URLSearchParams({
      skip: String(skip),
      limit: String(safePageSize),
    })
    const trimmedKeyword = keyword.trim()

    if (trimmedKeyword) {
      params.set('keyword', trimmedKeyword)
    }

    if (contentTypeId) {
      params.set('content_type_id', String(contentTypeId))
    }

    const payload = await requestJson(`/places?${params.toString()}`)
    const items = Array.isArray(payload.items) ? payload.items.map(mapApiPlace) : []

    return {
      items,
      pagination: normalizePagination(payload.pagination, safePage, safePageSize, items.length),
    }
  } catch {
    if (!fallbackOnError) {
      return {
        items: [],
        pagination: {
          page: safePage,
          size: safePageSize,
          total: 0,
        },
      }
    }

    const places = await loadApiPlaces()
    const filteredPlaces = places.filter((place) => matchesPlace(place, keyword, category))
    const pageItems = filteredPlaces.slice(skip, skip + safePageSize)

    return {
      items: pageItems,
      pagination: {
        page: safePage,
        size: safePageSize,
        total: filteredPlaces.length,
      },
    }
  }
}

export async function fetchPlaceById(id) {
  const places = await loadApiPlaces()
  return places.find((place) => place.id === Number(id))
}

export async function fetchCategories() {
  const places = await loadApiPlaces()
  return ['전체', ...new Set(places.map((place) => place.category).filter(Boolean))]
}

export async function fetchFestivals() {
  const places = await loadApiPlaces()
  const festivals = places
    .filter((place) => place.type === 'festival')
    .map((place, index) => ({
      id: place.id,
      name: place.name,
      category: place.category,
      date: '일정 미제공',
      days: [],
      district: place.district,
      location: place.address,
      color: ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981'][index % 4],
      image: place.image,
      summary: place.summary,
    }))

  return festivals.length ? festivals : fallbackFestivals
}

export async function fetchMapPins({ max = 180 } = {}) {
  let places = []

  try {
    const payload = await requestJson(`/places?skip=0&limit=${max}`)
    places = Array.isArray(payload.items) ? payload.items.map(mapApiPlace) : []
  } catch {
    places = await loadApiPlaces()
  }

  const pins = places
    .filter((place) => Number.isFinite(place.longitude) && Number.isFinite(place.latitude))
    .slice(0, max)
    .map((place) => ({
      id: `place-${place.id}`,
      placeId: place.id,
      contentId: place.contentId,
      name: place.name,
      type: place.type,
      category: place.category,
      district: place.district,
      address: place.address,
      image: place.image,
      summary: place.summary,
      lat: place.latitude,
      lng: place.longitude,
      x: place.x,
      y: place.y,
      color: colorForType(place.type),
    }))

  return pins.length
    ? pins
    : fallbackMapPins.map((pin) => ({
        ...pin,
        ...coordinateFromPercent(pin),
        color: colorForType(pin.type),
        category: pin.type,
        district: '서울',
        address: '서울',
        summary: pin.name,
      }))
}

export async function searchAll(keyword = '') {
  const [places, festivals] = await Promise.all([fetchPlaces(), fetchFestivals()])
  const normalized = keyword.trim().toLowerCase()
  if (!normalized) {
    return { places, festivals, posts: getPosts() }
  }

  const match = (values) => values.join(' ').toLowerCase().includes(normalized)

  return {
    places: places.filter((place) =>
      match([place.name, place.category, place.district, place.summary, ...place.tags]),
    ),
    festivals: festivals.filter((festival) =>
      match([festival.name, festival.location, festival.summary]),
    ),
    posts: getPosts().filter((post) => match([post.title, post.content, post.category])),
  }
}

export async function askAssistant(message) {
  const text = message.toLowerCase()

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })
    if (response.ok) {
      return response.json()
    }
  } catch {
    // Local fallback keeps the SPA usable before the FastAPI chat endpoint is ready.
  }

  if (text.includes('축제') || text.includes('festival') || text.includes('7월')) {
    return {
      answer:
        '서울 축제공연행사 데이터는 백엔드 data/서울 폴더에서 불러오고 있습니다. 축제 화면에서 전체 행사 목록을 확인해보세요.',
    }
  }

  if (text.includes('예산') || text.includes('budget') || text.includes('비용')) {
    return {
      answer:
        '서울 3일 여행은 중급 숙박 기준 1인 1일 15만-25만원 정도를 잡으면 무난합니다. 대중교통은 T-money 카드, 실내 명소는 비 오는 날 일정으로 남겨두면 좋습니다.',
    }
  }

  if (text.includes('교통') || text.includes('transport') || text.includes('지하철')) {
    return {
      answer:
        '서울은 지하철 동선이 가장 안정적입니다. 공항에서 짐이 많으면 공항버스, 시내 이동은 T-money 카드를 추천합니다.',
    }
  }

  if (text.includes('후기') || text.includes('게시글') || text.includes('사진')) {
    return {
      answer:
        '커뮤니티에는 경복궁 동문 사진 스팟, 인사동 찻집, 북한산 둘레길 후기가 있습니다. 게시판 검색창에서 사진, 인사동, 북한산 같은 키워드로 찾아보세요.',
    }
  }

  return {
    answer:
      '서울 첫 방문이라면 경복궁, 인사동, DDP, 한강 일정을 묶는 코스를 추천합니다. 탐색 화면의 백엔드 연동 데이터에서 지역명과 카테고리로 찾아볼 수 있어요.',
  }
}

export { fallbackCategories }
