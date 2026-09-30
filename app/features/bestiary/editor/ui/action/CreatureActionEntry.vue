<script setup lang="ts">
  import type { CreateAction, CreatureEffectContext } from '../../../model';

  import { ActiveEffects } from '~active-effects/editor';
  import {
    EFFECT_FORM_CONTEXT,
    EFFECT_ORIGIN,
    MAX_SAVE_OVERRIDE_USES,
  } from '~active-effects/model';
  import { MarkupEditor } from '~ui/markup-editor';
  import { SelectRecharge } from '~ui/select';

  import { toStoredSaveSuccessPerDay } from '../../../model';
  import {
    CREATURE_ACTION_LABELS,
    CREATURE_ACTION_SECTIONS,
    CREATURE_SAVE_SUCCESS_PER_DAY_MIN,
  } from '../../constants';
  import CreatureActionCombat from './CreatureActionCombat.vue';

  /**
   * Поля записи боевого блока: действия, реакции, умения, эффекта логова.
   *
   * Своей формы у записи нет — ей владеет строка списка, которая живёт и со
   * свёрнутыми полями. Поэтому имена полей здесь относительные: путь записи
   * (`actions.0`) вложенная форма подставляет сама.
   */
  const { effectContext } = defineProps<{
    /** Место эффектов записи: черта существа или действие. */
    effectContext: CreatureEffectContext;
  }>();

  const model = defineModel<CreateAction>({ required: true });

  /**
   * Сл самого действия — ею «Авто» подписывает поле Сл эффекта: «Сл действия ·
   * 14». Берётся Сл только первого спасброска: у записи с несколькими
   * спасбросками подпись назовёт первую, остальные в неё не попадут. У
   * действия без спасброска числа нет, остаётся одна подпись.
   */
  const actionSaveDc = computed(() => model.value.effect.savingThrows[0]?.dc);

  /** «Провал в успех, раз в день» бывает только у умения (черты) существа. */
  const isTrait = computed(
    () => effectContext === EFFECT_FORM_CONTEXT.creatureTrait,
  );

  // Очищенное поле и ноль — «не умеет»: в данных остаётся только число раз
  const saveSuccessPerDay = computed({
    get: () => model.value.saveSuccessPerDay,
    set: (enteredTimes: number | null | undefined) => {
      model.value = {
        ...model.value,
        saveSuccessPerDay: toStoredSaveSuccessPerDay(enteredTimes),
      };
    },
  });
</script>

<template>
  <UFormField
    class="col-span-full md:col-span-8"
    :label="CREATURE_ACTION_LABELS.nameRus"
    name="name.rus"
  >
    <UInput
      v-model="model.name.rus"
      :placeholder="CREATURE_ACTION_LABELS.nameRusPlaceholder"
    />
  </UFormField>

  <UFormField
    class="col-span-full md:col-span-8"
    :label="CREATURE_ACTION_LABELS.nameEng"
    name="name.eng"
  >
    <UInput
      v-model="model.name.eng"
      :placeholder="CREATURE_ACTION_LABELS.nameEngPlaceholder"
    />
  </UFormField>

  <UFormField
    class="col-span-full md:col-span-8"
    :label="CREATURE_ACTION_LABELS.recharge"
    name="recharge"
  >
    <SelectRecharge v-model="model.recharge" />
  </UFormField>

  <UFormField
    v-if="isTrait"
    class="col-span-full"
    :label="CREATURE_ACTION_LABELS.saveSuccessPerDay"
    :help="CREATURE_ACTION_LABELS.saveSuccessPerDayHint"
    name="saveSuccessPerDay"
  >
    <UInputNumber
      v-model="saveSuccessPerDay"
      :min="CREATURE_SAVE_SUCCESS_PER_DAY_MIN"
      :max="MAX_SAVE_OVERRIDE_USES"
      :placeholder="CREATURE_ACTION_LABELS.saveSuccessPerDayPlaceholder"
      class="w-40"
    />
  </UFormField>

  <UFormField
    class="col-span-full"
    :label="CREATURE_ACTION_LABELS.description"
    name="description"
    :ui="{ root: 'w-full', container: 'w-full' }"
  >
    <MarkupEditor
      v-model="model.description"
      :placeholder="CREATURE_ACTION_LABELS.descriptionPlaceholder"
    />
  </UFormField>

  <UFormField
    class="col-span-full"
    name="effect.damageParts"
    :ui="{ root: 'w-full', container: 'w-full' }"
  >
    <CreatureActionCombat
      v-model="model.effect"
      field-name-prefix="effect"
    />
  </UFormField>

  <ActiveEffects
    v-model="model.effect.activeEffects"
    nested
    :context="effectContext"
    :applier-save-dc="actionSaveDc"
    :origin="EFFECT_ORIGIN.feature"
    :title="CREATURE_ACTION_SECTIONS.effects"
  />
</template>
