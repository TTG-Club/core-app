<script setup lang="ts">
  import type { AbilityKey, RollMode } from '../../model';

  import { EFFECT_CONDITION_OPTIONS } from '~active-effects/model';
  import { useDiceRollHandler } from '~dice-roller/composables';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_LABELS,
    DEFAULT_ROLL_DICE_FACES,
    DEFAULT_ROLL_MODE,
    DICE_NOTATION_LETTER,
    getCheckFormula,
    getSwappedRollModifier,
    ROLL_ABILITY_AUTO,
    ROLL_ABILITY_OPTIONS,
    ROLL_BONUS_MAX,
    ROLL_BONUS_MIN,
    ROLL_CHECK_ACTION_LABEL,
    ROLL_DICE_FACES_OPTIONS,
    ROLL_MODE_OPTIONS,
    SHEET_ROLL_MODAL_LABELS,
  } from '../../model';

  /** Источник спасброска, названный игроком. */
  interface SheetRollSource {
    /** Спасбросок вызван заклинанием или иным магическим эффектом. */
    againstMagic: boolean;

    /** Состояние, которого спасбросок позволяет избежать; null — не выбрано. */
    condition: string | null;
  }

  interface RollModeButton {
    value: RollMode;
    label: string;
    icon?: string;
    color: 'primary' | 'neutral';
    variant: 'soft' | 'outline';
  }

  const props = withDefaults(
    defineProps<{
      /** Заголовок модалки (например, «Проверка: Сила»). */
      title: string;

      /** Модификатор проверки по правилам. */
      modifier: number;

      /** Характеристика, от которой бросок идёт по правилам. */
      ability: AbilityKey;

      /** Надпись на кнопке броска. */
      actionLabel?: string;

      /**
       * Режим броска по правилам — им модалка открывается (помеха тяжёлого
       * оружия). Игрок волен переключить его сам.
       */
      mode?: RollMode;

      /**
       * Пересчёт режима по названному источнику спасброска.
       *
       * Задан — модалка спрашивает, от чего спасаемся: лист источника не знает,
       * а без него не срабатывают ни «против магии» мантии, ни преимущество
       * вида против состояния. Не задан — строки нет, и это обычная проверка.
       */
      resolveMode?: (source: SheetRollSource) => RollMode;
    }>(),
    {
      actionLabel: ROLL_CHECK_ACTION_LABEL,
      mode: DEFAULT_ROLL_MODE,
      resolveMode: undefined,
    },
  );

  const emit = defineEmits<{
    close: [];
  }>();

  const { handleRoll } = useDiceRollHandler();

  // Подмена характеристики считается по значениям листа, а не по переданному
  // модификатору: в нём уже сложены мастерство и владение, их трогать нельзя.
  const { character } = useCharacterSheet();

  const draftBonus = ref(0);

  const rollMode = ref<RollMode>(props.mode);

  // Черновики живут только пока модалка открыта: оверлей размонтирует её после
  // закрытия, поэтому следующий бросок снова начинается с «Авто» и к20.
  const draftAbility = ref<AbilityKey | typeof ROLL_ABILITY_AUTO>(
    ROLL_ABILITY_AUTO,
  );

  const draftDiceFaces = ref(DEFAULT_ROLL_DICE_FACES);

  const draftAgainstMagic = ref(false);

  const draftCondition = ref<string | null>(null);

  /** Варианты состояний с пунктом «не выбрано»: спасбросок бывает и ни от чего. */
  const conditionOptions = [
    { value: '', label: 'Не выбрано' },
    ...EFFECT_CONDITION_OPTIONS.map((condition) => ({
      value: condition.value,
      label: condition.label,
    })),
  ];

  const draftConditionValue = computed({
    get: () => draftCondition.value ?? '',
    set: (value: string) => {
      draftCondition.value = value || null;
    },
  });

  // Источник называет игрок, поэтому режим пересчитывается по нему, а не берётся
  // из пропа: до ответа лист не знает, «против магии» этот спасбросок или от яда
  watch([draftAgainstMagic, draftCondition], () => {
    const resolve = props.resolveMode;

    if (!resolve) {
      return;
    }

    rollMode.value = resolve({
      againstMagic: draftAgainstMagic.value,
      condition: draftCondition.value,
    });
  });

  const modifier = computed(() =>
    draftAbility.value === ROLL_ABILITY_AUTO
      ? props.modifier
      : getSwappedRollModifier(
          character.value,
          props.modifier,
          props.ability,
          draftAbility.value,
        ),
  );

  const formula = computed(() =>
    getCheckFormula(
      modifier.value,
      rollMode.value,
      draftBonus.value,
      draftDiceFaces.value,
    ),
  );

  // Поля стоят в ряд, поэтому подсказки под ними короткие: длинные фразы
  // растянули бы соседние колонки по высоте.
  const abilityHelp = computed(
    () => `По правилам — ${ABILITY_LABELS[props.ability]}`,
  );

  const diceHelp = `По умолчанию — ${DICE_NOTATION_LETTER}${DEFAULT_ROLL_DICE_FACES}`;

  const bonusHelp = computed(
    () => `Модификатор (${getFormattedBonus(modifier.value)}) уже в формуле`,
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
            {{ SHEET_ROLL_MODAL_LABELS.formula }}
          </span>

          <span class="font-mono text-2xl font-bold text-highlighted">
            {{ formula }}
          </span>
        </div>

        <!-- Настройки броска идут одним рядом; на узком экране колонки
          складываются друг под друга -->
        <div class="flex flex-col gap-4 sm:flex-row">
          <UFormField
            :label="SHEET_ROLL_MODAL_LABELS.ability"
            :help="abilityHelp"
            class="min-w-0 flex-1"
          >
            <USelect
              v-model="draftAbility"
              :items="ROLL_ABILITY_OPTIONS"
              class="w-full"
            />
          </UFormField>

          <UFormField
            :label="SHEET_ROLL_MODAL_LABELS.dice"
            :help="diceHelp"
            class="min-w-0 flex-1"
          >
            <USelect
              v-model="draftDiceFaces"
              :items="ROLL_DICE_FACES_OPTIONS"
              class="w-full"
            />
          </UFormField>

          <UFormField
            :label="SHEET_ROLL_MODAL_LABELS.bonus"
            :help="bonusHelp"
            class="min-w-0 flex-1"
          >
            <UInputNumber
              v-model="draftBonus"
              :min="ROLL_BONUS_MIN"
              :max="ROLL_BONUS_MAX"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Источник спасброска: лист его не знает, поэтому спрашивает —
          от этого зависят «против магии» и преимущество против состояния -->
        <div
          v-if="resolveMode"
          class="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <UFormField
            :label="SHEET_ROLL_MODAL_LABELS.condition"
            :help="SHEET_ROLL_MODAL_LABELS.conditionHelp"
            class="min-w-0 flex-1"
          >
            <USelect
              v-model="draftConditionValue"
              :items="conditionOptions"
              class="w-full"
            />
          </UFormField>

          <UFormField
            :label="SHEET_ROLL_MODAL_LABELS.againstMagic"
            :help="SHEET_ROLL_MODAL_LABELS.againstMagicHelp"
            class="min-w-0 flex-1"
          >
            <USwitch
              v-model="draftAgainstMagic"
              :label="SHEET_ROLL_MODAL_LABELS.magicSource"
            />
          </UFormField>
        </div>

        <div class="flex flex-col gap-2">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ SHEET_ROLL_MODAL_LABELS.mode }}
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
