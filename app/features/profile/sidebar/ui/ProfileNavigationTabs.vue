<script setup lang="ts">
  import { UButton } from '#components';
  import {
    MY_BUGS_NAVIGATION_LABEL,
    MY_BUGS_UPDATES_HINT,
  } from '~bug-report/model';
  import { useMyBugReportUpdates } from '~bug-report/my';
  import { UpdatesDot } from '~ui/updates-dot';

  const props = defineProps<{
    full?: boolean;
  }>();

  const ProfileTabs = {
    GENERAL: 'general',
    ACTIVATION: 'activation',
    BUGS: 'bugs',
    SECURITY: 'security',
    SETTINGS: 'settings',
  } as const;

  const ProfileTabItems = [
    {
      value: ProfileTabs.GENERAL,
      label: 'Общие',
      icon: 'tabler:user',
    },
    {
      value: ProfileTabs.ACTIVATION,
      label: 'Подписка / Коды',
      icon: 'tabler:ticket',
    },
    {
      value: ProfileTabs.BUGS,
      label: MY_BUGS_NAVIGATION_LABEL,
      icon: 'tabler:bug',
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
  ];

  const { hasUpdates } = useMyBugReportUpdates();

  // В сайдбаре вкладки растянуты на всю ширину и крупнее, в мобильной ленте —
  // компактные и по содержимому.
  const tabSize = computed(() => (props.full ? 'lg' : 'md'));

  const tabClass = computed(() => ['shrink-0', props.full ? 'w-full' : '']);

  // Непросмотренное бывает только у баг-репортов: у остальных вкладок точки нет.
  const tabItems = computed(() =>
    ProfileTabItems.map((item) => ({
      ...item,
      hasUpdates: item.value === ProfileTabs.BUGS && hasUpdates.value,
    })),
  );
</script>

<template>
  <UButton
    v-for="item in tabItems"
    :key="item.value"
    :label="item.label"
    :icon="item.icon"
    :to="`/user/profile/${item.value}`"
    active-variant="solid"
    active-color="primary"
    variant="ghost"
    color="neutral"
    :size="tabSize"
    :class="tabClass"
  >
    <template
      v-if="item.hasUpdates"
      #trailing
    >
      <UpdatesDot :title="MY_BUGS_UPDATES_HINT" />
    </template>
  </UButton>
</template>
