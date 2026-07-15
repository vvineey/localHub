<template>
  <section class="section">
    <div class="container assistant-container">
      <div class="page-title">
        <h1>{{ t('assistant.title') }}</h1>
        <p>{{ t('assistant.description') }}</p>
      </div>

      <div class="assistant-layout">
        <div class="chat-panel panel">
          <header>
            <div class="ai-mark"><Bot :size="20" /></div>
            <div>
              <strong>Local-In AI</strong>
              <span>{{ t('common.online') }}</span>
            </div>
          </header>
          <ChatConversation :messages="messages" :loading="loading" @send="send" />
        </div>

        <aside class="assistant-side">
          <div class="panel prompt-panel">
            <h2>{{ t('assistant.recommendedPrompts') }}</h2>
            <button v-for="item in suggestedPrompts" :key="item" type="button" @click="send(item)">
              {{ item }}
            </button>
          </div>
          <div class="panel prompt-panel gradient">
            <Sparkles :size="22" />
            <h2>{{ t('assistant.scope') }}</h2>
            <ul>
              <li>{{ t('assistant.scopePlaces') }}</li>
              <li>{{ t('assistant.scopeFestivals') }}</li>
              <li>{{ t('assistant.scopeTransport') }}</li>
              <li>{{ t('assistant.scopeCommunity') }}</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Bot, Sparkles } from '@lucide/vue'
import ChatConversation from '../components/ChatConversation.vue'
import { askAssistant } from '../services/localHubApi'

const { locale, t } = useI18n()
const now = () => new Date().toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
const suggestedPrompts = computed(() => [
  t('assistant.quickLocal'),
  t('assistant.quickFestival'),
  t('assistant.quickBudget'),
])

const loading = ref(false)
const messages = ref([
  {
    role: 'assistant',
    text: t('assistant.greeting'),
    time: now(),
  },
])

watch(locale, () => {
  if (messages.value.length === 1 && messages.value[0].role === 'assistant') {
    messages.value[0] = {
      ...messages.value[0],
      text: t('assistant.greeting'),
      time: now(),
    }
  }
})

async function send(text) {
  if (loading.value) return
  const history = [...messages.value]
  messages.value.push({ role: 'user', text, time: now() })
  loading.value = true
  const response = await askAssistant(text, {
    locale: locale.value,
    history,
  })
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

.assistant-container {
  --primary: #0d1117;
  --primary-dark: #010409;
  --primary-soft: #f3f4f6;
  --on-primary: #ffffff;
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
  color: var(--on-primary);
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
  border-color: var(--line);
  background: var(--primary-soft);
}

.gradient {
  color: #fff;
  background: #0d1117;
  border: 1px solid var(--line);
}

.gradient h2 {
  color: #fff;
}

:global([data-theme='dark']) .gradient {
  color: #fff;
  background: #0d1117;
  border: 1px solid var(--line);
}

:global([data-theme='dark']) .assistant-container {
  --primary: #ffffff;
  --primary-dark: #e5e5e5;
  --primary-soft: #161b22;
  --on-primary: #0d1117;
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
