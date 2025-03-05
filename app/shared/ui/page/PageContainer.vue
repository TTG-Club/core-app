<template>
  <div :class="$style.page">
    <slot name="default" />
  </div>
</template>

<style module lang="scss">
  .page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 32px;
  }
</style>
