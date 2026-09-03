<script setup lang="ts">
  import type { AbilityKey, RollMode } from '../../model';

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
  } from '../../model';

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

      /** Чем бросают: оружие, навык, характеристика. Уходит в чат комнаты. */
      subject?: string;

      /** Что за бросок: «Атака», «Проверка навыка». Уходит в чат комнаты. */
      kind?: string;

      /**
       * Режим броска по правилам — им модалка открывается (помеха тяжёлого
       * оружия). Игрок волен переключить его сам.
       */
      mode?: RollMode;
    }>(),
    {
      actionLabel: ROLL_CHECK_ACTION_LABEL,
      mode: DEFAULT_ROLL_MODE,
      subject: undefined,
      kind: undefined,
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
    handleRoll(formula.value, { subject: props.subject, label: props.kind });
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

        <!-- Настройки броска идут одним рядом; на узком экране колонки
          складываются друг под друга -->
        <div class="flex flex-col gap-4 sm:flex-row">
          <UFormField
            label="Характеристика"
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
            label="Кость"
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
            label="Доп. бонус"
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
