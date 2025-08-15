<script setup lang="ts">
  import { CreatureEditor } from '~bestiary/editor';
</script>

<template>
  <NuxtLayout
    title="Создание нового существа"
    name="detail"
  >
    <template #actions>
      <UTooltip text="Закрыть">
        <UButton
          icon="i-ttg-x"
          variant="ghost"
          color="neutral"
          @click.left.exact.prevent="navigateTo('/workshop/bestiary')"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <CreatureEditor />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
