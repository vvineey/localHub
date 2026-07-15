<template>
  <section class="page-loading" aria-live="polite" aria-busy="true">
    <h1>Local - in</h1>
  </section>
</template>

<style scoped>
.page-loading {
  display: grid;
  min-height: calc(100vh - 64px);
  place-items: center;
  padding: 42px 16px;
  color: var(--text);
  background: var(--bg);
}

.page-loading h1 {
  margin: 0;
  font-size: clamp(2.4rem, 6vw, 5.4rem);
  font-weight: 950;
  letter-spacing: 0;
}

@media (max-width: 720px) {
  .page-loading {
    min-height: calc(100vh - 58px);
  }
}
</style>
