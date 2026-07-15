const KAKAO_LOCAL_API_BASE_URL = (import.meta.env.VITE_KAKAO_LOCAL_API_BASE_URL || '/kakao-local').replace(
  /\/$/,
  '',
)
const DIRECT_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY

function normalizeCoordinate(value) {
  const coordinate = Number(value)
  return Number.isFinite(coordinate) ? coordinate : null
}

export function formatAdministrativeDistrict(region) {
  if (!region) return ''
  return [
    region.region1DepthName,
    region.region2DepthName,
    region.region3DepthName,
    region.region4DepthName,
  ]
    .filter(Boolean)
    .join(' ')
}

export async function fetchAdministrativeDistrict(pin) {
  const lat = normalizeCoordinate(pin?.lat ?? pin?.latitude)
  const lng = normalizeCoordinate(pin?.lng ?? pin?.longitude)

  if (lat === null || lng === null) {
    return null
  }

  const query = new URLSearchParams({
    x: String(lng),
    y: String(lat),
    input_coord: 'WGS84',
  })
  const headers = {}

  if (DIRECT_REST_API_KEY && /^https?:\/\//.test(KAKAO_LOCAL_API_BASE_URL)) {
    headers.Authorization = `KakaoAK ${DIRECT_REST_API_KEY}`
  }

  const response = await fetch(`${KAKAO_LOCAL_API_BASE_URL}/v2/local/geo/coord2regioncode.json?${query}`, {
    headers,
  })

  if (!response.ok) {
    throw new Error(`Kakao local request failed: ${response.status}`)
  }

  const payload = await response.json()
  const documents = Array.isArray(payload.documents) ? payload.documents : []
  const region = documents.find((document) => document.region_type === 'H') || documents[0]

  if (!region) {
    return null
  }

  return {
    code: region.code,
    regionType: region.region_type,
    addressName: region.address_name,
    region1DepthName: region.region_1depth_name,
    region2DepthName: region.region_2depth_name,
    region3DepthName: region.region_3depth_name,
    region4DepthName: region.region_4depth_name,
    lng: normalizeCoordinate(region.x),
    lat: normalizeCoordinate(region.y),
  }
}
