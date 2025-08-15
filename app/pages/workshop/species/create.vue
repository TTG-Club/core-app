<script setup lang="ts">
  import { SpeciesEditor } from '~species/editor';
</script>

<template>
  <NuxtLayout
    title="Создание нового вида"
    name="detail"
  >
    <template #actions>
      <UTooltip text="Закрыть">
        <UButton
          icon="i-ttg-x"
          variant="ghost"
          color="neutral"
          @click.left.exact.prevent="navigateTo('/workshop/species')"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <SpeciesEditor />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
