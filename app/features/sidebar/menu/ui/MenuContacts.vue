<script setup lang="ts">
  import { SvgIcon } from '~/shared/ui';

  defineProps<{
    socialLinks: { url: string; icon: string }[]; // Массив ссылок на социальные сети
  }>();
</script>

<template>
  <AFlex
    gap="small"
    align="center"
  >
    <span>Контакты:</span>

    <AButton
      v-for="(link, index) in socialLinks"
      :key="index"
      type="text"
      :href="link.url"
      target="_blank"
    >
      <template #icon>
        <SvgIcon :icon="link.icon" />
      </template>
    </AButton>
  </AFlex>
</template>
