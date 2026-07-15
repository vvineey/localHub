import {
  categories as fallbackCategories,
  festivals as fallbackFestivals,
  mapPins as fallbackMapPins,
  places as fallbackPlaces,
} from '../data/localhub'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const PAGE_SIZE = 10000
const FESTIVAL_CONTENT_TYPE_ID = 15
const FESTIVAL_CALENDAR_YEAR = 2026
const FESTIVAL_CALENDAR_MONTH_INDEX = 6
const FESTIVAL_CALENDAR_DAYS = 31
const CHAT_SESSION_STORAGE_KEY = 'local-in-chat-session-id'
export const placeCategoryFilters = [
  { label: '전체', contentTypeId: null },
  { label: '관광지', contentTypeId: 12 },
  { label: '레포츠', contentTypeId: 28 },
  { label: '문화시설', contentTypeId: 14 },
  { label: '쇼핑', contentTypeId: 38 },
  { label: '숙박', contentTypeId: 32 },
  { label: '여행코스', contentTypeId: 25 },
  { label: '축제공연행사', contentTypeId: FESTIVAL_CONTENT_TYPE_ID },
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

function formatApiDate(value) {
  const text = String(value || '').trim()
  if (!text) return null
  if (/^\d{8}$/.test(text)) return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  return null
}

function parseDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

function dateRangeLabel(startDate, endDate) {
  if (!startDate) return '일정 미제공'
  if (!endDate || startDate === endDate) return startDate
  return `${startDate} ~ ${endDate}`
}

function calendarDaysForFestival(startDate, endDate) {
  const start = parseDate(startDate)
  const end = parseDate(endDate || startDate)

  if (!start || !end) return []

  const calendarStart = new Date(FESTIVAL_CALENDAR_YEAR, FESTIVAL_CALENDAR_MONTH_INDEX, 1)
  const calendarEnd = new Date(FESTIVAL_CALENDAR_YEAR, FESTIVAL_CALENDAR_MONTH_INDEX, FESTIVAL_CALENDAR_DAYS)

  if (end < calendarStart || start > calendarEnd) return []

  const visibleStart = start < calendarStart ? calendarStart : start
  const visibleEnd = end > calendarEnd ? calendarEnd : end
  const days = []

  for (let date = new Date(visibleStart); date <= visibleEnd; date.setDate(date.getDate() + 1)) {
    days.push(date.getDate())
  }

  return days
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
    eventStartDate: formatApiDate(place.event_start_date || place.eventstartdate),
    eventEndDate: formatApiDate(place.event_end_date || place.eventenddate),
    eventPlace: place.event_place || place.eventplace || null,
  }
}

function mapApiFestival(place, index = 0) {
  const startDate = formatApiDate(place.eventStartDate || place.event_start_date || place.eventstartdate)
  const endDate = formatApiDate(place.eventEndDate || place.event_end_date || place.eventenddate)
  const name = place.name || place.title || '서울 축제'
  const category = place.category || place.content_type_name || '축제공연행사'
  const location = place.eventPlace || place.event_place || place.eventplace || place.address || place.addr1 || '장소 미제공'
  const district = place.district || place.district_name || '서울'
  const image = place.image || place.first_image_url || place.thumbnail_url || fallbackImageFor(place)

  return {
    id: place.id,
    contentId: place.contentId || place.content_id,
    name,
    category,
    date: dateRangeLabel(startDate, endDate),
    startDate,
    endDate,
    days: calendarDaysForFestival(startDate, endDate),
    district,
    location,
    color: ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981'][index % 4],
    image,
    summary: place.summary || `${name}은(는) ${location}에서 열리는 ${category}입니다.`,
  }
}

async function requestJson(path, options = {}) {
  if (!API_BASE_URL || API_BASE_URL === 'mock') {
    throw new Error('Mock API mode')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options)
  if (!response.ok) {
    const errorText = await response.text().catch(() => null)
    throw new Error(`API request failed: ${response.status}${errorText ? ' - ' + errorText : ''}`)
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
  const safePageSize = Math.min(10000, Math.max(1, Number(pageSize) || 9))
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

export async function fetchCommunityPosts({ page = 1, pageSize = 100 } = {}) {
  const safePage = Math.max(1, Number(page) || 1)
  const safePageSize = Math.min(10000, Math.max(1, Number(pageSize) || 100))
  const skip = (safePage - 1) * safePageSize

  const payload = await requestJson(`/posts?skip=${skip}&limit=${safePageSize}`)
  return {
    items: Array.isArray(payload.items) ? payload.items : [],
    pagination: payload.pagination || { page: safePage, size: safePageSize, total: 0 },
  }
}

export async function fetchCommunityPostById(id) {
  return requestJson(`/posts/${id}`)
}

export async function createCommunityPost(payload) {
  return requestJson(`/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function updateCommunityPost(id, payload) {
  return requestJson(`/posts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function deleteCommunityPost(id, password) {
  return requestJson(`/posts/${id}?password=${encodeURIComponent(password)}`, {
    method: 'DELETE',
  })
}

export async function verifyCommunityPostPassword(id, password) {
  return requestJson(`/posts/${id}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
}

export async function fetchCommentsByPostId(postId) {
  return requestJson(`/comments/posts/${postId}`)
}

export async function createComment(postId, payload) {
  return requestJson(`/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ post_id: Number(postId), ...payload }),
  })
}

export async function deleteComment(commentId, password) {
  return requestJson(`/comments/${commentId}?password=${encodeURIComponent(password)}`, {
    method: 'DELETE',
  })
}

export async function fetchCategories() {
  const places = await loadApiPlaces()
  return ['전체', ...new Set(places.map((place) => place.category).filter(Boolean))]
}

export async function fetchFestivals() {
  try {
    const items = []
    let skip = 0

    while (true) {
      const params = new URLSearchParams({
        skip: String(skip),
        limit: String(PAGE_SIZE),
        content_type_id: String(FESTIVAL_CONTENT_TYPE_ID),
      })
      const payload = await requestJson(`/places?${params.toString()}`)
      const pageItems = Array.isArray(payload.items) ? payload.items : []

      items.push(...pageItems.map((place, index) => mapApiFestival(mapApiPlace(place), skip + index)))

      if (pageItems.length < PAGE_SIZE) break
      skip += PAGE_SIZE
    }

    return items.length ? items : fallbackFestivals
  } catch {
    return fallbackFestivals
  }
}

export async function fetchFestivalsPage({ page = 1, pageSize = 5, fallbackOnError = true } = {}) {
  const safePage = Math.max(1, Number(page) || 1)
  const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 5))
  const skip = (safePage - 1) * safePageSize

  try {
    const params = new URLSearchParams({
      skip: String(skip),
      limit: String(safePageSize),
      content_type_id: String(FESTIVAL_CONTENT_TYPE_ID),
    })
    const payload = await requestJson(`/places?${params.toString()}`)
    const items = Array.isArray(payload.items)
      ? payload.items.map((place, index) => mapApiFestival(mapApiPlace(place), skip + index))
      : []

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

    const pageItems = fallbackFestivals.slice(skip, skip + safePageSize)

    return {
      items: pageItems,
      pagination: {
        page: safePage,
        size: safePageSize,
        total: fallbackFestivals.length,
      },
    }
  }
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
    return { places, festivals, posts: [] }
  }

  const match = (values) => values.join(' ').toLowerCase().includes(normalized)
  let posts = []

  try {
    const { items } = await fetchCommunityPosts({ page: 1, pageSize: 100 })
    posts = Array.isArray(items) ? items : []
  } catch {
    posts = []
  }

  return {
    places: places.filter((place) =>
      match([place.name, place.category, place.district, place.summary, ...place.tags]),
    ),
    festivals: festivals.filter((festival) =>
      match([festival.name, festival.location, festival.summary]),
    ),
    posts: posts.filter((post) => match([post.title, post.content, post.category])),
  }
}

const chatFallbackAnswers = {
  ko: {
    festival:
      '서울 축제공연행사 데이터는 백엔드 data/서울 폴더에서 불러오고 있습니다. 축제 화면에서 전체 행사 목록을 확인해보세요.',
    budget:
      '서울 3일 여행은 중급 숙박 기준 1인 1일 15만-25만원 정도를 잡으면 무난합니다. 대중교통은 T-money 카드, 실내 명소는 비 오는 날 일정으로 남겨두면 좋습니다.',
    transport:
      '서울은 지하철 동선이 가장 안정적입니다. 공항에서 짐이 많으면 공항버스, 시내 이동은 T-money 카드를 추천합니다.',
    community:
      '커뮤니티에는 경복궁 동문 사진 스팟, 인사동 찻집, 북한산 둘레길 후기가 있습니다. 게시판 검색창에서 사진, 인사동, 북한산 같은 키워드로 찾아보세요.',
    default:
      '서울 첫 방문이라면 경복궁, 인사동, DDP, 한강 일정을 묶는 코스를 추천합니다. 탐색 화면의 백엔드 연동 데이터에서 지역명과 카테고리로 찾아볼 수 있어요.',
  },
  en: {
    festival:
      'Seoul festival data is loaded from the backend data folder. Open the festival screen to browse the full event list.',
    budget:
      'For a 3-day Seoul trip, a mid-range plan usually works around KRW 150,000-250,000 per person per day. Use a T-money card for transit and keep indoor spots for rainy days.',
    transport:
      'The subway is the most reliable way to move around Seoul. If you have heavy luggage from the airport, an airport bus is often worth it.',
    community:
      'The community includes tips for Gyeongbokgung photo spots, Insadong tea houses, and Bukhansan walking routes. Try searching photo, Insadong, or Bukhansan.',
    default:
      'For a first Seoul visit, combine Gyeongbokgung, Insadong, DDP, and the Han River. You can search by district and category on the Explore screen.',
  },
  zh: {
    festival:
      '首尔庆典活动数据会从后端数据目录加载。请在庆典页面查看完整活动列表。',
    budget:
      '首尔 3 日游以中等住宿为基准，每人每天约 15万-25万韩元比较稳妥。市内交通推荐使用 T-money，雨天可安排室内景点。',
    transport:
      '在首尔移动，地铁通常最稳定。从机场出发如果行李较多，机场巴士会更方便。',
    community:
      '社区中有景福宫拍照点、仁寺洞茶馆和北汉山路线等评价。可以搜索照片、仁寺洞、北汉山等关键词。',
    default:
      '第一次来首尔，可以把景福宫、仁寺洞、DDP 和汉江安排成一条路线。在探索页面可按地区和类别查找地点。',
  },
  ja: {
    festival:
      'ソウルの祭り・公演データはバックエンドのデータフォルダから読み込まれます。祭り画面で全イベント一覧を確認してください。',
    budget:
      'ソウル3日旅行は中級宿泊を基準に、1人1日15万〜25万ウォンほどを見込むと安心です。移動はT-money、雨の日は屋内スポットを残しておくと便利です。',
    transport:
      'ソウル市内の移動は地下鉄が最も安定しています。空港から荷物が多い場合は空港バスも便利です。',
    community:
      'コミュニティには景福宮の写真スポット、仁寺洞の茶屋、北漢山ルートのレビューがあります。写真、仁寺洞、北漢山などで検索してみてください。',
    default:
      '初めてのソウルなら、景福宮、仁寺洞、DDP、漢江を組み合わせるコースがおすすめです。探索画面で地域名とカテゴリから探せます。',
  },
}

function chatSessionId() {
  const storedSessionId = window.localStorage.getItem(CHAT_SESSION_STORAGE_KEY)
  if (storedSessionId) return storedSessionId

  const nextSessionId = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `local-in-${Date.now()}-${Math.random().toString(36).slice(2)}`

  window.localStorage.setItem(CHAT_SESSION_STORAGE_KEY, nextSessionId)
  return nextSessionId
}

function normalizeChatOptions(options) {
  if (typeof options === 'string') {
    return {
      locale: options,
      history: [],
      filters: {},
    }
  }

  return {
    locale: options?.locale || 'ko',
    history: Array.isArray(options?.history) ? options.history : [],
    filters: options?.filters || {},
  }
}

function normalizeChatHistory(history) {
  return history
    .filter((message) => ['system', 'user', 'assistant'].includes(message.role) && message.text?.trim())
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content: message.text.trim(),
    }))
}

export async function askAssistant(message, options = {}) {
  const { locale, history, filters } = normalizeChatOptions(options)
  const text = message.toLowerCase()
  const answers = chatFallbackAnswers[locale] || chatFallbackAnswers.ko

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: chatSessionId(),
        message,
        history: normalizeChatHistory(history),
        filters: {
          ...filters,
          locale,
        },
      }),
    })
    if (response.ok) {
      return response.json()
    }
  } catch {
    // Local fallback keeps the SPA usable before the FastAPI chat endpoint is ready.
  }

  if (text.includes('축제') || text.includes('festival') || text.includes('7월')) {
    return { answer: answers.festival }
  }

  if (text.includes('예산') || text.includes('budget') || text.includes('비용') || text.includes('预算') || text.includes('予算')) {
    return { answer: answers.budget }
  }

  if (text.includes('교통') || text.includes('transport') || text.includes('지하철') || text.includes('交通') || text.includes('地下鉄')) {
    return { answer: answers.transport }
  }

  if (text.includes('후기') || text.includes('게시글') || text.includes('사진') || text.includes('评价') || text.includes('レビュー')) {
    return { answer: answers.community }
  }

  return { answer: answers.default }
}

export { fallbackCategories }
