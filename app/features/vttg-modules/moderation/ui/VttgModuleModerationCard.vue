<script setup lang="ts">
  import type { ModuleSubmission } from '../../model';

  import { UserAvatar } from '~ui/user-avatar';

  import {
    APPROVE_ICON,
    APPROVE_LABEL,
    canApproveSubmission,
    canRejectSubmission,
    formatManifest,
    isSubmissionInCatalog,
    MANIFEST_HIDE_LABEL,
    MANIFEST_SHOW_LABEL,
    MODERATION_AUTHOR_PREFIX,
    REJECT_ICON,
    REJECT_LABEL,
    TAKE_DOWN_LABEL,
  } from '../../model';
  import { VttgModuleSummary } from '../../ui';

  /**
   * Заявка в очереди модератора: кто подал и что лежит в манифесте.
   */
  const { submission, busy = false } = defineProps<{
    submission: ModuleSubmission;
    /** Идёт решение по одной из заявок — кнопки ждут. */
    busy?: boolean;
  }>();

  const emit = defineEmits<{
    approve: [submissionId: string];
    reject: [submission: ModuleSubmission];
  }>();

  const isManifestOpen = ref(false);

  const authorLabel = computed(
    () =>
      `${MODERATION_AUTHOR_PREFIX}: ${submission.authorName ?? submission.authorId}`,
  );

  const manifestText = computed(() =>
    formatManifest(submission.module.manifest),
  );

  const canApprove = computed(() => canApproveSubmission(submission.status));
  const canReject = computed(() => canRejectSubmission(submission.status));

  const rejectLabel = computed(() =>
    isSubmissionInCatalog(submission.status) ? TAKE_DOWN_LABEL : REJECT_LABEL,
  );

  const manifestToggleLabel = computed(() =>
    isManifestOpen.value ? MANIFEST_HIDE_LABEL : MANIFEST_SHOW_LABEL,
  );

  /** Разворачивает или сворачивает манифест. */
  function toggleManifest(): void {
    isManifestOpen.value = !isManifestOpen.value;
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
  <VttgModuleSummary :submission>
    <template #extra>
      <div class="flex items-center gap-2 text-sm text-muted">
        <UserAvatar
          :user-id="submission.authorId"
          :name="submission.authorName"
          size="xs"
        />

        <span class="truncate">{{ authorLabel }}</span>
      </div>

      <div>
        <UButton
          size="md"
          variant="link"
          color="neutral"
          :label="manifestToggleLabel"
          @click.left.exact.prevent="toggleManifest"
        />

        <pre
          v-if="isManifestOpen"
          class="mt-2 max-h-80 overflow-auto rounded-md bg-elevated p-3 text-xs"
          >{{ manifestText }}</pre
        >
      </div>
    </template>

    <template #actions>
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
    </template>
  </VttgModuleSummary>
</template>
