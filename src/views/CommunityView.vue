<template>
  <section class="section">
    <div class="container community-container">
      <div class="section-title">
        <div>
          <h1>익명 여행 후기 게시판</h1>
          <p>회원가입 없이 제목, 내용, 수정용 비밀번호로 게시글을 관리합니다.</p>
        </div>
        <RouterLink class="btn btn-primary" to="/community/new">
          <PenLine :size="16" />
          글쓰기
        </RouterLink>
      </div>

      <div class="search-row board-search">
        <Search :size="17" />
        <input v-model="keyword" type="search" placeholder="게시글 제목 또는 내용 검색" />
      </div>

      <div class="chip-row">
        <button
          v-for="category in postCategories"
          :key="category"
          type="button"
          class="chip"
          :class="{ active: activeCategory === category }"
          @click="activeCategory = category"
        >
          {{ category }}
        </button>
      </div>

      <div class="post-list">
        <article v-for="post in pagedPosts" :key="post.id" class="post-card card">
          <RouterLink :to="`/community/${post.id}`" class="post-main">
            <div>
              <span class="badge">{{ post.category }}</span>
              <time>{{ post.date }}</time>
            </div>
            <h2>{{ post.title }}</h2>
            <p class="line-clamp">{{ post.content }}</p>
          </RouterLink>
          <div class="post-meta">
            <button type="button" :title="post.liked ? '좋아요 취소' : '좋아요'" @click="store.toggleLike(post.id)">
              <Heart :size="15" :fill="post.liked ? 'currentColor' : 'none'" />
              {{ post.likes }}
            </button>
            <span><Eye :size="15" /> {{ post.views.toLocaleString() }}</span>
            <span><MessageSquare :size="15" /> {{ post.comments }}</span>
          </div>
        </article>
      </div>

      <div v-if="filteredPosts.length === 0" class="empty-state panel">
        <MessageSquare :size="38" />
        <p>검색 조건에 맞는 게시글이 없습니다.</p>
      </div>

      <div v-if="pageCount > 1" class="pagination">
        <button class="icon-btn" type="button" :disabled="page === 1" title="이전" @click="page--">
          <ChevronLeft :size="16" />
        </button>
        <button
          v-for="pageNumber in pageCount"
          :key="pageNumber"
          type="button"
          class="page-btn"
          :class="{ active: page === pageNumber }"
          @click="page = pageNumber"
        >
          {{ pageNumber }}
        </button>
        <button class="icon-btn" type="button" :disabled="page === pageCount" title="다음" @click="page++">
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  MessageSquare,
  PenLine,
  Search,
} from '@lucide/vue'
import { useCommunityStore } from '../stores/community'

const store = useCommunityStore()
const keyword = ref('')
const activeCategory = ref('전체')
const page = ref(1)
const pageSize = 4

const postCategories = computed(() => [
  '전체',
  ...new Set(store.state.posts.map((post) => post.category)),
])

const filteredPosts = computed(() => {
  const normalized = keyword.value.trim().toLowerCase()
  return store.state.posts.filter((post) => {
    const matchKeyword =
      !normalized || [post.title, post.content, post.category].join(' ').toLowerCase().includes(normalized)
    const matchCategory = activeCategory.value === '전체' || post.category === activeCategory.value
    return matchKeyword && matchCategory
  })
})

const pageCount = computed(() => Math.ceil(filteredPosts.value.length / pageSize))
const pagedPosts = computed(() =>
  filteredPosts.value.slice((page.value - 1) * pageSize, page.value * pageSize),
)

watch([keyword, activeCategory], () => {
  page.value = 1
})
</script>

<style scoped>
.community-container {
  max-width: 860px;
}

.board-search {
  margin-bottom: 12px;
}

.post-list {
  display: grid;
  gap: 12px;
  margin-top: 20px;
}

.post-card {
  overflow: hidden;
}

.post-main {
  display: grid;
  gap: 10px;
  padding: 18px;
}

.post-main > div {
  display: flex;
  align-items: center;
  gap: 10px;
}

.post-main time {
  color: var(--muted-light);
  font-size: 0.8rem;
}

.post-main h2 {
  margin: 0;
  font-size: 1.06rem;
}

.post-main p {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.58;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 12px 18px;
  color: var(--muted-light);
  border-top: 1px solid var(--line-soft);
  font-size: 0.84rem;
}

.post-meta button,
.post-meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: inherit;
  background: transparent;
}

.post-meta button:hover {
  color: var(--primary);
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
}

.page-btn {
  width: 40px;
  height: 40px;
  color: var(--muted);
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  font-weight: 800;
}

.page-btn.active {
  color: #fff;
  background: var(--primary);
  border-color: var(--primary);
}
</style>
