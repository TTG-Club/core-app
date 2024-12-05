<template>
  <AFlex :class="$style.container">
    <div
      id="page-prev"
      :class="[$style.nav, $style.left]"
    />

    <div :class="$style.wrapper">
      <slot />
    </div>

    <div
      id="page-next"
      :class="[$style.nav, $style.right]"
    />
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
    margin: 0 auto;
  }

  .nav {
    position: sticky;
    top: 0;

    flex-shrink: 0;

    width: 16px;
    height: 100vh;

    @include media-min($xl) {
      width: 24px;
    }

    &.left {
      left: 0;
    }

    &.right {
      right: 0;
    }
  }
</style>
