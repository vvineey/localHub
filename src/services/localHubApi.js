import { festivals, places } from '../data/localhub'
import { getPosts } from '../stores/community'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const wait = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchPlaces({ keyword = '', category = '전체' } = {}) {
  await wait()
  const normalized = keyword.trim().toLowerCase()
  return places.filter((place) => {
    const matchesKeyword =
      !normalized ||
      [place.name, place.district, place.address, place.summary, ...place.tags]
        .join(' ')
        .toLowerCase()
        .includes(normalized)
    const matchesCategory = category === '전체' || place.category === category
    return matchesKeyword && matchesCategory
  })
}

export async function fetchPlaceById(id) {
  await wait()
  return places.find((place) => place.id === Number(id))
}

export async function fetchFestivals() {
  await wait()
  return festivals
}

export async function searchAll(keyword = '') {
  const normalized = keyword.trim().toLowerCase()
  if (!normalized) {
    return { places, festivals, posts: getPosts() }
  }

  await wait()
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
  await wait(540)
  const text = message.toLowerCase()

  if (API_BASE_URL && API_BASE_URL !== 'mock') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      if (response.ok) {
        return response.json()
      }
    } catch {
      // Local fallback keeps the SPA usable before the FastAPI server is connected.
    }
  }

  if (text.includes('축제') || text.includes('festival') || text.includes('7월')) {
    return {
      answer:
        '7월 서울 일정은 한강 불꽃 피크닉(7월 10일), 광화문 여름 푸드 페스타(7월 20일), K-Pop 서머 콘서트(7월 27일)가 좋습니다. 위치 확인이 필요하면 지도 화면에서 축제 핀만 필터링하세요.',
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
        '서울은 지하철 동선이 가장 안정적입니다. 공항에서 짐이 많으면 공항버스, 시내 이동은 T-money 카드를 추천합니다. 경복궁-인사동-DDP는 지하철과 도보 조합이 편합니다.',
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
      '서울 첫 방문이라면 경복궁, 인사동, DDP, 한강 일정을 묶는 코스를 추천합니다. 자연을 넣고 싶다면 북한산 둘레길을 반나절 코스로 추가하세요.',
  }
}
