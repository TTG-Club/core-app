<script setup lang="ts">
  import { SpellsEditor } from '~spells/editor';
</script>

<template>
  <NuxtLayout
    title="Редактирование заклинания"
    name="detail"
  >
    <template #actions>
      <UTooltip text="Закрыть">
        <UButton
          icon="i-ttg-x"
          variant="ghost"
          color="neutral"
          @click.left.exact.prevent="navigateTo('/spells')"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <SpellsEditor />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
