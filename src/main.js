import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles.css'

const THEME_STORAGE_KEY = 'local-in-theme'
const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
const initialTheme = storedTheme || 'dark'

document.documentElement.dataset.theme = initialTheme

createApp(App).use(router).mount('#app')
