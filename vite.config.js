import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const kakaoRestApiKey = env.KAKAO_REST_API_KEY || env.VITE_KAKAO_REST_API_KEY

  return {
    plugins: [vue()],
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/kakao-local': {
          target: 'https://dapi.kakao.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/kakao-local/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (kakaoRestApiKey) {
                proxyReq.setHeader('Authorization', `KakaoAK ${kakaoRestApiKey}`)
              }
            })
          },
        },
      },
    },
  }
})
