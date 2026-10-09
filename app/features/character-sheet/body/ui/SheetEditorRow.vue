<script setup lang="ts">
  import type { SheetEditor } from '../../model';

  import { SHEET_EDITORS_LABELS } from '../../model';

  /**
   * Строка запроса на редактирование или выданного права — у владельца листа:
   * в баннере запросов и в модалке «Поделиться». Решение принимает хозяин
   * строки, она лишь сообщает, какую кнопку нажали.
   */
  const {
    editor,
    canApprove = true,
    disabled = false,
  } = defineProps<{
    editor: SheetEditor;

    /** Место для нового редактора есть — запрос можно разрешить. */
    canApprove?: boolean;

    /** Заблокировать кнопки, пока идёт решение по другой строке. */
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    approve: [editorId: string];
    remove: [editorId: string];
  }>();

  const isPendingRequest = computed(() => editor.status === 'PENDING');

  const avatarSource = computed(() => editor.avatarUrl ?? undefined);

  const statusLabel = computed(() =>
    isPendingRequest.value
      ? SHEET_EDITORS_LABELS.pendingBadge
      : SHEET_EDITORS_LABELS.editorBadge,
  );

  const statusColor = computed(() =>
    isPendingRequest.value ? 'warning' : 'primary',
  );

  // Причина недоступности — в подсказке: серая кнопка без неё выглядит поломкой.
  const approveTooltip = computed(() =>
    canApprove
      ? SHEET_EDITORS_LABELS.approve
      : SHEET_EDITORS_LABELS.limitReached,
  );

  const isApproveDisabled = computed(() => disabled || !canApprove);

  /** Разрешить правки по запросу. */
  function handleApprove(): void {
    emit('approve', editor.id);
  }

  /** Отклонить запрос или отозвать выданное право. */
  function handleRemove(): void {
    emit('remove', editor.id);
  }
</script>

<template>
  <div class="flex items-center gap-3">
    <UAvatar
      :src="avatarSource"
      :alt="editor.displayName"
      size="md"
      :ui="{ fallback: 'uppercase' }"
    />

    <div class="flex min-w-0 flex-auto flex-col gap-0.5">
      <span class="truncate text-sm font-medium text-highlighted">
        {{ editor.displayName }}
      </span>

      <UBadge
        :label="statusLabel"
        :color="statusColor"
        variant="subtle"
        size="sm"
        class="self-start"
      />
    </div>

    <div class="flex shrink-0 items-center gap-1">
      <template v-if="isPendingRequest">
        <UTooltip :text="approveTooltip">
          <UButton
            :label="SHEET_EDITORS_LABELS.approve"
            icon="tabler:user-check"
            color="primary"
            variant="soft"
            size="sm"
            :disabled="isApproveDisabled"
            @click.left.exact.prevent="handleApprove"
          />
        </UTooltip>

        <UButton
          :label="SHEET_EDITORS_LABELS.decline"
          icon="tabler:user-x"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled
          @click.left.exact.prevent="handleRemove"
        />
      </template>

      <UButton
        v-else
        :label="SHEET_EDITORS_LABELS.revoke"
        icon="tabler:user-x"
        color="error"
        variant="ghost"
        size="sm"
        :disabled
        @click.left.exact.prevent="handleRemove"
      />
    </div>
  </div>
</template>
