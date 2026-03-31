<script setup lang="ts">
  import { UButton } from '#components';

  defineProps<{
    full?: boolean;
  }>();

  const ProfileTabs = {
    GENERAL: 'general',
    SECURITY: 'security',
    SETTINGS: 'settings',
    STATISTICS: 'statistics',
    CONNECTIONS: 'connections',
  } as const;

  const ProfileTabItems = [
    {
      value: ProfileTabs.GENERAL,
      label: 'Общие',
      icon: 'tabler:user',
    },
    {
      value: ProfileTabs.SECURITY,
      label: 'Безопасность',
      icon: 'tabler:shield',
    },
    {
      value: ProfileTabs.SETTINGS,
      label: 'Настройки / Источники',
      icon: 'tabler:settings',
    },
    {
      value: ProfileTabs.STATISTICS,
      label: 'Статистика',
      icon: 'tabler:chart-bar',
      disabled: true,
    },
    {
      value: ProfileTabs.CONNECTIONS,
      label: 'Подключения',
      icon: 'tabler:plug-connected',
      disabled: true,
    },
  ];
</script>

<template>
  <UButton
    v-for="item in ProfileTabItems"
    :key="item.value"
    :label="item.label"
    :icon="item.icon"
    :to="`/user/profile/${item.value}`"
    :disabled="item.disabled"
    active-variant="solid"
    active-color="primary"
    variant="ghost"
    color="neutral"
    :size="full ? 'lg' : 'md'"
    :class="['shrink-0', { 'w-full': full }]"
  />
</template>
