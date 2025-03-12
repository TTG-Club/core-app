<script setup lang="ts">
  import { CARD_LINKS } from './model';
</script>

<template>
  <AFlex
    :class="$style.cards"
    wrap="wrap"
    gap="16"
  >
    <NuxtLink
      v-for="(link, index) in CARD_LINKS"
      :key="index"
      :to="link.url"
      :class="[$style.card, { [$style.disabled]: link.disable }]"
    >
      <span :class="$style.name">{{ link.name }}</span>

      <img
        :class="$style.img"
        :src="link.img"
        :alt="link.name"
        loading="lazy"
      />
    </NuxtLink>
  </AFlex>
</template>

<style lang="scss" module>
  .cards {
    width: 100%;
    margin: 32px 0 0 0;
  }

  .card {
    position: relative;

    overflow: hidden;
    display: grid;
    flex: 1 1 15%;
    align-items: center;
    justify-content: start;

    min-width: 40%;
    height: 56px;
    padding: 0 12px;
    border: 1px solid var(--color-border);
    border-radius: 12px;

    text-decoration: none;

    background-color: var(--color-bg-secondary);
    box-shadow: 0 0.625rem 0.75rem 0 var(--color-card-shadow);

    &:hover {
      .img {
        transform: scale(1.15);
        transition: transform 0.6s;
      }
    }

    &.disabled {
      pointer-events: none;
      opacity: 0.4;
    }

    @include media-min($md) {
      min-width: 19%;
    }

    @include media-min($xl) {
      min-width: 16%;
    }

    .img {
      position: absolute;
      top: 0;
      right: 0;

      display: block;

      width: 220px;

      opacity: 0.8;

      transition: transform 0.6s;
    }

    .name {
      z-index: 10;
      font-weight: 600;
      color: var(--color-text);
    }
  }
</style>
