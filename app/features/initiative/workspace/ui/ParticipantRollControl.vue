<script setup lang="ts">
  import type { TrackerParticipant } from '~initiative/model';

  import { clamp } from 'es-toolkit';

  import {
    isParticipantRolled,
    MAX_D20,
    MIN_D20,
    rollD20,
  } from '~initiative/model';

  import ParticipantStatTile from './ParticipantStatTile.vue';

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

  const totalDisplay = computed(() =>
    typeof participant.initiativeTotal === 'number'
      ? String(participant.initiativeTotal)
      : '—',
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

  /**
   * Бросок с преимуществом/помехой: две к20 на клиенте, берём больший или
   * меньший. Результат уходит как ручной бросок (PUT `initiativeRoll`) —
   * отдельного эндпоинта на бэке для этого не нужно.
   * @param pickBest true — преимущество (больший), false — помеха (меньший).
   */
  function rollPair(pickBest: boolean): void {
    isOpen.value = false;

    const firstRoll = rollD20();
    const secondRoll = rollD20();

    const value = pickBest
      ? Math.max(firstRoll, secondRoll)
      : Math.min(firstRoll, secondRoll);

    emit('set-roll', participant.id, value);
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
  <div class="w-full">
    <UPopover
      v-model:open="isOpen"
      class="w-full"
    >
      <!-- Триггер — сама плитка итога инициативы: клик по значению открывает
           попап броска, мини-кубик у подписи выдаёт кликабельность. -->
      <button
        type="button"
        class="w-full cursor-pointer rounded-lg transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        :disabled
        aria-label="Бросок инициативы"
      >
        <ParticipantStatTile
          label="Иниц."
          accent
          class="w-full transition-colors hover:bg-primary/20"
        >
          <template #label-icon>
            <UIcon
              name="tabler:dice-5"
              class="size-3"
            />
          </template>

          <span
            :key="totalDisplay"
            class="roll-total-pop"
          >
            {{ totalDisplay }}
          </span>
        </ParticipantStatTile>
      </button>

      <template #content>
        <div class="flex w-56 flex-col gap-3 p-3">
          <UButton
            icon="tabler:dice-5"
            block
            @click.left.exact.prevent="rollRandom"
          >
            {{ rollActionLabel }}
          </UButton>

          <!-- Преимущество/помеха: две к20 фоном, берётся больший/меньший. -->
          <div class="flex flex-col gap-2">
            <UButton
              icon="tabler:chevrons-up"
              color="success"
              variant="soft"
              block
              @click.left.exact.prevent="rollPair(true)"
            >
              С преимуществом
            </UButton>

            <UButton
              icon="tabler:chevrons-down"
              color="error"
              variant="soft"
              block
              @click.left.exact.prevent="rollPair(false)"
            >
              С помехой
            </UButton>
          </div>

          <div class="flex items-center gap-2">
            <span class="shrink-0 text-xs text-secondary">
              Или живые кости
            </span>

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
  </div>
</template>

<style scoped>
  @media (prefers-reduced-motion: no-preference) {
    .roll-total-pop {
      animation: roll-total-pop 450ms ease-out;
    }
  }

  @keyframes roll-total-pop {
    0% {
      transform: scale(0.3);
      opacity: 0;
    }

    60% {
      transform: scale(1.2);
      opacity: 1;
    }

    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
