<script setup lang="ts">
  import { SourceEditor } from '~/features/sources/editor';
</script>

<template>
  <NuxtLayout
    title="Редактирование источника"
    name="detail"
  >
    <template #actions>
      <UTooltip text="Закрыть">
        <UButton
          icon="i-ttg-x"
          variant="ghost"
          color="neutral"
          @click.left.exact.prevent="navigateTo('/sources')"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <SourceEditor />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
