<script setup lang="ts">
  defineProps<{
    title: string;
    section: string;
  }>();
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h2 class="truncate text-base text-highlighted">
          {{ title }}
        </h2>

        <UButton
          size="sm"
          icon="i-ttg-plus"
          @click.left.exact.prevent="navigateTo(`/workshop/${section}/create`)"
        >
          Создать
        </UButton>
      </div>
    </template>

    <div class="flex flex-wrap items-center gap-3 text-sm">
      <div class="flex items-center gap-1">
        <span class="opacity-70">Создано:</span>

        <ULink :to="`/workshop/${section}`">0</ULink>
      </div>

      <span class="opacity-40">•</span>

      <div class="flex items-center gap-1">
        <span class="opacity-70">На модерации:</span>

        <ULink :to="`/workshop/${section}`">0</ULink>
      </div>

      <span class="opacity-40">•</span>

      <div class="flex items-center gap-1">
        <span class="opacity-70">Черновики:</span>

        <ULink :to="`/workshop/${section}`">0</ULink>
      </div>
    </div>
  </UCard>
</template>
