<script setup lang="ts">
  import type { TrackerParticipant } from '~initiative/model';

  import { MAX_PARTICIPANT_NAME_LENGTH } from '~initiative/model';

  const { participant, disabled = false } = defineProps<{
    participant: TrackerParticipant;
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    rename: [id: string, name: string];
  }>();

  const isOpen = ref(false);
  const nameDraft = ref(participant.name);

  // При открытии синхронизируем черновик с актуальным именем. Закрытый поповер
  // draft не показывает, поэтому этого достаточно и для ресинка после ответа
  // сервера, и для отката после неуспешной мутации.
  watch(isOpen, (open) => {
    if (open) {
      nameDraft.value = participant.name;
    }
  });

  function applyRename(): void {
    isOpen.value = false;

    const trimmed = nameDraft.value.trim();

    // Пустое или неизменённое имя — не мутация, просто закрываем поповер.
    if (!trimmed || trimmed === participant.name) {
      return;
    }

    emit('rename', participant.id, trimmed);
  }
</script>

<template>
  <UPopover v-model:open="isOpen">
    <UButton
      icon="tabler:pencil"
      color="neutral"
      variant="ghost"
      size="xs"
      :disabled
      aria-label="Переименовать участника"
    />

    <template #content>
      <form
        class="flex w-72 items-center gap-2 p-3"
        @submit.prevent="applyRename"
      >
        <UInput
          v-model="nameDraft"
          :maxlength="MAX_PARTICIPANT_NAME_LENGTH"
          class="min-w-0 flex-1"
          autofocus
          aria-label="Имя участника"
        />

        <UButton
          type="submit"
          color="neutral"
          variant="subtle"
        >
          ОК
        </UButton>
      </form>
    </template>
  </UPopover>
</template>
