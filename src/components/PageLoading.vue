<template>
  <section class="page-loading" aria-live="polite" aria-busy="true">
    <div class="page-loading__inner">
      <div class="page-loading__brand">
        <div class="page-loading__hero">
          <div class="page-loading__logo-wrap">
            <img class="page-loading__logo" :src="localinLogo" alt="Local-In" />
          </div>
          <div class="page-loading__text">
            <h1 class="page-loading__title" aria-label="Local-in">
              <span
                v-for="(letter, index) in loadingTitleLetters"
                :key="`${letter}-${index}`"
                aria-hidden="true"
                :style="{ '--letter-index': index }"
              >
                {{ letter }}
              </span>
            </h1>
            <p class="page-loading__subtitle">로딩 중... 지역 정보를 불러오고 있습니다.</p>
          </div>
        </div>
      </div>

      <div class="page-loading__dots" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </section>
</template>

<script setup>
import localinLogo from '../assets/icon/localin.png'

const loadingTitleLetters = ['L', 'o', 'c', 'a', 'l', '-', 'i', 'n']
</script>

<style scoped>
.page-loading {
  display: grid;
  min-height: calc(100vh - 64px);
  place-items: center;
  padding: 42px 16px;
  color: var(--text);
  background: var(--bg);
}

.page-loading__inner {
  display: grid;
  place-items: center;
  gap: 28px;
  text-align: center;
  max-width: 520px;
  width: 100%;
}

.page-loading__brand {
  display: grid;
  gap: 18px;
  align-items: center;
}

.page-loading__hero {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  flex-wrap: wrap;
}

.page-loading__text {
  display: grid;
  gap: 10px;
  text-align: left;
}

.page-loading__logo-wrap {
  position: relative;
  width: 120px;
  height: 120px;
  min-width: 120px;
  display: grid;
  place-items: center;
  border-radius: 28px;
  background: rgba(var(--surface-rgb), 0.14);
  box-shadow: inset 0 0 0 1px rgba(var(--surface-rgb), 0.08), 0 28px 80px rgba(0, 0, 0, 0.16);
}

.page-loading__logo-wrap::before {
  content: '';
  position: absolute;
  inset: -20px;
  border-radius: 44px;
  background: radial-gradient(circle at center, rgba(var(--primary-rgb), 0.18), transparent 55%);
  filter: blur(18px);
}

.page-loading__logo {
  width: 140px;
  height: 140px;
  object-fit: contain;
  z-index: 1;
}

.page-loading h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 900;
  letter-spacing: -0.04em;
}

.page-loading__title {
  display: flex;
  flex-wrap: wrap;
}

.page-loading__title span {
  display: inline-block;
  color: var(--text);
  animation: page-loading-title-sweep 3s ease-in-out infinite;
  animation-delay: calc(240ms + (var(--letter-index) * 95ms));
}

@keyframes page-loading-title-sweep {
  0%,
  38%,
  100% {
    color: var(--text);
    text-shadow: none;
    transform: translateY(0);
  }

  10%,
  22% {
    color: var(--primary);
    text-shadow: 0 0 26px rgba(var(--primary-rgb), 0.36);
    transform: translateY(-0.035em);
  }
}

.page-loading__subtitle {
  margin: 0;
  color: var(--muted);
  font-size: 1rem;
  line-height: 1.7;
  max-width: 320px;
}

.page-loading__dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.page-loading__dots span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(var(--primary-rgb), 0.85);
  box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0.35);
  animation: page-loading-pulse 1.2s infinite ease-in-out;
}

.page-loading__dots span:nth-child(1) {
  animation-delay: 0s;
}

.page-loading__dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.page-loading__dots span:nth-child(3) {
  animation-delay: 0.3s;
}

.page-loading__dots span:nth-child(4) {
  animation-delay: 0.45s;
}

.page-loading__dots span:nth-child(5) {
  animation-delay: 0.6s;
}

@keyframes page-loading-pulse {
  0%, 80%, 100% {
    transform: scale(0.85);
    opacity: 0.4;
    box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0.2);
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
    box-shadow: 0 0 28px 8px rgba(var(--primary-rgb), 0.12);
  }
}

.page-loading__dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(var(--text-rgb), 0.3);
  animation: page-loading-pulse 1.2s infinite ease-in-out;
}

.page-loading__dots span:nth-child(1) {
  animation-delay: 0s;
}

.page-loading__dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.page-loading__dots span:nth-child(3) {
  animation-delay: 0.3s;
}

.page-loading__dots span:nth-child(4) {
  animation-delay: 0.45s;
}

.page-loading__dots span:nth-child(5) {
  animation-delay: 0.6s;
}

@keyframes page-loading-pulse {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.35;
  }
  40% {
    transform: scale(1.15);
    opacity: 1;
  }
}

@media (max-width: 720px) {
  .page-loading {
    min-height: calc(100vh - 58px);
  }

  .page-loading__hero {
    gap: 12px;
  }

  .page-loading__logo-wrap {
    width: 72px;
    height: 72px;
    min-width: 72px;
  }

  .page-loading__logo {
    width: 42px;
    height: 42px;
  }

  .page-loading h1 {
    font-size: clamp(1.8rem, 10vw, 2.4rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-loading__title span {
    animation: none;
  }
}
</style>
