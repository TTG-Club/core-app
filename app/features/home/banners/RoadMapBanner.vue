<template>
  <NuxtLink
    :class="$style.card"
    class="relative min-h-[140px] rounded-lg p-6 shadow-lg"
    target="_blank"
    to="../roadmap"
  >
    <span class="z-1 text-2xl">Дорожная карта</span>

    <p class="z-1">Выбор за тобой!</p>
  </NuxtLink>
</template>

<style lang="scss" module>
  .card {
    overflow: hidden;
    display: flex;
    flex: 1 1 100%;
    flex-direction: column;
    gap: 12px;

    border: 1px solid var(--ui-border);

    color: var(--ui-text);
    text-decoration: none;

    background: var(--ui-bg-muted);
    &:before {
      content: '';

      position: absolute;
      top: 0;
      left: 0;

      display: block;

      width: 100%;
      height: 100%;

      opacity: 0.4;
      background-image: url('/s3/home/RoadMapBanner.webp');
      background-repeat: no-repeat;
      background-position: center;
      background-size: cover;

      transition: transform 200ms;
    }

    &:hover {
      &:before {
        transform: scale(1.15);
        transition: transform 200ms;
      }
    }
  }
</style>
