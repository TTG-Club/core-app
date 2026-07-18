<script setup lang="ts">
  import { useCommentSubmitCooldown } from '../../composables';
  import { COMMENT_CONTENT_MAX_LENGTH } from '../../model';

  const {
    submitAction,
    initialContent = '',
    placeholder = 'Написать комментарий…',
    submitLabel = 'Отправить',
    cancellable = false,
    autofocus = false,
    withCooldown = true,
  } = defineProps<{
    /** Асинхронная отправка текста; true — успех, форма очищается. */
    submitAction: (content: string) => Promise<boolean>;
    initialContent?: string;
    placeholder?: string;
    submitLabel?: string;
    /** Показывать ли кнопку «Отмена» (формы ответа и правки). */
    cancellable?: boolean;
    autofocus?: boolean;
    /**
     * Подчиняется ли форма антиспам-паузе между отправками. Отключается
     * у формы правки: лимит сервиса действует только на создание.
     */
    withCooldown?: boolean;
  }>();

  const emit = defineEmits<{
    /** Текст успешно отправлен — родитель может закрыть форму. */
    done: [];
    cancel: [];
  }>();

  const content = ref(initialContent);
  const isPending = ref(false);

  const normalizedContent = computed(() => content.value.trim());

  const isTooLong = computed(
    () => normalizedContent.value.length > COMMENT_CONTENT_MAX_LENGTH,
  );

  const { remainingSeconds, isCoolingDown } = useCommentSubmitCooldown();

  /** Действует ли на форму антиспам-пауза прямо сейчас. */
  const isCooldownActive = computed(() => withCooldown && isCoolingDown.value);

  const canSubmit = computed(
    () =>
      !!normalizedContent.value
      && !isTooLong.value
      && !isPending.value
      && !isCooldownActive.value,
  );

  /** Во время паузы кнопка показывает отсчёт до следующей отправки. */
  const submitButtonLabel = computed(() =>
    isCooldownActive.value
      ? `${submitLabel} · ${remainingSeconds.value} с`
      : submitLabel,
  );

  const lengthLabel = computed(
    () => `${normalizedContent.value.length} / ${COMMENT_CONTENT_MAX_LENGTH}`,
  );

  const lengthLabelClass = computed(() =>
    isTooLong.value ? 'text-error' : 'text-dimmed',
  );

  async function submit(): Promise<void> {
    if (!canSubmit.value) {
      return;
    }

    isPending.value = true;

    try {
      const success = await submitAction(normalizedContent.value);

      if (success) {
        content.value = '';
        emit('done');
      }
    } finally {
      isPending.value = false;
    }
  }

  function cancel(): void {
    emit('cancel');
  }

  /**
   * Enter отправляет сообщение, Shift+Enter — перенос строки.
   * Во время набора через IME Enter подтверждает ввод, а не отправляет.
   */
  function handleKeydown(keyboardEvent: KeyboardEvent): void {
    if (
      keyboardEvent.key !== 'Enter'
      || keyboardEvent.shiftKey
      || keyboardEvent.isComposing
    ) {
      return;
    }

    keyboardEvent.preventDefault();
    void submit();
  }

  function handleSubmitClick(): void {
    void submit();
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <UTextarea
      v-model="content"
      autoresize
      :rows="2"
      :maxrows="8"
      :placeholder
      :autofocus
      :disabled="isPending"
      @keydown="handleKeydown"
    />

    <div class="flex items-center justify-between gap-2">
      <span
        class="text-xs tabular-nums"
        :class="lengthLabelClass"
      >
        {{ lengthLabel }}
      </span>

      <div class="flex items-center gap-2">
        <UButton
          v-if="cancellable"
          variant="ghost"
          color="neutral"
          size="sm"
          :disabled="isPending"
          @click.left.exact.prevent="cancel"
        >
          Отмена
        </UButton>

        <UButton
          icon="tabler:send-2"
          size="sm"
          :loading="isPending"
          :disabled="!canSubmit"
          @click.left.exact.prevent="handleSubmitClick"
        >
          {{ submitButtonLabel }}
        </UButton>
      </div>
    </div>
  </div>
</template>
