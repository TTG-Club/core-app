<script setup lang="ts">
  import { SpeciesEditor } from '~species/editor';
</script>

<template>
  <NuxtLayout
    title="Редактирование вида"
    name="detail"
  >
    <template #actions>
      <UTooltip text="Закрыть">
        <UButton
          icon="i-ttg-x"
          variant="ghost"
          color="neutral"
          @click.left.exact.prevent="navigateTo('/species')"
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
