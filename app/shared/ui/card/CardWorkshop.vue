<script setup lang="ts">
  defineProps<{
    title: string;
    section: string;
  }>();
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <h2 class="text-lg text-(--color-text-title)">{{ title }}</h2>
    </template>

    <div class="flex flex-col gap-2">
      <div>Создано: <ULink :to="`/workshop/${section}`">0</ULink></div>

      <div>На модерации: <ULink :to="`/workshop/${section}`">0</ULink></div>

      <div>Черновики: <ULink :to="`/workshop/${section}`">0</ULink></div>
    </div>

    <template #footer>
      <UButton
        icon="i-ttg-plus"
        @click.left.exact.prevent="navigateTo(`/workshop/${section}/create`)"
      >
        Создать
      </UButton>
    </template>
  </UCard>
</template>
