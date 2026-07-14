<template>
  <AppHeader />
  <main class="app-shell">
    <RouterView />
  </main>
  <ChatWidget />
</template>

<script setup>
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import ChatWidget from './components/ChatWidget.vue'
</script>
