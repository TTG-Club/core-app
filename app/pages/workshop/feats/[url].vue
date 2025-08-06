<script setup lang="ts">
  import { FeatsEditor } from '~feats/editor';
</script>

<template>
  <NuxtLayout
    title="Редактирование черты"
    name="detail"
  >
    <template #actions>
      <UTooltip text="Закрыть">
        <UButton
          icon="i-ttg-x"
          variant="ghost"
          color="neutral"
          @click.left.exact.prevent="navigateTo('/feats')"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <FeatsEditor />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
