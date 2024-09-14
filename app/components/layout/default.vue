<template>
  <div :class="$style.wrapper">
    <slot />
  </div>
</template>

<style module lang="scss">
  .wrapper {
    width: 100%;
    max-width: var(--max-content);
    margin: 0 auto;
  }
</style>
