<script setup lang="ts">
  import type {
    BugReportResponse,
    BugReportStatusUpdatePayload,
  } from '../../model';

  import { MODERATION_BUGS_ROUTE } from '~moderation/model';
  import { UiDetailPane } from '~ui/detail-pane';

  import {
    BUG_REPORT_TYPE_LABELS,
    BUG_REPORT_TYPE_QUERY_KEY,
    resolveBugReportType,
    toBugReportTypeQuery,
  } from '../../model';
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
  const reportShareUrl = computed(() => {
    // Пожелание открывается сразу во вкладке пожеланий
    const typeQuery = toBugReportTypeQuery(resolveBugReportType(bug.type));

    const typeParameter = typeQuery
      ? `${BUG_REPORT_TYPE_QUERY_KEY}=${typeQuery}&`
      : '';

    return `${getOrigin()}${MODERATION_BUGS_ROUTE}?${typeParameter}id=${bug.id}`;
  });

  /** Заголовок панели: тип записи и короткий ID. */
  const paneTitle = computed(
    () =>
      `${BUG_REPORT_TYPE_LABELS[resolveBugReportType(bug.type)]} #${bug.id.slice(0, 8)}`,
  );

  const emit = defineEmits<{
    /** Событие закрытия панели */
    'close': [];
    /** Событие обновления статуса */
    'update-status': [payload: BugReportStatusUpdatePayload];
    /** Событие смены типа записи */
    'update-type': [bugReport: BugReportResponse];
  }>();

  function handleClose(): void {
    emit('close');
  }

  function handleUpdateStatus(payload: BugReportStatusUpdatePayload): void {
    emit('update-status', payload);
  }

  function handleUpdateType(bugReport: BugReportResponse): void {
    emit('update-type', bugReport);
  }
</script>

<template>
  <UiDetailPane
    :title="paneTitle"
    :date-time="dateTime"
    :url="reportShareUrl"
    copy-title
    no-comments
    @close="handleClose"
  >
    <AdminBugReportDetail
      :bug-report="bug"
      @update-status="handleUpdateStatus"
      @update-type="handleUpdateType"
    />
  </UiDetailPane>
</template>
