<script setup lang="ts">
  import {
    TokenatorCanvas,
    TokenatorControls,
    TokenatorPreview,
  } from '~tokenator';

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
      <div class="flex h-full flex-col gap-6 lg:flex-row lg:gap-8">
        <div
          class="lg:page-h flex shrink-0 flex-col gap-4 lg:w-80 lg:overflow-hidden lg:pr-1"
        >
          <div class="shrink-0 pt-0 pb-2">
            <TokenatorPreview />
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto">
            <TokenatorControls />
          </div>
        </div>

        <div
          class="relative flex min-w-0 flex-1 flex-col overflow-hidden lg:h-[calc(100vh-140px)] lg:rounded-2xl"
        >
          <h2
            class="absolute top-0 right-0 left-0 z-50 mb-4 p-4 text-xl font-bold backdrop-blur-sm lg:hidden"
          >
            Редактор
          </h2>

          <div class="absolute inset-0 h-full w-full">
            <TokenatorCanvas />
          </div>
        </div>
      </div>

      <template #fallback>
        <div class="flex h-96 items-center justify-center">
          <UIcon
            name="i-fluent-arrow-clockwise-24-regular"
            class="h-10 w-10 animate-spin text-gray-500"
          />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
