<script setup lang="ts">
  import { MagicItemEditor } from '~magic-items/editor';
</script>

<template>
  <NuxtLayout
    title="Редактирование магического предмета"
    name="detail"
  >
    <template #actions>
      <UTooltip text="Закрыть">
        <UButton
          icon="i-ttg-x"
          variant="ghost"
          color="neutral"
          @click.left.exact.prevent="navigateTo('/magic-items')"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <MagicItemEditor />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
