<template>
  <UCard
    v-if="isDev"
    :ui="{ body: 'p-6' }"
  >
    <UAlert
      icon="tabler:eye"
      color="neutral"
      variant="subtle"
      title="О видимости статистики"
      description="Публичная статистика будет видна другим пользователям в вашем профиле. Приватная статистика доступна только вам."
    />
  </UCard>
</template>
