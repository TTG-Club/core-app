<script setup lang="ts">
  import type {
    AbilityKey,
    DamageDiceGroup,
    DamageRollResult,
    DamageRollSource,
    SpellHealing,
  } from '../../model';

  import { useDiceRollHandler } from '~dice-roller/composables';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_LABELS,
    addDamageDice,
    CANTRIP_SPELL_LEVEL,
    DAMAGE_DICE_COUNT_MAX,
    DAMAGE_DICE_GROUPS_MAX,
    DAMAGE_ROLL_ACTION_LABEL,
    DAMAGE_ROLL_DICE_COUNT_MIN,
    DEFAULT_DAMAGE_DICE_FACES,
    EMPTY_SPELL_UPCAST_BONUS,
    getAbilityModifier,
    getDamageFormula,
    getSpellSlotLevelLabel,
    getSpellUpcastBonus,
    getSpellUpcastHelp,
    getSpellUpcastHint,
    getSpellUpcastSlotLevels,
    INVENTORY_STAT_HINT_LABELS,
    parseDamageNotation,
    ROLL_ABILITY_AUTO,
    ROLL_ABILITY_OPTIONS,
    ROLL_BONUS_MAX,
    ROLL_BONUS_MIN,
    ROLL_DICE_FACES_OPTIONS,
    SHEET_DAMAGE_MODAL_LABELS,
    SHEET_HEAL_MODAL_LABELS,
  } from '../../model';

  const props = withDefaults(
    defineProps<{
      /** Ключ открытого листа: с каким листом работает компонент. */
      sheetKey: string;

      /** Заголовок модалки (например, «Урон: Длинный меч»). */
      title: string;

      /** Разбор броска урона: кости, бонусы и характеристика по отдельности. */
      damage: DamageRollSource;

      /** Надпись на кнопке броска. */
      actionLabel?: string;

      /**
       * Бросок лечит, а не ранит: окно подписано лечением и предлагает
       * прибавить выпавшее к хитам листа; null — бросок урона.
       */
      healing?: SpellHealing | null;

      /**
       * Круг заклинания: окно даёт выбрать свободную ячейку этого круга или
       * выше; null — бросок не тратит ячеек (оружие).
       */
      spellLevel?: number | null;

      /** Прибавка за каждый круг ячейки выше круга заклинания («2к8»). */
      upcastNotation?: string | null;
    }>(),
    {
      actionLabel: DAMAGE_ROLL_ACTION_LABEL,
      healing: null,
      spellLevel: null,
      upcastNotation: null,
    },
  );

  const emit = defineEmits<{
    /** Закрытие модалки; итог есть — бросок сделан, а не отменён. */
    close: [result?: DamageRollResult];
  }>();

  const { handleRoll } = useDiceRollHandler();

  // Модификатор характеристики считается по листу: в справочнике и в оружии
  // лежит только то, сколько раз он входит в урон.
  const { character, isReadonly, spellSlotRows } = useCharacterSheet(
    props.sheetKey,
  );

  // Ячейку тратит только заклинание с кругом: заговор и оружие — нет
  const castSpellLevel = computed(() =>
    props.spellLevel !== null && props.spellLevel > CANTRIP_SPELL_LEVEL
      ? props.spellLevel
      : null,
  );

  // Круги со свободной ячейкой не ниже круга заклинания; пусто — ячеек нет
  // или класс их не даёт: тогда выбирать нечего, и трата решится как раньше
  const slotLevelOptions = computed(() =>
    castSpellLevel.value === null
      ? []
      : getSpellUpcastSlotLevels(spellSlotRows.value, castSpellLevel.value).map(
          (level) => ({
            label: getSpellSlotLevelLabel(level),
            value: level,
          }),
        ),
  );

  const hasSlotLevelChoice = computed(() => slotLevelOptions.value.length > 0);

  /**
   * Ячейка, выбранная при открытии окна: круг заклинания, а если он исчерпан —
   * первая свободная выше, чтобы бросок не упёрся в пустой круг. Дальше выбор
   * за игроком: окно живёт до закрытия.
   *
   * @returns круг ячейки; undefined — бросок без ячейки (оружие, заговор).
   */
  function getInitialSlotLevel(): number | undefined {
    const spellLevel = castSpellLevel.value;

    if (spellLevel === null) {
      return undefined;
    }

    const levels = slotLevelOptions.value.map((option) => option.value);

    return levels.includes(spellLevel) ? spellLevel : (levels[0] ?? spellLevel);
  }

  const draftSlotLevel = ref(getInitialSlotLevel());

  const upcastBonus = computed(() =>
    castSpellLevel.value === null || draftSlotLevel.value === undefined
      ? EMPTY_SPELL_UPCAST_BONUS
      : getSpellUpcastBonus(
          props.upcastNotation,
          draftSlotLevel.value - castSpellLevel.value,
        ),
  );

  const slotLevelHelp = computed(() =>
    castSpellLevel.value === null
      ? ''
      : getSpellUpcastHelp(props.upcastNotation, castSpellLevel.value),
  );

  const healLabels = computed(() =>
    props.healing ? SHEET_HEAL_MODAL_LABELS[props.healing.kind] : null,
  );

  const rollActionLabel = computed(
    () => healLabels.value?.action ?? props.actionLabel,
  );

  const diceLabel = computed(() =>
    props.healing
      ? SHEET_DAMAGE_MODAL_LABELS.healDice
      : SHEET_DAMAGE_MODAL_LABELS.dice,
  );

  // Чужой лист открыт на просмотр: хиты в нём не меняются, и галочка ни к чему
  const applyToSelfLabels = computed(() =>
    isReadonly.value ? null : healLabels.value,
  );

  // Лечение «на себя» прибавляется сразу; лечение другого существа — только
  // если игрок сам отметит, что лечит себя
  const isAppliedToSelf = ref(props.healing?.isSelfTargeted ?? false);

  /**
   * Смена галочки «прибавить к своим хитам»: неопределённого состояния у неё
   * не бывает, поэтому всё, кроме `true`, — снятая галочка.
   *
   * @param value новое значение галочки.
   */
  function handleApplyToSelfChange(value: boolean | 'indeterminate') {
    isAppliedToSelf.value = value === true;
  }

  const baseNotation = parseDamageNotation(props.damage.diceNotation);

  // Кости правятся игроком: их можно поменять и докинуть лишнюю кость бонусом
  // от мастера. Черновик живёт до закрытия — оверлей размонтирует модалку.
  const diceGroups = ref<DamageDiceGroup[]>(baseNotation.dice);

  const draftBonus = ref(0);

  // Прибавки «по применению» выключены, пока игрок не отметит: идут они не в
  // каждый удар, а условие («в свой ход действием Атака») лист не проверит.
  const enabledRiderIds = shallowRef<string[]>([]);

  const enabledRiders = computed(() =>
    props.damage.riders.filter((rider) =>
      enabledRiderIds.value.includes(rider.id),
    ),
  );

  const ridersBonus = computed(() =>
    enabledRiders.value.reduce((total, rider) => total + rider.bonus, 0),
  );

  /** Подписи галочек: название эффекта с величиной прибавки. */
  const riderOptions = computed(() =>
    props.damage.riders.map((rider) => ({
      id: rider.id,
      label: `${rider.name} ${getFormattedBonus(rider.bonus)}`,
      description: rider.description,
    })),
  );

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
      + props.damage.effectBonus
      + ridersBonus.value
      + props.damage.abilityModifierCount * abilityModifier.value,
  );

  // Усиление ячейки складывается с костями игрока только в формуле: поля
  // костей остаются его правкой, а прибавка меняется вместе с выбором ячейки
  const formula = computed(() =>
    getDamageFormula(
      addDamageDice(diceGroups.value, upcastBonus.value.dice),
      baseBonus.value + draftBonus.value + upcastBonus.value.flatBonus,
    ),
  );

  /** Слагаемые базового броска для подписи под формулой. */
  const baseHint = computed(() => {
    const baseParts = [props.damage.diceNotation];

    if (props.damage.flatBonus !== 0) {
      baseParts.push(`оружие ${getFormattedBonus(props.damage.flatBonus)}`);
    }

    if (props.damage.effectBonus !== 0) {
      baseParts.push(
        `${INVENTORY_STAT_HINT_LABELS.effects} ${getFormattedBonus(props.damage.effectBonus)}`,
      );
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

    for (const rider of enabledRiders.value) {
      baseParts.push(`${rider.name} ${getFormattedBonus(rider.bonus)}`);
    }

    const upcastHint =
      draftSlotLevel.value === undefined
        ? ''
        : getSpellUpcastHint(draftSlotLevel.value, upcastBonus.value);

    if (upcastHint) {
      baseParts.push(upcastHint);
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
    const total = handleRoll(formula.value);

    emit('close', {
      total,
      isAppliedToSelf:
        applyToSelfLabels.value !== null && isAppliedToSelf.value,
      slotLevel: draftSlotLevel.value ?? null,
    });
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
            {{ SHEET_DAMAGE_MODAL_LABELS.formula }}
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
            {{ diceLabel }}
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
              :aria-label="SHEET_DAMAGE_MODAL_LABELS.removeDie"
              @click.left.exact.prevent="handleDiceRemove(diceIndex)"
            />
          </div>

          <UButton
            :label="SHEET_DAMAGE_MODAL_LABELS.addDie"
            icon="tabler:plus"
            color="neutral"
            variant="outline"
            :disabled="!canAddDice"
            block
            @click.left.exact.prevent="handleDiceAdd"
          />
        </div>

        <div
          v-if="riderOptions.length"
          class="flex flex-col gap-2"
        >
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ SHEET_DAMAGE_MODAL_LABELS.riders }}
          </span>

          <UCheckboxGroup
            v-model="enabledRiderIds"
            :items="riderOptions"
            value-key="id"
          />
        </div>

        <UFormField
          v-if="hasSlotLevelChoice"
          :label="SHEET_DAMAGE_MODAL_LABELS.slotLevel"
          :help="slotLevelHelp"
        >
          <USelect
            v-model="draftSlotLevel"
            :items="slotLevelOptions"
            class="w-full"
          />
        </UFormField>

        <UCheckbox
          v-if="applyToSelfLabels"
          :model-value="isAppliedToSelf"
          :label="applyToSelfLabels.applyToSelf"
          :description="applyToSelfLabels.applyHint"
          @update:model-value="handleApplyToSelfChange"
        />

        <!-- Настройки броска идут одним рядом; без селекта характеристики
          «Доп. бонус» занимает ряд целиком -->
        <div class="flex flex-col gap-4 sm:flex-row">
          <UFormField
            v-if="canSwapAbility"
            :label="SHEET_DAMAGE_MODAL_LABELS.ability"
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
            :label="SHEET_DAMAGE_MODAL_LABELS.bonus"
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
        :label="rollActionLabel"
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
