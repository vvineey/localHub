<template>
  <PageLoading v-if="isLoading" />
  <section v-else-if="post" class="section">
    <div class="container post-detail-container">
      <RouterLink class="back-link" to="/community"><ArrowLeft :size="16" /> {{ t('community.back') }}</RouterLink>

      <article class="post-detail panel">
        <header>
          <span class="badge">{{ categoryLabel(post.category) }}</span>
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
            <button class="btn btn-ghost" type="button" @click="requestAction('edit')">{{ t('common.edit') }}</button>
            <button class="btn btn-ghost danger" type="button" @click="requestAction('delete')">{{ t('common.delete') }}</button>
          </div>
        </footer>
      </article>

      <section class="comments panel">
        <h2>{{ t('community.comments') }}</h2>
        <article v-if="comments.length === 0" class="empty-comment">
          {{ t('community.noComments') }}
        </article>
        <article v-for="comment in comments" :key="comment.id" class="comment-item">
          <strong>{{ comment.author_name || t('community.anonymous') }}</strong>
          <time>{{ comment.created_at ?? comment.date ?? t('community.noDate') }}</time>
          <p>{{ comment.content }}</p>
        </article>

        <form class="comment-form" @submit.prevent="submitComment">
          <div class="writer-info">
            <input
              v-model="newComment.author_name"
              type="text"
              :placeholder="t('community.commentAuthorPlaceholder')"
            />
            <input
              v-model="newComment.password"
              type="password"
              :placeholder="t('community.commentPasswordPlaceholder')"
              required
            />
          </div>
          <div class="content-box">
            <textarea
              v-model="newComment.content"
              rows="3"
              :placeholder="t('community.commentPlaceholder')"
              required
            />
            <button class="btn btn-primary" type="submit">{{ t('community.writeComment') }}</button>
          </div>
        </form>
      </section>
    </div>

    <PasswordModal
      v-if="modalOpen"
      :title="pendingAction === 'delete' ? t('community.deletePost') : t('community.editPost')"
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
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Eye, Heart, MessageSquare } from '@lucide/vue'
import PageLoading from '../components/PageLoading.vue'
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

const randomNicknames = [
  '여행자A',
  '서울러버',
  '맛집탐험가',
  '사진찍는여행자',
  '도시산책러',
  '한강러닝',
  '미식가',
  '문화탐험가',
  '낭만여행자',
  '소확행러',
]

function generateRandomNickname() {
  const index = Math.floor(Math.random() * randomNicknames.length)
  return randomNicknames[index]
}

const router = useRouter()
const { t, te } = useI18n()
const modalOpen = ref(false)
const pendingAction = ref(null)
const passwordError = ref(false)
const post = ref(null)
const comments = ref([])
const isLoading = ref(true)
const newComment = ref({ author_name: generateRandomNickname(), content: '', password: '' })

async function loadPost() {
  isLoading.value = true
  try {
    const data = await fetchCommunityPostById(props.id)
    post.value = { ...data, liked: false }
    await Promise.all([increaseViewCount(), loadComments()])
  } catch {
    post.value = null
  } finally {
    isLoading.value = false
  }
}

function categoryLabel(category) {
  const key = `categoryLabels.${category}`
  return te(key) ? t(key) : category
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

  const authorName = newComment.value.author_name.trim() || generateRandomNickname()

  try {
    await createComment(props.id, {
      content: newComment.value.content.trim(),
      author_name: authorName,
      password: newComment.value.password,
    })
    newComment.value.content = ''
    newComment.value.author_name = generateRandomNickname()
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

async function toggleLike() {
  if (!post.value) return

  const liked = !post.value.liked
  const newLikes = (post.value.likes || 0) + (liked ? 1 : -1)
  post.value.liked = liked
  post.value.likes = newLikes

  try {
    await updateCommunityPost(props.id, { likes: newLikes })
  } catch {
    post.value.liked = !liked
    post.value.likes = (post.value.likes || 0) + (liked ? -1 : 1)
  }
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
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 18px;
  padding: 24px;
}

.comments h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  border-bottom: 2px solid var(--line-soft);
  padding-bottom: 12px;
}

/* 개별 댓글 아이템 */
.comment-item {
  padding: 16px 0;
  border-bottom: 1px solid var(--line-soft);
}

.comment-item:last-of-type {
  border-bottom: none;
}

.comment-item strong {
  color: var(--text);
  font-size: 0.95rem;
  font-weight: 700;
}

.comment-item time {
  margin-left: 8px;
  color: var(--muted-light);
  font-size: 0.78rem;
}

.comment-item p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.6;
  font-size: 0.92rem;
  white-space: pre-line;
}

.empty-comment {
  padding: 32px 0;
  text-align: center;
  color: var(--muted-light);
  font-size: 0.9rem;
}

/* 댓글 입력 폼 */
.comment-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid var(--line-soft);
}

/* 작성자 & 비밀번호 영역 (가로 병렬 배치) */
.writer-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.writer-info input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--line-soft);
  border-radius: 6px;
  background: transparent;
  color: var(--text);
  font-size: 0.88rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.writer-info input:focus {
  border-color: var(--primary);
}

/* 댓글 내용 & 등록 버튼 영역 */
.content-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.content-box textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--line-soft);
  border-radius: 6px;
  background: transparent;
  color: var(--text);
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s ease;
}

.content-box textarea:focus {
  border-color: var(--primary);
}

.content-box .btn {
  padding: 10px 20px;
  font-size: 0.88rem;
  font-weight: 700;
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
}

/* 모바일 대응 (화면이 작을 때 레이아웃 조정) */
@media (max-width: 620px) {
  .writer-info {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .content-box {
    align-items: stretch;
  }

  .content-box .btn {
    width: 100%;
  }
}
</style>
