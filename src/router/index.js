import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ExploreView from '../views/ExploreView.vue'
import MapView from '../views/MapView.vue'
import CommunityView from '../views/CommunityView.vue'
import PostDetailView from '../views/PostDetailView.vue'
import PostEditorView from '../views/PostEditorView.vue'
import FestivalView from '../views/FestivalView.vue'
import AssistantView from '../views/AssistantView.vue'
import PlaceDetailView from '../views/PlaceDetailView.vue'
import NotFoundView from '../views/NotFoundView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/explore', name: 'explore', component: ExploreView },
  { path: '/places/:id', name: 'place-detail', component: PlaceDetailView, props: true },
  { path: '/map', name: 'map', component: MapView },
  { path: '/community', name: 'community', component: CommunityView },
  { path: '/community/new', name: 'post-new', component: PostEditorView },
  { path: '/community/:id', name: 'post-detail', component: PostDetailView, props: true },
  { path: '/community/:id/edit', name: 'post-edit', component: PostEditorView, props: true },
  { path: '/festivals', name: 'festivals', component: FestivalView },
  { path: '/assistant', name: 'assistant', component: AssistantView },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
