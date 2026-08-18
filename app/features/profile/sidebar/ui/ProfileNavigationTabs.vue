<script setup lang="ts">
  import { UButton } from '#components';
  import {
    MY_BUGS_NAVIGATION_LABEL,
    MY_BUGS_UPDATES_HINT,
  } from '~bug-report/model';
  import { useMyBugReportUpdates } from '~bug-report/my';
  import {
    MY_COMMENTS_NAVIGATION_LABEL,
    MY_COMMENTS_UPDATES_HINT,
  } from '~comments/model';
  import { useMyCommentUpdates } from '~comments/my';
  import { UpdatesDot } from '~ui/updates-dot';

  const props = defineProps<{
    full?: boolean;
  }>();

  const ProfileTabs = {
    GENERAL: 'general',
    ACTIVATION: 'activation',
    BUGS: 'bugs',
    COMMENTS: 'comments',
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
      value: ProfileTabs.COMMENTS,
      label: MY_COMMENTS_NAVIGATION_LABEL,
      icon: 'tabler:message-circle',
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

  const { hasUpdates: hasBugReportUpdates } = useMyBugReportUpdates();
  const { hasUpdates: hasCommentUpdates } = useMyCommentUpdates();

  // В сайдбаре вкладки растянуты на всю ширину и крупнее, в мобильной ленте —
  // компактные и по содержимому.
  const tabSize = computed(() => (props.full ? 'lg' : 'md'));

  const tabClass = computed(() => ['shrink-0', props.full ? 'w-full' : '']);

  /**
   * Непросмотренное бывает у баг-репортов и комментариев: точка и её подсказка
   * есть только у этих вкладок, у остальных карта ничего не вернёт.
   */
  const updatesByTab = computed<
    Partial<Record<string, { hasUpdates: boolean; hint: string }>>
  >(() => ({
    [ProfileTabs.BUGS]: {
      hasUpdates: hasBugReportUpdates.value,
      hint: MY_BUGS_UPDATES_HINT,
    },
    [ProfileTabs.COMMENTS]: {
      hasUpdates: hasCommentUpdates.value,
      hint: MY_COMMENTS_UPDATES_HINT,
    },
  }));

  const tabItems = computed(() =>
    ProfileTabItems.map((item) => ({
      ...item,
      updates: updatesByTab.value[item.value],
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
      v-if="item.updates?.hasUpdates"
      #trailing
    >
      <UpdatesDot :title="item.updates.hint" />
    </template>
  </UButton>
</template>
