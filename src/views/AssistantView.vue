<template>
  <section class="section">
    <div class="container assistant-container">
      <div class="page-title">
        <h1>AI 여행 비서</h1>
        <p>제공 JSON 데이터와 커뮤니티 후기를 근거로 답변하는 FastAPI `/api/chat` 화면입니다.</p>
      </div>

      <div class="assistant-layout">
        <div class="chat-panel panel">
          <header>
            <div class="ai-mark"><Bot :size="20" /></div>
            <div>
              <strong>LocalHub AI</strong>
              <span>온라인</span>
            </div>
          </header>
          <ChatConversation :messages="messages" :loading="loading" @send="send" />
        </div>

        <aside class="assistant-side">
          <div class="panel prompt-panel">
            <h2>추천 질문</h2>
            <button v-for="item in aiSuggestions" :key="item" type="button" @click="send(item)">
              {{ item }}
            </button>
          </div>
          <div class="panel prompt-panel gradient">
            <Sparkles :size="22" />
            <h2>응답 범위</h2>
            <ul>
              <li>관광지 추천</li>
              <li>축제 일정</li>
              <li>교통과 예산</li>
              <li>커뮤니티 후기 검색</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { Bot, Sparkles } from '@lucide/vue'
import ChatConversation from '../components/ChatConversation.vue'
import { aiSuggestions } from '../data/localhub'
import { askAssistant } from '../services/localHubApi'

const now = () => new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

const loading = ref(false)
const messages = ref([
  {
    role: 'assistant',
    text: '안녕하세요. LocalHub AI입니다. 서울 관광지, 축제, 숙박, 커뮤니티 후기 중 무엇을 찾고 있나요?',
    time: now(),
  },
])

async function send(text) {
  if (loading.value) return
  messages.value.push({ role: 'user', text, time: now() })
  loading.value = true
  const response = await askAssistant(text)
  messages.value.push({ role: 'assistant', text: response.answer, time: now() })
  loading.value = false
}
</script>

<style scoped>
.assistant-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 18px;
}

.chat-panel {
  display: flex;
  overflow: hidden;
  min-height: 650px;
  flex-direction: column;
}

.chat-panel header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--line);
}

.ai-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  color: #fff;
  background: var(--primary);
  border-radius: var(--radius);
}

header strong,
header span {
  display: block;
}

header span {
  margin-top: 3px;
  color: var(--green);
  font-size: 0.82rem;
  font-weight: 800;
}

.assistant-side {
  display: grid;
  align-content: start;
  gap: 14px;
}

.prompt-panel {
  display: grid;
  gap: 10px;
  padding: 18px;
}

.prompt-panel h2 {
  margin: 0 0 4px;
  font-size: 1.05rem;
}

.prompt-panel button {
  min-height: 42px;
  padding: 0 12px;
  color: var(--muted);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  text-align: left;
  font-weight: 750;
}

.prompt-panel button:hover {
  color: var(--primary);
  border-color: #bfdbfe;
  background: var(--primary-soft);
}

.gradient {
  color: #fff;
  background: linear-gradient(135deg, #1e40af, #047857);
  border: 0;
}

.gradient h2 {
  color: #fff;
}

.gradient ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 18px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.9rem;
}

@media (max-width: 900px) {
  .assistant-layout {
    grid-template-columns: 1fr;
  }

  .chat-panel {
    min-height: 560px;
  }
}
</style>
