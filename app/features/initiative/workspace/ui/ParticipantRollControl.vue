<script setup lang="ts">
  import type { TrackerParticipant } from '~initiative/model';

  import { clamp } from 'es-toolkit';

  import { isParticipantRolled, MAX_D20, MIN_D20 } from '~initiative/model';

  const { participant, disabled = false } = defineProps<{
    participant: TrackerParticipant;
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    'roll': [id: string];
    'set-roll': [id: string, roll: number];
  }>();

  const isOpen = ref(false);
  const rollDraft = ref(participant.initiativeRoll ?? MIN_D20);
  // Флаг «пользователь коснулся поля»: без него «ОК» без правки у ещё не
  // брошенного участника молча выставил бы бросок 1 (дефолт rollDraft).
  const isDraftDirty = ref(false);

  const isRolled = computed(() => isParticipantRolled(participant));

  const rollActionLabel = computed(() =>
    isRolled.value ? 'Перебросить' : 'Бросить (к20)',
  );

  // При открытии синхронизируем поле с текущим броском и сбрасываем «грязность».
  // Закрытый поповер draft не показывает, поэтому этого достаточно и для ресинка
  // после ответа сервера, и для отката после неуспешной мутации.
  watch(isOpen, (open) => {
    if (open) {
      rollDraft.value = participant.initiativeRoll ?? MIN_D20;
      isDraftDirty.value = false;
    }
  });

  function onDraftInput(value: number | null): void {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return;
    }

    rollDraft.value = value;
    isDraftDirty.value = true;
  }

  function rollRandom(): void {
    isOpen.value = false;
    emit('roll', participant.id);
  }

  function applyManual(): void {
    isOpen.value = false;

    // Нетронутое поле = не выставляем бросок (иначе «ОК» = бросок 1).
    if (!isDraftDirty.value) {
      return;
    }

    const clamped = clamp(rollDraft.value, MIN_D20, MAX_D20);

    if (clamped !== participant.initiativeRoll) {
      emit('set-roll', participant.id, clamped);
    }
  }
</script>

<template>
  <UPopover v-model:open="isOpen">
    <UButton
      icon="tabler:dice-5"
      color="primary"
      variant="soft"
      size="sm"
      :disabled
      aria-label="Бросок инициативы"
    />

    <template #content>
      <div class="flex w-56 flex-col gap-3 p-3">
        <UButton
          icon="tabler:dice-5"
          block
          @click.left.exact.prevent="rollRandom"
        >
          {{ rollActionLabel }}
        </UButton>

        <div class="flex items-center gap-2">
          <span class="shrink-0 text-xs text-secondary"> Или живые кости </span>

          <div class="h-px flex-1 bg-default" />
        </div>

        <div class="flex gap-2">
          <UInputNumber
            :model-value="rollDraft"
            :min="MIN_D20"
            :max="MAX_D20"
            class="flex-1"
            aria-label="Значение d20"
            @update:model-value="onDraftInput"
          />

          <UButton
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="applyManual"
          >
            ОК
          </UButton>
        </div>
      </div>
    </template>
  </UPopover>
</template>
