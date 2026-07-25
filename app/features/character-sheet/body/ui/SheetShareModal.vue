<script setup lang="ts">
  import { useCharacterSheetShare } from '../../composables';
  import {
    SHEET_SHARE_LABELS,
    SHEET_SHARE_REVOKED_DESCRIPTION,
    SHEET_SHARE_REVOKED_TITLE,
  } from '../../model';

  // Идентификатор приходит пропом, а не из состояния листа: открывающий явно
  // называет лист, которым делится, и модалка не зависит от того, что лежит в
  // общем состоянии на момент её открытия.
  const props = defineProps<{
    sheetId: string;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const { isShared, shareUrl, isPending, enableShare, disableShare } =
    useCharacterSheetShare();

  const { copy, share } = useCopyAndShare();

  const toast = useToast();

  const hintText = computed(() =>
    isShared.value
      ? SHEET_SHARE_LABELS.enabledHint
      : SHEET_SHARE_LABELS.disabledHint,
  );

  /** Выдаёт ссылку на лист; ошибку показывает тостом сам композабл. */
  async function handleEnable(): Promise<void> {
    await enableShare(props.sheetId);
  }

  /** Отзывает ссылку и подтверждает это тостом — действие необратимо. */
  async function handleDisable(): Promise<void> {
    if (!(await disableShare(props.sheetId))) {
      return;
    }

    toast.add({
      title: SHEET_SHARE_REVOKED_TITLE,
      description: SHEET_SHARE_REVOKED_DESCRIPTION,
      color: 'success',
      icon: 'tabler:link-off',
    });
  }

  /**
   * Выделяет ссылку целиком при фокусе поля: она длиннее видимой части, и без
   * выделения скопировать её вручную неудобно.
   *
   * @param event событие фокуса поля со ссылкой.
   */
  function handleLinkFocus(event: FocusEvent): void {
    if (event.target instanceof HTMLInputElement) {
      event.target.select();
    }
  }

  /** Копирует ссылку в буфер обмена. */
  async function handleCopy(): Promise<void> {
    if (shareUrl.value) {
      await copy(shareUrl.value);
    }
  }

  /** Отдаёт ссылку в системный «Поделиться»; на десктопе — копирование. */
  async function handleShare(): Promise<void> {
    if (shareUrl.value) {
      await share(shareUrl.value);
    }
  }

  /** Закрытие модалки — доступ уже сохранён на сервере. */
  function handleClose(): void {
    emit('close');
  }
</script>

<template>
  <UModal :title="SHEET_SHARE_LABELS.title">
    <template #body>
      <div class="flex flex-col gap-4">
        <p class="text-sm text-toned">{{ hintText }}</p>

        <template v-if="isShared && shareUrl">
          <div class="flex flex-col gap-2">
            <span class="text-xs font-medium text-muted">
              {{ SHEET_SHARE_LABELS.linkTitle }}
            </span>

            <div class="flex items-center gap-2">
              <UInput
                :model-value="shareUrl"
                readonly
                class="grow"
                :ui="{ base: 'font-mono text-xs' }"
                :aria-label="SHEET_SHARE_LABELS.linkAriaLabel"
                @focus="handleLinkFocus"
              />

              <UTooltip :text="SHEET_SHARE_LABELS.copy">
                <UButton
                  icon="tabler:copy"
                  color="neutral"
                  variant="subtle"
                  square
                  :aria-label="SHEET_SHARE_LABELS.copy"
                  @click.left.exact.prevent="handleCopy"
                />
              </UTooltip>

              <UTooltip :text="SHEET_SHARE_LABELS.share">
                <UButton
                  icon="tabler:share"
                  color="neutral"
                  variant="subtle"
                  square
                  :aria-label="SHEET_SHARE_LABELS.share"
                  @click.left.exact.prevent="handleShare"
                />
              </UTooltip>
            </div>
          </div>

          <UAlert
            icon="tabler:eye"
            color="neutral"
            variant="subtle"
            :title="SHEET_SHARE_LABELS.viewerNoteTitle"
            :description="SHEET_SHARE_LABELS.viewerNoteDescription"
          />
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="SHEET_SHARE_LABELS.close"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleClose"
        />

        <UButton
          v-if="isShared"
          :label="SHEET_SHARE_LABELS.disable"
          color="error"
          variant="soft"
          icon="tabler:link-off"
          :loading="isPending"
          @click.left.exact.prevent="handleDisable"
        />

        <UButton
          v-else
          :label="SHEET_SHARE_LABELS.enable"
          color="primary"
          icon="tabler:link"
          :loading="isPending"
          @click.left.exact.prevent="handleEnable"
        />
      </div>
    </template>
  </UModal>
</template>
