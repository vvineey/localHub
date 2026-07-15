<template>
  <section class="section">
    <div class="container editor-container">
      <RouterLink class="back-link" to="/community"><ArrowLeft :size="16" /> 게시판으로</RouterLink>
      <div class="page-title">
        <h1>{{ isEdit ? '게시글 수정' : '새 여행 후기 작성' }}</h1>
        <p>비밀번호는 수정과 삭제 확인에 사용됩니다.</p>
      </div>

      <form class="editor-form" @submit.prevent="submit">
        <div class="form-block panel">
          <label>카테고리</label>
          <div class="chip-row">
            <button
              v-for="category in categories"
              :key="category"
              type="button"
              class="chip"
              :class="{ active: form.category === category }"
              @click="form.category = category"
            >
              {{ category }}
            </button>
          </div>
        </div>

        <div class="form-block panel">
          <label for="title">제목</label>
          <input id="title" v-model="form.title" maxlength="100" type="text" placeholder="예: 경복궁 오전 방문 팁" required />
          <span>{{ form.title.length }}/100</span>
        </div>

        <div class="form-block panel">
          <label for="content">내용</label>
          <textarea id="content" v-model="form.content" rows="9" placeholder="여행 경험, 팁, 발견한 장소를 공유해 주세요." required></textarea>
          <span>{{ form.content.length }}자</span>
        </div>

        <div class="form-block panel">
          <label for="password">수정용 비밀번호</label>
          <input id="password" v-model="form.password" type="password" placeholder="비밀번호" required />
        </div>

        <button class="btn btn-primary submit-btn" type="submit" :disabled="!isValid">
          {{ isEdit ? '수정 완료' : '등록하기' }}
        </button>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, onMounted, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import { fetchCommunityPostById, createCommunityPost, updateCommunityPost } from '../services/localHubApi'

const props = defineProps({
  id: {
    type: String,
    default: null,
  },
})

const router = useRouter()
const categories = ['맛집/카페', '일정', '사진', '팁', '자연']
const isEdit = computed(() => Boolean(props.id))

const form = reactive({
  title: '',
  content: '',
  category: '팁',
  password: '',
})

async function loadPost() {
  if (!props.id) {
    form.title = ''
    form.content = ''
    form.category = '팁'
    form.password = ''
    return
  }

  try {
    const post = await fetchCommunityPostById(props.id)
    form.title = post.title || ''
    form.content = post.content || ''
    form.category = post.category || '팁'
  } catch {
    router.push('/community')
  }
}

onMounted(loadPost)
watch(() => props.id, loadPost)

const isValid = computed(() => form.title.trim() && form.content.trim() && form.password.trim())

async function submit() {
  if (!isValid.value) return

  const payload = {
    title: form.title.trim(),
    content: form.content.trim(),
    category: form.category,
    password: form.password,
  }

  try {
    if (isEdit.value) {
      await updateCommunityPost(props.id, payload)
      router.push(`/community/${props.id}`)
      return
    }

    const post = await createCommunityPost(payload)
    router.push(`/community/${post.id}`)
  } catch {
    // 실패 시 현재 페이지에 머물며 사용자는 다시 시도할 수 있습니다.
  }
}
</script>

<style scoped>
.editor-container {
  max-width: 760px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 14px;
  color: var(--muted);
  font-weight: 750;
}

.editor-form {
  display: grid;
  gap: 14px;
}

.form-block {
  display: grid;
  gap: 10px;
  padding: 18px;
}

label {
  color: var(--text);
  font-size: 0.92rem;
  font-weight: 850;
}

input,
textarea {
  width: 100%;
  color: var(--text);
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--line);
  outline: 0;
}

input {
  min-height: 42px;
}

textarea {
  resize: vertical;
  min-height: 180px;
  line-height: 1.65;
}

input:focus,
textarea:focus {
  border-color: var(--primary);
}

.form-block > span {
  color: var(--muted-light);
  text-align: right;
  font-size: 0.78rem;
}

.submit-btn {
  min-height: 50px;
}

.submit-btn:disabled {
  background: var(--muted-light);
}
</style>
