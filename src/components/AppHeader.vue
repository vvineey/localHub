<template>
  <header class="site-header">
    <div class="header-inner">
      <RouterLink class="brand" to="/" aria-label="Local-In 홈">
        <span class="brand-mark"><MapPinned :size="17" /></span>
        <span>Local<span>-In</span></span>
      </RouterLink>

      <nav class="desktop-nav" aria-label="주요 메뉴">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav-link">
          <component :is="item.icon" :size="16" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="header-actions">
        <button
          class="icon-btn theme-toggle"
          type="button"
          :aria-label="isDarkMode ? '라이트 모드로 변경' : '다크 모드로 변경'"
          :title="isDarkMode ? '라이트 모드' : '다크 모드'"
          @click="toggleTheme"
        >
          <Sun v-if="isDarkMode" :size="18" />
          <Moon v-else :size="18" />
        </button>
        <RouterLink class="btn btn-primary write-link" to="/community/new">
          <PenLine :size="16" />
          글쓰기
        </RouterLink>
        <button
          class="icon-btn mobile-toggle"
          type="button"
          :aria-expanded="menuOpen"
          aria-label="메뉴 열기"
          title="메뉴"
          @click="menuOpen = !menuOpen"
        >
          <X v-if="menuOpen" :size="20" />
          <Menu v-else :size="20" />
        </button>
      </div>
    </div>

    <nav v-if="menuOpen" class="mobile-nav" aria-label="모바일 메뉴">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="mobile-link"
        @click="menuOpen = false"
      >
        <component :is="item.icon" :size="17" />
        {{ item.label }}
      </RouterLink>
      <RouterLink class="mobile-link primary" to="/community/new" @click="menuOpen = false">
        <PenLine :size="17" />
        글쓰기
      </RouterLink>
    </nav>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  CalendarDays,
  Home,
  Map,
  MapPinned,
  Menu,
  MessageCircle,
  Moon,
  PenLine,
  Search,
  Sun,
  Users,
  X,
} from '@lucide/vue'

const THEME_STORAGE_KEY = 'local-in-theme'
const menuOpen = ref(false)
const isDarkMode = ref(document.documentElement.dataset.theme === 'dark')

const navItems = [
  { to: '/', label: '홈', icon: Home },
  { to: '/explore', label: '탐색', icon: Search },
  { to: '/map', label: '지도', icon: Map },
  { to: '/community', label: '커뮤니티', icon: Users },
  { to: '/festivals', label: '축제', icon: CalendarDays },
  { to: '/assistant', label: 'AI 채팅', icon: MessageCircle },
]

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  isDarkMode.value = theme === 'dark'
}

function toggleTheme() {
  applyTheme(isDarkMode.value ? 'light' : 'dark')
}
</script>

<style scoped>
.site-header {
  position: fixed;
  z-index: 50;
  top: 0;
  right: 0;
  left: 0;
  background: var(--header-bg);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(16px);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: min(1180px, calc(100% - 32px));
  height: 64px;
  margin: 0 auto;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  font-size: 1.14rem;
  font-weight: 900;
}

.brand > span:last-child span {
  color: var(--primary);
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: var(--on-primary);
  background: var(--primary);
  border-radius: var(--radius);
}

.desktop-nav {
  display: flex;
  gap: 4px;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 0 12px;
  color: var(--muted);
  border-radius: var(--radius);
  font-size: 0.9rem;
  font-weight: 750;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--primary);
  background: var(--primary-soft);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.theme-toggle {
  color: var(--primary);
}

.mobile-toggle {
  display: none;
}

.mobile-nav {
  display: grid;
  gap: 6px;
  padding: 10px 12px 14px;
  background: var(--surface);
  border-top: 1px solid var(--line);
}

.mobile-link {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 12px;
  color: var(--muted);
  border-radius: var(--radius);
  font-weight: 750;
}

.mobile-link.router-link-active,
.mobile-link:hover {
  color: var(--primary);
  background: var(--primary-soft);
}

.mobile-link.primary {
  color: var(--on-primary);
  background: var(--primary);
}

:global([data-theme='dark']) .site-header {
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04);
}

:global([data-theme='dark']) .nav-link:hover,
:global([data-theme='dark']) .nav-link.router-link-active,
:global([data-theme='dark']) .mobile-link.router-link-active,
:global([data-theme='dark']) .mobile-link:hover {
  color: #fff;
  background: #111;
}

@media (max-width: 860px) {
  .desktop-nav,
  .write-link {
    display: none;
  }

  .mobile-toggle {
    display: inline-flex;
  }

  .header-inner {
    width: min(100% - 24px, 1180px);
    height: 58px;
  }
}
</style>
