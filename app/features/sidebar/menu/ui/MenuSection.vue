<script setup lang="ts">
  import { SvgIcon } from '~/shared/ui';

  defineProps<{
    icon: string;
    title: string;
    items: { href: string; label: string }[]; // Массив ссылок
  }>();
</script>

<template>
  <AFlex
    :class="$style.menu"
    vertical
  >
    <AFlex
      align="center"
      gap="8"
      :class="$style.title"
    >
      <SvgIcon :icon="icon" />

      <span>{{ title }}</span>
    </AFlex>

    <NuxtLink
      v-for="(item, index) in items"
      :key="index"
      :class="$style.item"
      :to="item.href"
    >
      {{ item.label }}
    </NuxtLink>
  </AFlex>
</template>

<style lang="scss" module>
  .menu {
    width: 100%;
    min-width: 200px;
    max-width: 240px;
    margin: 0;
    padding: 0;

    list-style: none;
  }
  .title {
    margin-bottom: 4px;
    padding: 0 8px;

    font-size: 13px;
    font-weight: 200;
    color: var(--color-text-g);
  }
  .item {
    margin-left: 14px;
    padding: 6px 16px;
    color: var(--color-text);
    border-radius: 6px;
    &:hover {
      color: var(--color-text);
      background-color: var(--color-hover);
      transition: all 0.15s ease-in-out;
    }
  }
</style>
