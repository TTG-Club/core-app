<script setup lang="ts">
  /**
   * Настройка заклинательства класса: характеристика, Сл спасброска и бонус
   * атаки заклинанием — как окно заклинательства в VTTG.
   *
   * По правилам оба числа выводятся из характеристики и бонуса мастерства.
   * Здесь расчёт правится: своё число вместо него целиком либо свои бонусы
   * сверху — от характеристики, от мастерства или числом. Правки копятся в
   * черновике до «Применить»: числа в окне пересчитываются сразу, а лист узнаёт
   * о них только по кнопке.
   */
  import type {
    AbilityKey,
    CharacterSpellcastingSettings,
    SpellcastingValueDraft,
  } from '../../model';

  import { ACTION_LABELS } from '~/shared/consts';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_LABELS,
    ABILITY_OPTIONS,
    CUSTOM_BONUS_FORMAT_OPTIONS,
    getAbilityModifier,
    getCharacterClasses,
    getCharacterProficiencyBonus,
    getClassSpellcastingAbility,
    getSpellcastingRuleHint,
    getSpellcastingValues,
    SHEET_SPELLCASTING_MODAL_LABELS,
    SPELL_ATTACK_CUSTOM_MAX,
    SPELL_ATTACK_CUSTOM_MIN,
    SPELL_SAVE_DC_CUSTOM_MAX,
    SPELL_SAVE_DC_CUSTOM_MIN,
    SPELLCASTING_ABILITY_AUTO,
    SPELLCASTING_LABEL_SEPARATOR,
    SPELLCASTING_MODAL_TITLE,
    SPELLCASTING_STAT_LABELS,
    toSpellcastingValueDraft,
    toSpellcastingValueSettings,
  } from '../../model';
  import SheetCustomBonusRows from './SheetCustomBonusRows.vue';

  /** Выбор характеристики: своя либо «по классу». */
  type AbilityChoice = AbilityKey | typeof SPELLCASTING_ABILITY_AUTO;

  /** Ключ числа заклинательства. */
  type SpellcastingValueKey = keyof CharacterSpellcastingSettings;

  /** Раздел настройки одного числа: у Сл и у атаки устройство одно. */
  interface ValueSection {
    key: SpellcastingValueKey;
    title: string;
    draft: SpellcastingValueDraft;

    /** Подпись расчёта по правилам под галкой («По правилам: 13»). */
    ruleHint: string;

    /** Подпись поля своего числа для скринридера. */
    ariaLabel: string;

    /** Пределы своего числа. */
    min: number;
    max: number;

    /**
     * Формат поля своего числа: у Сл знака нет, бонус атаки прибавляется к
     * броску, и знак у него виден всегда.
     */
    formatOptions?: Intl.NumberFormatOptions;
  }

  const { sheetKey, classUrl } = defineProps<{
    /** Ключ открытого листа: с каким листом работает компонент. */
    sheetKey: string;

    /** Класс, чьё заклинательство настраивают. */
    classUrl: string;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setClassSpellcasting } = useCharacterSheet(sheetKey);

  /** Настраиваемый класс: у мультикласса заклинательство своё у каждого. */
  const targetClass = computed(
    () =>
      getCharacterClasses(character.value).find(
        (entry) => entry.url === classUrl,
      ) ?? null,
  );

  // Характеристика, определяемая по классу (режим «Авто»).
  const autoAbility = computed(() =>
    targetClass.value
      ? getClassSpellcastingAbility({
          ...targetClass.value,
          spellcastingAbility: null,
        })
      : null,
  );

  /**
   * Начальный черновик окна. Вынесено в функцию — читать `.value` computed'а
   * прямо в корне setup нельзя (`vue/no-ref-object-reactivity-loss`).
   *
   * @returns черновик характеристики и обоих чисел.
   */
  function createInitialDraft(): {
    ability: AbilityChoice;
    saveDc: SpellcastingValueDraft;
    attack: SpellcastingValueDraft;
  } {
    const storedAbility = targetClass.value?.spellcastingAbility ?? null;

    const settings = targetClass.value?.spellcastingSettings;

    const ruleValues = getSpellcastingValues(
      character.value,
      storedAbility ?? autoAbility.value,
    );

    return {
      ability: storedAbility ?? SPELLCASTING_ABILITY_AUTO,
      saveDc: toSpellcastingValueDraft(
        settings?.saveDc,
        ruleValues.saveDc.ruleValue,
      ),
      attack: toSpellcastingValueDraft(
        settings?.attack,
        ruleValues.attack.ruleValue,
      ),
    };
  }

  const draft = reactive(createInitialDraft());

  // Эффективная характеристика черновика: явная либо класс-производная.
  const effectiveAbility = computed<AbilityKey | null>(() =>
    draft.ability === SPELLCASTING_ABILITY_AUTO
      ? autoAbility.value
      : draft.ability,
  );

  const abilityOptions = computed<
    Array<{ label: string; value: AbilityChoice }>
  >(() => [
    {
      value: SPELLCASTING_ABILITY_AUTO,
      label: autoAbility.value
        ? `${SHEET_SPELLCASTING_MODAL_LABELS.autoByClassPrefix}${ABILITY_LABELS[autoAbility.value]}${SHEET_SPELLCASTING_MODAL_LABELS.autoByClassSuffix}`
        : SHEET_SPELLCASTING_MODAL_LABELS.autoByClass,
    },
    ...ABILITY_OPTIONS,
  ]);

  // Подсказка «характеристику задаёт класс» собирается здесь, а не в шаблоне:
  // подстановки подряд форматтер вправе разорвать переносом.
  const abilityHint = computed(() =>
    autoAbility.value
      ? `${SHEET_SPELLCASTING_MODAL_LABELS.byClassHintPrefix}${ABILITY_LABELS[autoAbility.value]}${SHEET_SPELLCASTING_MODAL_LABELS.byClassHintSuffix}`
      : SHEET_SPELLCASTING_MODAL_LABELS.noClassHint,
  );

  const draftSettings = computed<CharacterSpellcastingSettings>(() => ({
    saveDc: toSpellcastingValueSettings(draft.saveDc),
    attack: toSpellcastingValueSettings(draft.attack),
  }));

  // Те же числа, что покажет плитка вкладки: одна функция на всё — с
  // предметами, эффектами и истощением.
  const values = computed(() =>
    getSpellcastingValues(
      character.value,
      effectiveAbility.value,
      draftSettings.value,
    ),
  );

  const sections = computed<ValueSection[]>(() => [
    {
      key: 'saveDc',
      title: SPELLCASTING_STAT_LABELS.saveDc.full,
      draft: draft.saveDc,
      ruleHint: getSpellcastingRuleHint(values.value.saveDc, false),
      ariaLabel: `${SHEET_SPELLCASTING_MODAL_LABELS.customBaseValue}: ${SPELLCASTING_STAT_LABELS.saveDc.full}`,
      min: SPELL_SAVE_DC_CUSTOM_MIN,
      max: SPELL_SAVE_DC_CUSTOM_MAX,
    },
    {
      key: 'attack',
      title: SPELLCASTING_STAT_LABELS.attack.full,
      draft: draft.attack,
      ruleHint: getSpellcastingRuleHint(values.value.attack, true),
      ariaLabel: `${SHEET_SPELLCASTING_MODAL_LABELS.customBaseValue}: ${SPELLCASTING_STAT_LABELS.attack.full}`,
      min: SPELL_ATTACK_CUSTOM_MIN,
      max: SPELL_ATTACK_CUSTOM_MAX,
      formatOptions: CUSTOM_BONUS_FORMAT_OPTIONS,
    },
  ]);

  const abilityModifierLabel = computed(() => {
    if (!effectiveAbility.value) {
      return SHEET_SPELLCASTING_MODAL_LABELS.none;
    }

    return `${ABILITY_LABELS[effectiveAbility.value]}${SPELLCASTING_LABEL_SEPARATOR}${getFormattedBonus(
      getAbilityModifier(character.value, effectiveAbility.value),
    )}`;
  });

  const formattedProficiencyBonus = computed(() =>
    getFormattedBonus(getCharacterProficiencyBonus(character.value)),
  );

  /**
   * Прибавки предметов и эффектов к обоим числам; пусто — их нет. Без строки
   * игрок не понял бы, почему итог не сходится с основой и бонусами.
   */
  const effectBonusLabel = computed(() => {
    const { saveDc, attack } = values.value;

    if (!saveDc.effectBonus && !attack.effectBonus) {
      return '';
    }

    return [
      `${SPELLCASTING_STAT_LABELS.saveDc.short} ${getFormattedBonus(saveDc.effectBonus)}`,
      `${SPELLCASTING_STAT_LABELS.attack.short} ${getFormattedBonus(attack.effectBonus)}`,
    ].join(SPELLCASTING_LABEL_SEPARATOR);
  });

  /** Штраф истощения к атаке; пусто — штрафа нет. */
  const penaltyLabel = computed(() =>
    values.value.attack.penalty
      ? `${SPELLCASTING_STAT_LABELS.attack.short} ${getFormattedBonus(-values.value.attack.penalty)}`
      : '',
  );

  const formattedSaveDc = computed(() => String(values.value.saveDc.value));

  const formattedAttackBonus = computed(() =>
    getFormattedBonus(values.value.attack.value),
  );

  // У мультикласса окно открывается на конкретный класс — его и подписываем.
  const modalTitle = computed(() =>
    targetClass.value
      ? `${SPELLCASTING_MODAL_TITLE}: ${targetClass.value.name}`
      : SPELLCASTING_MODAL_TITLE,
  );

  /**
   * Галка своей основы. Чекбокс умеет и «неопределённое» состояние — для
   * основы оно ничего не значит, поэтому всё, кроме true, снимает галку.
   *
   * @param section раздел числа.
   * @param checked новое состояние галки.
   */
  function handleCustomBaseToggle(
    section: ValueSection,
    checked: boolean | 'indeterminate',
  ): void {
    section.draft.isCustomBase = checked === true;
  }

  function handleApply(): void {
    setClassSpellcasting(
      classUrl,
      draft.ability === SPELLCASTING_ABILITY_AUTO ? null : draft.ability,
      draftSettings.value,
    );

    emit('close');
  }

  /** Закрытие без правок: черновик пропадает вместе с окном. */
  function handleCancel(): void {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="modalTitle"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-sm text-toned">
            {{ SHEET_SPELLCASTING_MODAL_LABELS.ability }}
          </span>

          <USelect
            v-model="draft.ability"
            :items="abilityOptions"
            class="w-full sm:w-60"
          />
        </div>

        <p class="text-xs text-dimmed">
          {{ abilityHint }}
        </p>

        <!-- Сложность спасброска и атака: устройство у них одно, и разметка
          общая — расходиться этим двум блокам не с чего -->
        <div
          v-for="section in sections"
          :key="section.key"
          class="flex flex-col gap-3 border-t border-default/50 pt-3"
        >
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ section.title }}
          </span>

          <UCheckbox
            :model-value="section.draft.isCustomBase"
            :label="SHEET_SPELLCASTING_MODAL_LABELS.customBase"
            :description="section.ruleHint"
            @update:model-value="handleCustomBaseToggle(section, $event)"
          />

          <div
            v-if="section.draft.isCustomBase"
            class="flex items-center justify-between gap-4"
          >
            <span class="text-sm text-toned">
              {{ SHEET_SPELLCASTING_MODAL_LABELS.customBaseValue }}
            </span>

            <UInputNumber
              v-model="section.draft.base"
              :min="section.min"
              :max="section.max"
              :format-options="section.formatOptions"
              class="w-36 shrink-0"
              :aria-label="section.ariaLabel"
            />
          </div>

          <SheetCustomBonusRows
            v-model="section.draft.bonuses"
            :character="character"
          />
        </div>

        <USeparator />

        <div class="flex items-center justify-between gap-4 text-sm">
          <span class="text-toned">
            {{ SHEET_SPELLCASTING_MODAL_LABELS.abilityModifier }}
          </span>

          <span class="text-toned tabular-nums">{{
            abilityModifierLabel
          }}</span>
        </div>

        <div class="flex items-center justify-between gap-4 text-sm">
          <span class="text-toned">
            {{ SHEET_SPELLCASTING_MODAL_LABELS.proficiencyBonus }}
          </span>

          <span class="text-toned tabular-nums">
            {{ formattedProficiencyBonus }}
          </span>
        </div>

        <div
          v-if="effectBonusLabel"
          class="flex items-center justify-between gap-4 text-sm"
        >
          <span class="text-toned">
            {{ SHEET_SPELLCASTING_MODAL_LABELS.effectBonus }}
          </span>

          <span class="text-toned tabular-nums">{{ effectBonusLabel }}</span>
        </div>

        <div
          v-if="penaltyLabel"
          class="flex items-center justify-between gap-4 text-sm"
        >
          <span class="text-toned">
            {{ SHEET_SPELLCASTING_MODAL_LABELS.exhaustion }}
          </span>

          <span class="text-warning tabular-nums">{{ penaltyLabel }}</span>
        </div>

        <!-- Итоговые числа — ровно то, что покажет плитка вкладки: подписи
          полные, плитки модалки широкие -->
        <div class="grid grid-cols-2 gap-3">
          <div
            class="flex flex-col items-center gap-1 rounded-lg border border-default/50 bg-elevated/20 p-3"
          >
            <span
              class="text-center text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ SPELLCASTING_STAT_LABELS.saveDc.full }}
            </span>

            <span
              class="text-2xl leading-none font-bold text-highlighted tabular-nums"
            >
              {{ formattedSaveDc }}
            </span>
          </div>

          <div
            class="flex flex-col items-center gap-1 rounded-lg border border-default/50 bg-elevated/20 p-3"
          >
            <span
              class="text-center text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ SPELLCASTING_STAT_LABELS.attack.full }}
            </span>

            <span
              class="text-2xl leading-none font-bold text-highlighted tabular-nums"
            >
              {{ formattedAttackBonus }}
            </span>
          </div>
        </div>

        <p class="text-xs text-dimmed">
          {{ SHEET_SPELLCASTING_MODAL_LABELS.formulaHint }}
        </p>

        <p class="text-xs text-dimmed">
          {{ SHEET_SPELLCASTING_MODAL_LABELS.bonusesHint }}
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="ACTION_LABELS.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="ACTION_LABELS.apply"
          color="primary"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
