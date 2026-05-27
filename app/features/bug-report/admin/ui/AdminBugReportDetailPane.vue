<script setup lang="ts">
  import type { BugReportResponse, BugReportStatus } from '../../model';

  import { UiDetailPane } from '~ui/detail-pane';

  import { AdminBugReportDetail } from './';

  defineProps<{
    /** Выбранный баг-репорт */
    bug: BugReportResponse;
    /** Форматированное время для отображения */
    dateTime: string;
  }>();

  const emit = defineEmits<{
    /** Событие закрытия панели */
    'close': [];
    /** Событие обновления статуса */
    'update-status': [
      payload: {
        id: string;
        status: BugReportStatus;
        statusUpdatedAt: string;
      },
    ];
  }>();

  function handleClose(): void {
    emit('close');
  }

  function handleUpdateStatus(payload: {
    id: string;
    status: BugReportStatus;
    statusUpdatedAt: string;
  }): void {
    emit('update-status', payload);
  }
</script>

<template>
  <UiDetailPane
    :title="`Баг-репорт #${bug.id.slice(0, 8)}`"
    :date-time="dateTime"
    :url="bug.url"
    copy-title
    @close="handleClose"
  >
    <AdminBugReportDetail
      :bug-report="bug"
      @update-status="handleUpdateStatus"
    />
  </UiDetailPane>
</template>
