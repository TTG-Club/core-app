<template>
  <NuxtLayout
    name="detail"
    title="Мастерская источников"
  >
    <template #actions>
      <UButton
        icon="i-ttg-plus"
        color="neutral"
        variant="ghost"
        @click.left.exact.prevent="navigateTo('/workshop/sources/create')"
      >
        Создать источник
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
