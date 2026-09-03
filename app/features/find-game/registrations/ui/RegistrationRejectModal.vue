<script setup lang="ts">
  import type { GameRegistration } from '../../model';

  import {
    CANCEL_LABEL,
    REGISTRATION_EXCLUDE_LABEL,
    REGISTRATION_EXCLUDE_TITLE,
    REGISTRATION_REASON_HINT,
    REGISTRATION_REASON_LABEL,
    REGISTRATION_REASON_MAX_LENGTH,
    REGISTRATION_REASON_PLACEHOLDER,
    REGISTRATION_REJECT_LABEL,
    REGISTRATION_REJECT_TITLE,
  } from '../../model';

  /**
   * Отказ по заявке с необязательной причиной.
   *
   * Причина спрашивается отдельным окном, а не полем в строке списка: писать
   * её мастер будет редко, а место в строке она занимала бы всегда.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { registration, playerName } = defineProps<{
    /** Заявка, по которой отказывают; `null` — окно закрыто. */
    registration: GameRegistration | null;
    /** Отображаемое имя игрока; сырой UUID показывать нельзя. */
    playerName: string;
    loading?: boolean;
  }>();

  const emit = defineEmits<{
    submit: [registrationId: string, reason: string];
  }>();

  const reason = ref('');

  // Принятого игрока не отклоняют, а исключают: он уже в составе, и окно
  // должно говорить именно об этом.
  const isExclude = computed(() => registration?.status === 'APPROVED');

  const title = computed(() =>
    isExclude.value ? REGISTRATION_EXCLUDE_TITLE : REGISTRATION_REJECT_TITLE,
  );

  const submitLabel = computed(() =>
    isExclude.value ? REGISTRATION_EXCLUDE_LABEL : REGISTRATION_REJECT_LABEL,
  );

  // Окно переиспользуется для всех заявок, поэтому прошлый текст стирается на
  // каждое открытие: чужая причина в чужом отказе — худшая из подсказок.
  watch(isOpen, (opened) => {
    if (opened) {
      reason.value = '';
    }
  });

  /** Отправляет решение мастера. */
  function submit(): void {
    if (registration) {
      emit('submit', registration.id, reason.value.trim());
    }
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :description="playerName"
  >
    <template #body>
      <UFormField
        :label="REGISTRATION_REASON_LABEL"
        :hint="REGISTRATION_REASON_HINT"
      >
        <UTextarea
          v-model="reason"
          autoresize
          :rows="3"
          :maxlength="REGISTRATION_REASON_MAX_LENGTH"
          :placeholder="REGISTRATION_REASON_PLACEHOLDER"
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
          @click.left.exact.prevent="isOpen = false"
        />

        <UButton
          color="error"
          icon="tabler:user-minus"
          :loading="loading"
          :label="submitLabel"
          @click.left.exact.prevent="submit"
        />
      </div>
    </template>
  </UModal>
</template>
