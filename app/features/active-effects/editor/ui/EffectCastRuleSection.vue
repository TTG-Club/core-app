<script setup lang="ts">
  import type {
    ActiveEffect,
    CastRuleComponentChoice,
    CastRuleSave,
    EffectCastRule,
    EffectFormLayout,
  } from '../../model';

  import { InfoTooltip } from '~ui/tooltip';

  import {
    ACTIVE_EFFECT_FORM_LABELS,
    CAST_RULE_ANY_COMPONENT,
    CAST_RULE_COMPONENT_OPTIONS,
    castRuleHasFailure,
    createDefaultEffectSave,
    EFFECT_CAST_RULE_LABELS,
    MAX_CAST_FAIL_CHANCE,
    MAX_SPELL_SLOT_LEVEL,
    MIN_CAST_FAIL_CHANCE,
    MIN_SPELL_SLOT_LEVEL,
    NEW_CAST_RULE_SAVE_ABILITY,
  } from '../../model';
  import EffectSaveFields from './EffectSaveFields.vue';

  /**
   * Раздел «Правило каста»: что мешает носителю колдовать, пока эффект на нём,
   * — лимит круга ячейки («не может использовать ячейки 7-го круга и выше») и
   * провал каста шансом («Замедление»: 25 % у заклинаний с соматическим
   * компонентом) или спасброском заклинателя («Слово силы: Боль»).
   *
   * Запреты без чисел — «нельзя вовсе», «нельзя школу», «нельзя действие
   * Магия» — лежат особыми правилами в списке флагов.
   */
  const { layout, applierSaveDc = undefined } = defineProps<{
    /** Раскладка формы. */
    layout: EffectFormLayout;
    /** Сл источника для «Авто», если форма её знает. */
    applierSaveDc?: number;
  }>();

  const effect = defineModel<ActiveEffect>('effect', { required: true });

  /** Правило в полях раздела; раздел выключен — пустое правило. */
  const castRule = computed<EffectCastRule>(() => effect.value.castRule ?? {});

  /**
   * Записывает правило.
   *
   * @param nextRule новое правило; нет — раздел выключен.
   */
  function writeRule(nextRule: EffectCastRule | undefined): void {
    effect.value = { ...effect.value, castRule: nextRule };
  }

  const hasCastRule = computed({
    get: () => effect.value.castRule !== undefined,
    set: (enabled: boolean) => writeRule(enabled ? {} : undefined),
  });

  // Очищенное поле числа отдаёт `undefined`: лимита или шанса тогда нет
  const maxSlotLevel = computed({
    get: () => castRule.value.maxSlotLevel,
    set: (slotLevel: number | null | undefined) =>
      writeRule({ ...castRule.value, maxSlotLevel: slotLevel ?? undefined }),
  });

  const minSlotLevel = computed({
    get: () => castRule.value.minSlotLevel,
    set: (slotLevel: number | null | undefined) =>
      writeRule({ ...castRule.value, minSlotLevel: slotLevel ?? undefined }),
  });

  const failChance = computed({
    get: () => castRule.value.failChance,
    set: (chance: number | null | undefined) =>
      writeRule({ ...castRule.value, failChance: chance ?? undefined }),
  });

  // Новый спасбросок — Телосложения, против Сл источника там, где он есть
  const hasFailSave = computed({
    get: () => castRule.value.failSave !== undefined,
    set: (enabled: boolean) =>
      writeRule({
        ...castRule.value,
        failSave: enabled
          ? {
              ...createDefaultEffectSave(layout),
              ability: NEW_CAST_RULE_SAVE_ABILITY,
            }
          : undefined,
      }),
  });

  /**
   * Заменяет спасбросок при попытке каста.
   *
   * @param nextSave спасбросок с изменёнными характеристикой или Сл.
   */
  function updateFailSave(nextSave: CastRuleSave): void {
    writeRule({ ...castRule.value, failSave: nextSave });
  }

  /** Есть ли у правила провал: без него компонент и ячейка ничего не значат. */
  const hasFailure = computed(() => castRuleHasFailure(castRule.value));

  // «Любое заклинание» — значение по умолчанию: в данных оно не пишется
  const failComponent = computed<CastRuleComponentChoice>({
    get: () => castRule.value.failComponent ?? CAST_RULE_ANY_COMPONENT,
    set: (component) =>
      writeRule({
        ...castRule.value,
        failComponent:
          component === CAST_RULE_ANY_COMPONENT ? undefined : component,
      }),
  });

  // Галочка пишется только включённой: `failLosesSlot: true`
  const failLosesSlot = computed({
    get: () => castRule.value.failLosesSlot === true,
    set: (enabled: boolean) =>
      writeRule({
        ...castRule.value,
        failLosesSlot: enabled ? true : undefined,
      }),
  });
</script>

<template>
  <div class="flex flex-col gap-2">
    <USwitch
      v-model="hasCastRule"
      :label="EFFECT_CAST_RULE_LABELS.toggle"
      :description="EFFECT_CAST_RULE_LABELS.toggleHint"
    />

    <template v-if="hasCastRule">
      <div class="flex flex-wrap items-end gap-3">
        <UFormField class="w-full sm:w-56">
          <template #label>
            <InfoTooltip
              :text="EFFECT_CAST_RULE_LABELS.maxSlotLevelHint"
              icon="tabler:info-circle-filled"
            >
              <span>{{ EFFECT_CAST_RULE_LABELS.maxSlotLevel }}</span>
            </InfoTooltip>
          </template>

          <UInputNumber
            v-model="maxSlotLevel"
            :min="MIN_SPELL_SLOT_LEVEL"
            :max="MAX_SPELL_SLOT_LEVEL"
            size="sm"
            class="w-full"
          />
        </UFormField>

        <UFormField class="w-full sm:w-56">
          <template #label>
            <InfoTooltip
              :text="EFFECT_CAST_RULE_LABELS.minSlotLevelHint"
              icon="tabler:info-circle-filled"
            >
              <span>{{ EFFECT_CAST_RULE_LABELS.minSlotLevel }}</span>
            </InfoTooltip>
          </template>

          <UInputNumber
            v-model="minSlotLevel"
            :min="MIN_SPELL_SLOT_LEVEL"
            :max="MAX_SPELL_SLOT_LEVEL"
            size="sm"
            class="w-full"
          />
        </UFormField>

        <UFormField class="w-full sm:w-48">
          <template #label>
            <InfoTooltip
              :text="EFFECT_CAST_RULE_LABELS.failChanceHint"
              icon="tabler:info-circle-filled"
            >
              <span>{{ EFFECT_CAST_RULE_LABELS.failChance }}</span>
            </InfoTooltip>
          </template>

          <UInputNumber
            v-model="failChance"
            :min="MIN_CAST_FAIL_CHANCE"
            :max="MAX_CAST_FAIL_CHANCE"
            size="sm"
            class="w-full"
          />
        </UFormField>
      </div>

      <USwitch
        v-model="hasFailSave"
        :label="EFFECT_CAST_RULE_LABELS.failSaveToggle"
        :description="EFFECT_CAST_RULE_LABELS.failSaveToggleHint"
      />

      <div
        v-if="castRule.failSave"
        class="flex flex-wrap items-end gap-3"
      >
        <EffectSaveFields
          :save="castRule.failSave"
          :layout="layout"
          :applier-save-dc="applierSaveDc"
          :ability-label="ACTIVE_EFFECT_FORM_LABELS.ability"
          :save-dc-label="EFFECT_CAST_RULE_LABELS.failSaveDc"
          @update:save="updateFailSave"
        />
      </div>

      <div
        v-if="hasFailure"
        class="flex flex-wrap items-end gap-3"
      >
        <UFormField
          :label="EFFECT_CAST_RULE_LABELS.failComponent"
          class="w-full sm:w-64"
        >
          <USelect
            v-model="failComponent"
            :items="CAST_RULE_COMPONENT_OPTIONS"
            value-key="value"
            size="sm"
            class="w-full"
          />
        </UFormField>

        <USwitch
          v-model="failLosesSlot"
          class="mb-2"
          :label="EFFECT_CAST_RULE_LABELS.failLosesSlot"
          :description="EFFECT_CAST_RULE_LABELS.failLosesSlotHint"
        />
      </div>
    </template>
  </div>
</template>
