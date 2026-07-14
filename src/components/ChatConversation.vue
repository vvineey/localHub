<template>
  <div class="conversation">
    <div ref="scrollRef" class="message-list">
      <article
        v-for="(message, index) in messages"
        :key="`${message.role}-${index}-${message.time}`"
        class="message"
        :class="message.role"
      >
        <div class="bubble">
          <p>{{ message.text }}</p>
          <time>{{ message.time }}</time>
        </div>
      </article>
      <article v-if="loading" class="message assistant">
        <div class="bubble typing" aria-label="AI 응답 작성 중">
          <span></span><span></span><span></span>
        </div>
      </article>
    </div>

    <form class="chat-input" @submit.prevent="submit">
      <input v-model="draft" type="text" placeholder="서울 여행에 대해 질문하기" />
      <button class="icon-btn send" type="submit" :disabled="!draft.trim() || loading" aria-label="전송" title="전송">
        <Send :size="16" />
      </button>
    </form>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import { Send } from '@lucide/vue'

const props = defineProps({
  messages: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['send'])
const draft = ref('')
const scrollRef = ref(null)

function submit() {
  const value = draft.value.trim()
  if (!value) return
  emit('send', value)
  draft.value = ''
}

watch(
  () => [props.messages.length, props.loading],
  async () => {
    await nextTick()
    if (scrollRef.value) {
      scrollRef.value.scrollTop = scrollRef.value.scrollHeight
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.conversation {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}

.message-list {
  display: flex;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.message {
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.bubble {
  max-width: min(78%, 560px);
  padding: 11px 13px;
  border-radius: var(--radius);
  color: var(--text);
  background: #fff;
  border: 1px solid var(--line);
}

.message.user .bubble {
  color: #fff;
  background: var(--primary);
  border-color: var(--primary);
}

.bubble p {
  margin: 0;
  white-space: pre-line;
  font-size: 0.9rem;
  line-height: 1.55;
}

.bubble time {
  display: block;
  margin-top: 6px;
  color: var(--muted-light);
  font-size: 0.72rem;
}

.message.user time {
  color: rgba(255, 255, 255, 0.72);
}

.typing {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  width: 64px;
  height: 38px;
}

.typing span {
  width: 7px;
  height: 7px;
  background: var(--muted-light);
  border-radius: 999px;
  animation: bounce 900ms infinite ease-in-out;
}

.typing span:nth-child(2) {
  animation-delay: 120ms;
}

.typing span:nth-child(3) {
  animation-delay: 240ms;
}

.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--line);
}

.chat-input input {
  flex: 1;
  min-width: 0;
  padding: 0 12px;
  color: var(--text);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  outline: 0;
}

.chat-input input:focus {
  border-color: var(--primary);
}

.send {
  color: #fff;
  background: var(--primary);
  border-color: var(--primary);
}

.send:disabled {
  background: var(--muted-light);
  border-color: var(--muted-light);
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-5px);
  }
}
</style>
