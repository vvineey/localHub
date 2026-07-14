<template>
  <section v-if="post" class="section">
    <div class="container post-detail-container">
      <RouterLink class="back-link" to="/community"><ArrowLeft :size="16" /> 게시판으로</RouterLink>

      <article class="post-detail panel">
        <header>
          <span class="badge">{{ post.category }}</span>
          <h1>{{ post.title }}</h1>
          <div class="meta-line">
            <span>{{ post.date }}</span>
            <span><Eye :size="15" /> {{ post.views.toLocaleString() }}</span>
            <span><MessageSquare :size="15" /> {{ post.comments }}</span>
          </div>
        </header>
        <p class="content">{{ post.content }}</p>
        <footer>
          <button class="btn btn-secondary" type="button" @click="store.toggleLike(post.id)">
            <Heart :size="16" :fill="post.liked ? 'currentColor' : 'none'" />
            {{ post.likes }}
          </button>
          <div>
            <button class="btn btn-ghost" type="button" @click="requestAction('edit')">수정</button>
            <button class="btn btn-ghost danger" type="button" @click="requestAction('delete')">삭제</button>
          </div>
        </footer>
      </article>

      <section class="comments panel">
        <h2>댓글</h2>
        <article v-for="comment in comments" :key="comment.name">
          <strong>{{ comment.name }}</strong>
          <time>{{ comment.date }}</time>
          <p>{{ comment.text }}</p>
        </article>
      </section>
    </div>

    <PasswordModal
      v-if="modalOpen"
      :title="pendingAction === 'delete' ? '게시글 삭제' : '게시글 수정'"
      :error="passwordError"
      @close="closeModal"
      @confirm="confirmPassword"
    />
  </section>
  <NotFoundView v-else />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ArrowLeft, Eye, Heart, MessageSquare } from '@lucide/vue'
import PasswordModal from '../components/PasswordModal.vue'
import { useCommunityStore } from '../stores/community'
import NotFoundView from './NotFoundView.vue'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
})

const router = useRouter()
const store = useCommunityStore()
const modalOpen = ref(false)
const pendingAction = ref(null)
const passwordError = ref(false)

const post = computed(() => store.getPost(props.id))
const comments = [
  {
    name: 'Travel Buddy',
    date: '2026-07-13',
    text: '정리 감사합니다. 서울 일정 짤 때 바로 참고할 수 있겠어요.',
  },
  {
    name: 'SeoulExplorer',
    date: '2026-07-11',
    text: '저도 비슷한 동선으로 다녀왔는데 오전 시간이 확실히 좋았습니다.',
  },
]

onMounted(() => {
  if (post.value) {
    store.increaseView(props.id)
  }
})

function requestAction(action) {
  pendingAction.value = action
  modalOpen.value = true
  passwordError.value = false
}

function closeModal() {
  modalOpen.value = false
  pendingAction.value = null
  passwordError.value = false
}

function confirmPassword(password) {
  if (!store.verifyPassword(props.id, password)) {
    passwordError.value = true
    return
  }

  if (pendingAction.value === 'delete') {
    store.deletePost(props.id)
    router.push('/community')
    return
  }

  router.push(`/community/${props.id}/edit`)
}
</script>

<style scoped>
.post-detail-container {
  max-width: 820px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 14px;
  color: var(--muted);
  font-weight: 750;
}

.post-detail {
  padding: 24px;
}

header h1 {
  margin: 14px 0 12px;
  font-size: 2rem;
  line-height: 1.22;
}

.meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: var(--muted-light);
  font-size: 0.86rem;
}

.meta-line span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.content {
  margin: 28px 0;
  white-space: pre-line;
  color: var(--muted);
  line-height: 1.78;
}

footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 18px;
  border-top: 1px solid var(--line-soft);
}

footer > div {
  display: flex;
  gap: 8px;
}

.danger {
  color: var(--red);
}

.comments {
  display: grid;
  gap: 14px;
  margin-top: 14px;
  padding: 20px;
}

.comments h2 {
  margin: 0;
  font-size: 1.08rem;
}

.comments article {
  padding-top: 14px;
  border-top: 1px solid var(--line-soft);
}

.comments strong,
.comments time {
  display: inline-block;
}

.comments time {
  margin-left: 8px;
  color: var(--muted-light);
  font-size: 0.78rem;
}

.comments p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.55;
}

@media (max-width: 620px) {
  footer {
    align-items: stretch;
    flex-direction: column;
  }

  footer > div,
  footer .btn {
    width: 100%;
  }
}
</style>
