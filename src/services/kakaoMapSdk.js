const KAKAO_MAP_APP_KEY = import.meta.env.VITE_KAKAO_MAP_APP_KEY

let sdkPromise = null

export function hasKakaoMapAppKey() {
  return Boolean(KAKAO_MAP_APP_KEY)
}

export function loadKakaoMapsSdk() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Kakao Maps SDK can only be loaded in the browser'))
  }

  if (window.kakao?.maps) {
    return new Promise((resolve) => {
      window.kakao.maps.load(() => resolve(window.kakao))
    })
  }

  if (!KAKAO_MAP_APP_KEY) {
    return Promise.reject(new Error('Kakao Maps JavaScript app key is missing'))
  }

  if (sdkPromise) {
    return sdkPromise
  }

  sdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-kakao-map-sdk]')

    function resolveWhenReady() {
      if (!window.kakao?.maps) {
        reject(new Error('Kakao Maps SDK failed to initialize'))
        return
      }

      window.kakao.maps.load(() => resolve(window.kakao))
    }

    if (existingScript) {
      existingScript.addEventListener('load', resolveWhenReady, { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Kakao Maps SDK failed to load')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.dataset.kakaoMapSdk = 'true'
    script.async = true
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(
      KAKAO_MAP_APP_KEY,
    )}&autoload=false`
    script.addEventListener('load', resolveWhenReady, { once: true })
    script.addEventListener('error', () => reject(new Error('Kakao Maps SDK failed to load')), { once: true })
    document.head.appendChild(script)
  })

  return sdkPromise
}
