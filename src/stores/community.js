import { reactive } from 'vue'
import { initialPosts } from '../data/localhub'

const STORAGE_KEY = 'localhub-community-posts'

function loadPosts() {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (!stored) return initialPosts

  try {
    return JSON.parse(stored)
  } catch {
    return initialPosts
  }
}

const state = reactive({
  posts: loadPosts(),
})

function persist() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.posts))
}

export function useCommunityStore() {
  return {
    state,
    createPost(payload) {
      const post = {
        id: Date.now(),
        date: new Date().toISOString().slice(0, 10),
        views: 0,
        likes: 0,
        comments: 0,
        ...payload,
      }
      state.posts.unshift(post)
      persist()
      return post
    },
    updatePost(id, payload) {
      const index = state.posts.findIndex((post) => post.id === Number(id))
      if (index === -1) return null

      state.posts[index] = { ...state.posts[index], ...payload }
      persist()
      return state.posts[index]
    },
    deletePost(id) {
      state.posts = state.posts.filter((post) => post.id !== Number(id))
      persist()
    },
    getPost(id) {
      return state.posts.find((post) => post.id === Number(id))
    },
    verifyPassword(id, password) {
      const post = state.posts.find((item) => item.id === Number(id))
      return Boolean(post && post.password === password)
    },
    toggleLike(id) {
      const post = state.posts.find((item) => item.id === Number(id))
      if (!post) return
      post.liked = !post.liked
      post.likes += post.liked ? 1 : -1
      persist()
    },
    increaseView(id) {
      const post = state.posts.find((item) => item.id === Number(id))
      if (!post) return
      post.views += 1
      persist()
    },
  }
}

export function getPosts() {
  return state.posts
}
