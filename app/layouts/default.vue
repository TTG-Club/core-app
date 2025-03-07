<template>
  <div :class="$style.container">
    <slot />
  </div>
</template>

<style module lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
  }
</style>
