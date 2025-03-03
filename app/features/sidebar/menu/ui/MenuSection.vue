<script setup lang="ts">
  defineProps<{
    title: string;
    items: { href: string; label: string; disabled?: boolean }[]; // Массив ссылок
  }>();
</script>

<template>
  <AFlex
    :class="$style.menu"
    vertical
  >
    <span :class="$style.title">{{ title }}</span>

    <NuxtLink
      v-for="(item, index) in items"
      :key="index"
      :class="[$style.item, item.disabled && $style.disabled]"
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
    padding: 0 16px;

    font-size: 13px;
    font-weight: 200;
    color: var(--color-text-g);
  }
  .item {
    padding: 6px 16px;
    border-radius: 6px;
    color: var(--color-text);
    &:hover {
      color: var(--color-text);
      background-color: var(--color-hover);
      transition: all 0.15s ease-in-out;
    }
  }

  .disabled {
    pointer-events: none;
    opacity: 0.4;
  }
</style>
