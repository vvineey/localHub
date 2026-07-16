<template>
  <header class="site-header">
    <div class="header-inner">
      <RouterLink class="brand" to="/" :aria-label="t('nav.brandHome')">
        <img class="brand-logo" :src="localinLogo" alt="Local-In" />
        <span>Local<span>-In</span></span>
      </RouterLink>

      <nav class="desktop-nav" :aria-label="t('nav.mainMenu')">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav-link">
          <component :is="item.icon" :size="16" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="header-actions">
        <label class="language-select">
          <Languages :size="16" />
          <select v-model="currentLocale" :aria-label="t('nav.language')" :title="t('nav.language')">
            <option v-for="language in languageOptions" :key="language.value" :value="language.value">
              {{ language.label }}
            </option>
          </select>
        </label>
        <button
          class="icon-btn theme-toggle"
          type="button"
          :aria-label="isDarkMode ? t('nav.toLight') : t('nav.toDark')"
          :title="isDarkMode ? t('nav.lightMode') : t('nav.darkMode')"
          @click="toggleTheme"
        >
          <Sun v-if="isDarkMode" :size="18" />
          <Moon v-else :size="18" />
        </button>
        <RouterLink class="btn btn-primary write-link" to="/community/new">
          <PenLine :size="16" />
          {{ t('common.write') }}
        </RouterLink>
        <button
          class="icon-btn mobile-toggle"
          type="button"
          :aria-expanded="menuOpen"
          :aria-label="t('nav.openMenu')"
          :title="t('nav.menu')"
          @click="menuOpen = !menuOpen"
        >
          <X v-if="menuOpen" :size="20" />
          <Menu v-else :size="20" />
        </button>
      </div>
    </div>

    <nav v-if="menuOpen" class="mobile-nav" :aria-label="t('nav.mobileMenu')">
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
        {{ t('common.write') }}
      </RouterLink>
    </nav>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import localinLogo from '../assets/icon/localin.png'
import {
  CalendarDays,
  Home,
  Languages,
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
import { languageOptions, LOCALE_STORAGE_KEY } from '../i18n'

const THEME_STORAGE_KEY = 'local-in-theme'
const { locale, t } = useI18n()
const menuOpen = ref(false)
const isDarkMode = ref(document.documentElement.dataset.theme === 'dark')

const navItems = computed(() => [
  { to: '/', label: t('nav.home'), icon: Home },
  { to: '/explore', label: t('nav.explore'), icon: Search },
  { to: '/map', label: t('nav.map'), icon: Map },
  { to: '/community', label: t('nav.community'), icon: Users },
  { to: '/festivals', label: t('nav.festivals'), icon: CalendarDays },
  { to: '/assistant', label: t('nav.assistant'), icon: MessageCircle },
])

const currentLocale = computed({
  get: () => locale.value,
  set: (value) => {
    locale.value = value
    document.documentElement.lang = value
    window.localStorage.setItem(LOCALE_STORAGE_KEY, value)
  },
})

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

.brand-logo {
  display: inline-flex;
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.brand > span:last-child span {
  color: var(--primary);
}

.brand-mark {
  display: none;
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

.language-select {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 16px 0 13px;
  color: var(--text);
  background: rgba(var(--surface-rgb), 0.92);
  border: 1px solid rgba(var(--primary-rgb), 0.14);
  border-radius: 999px;
  box-shadow: 0 12px 34px rgba(15, 23, 42, 0.06);
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.language-select:hover,
.language-select:focus-within {
  background: rgba(var(--surface-rgb), 1);
  border-color: rgba(var(--primary-rgb), 0.25);
  transform: translateY(-1px);
}

.language-select svg {
  color: var(--primary);
  flex-shrink: 0;
}

.language-select::after {
  content: '';
  position: absolute;
  right: 14px;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid var(--muted);
  pointer-events: none;
}

.language-select select {
  flex: 1;
  min-width: 84px;
  color: var(--text);
  background: transparent;
  border: 0;
  outline: 0;
  font-size: 0.94rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 26px;
  cursor: pointer;
}

.language-select select::-ms-expand {
  display: none;
}

.language-select select option {
  color: var(--text);
  background: var(--surface);
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
  color: var(--primary);
  background: var(--primary-soft);
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

  .language-select {
    min-height: 38px;
    padding: 0 8px;
  }

  .language-select select {
    max-width: 76px;
  }
}
</style>
