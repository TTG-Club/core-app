<script setup lang="ts">
  import type { RollMode } from '../../model';

  import { useDiceRollHandler } from '~dice-roller/composables';

  import {
    getCheckFormula,
    getFormattedBonus,
    ROLL_BONUS_MAX,
    ROLL_BONUS_MIN,
    ROLL_MODE_OPTIONS,
  } from '../../model';

  interface RollModeButton {
    value: RollMode;
    label: string;
    icon?: string;
    color: 'primary' | 'neutral';
    variant: 'soft' | 'outline';
  }

  const { actionLabel = 'Бросить проверку', ...props } = defineProps<{
    /** Заголовок модалки (например, «Проверка: Сила»). */
    title: string;

    /** Модификатор проверки. */
    modifier: number;

    /** Надпись на кнопке броска. */
    actionLabel?: string;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const { handleRoll } = useDiceRollHandler();

  const draftBonus = ref(0);

  const rollMode = ref<RollMode>('normal');

  const formula = computed(() =>
    getCheckFormula(props.modifier, rollMode.value, draftBonus.value),
  );

  const bonusHelp = computed(
    () =>
      `Модификатор проверки (${getFormattedBonus(props.modifier)}) уже учтён в формуле`,
  );

  const modeButtons = computed<RollModeButton[]>(() =>
    ROLL_MODE_OPTIONS.map((option) => ({
      ...option,
      color: option.value === rollMode.value ? 'primary' : 'neutral',
      variant: option.value === rollMode.value ? 'soft' : 'outline',
    })),
  );

  function handleModeSelect(mode: RollMode) {
    rollMode.value = mode;
  }

  function handleRollClick() {
    handleRoll(formula.value);
    emit('close');
  }
</script>

<template>
  <UModal :title="title">
    <template #body>
      <div class="flex flex-col gap-4">
        <div
          class="flex flex-col items-center gap-1 rounded-lg bg-elevated/40 p-4"
        >
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            Формула
          </span>

          <span class="font-mono text-2xl font-bold text-highlighted">
            {{ formula }}
          </span>
        </div>

        <UFormField
          label="Доп. бонус"
          :help="bonusHelp"
        >
          <UInputNumber
            v-model="draftBonus"
            :min="ROLL_BONUS_MIN"
            :max="ROLL_BONUS_MAX"
            class="w-full"
          />
        </UFormField>

        <div class="flex flex-col gap-2">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            Режим броска
          </span>

          <div class="grid grid-cols-3 gap-2">
            <UButton
              v-for="modeButton in modeButtons"
              :key="modeButton.value"
              :label="modeButton.label"
              :icon="modeButton.icon"
              :color="modeButton.color"
              :variant="modeButton.variant"
              block
              @click.left.exact.prevent="handleModeSelect(modeButton.value)"
            />
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton
        :label="actionLabel"
        icon="ttg:dice-outline-d20"
        color="primary"
        size="lg"
        block
        @click.left.exact.prevent="handleRollClick"
      />
    </template>
  </UModal>
</template>
