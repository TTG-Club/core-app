<template>
  <AFlex :class="$style.container">
    <div :class="$style.wrapper">
      <slot />
    </div>
  </AFlex>
</template>

<style module lang="scss">
  .container {
    position: relative;
    width: 100%;
    min-height: 100vh;
  }

  .wrapper {
    width: 100%;
    max-width: var(--max-content);
    padding: 0 24px 0 24px;

    @include media-min($xxl) {
      margin: 0 auto 24px;
    }
  }
</style>
