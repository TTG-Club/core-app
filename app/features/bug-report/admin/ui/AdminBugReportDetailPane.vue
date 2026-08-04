<script setup lang="ts">
  import type {
    BugReportResponse,
    BugReportStatusUpdatePayload,
  } from '../../model';

  import { MODERATION_BUGS_ROUTE } from '~moderation/model';
  import { UiDetailPane } from '~ui/detail-pane';

  import { AdminBugReportDetail } from './';

  const { bug } = defineProps<{
    /** Выбранный баг-репорт */
    bug: BugReportResponse;
    /** Форматированное время для отображения */
    dateTime: string;
  }>();

  /**
   * Абсолютная ссылка на сам баг-репорт в панели модератора, чтобы её можно
   * было скинуть другому админу. НЕ путать с `bug.url` — тот указывает на
   * страницу, где нашли ошибку (показывается отдельно в теле панели).
   */
  const reportShareUrl = computed(
    () => `${getOrigin()}${MODERATION_BUGS_ROUTE}?id=${bug.id}`,
  );

  const emit = defineEmits<{
    /** Событие закрытия панели */
    'close': [];
    /** Событие обновления статуса */
    'update-status': [payload: BugReportStatusUpdatePayload];
  }>();

  function handleClose(): void {
    emit('close');
  }

  function handleUpdateStatus(payload: BugReportStatusUpdatePayload): void {
    emit('update-status', payload);
  }
</script>

<template>
  <UiDetailPane
    :title="`Баг-репорт #${bug.id.slice(0, 8)}`"
    :date-time="dateTime"
    :url="reportShareUrl"
    copy-title
    no-comments
    @close="handleClose"
  >
    <AdminBugReportDetail
      :bug-report="bug"
      @update-status="handleUpdateStatus"
    />
  </UiDetailPane>
</template>
