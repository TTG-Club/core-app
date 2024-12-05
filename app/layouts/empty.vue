<template>
  <div :class="$style.empty">
    <slot />
  </div>
</template>

<style lang="scss" module>
  .empty {
    overflow: auto;
    min-height: 100vh;
  }
</style>
