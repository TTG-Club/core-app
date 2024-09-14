<template>
  <div :class="$style.empty">
    <slot />
  </div>
</template>

<style lang="scss" module>
  .empty {
    overflow: auto;
    height: var(--max-vh);
    min-height: var(--max-vh);
    max-height: var(--max-vh);
  }
</style>
