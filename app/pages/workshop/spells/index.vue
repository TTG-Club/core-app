<template>
  <NuxtLayout
    name="detail"
    title="Мастерская заклинаний"
  >
    <template #actions>
      <UButton
        icon="i-ttg-plus"
        color="neutral"
        variant="ghost"
        @click.left.exact.prevent="navigateTo('/workshop/spells/create')"
      >
        Создать заклинание
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
