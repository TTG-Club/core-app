<script setup lang="ts">
  import { CARD_LINKS } from './model';
</script>

<template>
  <ARow
    :gutter="[12, 12]"
    :class="$style.cards"
  >
    <ACol
      v-for="(link, index) in CARD_LINKS"
      :key="index"
      class="gutter-row"
      :xs="12"
      :sm="12"
      :md="6"
      :xl="4"
    >
      <NuxtLink
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
    </ACol>
  </ARow>
</template>

<style lang="scss" module>
  .cards {
    margin: 32px 0 0 0;
  }

  .card {
    position: relative;

    overflow: hidden;
    display: grid;
    align-items: center;
    justify-content: start;

    height: 56px;
    padding: 0 12px;
    border: 1px solid var(--color-border);
    border-radius: 10px;

    text-decoration: none;

    background-color: var(--color-bg-secondary);
    box-shadow: 0 0.625rem 0.75rem 0 var(--color-card-shadow);

    &:hover {
      .img {
        transform: scale(1.15);
        transition: transform 200ms;
      }
    }

    &.disabled {
      pointer-events: none;
      opacity: 0.4;
    }

    .img {
      position: absolute;
      top: 0;
      right: 0;

      display: block;

      width: 220px;

      opacity: 0.8;

      transition: transform 200ms;
    }

    .name {
      z-index: 10;
      font-weight: 600;
      color: var(--color-text);
      text-shadow: 0 2px 4px #0000006e;
    }
  }
</style>
