<template>
  <PageLoading v-if="isLoading" />
  <section v-else class="section">
    <div class="container editor-container">
      <RouterLink class="back-link" to="/community"><ArrowLeft :size="16" /> {{ t('community.back') }}</RouterLink>
      <div class="page-title">
        <h1>{{ isEdit ? t('editor.editTitle') : t('editor.newTitle') }}</h1>
        <p>{{ t('editor.description') }}</p>
      </div>

      <form class="editor-form" @submit.prevent="submit">
        <div class="form-block panel">
          <label>{{ t('editor.category') }}</label>
          <div class="chip-row">
            <button
              v-for="category in categories"
              :key="category"
              type="button"
              class="chip"
              :class="{ active: form.category === category }"
              @click="form.category = category"
            >
              {{ categoryLabel(category) }}
            </button>
          </div>
        </div>

        <div class="form-block panel">
          <label for="title">{{ t('editor.title') }}</label>
          <input id="title" v-model="form.title" maxlength="100" type="text" :placeholder="t('editor.titlePlaceholder')" required />
          <span>{{ form.title.length }}/100</span>
        </div>

        <div class="form-block panel">
          <label for="content">{{ t('editor.content') }}</label>
          <textarea id="content" v-model="form.content" rows="9" :placeholder="t('editor.contentPlaceholder')" required></textarea>
          <span>{{ t('common.characterCount', { count: form.content.length }) }}</span>
        </div>

        <div class="form-block panel">
          <label for="password">{{ t('editor.editPassword') }}</label>
          <input id="password" v-model="form.password" type="password" :placeholder="t('common.password')" required />
        </div>

        <button class="btn btn-primary submit-btn" type="submit" :disabled="!isValid">
          {{ isEdit ? t('editor.submitEdit') : t('editor.submitNew') }}
        </button>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft } from '@lucide/vue'
import PageLoading from '../components/PageLoading.vue'
import { fetchCommunityPostById, createCommunityPost, updateCommunityPost } from '../services/localHubApi'

const props = defineProps({
  id: {
    type: String,
    default: null,
  },
})

const router = useRouter()
const { t, te } = useI18n()
const categories = ['맛집/카페', '일정', '사진', '팁', '자연', '질문']
const isEdit = computed(() => Boolean(props.id))
const isLoading = ref(false)

function categoryLabel(category) {
  const key = `categoryLabels.${category}`
  return te(key) ? t(key) : category
}

const form = reactive({
  title: '',
  content: '',
  category: '팁',
  password: '',
})

async function loadPost() {
  if (!props.id) {
    isLoading.value = false
    form.title = ''
    form.content = ''
    form.category = '팁'
    form.password = ''
    return
  }

  isLoading.value = true
  try {
    const post = await fetchCommunityPostById(props.id)
    form.title = post.title || ''
    form.content = post.content || ''
    form.category = post.category || '팁'
  } catch {
    router.push('/community')
  } finally {
    isLoading.value = false
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
