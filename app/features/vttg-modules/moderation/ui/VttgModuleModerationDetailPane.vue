<script setup lang="ts">
  import type { ModuleSubmission } from '../../model';

  import { UiDetailPane } from '~ui/detail-pane';
  import { UserAvatar } from '~ui/user-avatar';

  import { useVttgGameSystems } from '../../composables';
  import {
    APPROVE_ICON,
    APPROVE_LABEL,
    canApproveSubmission,
    canRejectSubmission,
    CARD_DATE_FORMAT,
    CARD_MANIFEST_LABEL,
    CARD_MODERATOR_COMMENT_LABEL,
    CARD_SYNCED_PREFIX,
    formatManifest,
    getModuleVersionLabel,
    getSubmissionAuthorLabel,
    getSubmissionLinks,
    isSubmissionInCatalog,
    REJECT_ICON,
    REJECT_LABEL,
    TAKE_DOWN_LABEL,
  } from '../../model';
  import { VttgModuleStatusBadge } from '../../ui';

  /**
   * Карточка заявки для модератора: всё, что нужно для решения, и само
   * решение. Одна и та же стоит справа в широком режиме и в выезжающей
   * панели в обычном.
   */
  const { submission, busy = false } = defineProps<{
    submission: ModuleSubmission;
    /** Идёт решение по заявке — кнопки ждут. */
    busy?: boolean;
  }>();

  const emit = defineEmits<{
    close: [];
    approve: [submissionId: string];
    reject: [submission: ModuleSubmission];
  }>();

  const { format } = useDayjs();
  const { getSystemNames } = useVttgGameSystems();

  const moduleVersion = computed(() => getModuleVersionLabel(submission));

  const authorLabel = computed(() => getSubmissionAuthorLabel(submission));

  const systemNames = computed(() => getSystemNames(submission.systemIds));

  const links = computed(() => getSubmissionLinks(submission));

  const syncedAt = computed(
    () =>
      `${CARD_SYNCED_PREFIX} ${format(submission.module.syncedAt, CARD_DATE_FORMAT)}`,
  );

  const moderatorComment = computed(
    () => submission.moderation?.comment ?? null,
  );

  const manifestText = computed(() =>
    formatManifest(submission.module.manifest),
  );

  const canApprove = computed(() => canApproveSubmission(submission.status));
  const canReject = computed(() => canRejectSubmission(submission.status));
  const hasActions = computed(() => canApprove.value || canReject.value);

  const rejectLabel = computed(() =>
    isSubmissionInCatalog(submission.status) ? TAKE_DOWN_LABEL : REJECT_LABEL,
  );

  /** Закрывает карточку. */
  function close(): void {
    emit('close');
  }

  /** Просит одобрить заявку. */
  function approve(): void {
    emit('approve', submission.id);
  }

  /** Просит отклонить заявку или снять модуль из каталога. */
  function reject(): void {
    emit('reject', submission);
  }
</script>

<template>
  <UiDetailPane
    :title="submission.module.name"
    :date-time="submission.createdAt"
    :date-time-format="CARD_DATE_FORMAT"
    no-comments
    @close="close"
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <VttgModuleStatusBadge :status="submission.status" />

        <span class="font-mono text-sm text-muted">{{ moduleVersion }}</span>
      </div>

      <div
        v-if="hasActions"
        class="flex flex-wrap gap-2"
      >
        <UButton
          v-if="canApprove"
          :icon="APPROVE_ICON"
          size="md"
          color="success"
          :disabled="busy"
          @click.left.exact.prevent="approve"
        >
          {{ APPROVE_LABEL }}
        </UButton>

        <UButton
          v-if="canReject"
          :icon="REJECT_ICON"
          size="md"
          color="error"
          variant="soft"
          :disabled="busy"
          @click.left.exact.prevent="reject"
        >
          {{ rejectLabel }}
        </UButton>
      </div>

      <UAlert
        v-if="moderatorComment"
        :title="CARD_MODERATOR_COMMENT_LABEL"
        :description="moderatorComment"
        color="neutral"
        variant="subtle"
      />

      <p class="text-sm leading-6 whitespace-pre-line text-default">
        {{ submission.description }}
      </p>

      <div class="flex flex-wrap gap-1">
        <UBadge
          v-for="systemName in systemNames"
          :key="systemName"
          color="neutral"
          variant="outline"
          size="md"
        >
          {{ systemName }}
        </UBadge>
      </div>

      <div class="flex flex-wrap gap-x-4 gap-y-1">
        <ULink
          v-for="link in links"
          :key="link.label"
          :to="link.to"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-sm"
        >
          <UIcon :name="link.icon" />

          {{ link.label }}
        </ULink>
      </div>

      <div class="flex items-center gap-2 text-sm text-muted">
        <UserAvatar
          :user-id="submission.authorId"
          :name="submission.authorName"
          size="xs"
        />

        <span class="truncate">{{ authorLabel }}</span>
      </div>

      <figure
        class="flex min-w-0 flex-col overflow-hidden rounded-md border border-default bg-elevated/50"
      >
        <figcaption
          class="flex flex-wrap items-center justify-between gap-x-3 border-b border-default px-3 py-2 text-xs text-muted"
        >
          <span class="font-mono">{{ CARD_MANIFEST_LABEL }}</span>

          <span>{{ syncedAt }}</span>
        </figcaption>

        <pre
          class="overflow-x-auto px-3 py-2 font-mono text-xs leading-5 text-highlighted"
        ><code>{{ manifestText }}</code></pre>
      </figure>
    </div>
  </UiDetailPane>
</template>
