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
          <button class="btn btn-secondary" type="button" @click="toggleLike()">
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
        <article v-if="comments.length === 0" class="empty-comment">
          댓글이 없습니다. 첫 댓글을 남겨보세요.
        </article>
        <article v-for="comment in comments" :key="comment.id" class="comment-item">
          <strong>{{ comment.author_name || '익명' }}</strong>
          <time>{{ comment.created_at ?? comment.date ?? '날짜 없음' }}</time>
          <p>{{ comment.content }}</p>
        </article>

        <form class="comment-form" @submit.prevent="submitComment">
          <input
            v-model="newComment.author_name"
            type="text"
            placeholder="작성자 이름 (선택)"
          />
          <textarea
            v-model="newComment.content"
            rows="3"
            placeholder="댓글을 남겨보세요."
            required
          />
          <input
            v-model="newComment.password"
            type="password"
            placeholder="댓글 비밀번호"
            required
          />
          <button class="btn btn-primary" type="submit">댓글 작성</button>
        </form>
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
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ArrowLeft, Eye, Heart, MessageSquare } from '@lucide/vue'
import PasswordModal from '../components/PasswordModal.vue'
import NotFoundView from './NotFoundView.vue'
import {
  fetchCommunityPostById,
  fetchCommentsByPostId,
  createComment,
  verifyCommunityPostPassword,
  deleteCommunityPost,
  updateCommunityPost,
} from '../services/localHubApi'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
})

const router = useRouter()
const modalOpen = ref(false)
const pendingAction = ref(null)
const passwordError = ref(false)
const post = ref(null)
const comments = ref([])
const newComment = ref({ author_name: '', content: '', password: '' })

async function loadPost() {
  try {
    const data = await fetchCommunityPostById(props.id)
    post.value = { ...data, liked: false }
    await Promise.all([increaseViewCount(), loadComments()])
  } catch {
    post.value = null
  }
}

async function increaseViewCount() {
  if (!post.value) return
  try {
    const newViews = (post.value.views || 0) + 1
    await updateCommunityPost(props.id, { views: newViews })
    post.value.views = newViews
  } catch {
    post.value.views = (post.value.views || 0) + 1
  }
}

async function loadComments() {
  try {
    comments.value = await fetchCommentsByPostId(props.id)
  } catch {
    comments.value = []
  }
}

async function submitComment() {
  if (!newComment.value.content.trim() || !newComment.value.password.trim()) return

  try {
    await createComment(props.id, {
      content: newComment.value.content.trim(),
      author_name: newComment.value.author_name.trim() || '익명',
      password: newComment.value.password,
    })
    newComment.value.content = ''
    newComment.value.author_name = ''
    newComment.value.password = ''
    await loadComments()
    if (post.value) {
      post.value.comments = (post.value.comments || 0) + 1
    }
  } catch {
    // 댓글 작성 실패 시 차후 처리
  }
}

onMounted(loadPost)

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

function toggleLike() {
  if (!post.value) return
  post.value.liked = !post.value.liked
  post.value.likes = (post.value.likes || 0) + (post.value.liked ? 1 : -1)
}

async function confirmPassword(password) {
  try {
    await verifyCommunityPostPassword(props.id, password)
    passwordError.value = false
  } catch {
    passwordError.value = true
    return
  }

  if (pendingAction.value === 'delete') {
    await deleteCommunityPost(props.id, password)
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
