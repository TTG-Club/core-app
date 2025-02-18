<script setup lang="ts">
  import { SvgIcon } from '~/shared/ui';

  defineProps<{
    supportItems: { url: string; icon: string; label: string }[]; // Массив элементов поддержки
  }>();
</script>

<template>
  <AFlex
    gap="small"
    align="center"
    wrap="wrap"
  >
    <span>Поддержка:</span>

    <AButton
      v-for="(item, index) in supportItems"
      :key="index"
      type="text"
      :href="item.url"
      target="_blank"
    >
      <template #icon>
        <SvgIcon :icon="item.icon" />
      </template>

      <template #default>{{ item.label }}</template>
    </AButton>
  </AFlex>
</template>
