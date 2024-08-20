<template>
  <div :class="['ttg-app', $style.app]">
    <NavBar />

    <div :class="$style.container">
      <div :class="$style.wrapper">
        <slot />
      </div>
    </div>
  </div>
</template>

<style module lang="scss">
  .app {
    display: flex;
    flex-flow: column-reverse;

    @include media-min($md) {
      flex-flow: row;
    }
  }

  .container {
    position: relative;

    overflow: auto;

    width: 100%;
    height: var(--max-vh);
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
