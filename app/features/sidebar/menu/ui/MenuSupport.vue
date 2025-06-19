<script setup lang="ts">
  defineProps<{
    supportItems: { url: string; icon: string; label: string }[]; // Массив элементов поддержки
  }>();
</script>

<template>
  <div :class="$style.container">
    <span :class="$style.label">Поддержка:</span>

    <UButton
      v-for="(item, index) in supportItems"
      :key="index"
      :label="item.label"
      :icon="item.icon"
      :href="item.url"
      target="_blank"
      variant="link"
      color="neutral"
    />
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
