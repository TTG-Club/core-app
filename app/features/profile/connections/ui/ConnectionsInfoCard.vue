<template>
  <UCard
    v-if="isDev"
    :ui="{ body: 'p-6' }"
  >
    <UAlert
      icon="tabler:plug-connected"
      color="neutral"
      variant="subtle"
      title="О подключениях"
      description="Подключите свои аккаунты в социальных сетях для быстрого входа и дополнительных возможностей."
    />
  </UCard>
</template>
