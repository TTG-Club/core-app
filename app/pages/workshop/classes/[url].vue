<script setup lang="ts">
  import { ClassEditor } from '~classes/editor';
</script>

<template>
  <NuxtLayout
    title="Редактирование класса"
    name="detail"
  >
    <template #actions>
      <UTooltip text="Закрыть">
        <UButton
          icon="i-ttg-x"
          variant="ghost"
          color="neutral"
          @click.left.exact.prevent="navigateTo('/classes')"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <ClassEditor />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
