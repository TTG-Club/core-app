<script setup lang="ts">
  import { SvgIcon } from '~ui/icon';

  defineProps<{
    supportItems: { url: string; icon: string; label: string }[]; // Массив элементов поддержки
  }>();
</script>

<template>
  <div :class="$style.container">
    <span :class="$style.label">Поддержка:</span>

    <AButton
      v-for="(item, index) in supportItems"
      :key="index"
      :class="$style.btn"
      :href="item.url"
      target="_blank"
      type="text"
    >
      <template #icon>
        <SvgIcon :icon="item.icon" />
      </template>

      <template #default>{{ item.label }}</template>
    </AButton>
  </div>
</template>

<style module lang="scss">
  .container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
</style>
