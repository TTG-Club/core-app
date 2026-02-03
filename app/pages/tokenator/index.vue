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

  useSeoMeta({
    title: 'Токенатор [Tokenator]',
    description:
      'Создавайте красивые токены для D&D, Pathfinder и других VTT (Roll20, Foundry) онлайн. Загрузите картинку, выберите рамку и скачайте токен.',
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    title="Токенатор"
  >
    <div class="flex min-h-full flex-col gap-6 lg:flex-row lg:gap-8">
      <ClientOnly>
        <div class="flex shrink-0 flex-col gap-4 lg:w-80">
          <div class="shrink-0 pt-0 pb-2">
            <TokenatorPreview />
          </div>

          <div class="min-h-0 flex-1">
            <TokenatorControls />
          </div>
        </div>

        <div
          class="relative hidden min-w-0 flex-1 flex-col overflow-hidden rounded-2xl lg:flex lg:h-[calc(100vh-140px)]"
        >
          <div class="inset-0 h-full w-full">
            <TokenatorCanvas />
          </div>
        </div>

        <template #fallback>
          <div class="flex h-96 w-full items-center justify-center">
            <UIcon
              name="i-fluent-arrow-clockwise-24-regular"
              class="animate-spin text-gray-500"
              size="2.5rem"
            />
          </div>
        </template>
      </ClientOnly>
    </div>
  </NuxtLayout>
</template>
