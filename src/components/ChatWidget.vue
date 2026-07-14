<template>
  <aside v-if="$route.name !== 'assistant'" class="chat-widget" aria-label="LocalHub AI 채팅 위젯">
    <div v-if="open" class="widget-panel">
      <div class="widget-header">
        <div>
          <strong>LocalHub AI</strong>
          <span>서울 여행 비서</span>
        </div>
        <button type="button" aria-label="채팅 닫기" title="닫기" @click="open = false">
          <X :size="17" />
        </button>
      </div>
      <div v-if="messages.length === 1" class="quick-row">
        <button v-for="item in quickPrompts" :key="item" type="button" @click="send(item)">
          {{ item }}
        </button>
      </div>
      <ChatConversation :messages="messages" :loading="loading" @send="send" />
    </div>

    <button
      class="widget-button"
      type="button"
      :aria-expanded="open"
      aria-label="AI 채팅 열기"
      title="AI 채팅"
      @click="open = !open"
    >
      <X v-if="open" :size="22" />
      <MessageCircle v-else :size="24" />
      <span v-if="!open"></span>
    </button>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { MessageCircle, X } from '@lucide/vue'
import ChatConversation from './ChatConversation.vue'
import { askAssistant } from '../services/localHubApi'

const now = () => new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

const quickPrompts = ['인기 명소', '7월 축제', '여행 예산']
const open = ref(false)
const loading = ref(false)
const messages = ref([
  {
    role: 'assistant',
    text: '안녕하세요. 서울 관광지, 축제, 숙박, 커뮤니티 후기를 기반으로 여행 질문에 답해드릴게요.',
    time: now(),
  },
])

async function send(text) {
  messages.value.push({ role: 'user', text, time: now() })
  loading.value = true
  const response = await askAssistant(text)
  messages.value.push({ role: 'assistant', text: response.answer, time: now() })
  loading.value = false
}
</script>

<style scoped>
.chat-widget {
  position: fixed;
  z-index: 60;
  right: 22px;
  bottom: 22px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.widget-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  color: #fff;
  background: var(--primary);
  border-radius: 999px;
  box-shadow: 0 16px 34px rgba(37, 99, 235, 0.32);
}

.widget-button span {
  position: absolute;
  top: 1px;
  right: 1px;
  width: 14px;
  height: 14px;
  background: var(--green);
  border: 2px solid #fff;
  border-radius: 999px;
}

.widget-panel {
  display: flex;
  overflow: hidden;
  width: min(360px, calc(100vw - 24px));
  height: 470px;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.2);
}

.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 14px;
  color: #fff;
  background: var(--primary);
}

.widget-header strong,
.widget-header span {
  display: block;
}

.widget-header span {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.74);
  font-size: 0.78rem;
}

.widget-header button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: rgba(255, 255, 255, 0.82);
  background: rgba(255, 255, 255, 0.12);
  border-radius: var(--radius);
}

.quick-row {
  display: flex;
  gap: 6px;
  padding: 10px;
  border-bottom: 1px solid var(--line-soft);
}

.quick-row button {
  min-height: 30px;
  padding: 0 9px;
  color: var(--primary);
  background: var(--primary-soft);
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 800;
}

@media (max-width: 640px) {
  .chat-widget {
    right: 14px;
    bottom: 14px;
  }

  .widget-panel {
    width: calc(100vw - 28px);
    height: min(620px, calc(100vh - 92px));
  }
}
</style>
