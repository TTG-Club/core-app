<script setup lang="ts">
  import { SOCIAL_LINKS } from './model';

  import { SvgIcon } from '~ui/icon';
</script>

<template>
  <AFlex
    :class="$style.cards"
    gap="12"
    vertical
  >
    <NuxtLink
      v-for="(link, index) in SOCIAL_LINKS"
      :key="index"
      :to="link.url"
      :class="[$style.card, { [$style.disabled]: link.disable }]"
      :style="{ backgroundColor: link.backgroundColor }"
      target="_blank"
    >
      <SvgIcon
        :class="$style.icon"
        :icon="link.icon"
      />

      <span :class="$style.name">{{ link.name }}</span>
    </NuxtLink>
  </AFlex>
</template>

<style lang="scss" module>
  .cards {
    width: 100%;
  }

  .card {
    position: relative;

    overflow: hidden;
    display: flex;
    flex-direction: row;
    gap: 8px;
    align-items: center;
    justify-content: center;

    height: 48px;
    padding: 0 12px;
    border: 1px solid var(--color-border);
    border-radius: 10px;

    color: #ffffff;
    text-decoration: none;

    box-shadow: 0 0.625rem 0.75rem 0 var(--color-card-shadow);

    &:hover {
      color: #ffffff;

      .name {
        font-size: 18px;
        transition: all 200ms;
      }
    }

    &.disabled {
      pointer-events: none;
      opacity: 0.4;
    }

    .name {
      font-weight: 600;
      transition: all 200ms;
    }

    .icon,
    svg {
      width: 24px;
      height: 24px;
    }
  }
</style>
