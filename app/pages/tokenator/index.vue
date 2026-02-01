<script setup lang="ts">
  import TokenatorPage from '../../features/tokenator/pages/TokenatorPage.vue';

  definePageMeta({
    layout: 'default',
    title: 'Токенатор',
  });

  useHead({
    title: 'Токенатор — Генератор токенов для VTT',
    meta: [
      {
        name: 'description',
        content:
          'Создавайте красивые токены для D&D, Pathfinder и других VTT (Roll20, Foundry) онлайн. Загрузите картинку, выберите рамку и скачайте токен.',
      },
    ],
  });
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="mb-8 text-3xl font-bold">Токенатор</h1>

    <ClientOnly>
      <TokenatorPage />

      <template #fallback>
        <div class="flex h-96 items-center justify-center">
          <UIcon
            name="i-heroicons-arrow-path"
            class="h-10 w-10 animate-spin text-gray-500"
          />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
