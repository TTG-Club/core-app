<template>
  <NuxtLink
    to="https://ttg.club/"
    :class="$style.card"
    target="_blank"
  >
    <h2
      :class="$style.name"
      class="text-2xl"
    >
      D&D 2014
    </h2>

    <p :class="$style.description">Предыдущая редакция Dungeon and Dragons</p>
  </NuxtLink>
</template>

<style lang="scss" module>
  .card {
    position: relative;

    overflow: hidden;
    display: flex;
    flex: 1 1 100%;
    flex-direction: column;
    gap: 12px;

    padding: 12px 12px;
    border: 1px solid var(--ui-border);
    border-radius: 10px;

    color: var(--ui-text);
    text-decoration: none;

    background: var(--ui-bg-muted);
    box-shadow: 0 0.625rem 0.75rem 0 var(--color-card-shadow);

    &:before {
      content: '';

      position: absolute;
      top: 0;
      left: 0;

      display: block;

      width: 100%;
      height: 100%;

      opacity: 0.4;
      background-image: url('/s3/sections/fon.png');
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

    .name {
      z-index: 10;
      font-weight: 600;
      color: var(--ui-text);
      text-shadow: 0 2px 4px #0000006e;
    }

    .description {
      z-index: 10;
      color: var(--ui-text);
      text-shadow: 0 2px 4px #0000006e;
    }
  }
</style>
