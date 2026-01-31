<script setup lang="ts">
  import { useUserStore } from '~/shared/stores';

  import { LinkTo5e14 } from '../link-to-5e14';

  import { CARD_LINKS } from './model';

  const { user } = storeToRefs(useUserStore());

  const sections = computed(() =>
    CARD_LINKS.map((link) => {
      if (!Array.isArray(link.roles)) {
        return link;
      }

      const available = link.roles.some((role) =>
        user.value?.roles.includes(role),
      );

      return {
        ...link,
        disabled: link.disabled || !available,
      };
    }),
  );
</script>

<template>
  <div
    :class="$style.container"
    class="grid w-full grid-cols-1 gap-3 xl:grid-cols-6"
  >
    <div
      class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:col-span-5 xl:row-span-2 xl:grid-cols-5"
    >
      <NuxtLink
        v-for="(link, index) in sections"
        :key="index"
        :to="link.url"
        :class="[$style.card, { [$style.disabled]: link.disabled }]"
        class="shadow-lg"
      >
        <span :class="$style.name">{{ link.name }}</span>

        <img
          :class="$style.img"
          :src="link.img"
          :alt="link.name"
          loading="lazy"
        />
      </NuxtLink>
    </div>

    <div
      class="order-last xl:order-none xl:col-start-6 xl:row-span-2 xl:row-start-1"
    >
      <LinkTo5e14 class="h-full" />
    </div>
  </div>
</template>

<style lang="scss" module>
  .cards {
    margin: 32px 0 0 0;
  }

  @media (min-width: 1280px) {
    .container {
      grid-auto-rows: 56px;
      align-items: stretch;
    }
  }

  .card {
    position: relative;

    overflow: hidden;
    display: grid;
    align-items: center;
    justify-content: start;

    height: 56px;
    padding: 0 12px;
    border: 1px solid var(--ui-border);
    border-radius: 10px;

    text-decoration: none;

    background-color: var(--ui-bg-muted);

    &:hover {
      .img {
        transform: scale(1.05);
        transition: transform 200ms;
      }

      &:after {
        left: -200px;
        transition: left 200ms;
      }
    }

    &:after {
      content: '';

      position: absolute;
      left: 0;

      width: 100%;
      height: 100%;

      background: linear-gradient(
        90deg,
        rgb(18, 18, 18) 0%,
        rgba(18, 18, 18, 0.75) 20%,
        rgba(255, 255, 255, 0) 100%
      );

      transition: left 200ms;
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

      width: 100%;
      height: 100%;

      opacity: 0.9;
      object-fit: cover;

      transition: transform 200ms;
    }

    .name {
      z-index: 10;
      font-weight: 600;
      color: var(--color-white);
      text-shadow: 0 2px 4px #0000006e;
    }
  }
</style>
