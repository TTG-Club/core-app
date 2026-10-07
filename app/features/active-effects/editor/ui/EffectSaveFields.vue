<script
  setup
  lang="ts"
  generic="
    Save extends Pick<
      EffectTriggerSave,
      'ability' | 'dc' | 'dcFormula' | 'altAbilities'
    >
  "
>
  import type {
    EffectAbility,
    EffectFormLayout,
    EffectTriggerSave,
  } from '../../model';

  import { InfoTooltip } from '~ui/tooltip';

  import {
    EFFECT_ABILITY_OPTIONS,
    EFFECT_APPLIER_DC_LABELS,
    EFFECT_SAVE_STEP_LABELS,
    layoutAcceptsApplierSaveDc,
    normalizeAltAbilities,
  } from '../../model';
  import EffectSaveDcField from './EffectSaveDcField.vue';

  /**
   * Поля спасброска: характеристика и Сл, у которой «Авто» есть там, где у Сл
   * есть источник, а «Формулой» — везде. Одни и те же у спасброска эффекта и
   * у спасброска строки срабатывания: меняются характеристика, число и
   * формула, остальные поля спасброска (исход при успехе, режим) переносятся
   * как есть. Характеристики на выбор бросающего показываются там, где VTTG их
   * читает, — им задают подпись.
   */
  const {
    layout,
    applierSaveDc = undefined,
    acceptsDamage = false,
    altAbilitiesLabel = undefined,
  } = defineProps<{
    /** Раскладка формы: можно ли подставить Сл источника и чья она. */
    layout: EffectFormLayout;
    /** Сл источника для «Авто», если форма её знает. */
    applierSaveDc?: number;
    /** Подпись поля характеристики. */
    abilityLabel: string;
    /** Подпись поля Сл. */
    saveDcLabel: string;
    /** Есть ли у события урон — токен `@damage` в формуле Сл. */
    acceptsDamage?: boolean;
    /**
     * Подпись поля «или характеристика»: задана — спасбросок можно бросать
     * одной из нескольких характеристик («Силы или Ловкости»).
     */
    altAbilitiesLabel?: string;
  }>();

  /** Спасбросок: поля заменяют его целиком при каждой правке. */
  const save = defineModel<Save>('save', { required: true });

  const acceptsApplierSaveDc = computed(() =>
    layoutAcceptsApplierSaveDc(layout),
  );

  const applierDcLabel = computed(
    () => EFFECT_APPLIER_DC_LABELS[layout.context],
  );

  // Основная характеристика не может быть ещё и «на выбор»: она уходит из
  // списка вместе со сменой
  const saveAbility = computed({
    get: () => save.value.ability,
    set: (nextAbility: EffectAbility) => {
      save.value = {
        ...save.value,
        ability: nextAbility,
        altAbilities: normalizeAltAbilities(
          nextAbility,
          save.value.altAbilities ?? [],
        ),
      };
    },
  });

  /** Характеристики на выбор — все, кроме основной. */
  const altAbilityItems = computed(() =>
    EFFECT_ABILITY_OPTIONS.filter(
      (ability) => ability.value !== save.value.ability,
    ),
  );

  // Пустой список в данных не пишется
  const saveAltAbilities = computed({
    get: () => save.value.altAbilities ?? [],
    set: (pickedAbilities: EffectAbility[]) => {
      save.value = {
        ...save.value,
        altAbilities: normalizeAltAbilities(
          save.value.ability,
          pickedAbilities,
        ),
      };
    },
  });

  const saveDc = computed({
    get: () => save.value.dc,
    set: (nextSaveDc: number) => {
      save.value = { ...save.value, dc: nextSaveDc };
    },
  });

  const saveDcFormula = computed({
    get: () => save.value.dcFormula,
    set: (nextFormula: string | undefined) => {
      save.value = { ...save.value, dcFormula: nextFormula };
    },
  });
</script>

<template>
  <UFormField
    :label="abilityLabel"
    class="w-48"
  >
    <USelect
      v-model="saveAbility"
      :items="EFFECT_ABILITY_OPTIONS"
      value-key="value"
      size="sm"
      class="w-full"
    />
  </UFormField>

  <UFormField
    v-if="altAbilitiesLabel"
    class="w-full sm:w-80"
  >
    <template #label>
      <InfoTooltip
        :text="EFFECT_SAVE_STEP_LABELS.altAbilitiesHint"
        icon="tabler:info-circle-filled"
      >
        <span>{{ altAbilitiesLabel }}</span>
      </InfoTooltip>
    </template>

    <USelectMenu
      v-model="saveAltAbilities"
      :items="altAbilityItems"
      value-key="value"
      label-key="label"
      multiple
      :search-input="false"
      :placeholder="EFFECT_SAVE_STEP_LABELS.altAbilitiesPlaceholder"
      size="sm"
      class="w-full"
    />
  </UFormField>

  <EffectSaveDcField
    v-model="saveDc"
    v-model:formula="saveDcFormula"
    formula-allowed
    :accepts-damage="acceptsDamage"
    :label="saveDcLabel"
    :auto-allowed="acceptsApplierSaveDc"
    :auto-label="applierDcLabel"
    :auto-value="applierSaveDc"
  />
</template>
