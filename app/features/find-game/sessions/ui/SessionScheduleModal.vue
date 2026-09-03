<script setup lang="ts">
  import type { GameSession } from '../../model';

  import {
    CANCEL_LABEL,
    fromLocalDateTimeInput,
    getDefaultSessionStart,
    SESSION_SCHEDULE_DESCRIPTION,
    SESSION_SCHEDULE_LABEL,
    SESSION_SCHEDULE_TITLE,
    SESSION_STARTS_AT_LABEL,
    SESSION_TIMEZONE_HINT_PREFIX,
  } from '../../model';

  const isOpen = defineModel<boolean>('open', { required: true });

  const { session, loading = false } = defineProps<{
    /** Сессия, которой назначается дата; `null` — окно закрыто. */
    session: GameSession | null;
    loading?: boolean;
  }>();

  const emit = defineEmits<{
    submit: [sessionId: string, startsAt: string];
  }>();

  const startsAt = ref('');

  const startsAtIso = computed(() => fromLocalDateTimeInput(startsAt.value));

  const { $dayjs } = useDayjs();

  // То же, что и в форме сессии: игроки читают время в своём поясе.
  const timezoneHint = computed(
    () => `${SESSION_TIMEZONE_HINT_PREFIX} (UTC${$dayjs().format('Z')})`,
  );

  const isValid = computed(() => !!startsAtIso.value);

  /** Закрывает окно, не назначая дату. */
  function cancel(): void {
    isOpen.value = false;
  }

  /** Назначает дату сессии. */
  function submit(): void {
    if (!session || !startsAtIso.value) {
      return;
    }

    emit('submit', session.id, startsAtIso.value);
  }

  // Поле чистится на каждом открытии: иначе дата прошлой сессии подставится
  // в следующую.
  watch(isOpen, (opened) => {
    if (opened) {
      startsAt.value = getDefaultSessionStart();
    }
  });
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="SESSION_SCHEDULE_TITLE"
    :description="SESSION_SCHEDULE_DESCRIPTION"
  >
    <template #body>
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
          icon="tabler:calendar-plus"
          :loading="loading"
          :disabled="!isValid"
          :label="SESSION_SCHEDULE_LABEL"
          @click.left.exact.prevent="submit"
        />
      </div>
    </template>
  </UModal>
</template>
