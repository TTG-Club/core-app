<script setup lang="ts">
  import { BackgroundsEditor } from '~backgrounds/editor';
</script>

<template>
  <NuxtLayout
    title="Создание новой предыстории"
    name="detail"
  >
    <template #actions>
      <UTooltip text="Закрыть">
        <UButton
          icon="i-ttg-x"
          variant="ghost"
          color="neutral"
          @click.left.exact.prevent="navigateTo('/workshop/backgrounds')"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <BackgroundsEditor />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
