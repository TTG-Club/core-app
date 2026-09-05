<script setup lang="ts">
  import type { CopyGameSessionRequest, GameSession } from '../../model';

  import {
    CANCEL_LABEL,
    fromLocalDateTimeInput,
    getDefaultSessionStart,
    SESSION_COPY_DESCRIPTION,
    SESSION_COPY_LABEL,
    SESSION_COPY_TITLE,
    SESSION_COPY_TITLE_PLACEHOLDER,
    SESSION_STARTS_AT_LABEL,
    SESSION_TIMEZONE_HINT_PREFIX,
    SESSION_TITLE_LABEL,
    SESSION_TITLE_MAX_LENGTH,
  } from '../../model';

  const isOpen = defineModel<boolean>('open', { required: true });

  const { source, loading = false } = defineProps<{
    /** Сессия-источник; `null` — окно закрыто. */
    source: GameSession | null;
    loading?: boolean;
  }>();

  const emit = defineEmits<{
    submit: [sourceSessionId: string, request: CopyGameSessionRequest];
  }>();

  const title = ref('');
  const startsAt = ref('');

  const startsAtIso = computed(() => fromLocalDateTimeInput(startsAt.value));

  // Игроки читают время в своём поясе, поэтому мастеру показывается его
  // собственный: иначе «17:00» каждый понимает по-своему.
  const { $dayjs } = useDayjs();

  const timezoneHint = computed(
    () => `${SESSION_TIMEZONE_HINT_PREFIX} (UTC${$dayjs().format('Z')})`,
  );

  const isValid = computed(() => !!startsAtIso.value);

  /** Закрывает окно без копирования. */
  function cancel(): void {
    isOpen.value = false;
  }

  /**
   * Копирует сессию. Название необязательно: без него сервис сохраняет
   * название исходной сессии.
   */
  function submit(): void {
    if (!source || !startsAtIso.value) {
      return;
    }

    const request: CopyGameSessionRequest = { startsAt: startsAtIso.value };
    const trimmedTitle = title.value.trim();

    if (trimmedTitle) {
      request.title = trimmedTitle;
    }

    emit('submit', source.id, request);
  }

  // Поля чистятся на каждом открытии: иначе дата прошлой копии подставится в
  // следующую.
  watch(isOpen, (opened) => {
    if (opened) {
      title.value = '';
      startsAt.value = getDefaultSessionStart();
    }
  });
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="SESSION_COPY_TITLE"
    :description="SESSION_COPY_DESCRIPTION"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField :label="SESSION_TITLE_LABEL">
          <UInput
            v-model="title"
            :maxlength="SESSION_TITLE_MAX_LENGTH"
            :placeholder="source?.title || SESSION_COPY_TITLE_PLACEHOLDER"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="SESSION_STARTS_AT_LABEL"
          :hint="timezoneHint"
          required
        >
          <UInput
            v-model="startsAt"
            type="datetime-local"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          :disabled="loading"
          :label="CANCEL_LABEL"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          icon="tabler:copy"
          :loading="loading"
          :disabled="!isValid"
          :label="SESSION_COPY_LABEL"
          @click.left.exact.prevent="submit"
        />
      </div>
    </template>
  </UModal>
</template>
