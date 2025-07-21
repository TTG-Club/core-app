<template>
  <NuxtLayout
    name="detail"
    title="Мастерская черт"
  >
    <template #actions>
      <UButton
        icon="i-ttg-plus"
        color="neutral"
        variant="ghost"
        @click.left.exact.prevent="navigateTo('/workshop/feats/create')"
      >
        Создать черту
      </UButton>

      <UTooltip text="Вернуться в мастерскую">
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-ttg-x"
          @click.left.exact.prevent="navigateTo('/workshop')"
        />
      </UTooltip>
    </template>
  </NuxtLayout>
</template>
