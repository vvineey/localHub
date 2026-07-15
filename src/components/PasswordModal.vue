<template>
  <Teleport to="body">
    <div class="modal-backdrop" role="presentation" @click.self="$emit('close')">
      <form class="modal-panel" @submit.prevent="confirm">
        <div class="modal-icon"><LockKeyhole :size="20" /></div>
        <h2>{{ title }}</h2>
        <p>작성 시 등록한 수정용 비밀번호를 입력하세요.</p>
        <input v-model="password" type="password" placeholder="비밀번호" autofocus />
        <p v-if="error" class="error">비밀번호가 일치하지 않습니다.</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" type="button" @click="$emit('close')">취소</button>
          <button class="btn btn-primary" type="submit">확인</button>
        </div>
      </form>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { LockKeyhole } from '@lucide/vue'

defineProps({
  title: {
    type: String,
    default: '비밀번호 확인',
  },
  error: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'confirm'])
const password = ref('')

function confirm() {
  emit('confirm', password.value)
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  z-index: 90;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.48);
}

.modal-panel {
  width: min(420px, 100%);
  padding: 22px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24);
}

.modal-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  color: var(--primary);
  background: var(--primary-soft);
  border-radius: var(--radius);
}

h2 {
  margin: 14px 0 6px;
}

p {
  margin: 0 0 14px;
  color: var(--muted);
  font-size: 0.9rem;
}

input {
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  color: var(--text);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  outline: 0;
}

input:focus {
  border-color: var(--primary);
}

.error {
  margin: 8px 0 0;
  color: var(--red);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}
</style>
