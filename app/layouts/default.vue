<template>
  <div :class="$style.container">
    <div :class="$style.wrapper">
      <slot />
    </div>
  </div>
</template>

<style module lang="scss">
  .container {
    position: relative;

    width: 100%;
    min-height: var(--max-vh);
    margin: auto;
    padding: 0 16px;

    @include media-min($xl) {
      padding: 0 24px;
    }
  }

  .wrapper {
    width: 100%;
    max-width: var(--max-content);
    margin: 0 auto;
  }
</style>
