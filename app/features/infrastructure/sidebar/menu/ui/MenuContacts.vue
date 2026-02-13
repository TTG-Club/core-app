<script setup lang="ts">
  defineProps<{
    socialLinks: { url: string; icon: string }[]; // Массив ссылок на социальные сети
  }>();
</script>

<template>
  <div class="flex items-center gap-2">
    <span>Контакты:</span>

    <UButton
      v-for="(link, index) in socialLinks"
      :key="index"
      :href="link.url"
      :icon="link.icon"
      variant="link"
      target="_blank"
      color="neutral"
    />
  </div>
</template>
