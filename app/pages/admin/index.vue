<template>
  <NuxtLayout
    name="detail"
    title="Админка"
  >
    <div
      class="grid [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))] gap-4 sm:[grid-template-columns:repeat(auto-fit,minmax(360px,1fr))]"
    >
      <UButton
        size="sm"
        icon="i-ttg-plus"
        @click.left.exact.prevent="navigateTo(`/admin/news`)"
      >
        Новости
      </UButton>
    </div>
  </NuxtLayout>
</template>
