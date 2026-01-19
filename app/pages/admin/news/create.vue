<script setup lang="ts">
  import NewsEditor from '~/pages/admin/news/ui/NewsEditor.vue';
</script>

<template>
  <NuxtLayout
    title="Создание новости"
    name="detail"
  >
    <template #actions>
      <UTooltip text="Закрыть">
        <UButton
          icon="i-ttg-x"
          variant="ghost"
          color="neutral"
          @click.left.exact.prevent="navigateTo('/admin/news')"
        />
      </UTooltip>
    </template>

    <template #default>
      <ClientOnly>
        <NewsEditor />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
