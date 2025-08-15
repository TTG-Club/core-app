<script setup lang="ts">
  import { GlossaryEditor } from '~glossary/editor';
</script>

<template>
  <NuxtLayout
    title="Редактирование записи глоссария"
    name="detail"
  >
    <template #actions>
      <UTooltip text="Закрыть">
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-ttg-x"
          @click.left.exact.prevent="navigateTo('/glossary')"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <GlossaryEditor />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
