<script setup lang="ts">
  import { ItemEditor } from '~items/editor';
</script>

<template>
  <NuxtLayout
    title="Редактирование предмета"
    name="detail"
  >
    <template #actions>
      <UTooltip text="Закрыть">
        <UButton
          icon="i-ttg-x"
          variant="ghost"
          color="neutral"
          @click.left.exact.prevent="navigateTo('/items')"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <ItemEditor />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
