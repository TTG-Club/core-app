<script setup lang="ts">
  import type {
    AbilityKey,
    DamageDiceGroup,
    DamageRollSource,
  } from '../../model';

  import { useDiceRollHandler } from '~dice-roller/composables';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_LABELS,
    DAMAGE_DICE_COUNT_MAX,
    DAMAGE_DICE_GROUPS_MAX,
    DAMAGE_ROLL_ACTION_LABEL,
    DAMAGE_ROLL_DICE_COUNT_MIN,
    DEFAULT_DAMAGE_DICE_FACES,
    getAbilityModifier,
    getDamageFormula,
    getFormattedBonus,
    parseDamageNotation,
    ROLL_ABILITY_AUTO,
    ROLL_ABILITY_OPTIONS,
    ROLL_BONUS_MAX,
    ROLL_BONUS_MIN,
    ROLL_DICE_FACES_OPTIONS,
  } from '../../model';

  const props = withDefaults(
    defineProps<{
      /** Заголовок модалки (например, «Урон: Длинный меч»). */
      title: string;

      /** Разбор броска урона: кости, бонусы и характеристика по отдельности. */
      damage: DamageRollSource;

      /** Надпись на кнопке броска. */
      actionLabel?: string;
    }>(),
    {
      actionLabel: DAMAGE_ROLL_ACTION_LABEL,
    },
  );

  const emit = defineEmits<{
    /** Закрытие модалки; `true` — бросок сделан, а не отменён. */
    close: [rolled?: boolean];
  }>();

  const { handleRoll } = useDiceRollHandler();

  // Модификатор характеристики считается по листу: в справочнике и в оружии
  // лежит только то, сколько раз он входит в урон.
  const { character } = useCharacterSheet();

  const baseNotation = parseDamageNotation(props.damage.diceNotation);

  // Кости правятся игроком: их можно поменять и докинуть лишнюю кость бонусом
  // от мастера. Черновик живёт до закрытия — оверлей размонтирует модалку.
  const diceGroups = ref<DamageDiceGroup[]>(baseNotation.dice);

  const draftBonus = ref(0);

  const draftAbility = ref<AbilityKey | typeof ROLL_ABILITY_AUTO>(
    ROLL_ABILITY_AUTO,
  );

  // Подменять нечего, если модификатор характеристики в урон не входит: у
  // заклинаний без тега `mod.spell` и у оружия без характеристики.
  const canSwapAbility = computed(
    () =>
      props.damage.ability !== null && props.damage.abilityModifierCount > 0,
  );

  const abilityKey = computed<AbilityKey | null>(() =>
    draftAbility.value === ROLL_ABILITY_AUTO
      ? props.damage.ability
      : draftAbility.value,
  );

  const abilityModifier = computed(() =>
    abilityKey.value
      ? getAbilityModifier(character.value, abilityKey.value)
      : 0,
  );

  /** Бонус базового броска: плоские слагаемые формулы плюс характеристика. */
  const baseBonus = computed(
    () =>
      baseNotation.flatBonus
      + props.damage.flatBonus
      + props.damage.abilityModifierCount * abilityModifier.value,
  );

  const formula = computed(() =>
    getDamageFormula(diceGroups.value, baseBonus.value + draftBonus.value),
  );

  /** Слагаемые базового броска для подписи под формулой. */
  const baseHint = computed(() => {
    const baseParts = [props.damage.diceNotation];

    if (props.damage.flatBonus !== 0) {
      baseParts.push(`оружие ${getFormattedBonus(props.damage.flatBonus)}`);
    }

    if (abilityKey.value && props.damage.abilityModifierCount > 0) {
      const repeat =
        props.damage.abilityModifierCount > 1
          ? ` ×${props.damage.abilityModifierCount}`
          : '';

      baseParts.push(
        `${ABILITY_LABELS[abilityKey.value]} ${getFormattedBonus(abilityModifier.value)}${repeat}`,
      );
    }

    const typePart = props.damage.typeLabel
      ? ` · ${props.damage.typeLabel}`
      : '';

    return `Основа: ${baseParts.join(' + ')}${typePart}`;
  });

  // Поля стоят в ряд, поэтому подсказки под ними короткие: длинные фразы
  // растянули бы соседнюю колонку по высоте.
  const abilityHelp = computed(() =>
    props.damage.ability
      ? `По правилам — ${ABILITY_LABELS[props.damage.ability]}`
      : '',
  );

  const bonusHelp = computed(
    () => `Модификатор (${getFormattedBonus(baseBonus.value)}) уже в формуле`,
  );

  const canAddDice = computed(
    () => diceGroups.value.length < DAMAGE_DICE_GROUPS_MAX,
  );

  // Последнюю кость убрать нельзя: без неё урон перестал бы быть броском.
  const canRemoveDice = computed(() => diceGroups.value.length > 1);

  const isRollDisabled = computed(() => !formula.value);

  /** Добавление кости бонусом: номинал потом меняется селектом. */
  function handleDiceAdd() {
    diceGroups.value = [
      ...diceGroups.value,
      { count: 1, faces: DEFAULT_DAMAGE_DICE_FACES },
    ];
  }

  function handleDiceRemove(diceIndex: number) {
    diceGroups.value = diceGroups.value.filter(
      (_, index) => index !== diceIndex,
    );
  }

  function handleRollClick() {
    handleRoll(formula.value);
    emit('close', true);
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

          <span class="text-center text-xs text-muted">
            {{ baseHint }}
          </span>
        </div>

        <div class="flex flex-col gap-2">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            Кости урона
          </span>

          <div
            v-for="(diceGroup, diceIndex) in diceGroups"
            :key="diceIndex"
            class="flex items-center gap-2"
          >
            <UInputNumber
              v-model="diceGroup.count"
              :min="DAMAGE_ROLL_DICE_COUNT_MIN"
              :max="DAMAGE_DICE_COUNT_MAX"
              class="w-32"
            />

            <USelect
              v-model="diceGroup.faces"
              :items="ROLL_DICE_FACES_OPTIONS"
              class="flex-1"
            />

            <UButton
              icon="tabler:trash"
              color="neutral"
              variant="ghost"
              :disabled="!canRemoveDice"
              aria-label="Убрать кость урона"
              @click.left.exact.prevent="handleDiceRemove(diceIndex)"
            />
          </div>

          <UButton
            label="Добавить кость"
            icon="tabler:plus"
            color="neutral"
            variant="outline"
            :disabled="!canAddDice"
            block
            @click.left.exact.prevent="handleDiceAdd"
          />
        </div>

        <!-- Настройки броска идут одним рядом; без селекта характеристики
          «Доп. бонус» занимает ряд целиком -->
        <div class="flex flex-col gap-4 sm:flex-row">
          <UFormField
            v-if="canSwapAbility"
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
      </div>
    </template>

    <template #footer>
      <UButton
        :label="actionLabel"
        icon="ttg:dice-outline-d20"
        color="primary"
        size="lg"
        :disabled="isRollDisabled"
        block
        @click.left.exact.prevent="handleRollClick"
      />
    </template>
  </UModal>
</template>
