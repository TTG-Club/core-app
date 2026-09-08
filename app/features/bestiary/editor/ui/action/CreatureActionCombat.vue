<script setup lang="ts">
  import type { CreatureActionEffect } from '../../../model';

  import { DictionaryService } from '~/shared/api';
  import { DamageParts } from '~ui/damage-formula';
  import { EditorNestedSection } from '~ui/editor';
  import {
    SelectAbilities,
    SelectAttackType,
    SelectSpellArea,
  } from '~ui/select';

  import { getCreatureActionCombatFilledCount } from '../../../model';
  import {
    CREATURE_ACTION_LABELS,
    CREATURE_ACTION_SECTIONS,
    CREATURE_DAMAGE_PART_EMPTY,
    CREATURE_SAVE_EFFECT_OPTIONS,
  } from '../../constants';

  const { fieldNamePrefix } = defineProps<{
    /** Приставка имени поля формы — по ней подсвечивается ошибка. */
    fieldNamePrefix: string;
  }>();

  const model = defineModel<CreatureActionEffect>({ required: true });

  // Ключ один на все записи боевого блока: сколько бы их ни было на вкладке,
  // справочник грузится однажды. Без `await` — форма не должна ждать словарь,
  // чтобы отрисовать уже заполненные поля.
  const { data: damageTypes, status: damageTypesStatus } = useAsyncData(
    'dictionaries-damage-types',
    () => DictionaryService.damageTypes(),
    { dedupe: 'defer' },
  );

  const damageTypeOptions = computed(() => damageTypes.value ?? []);

  const damageTypesPending = computed(
    () => damageTypesStatus.value === 'pending',
  );

  /**
   * Спасбросок у записи один: столько же знает игровая система, и второй
   * уехал бы в выгрузку молча отброшенным. Правится он как обычные поля, а
   * хранится списком — таким его отдаёт бэкенд.
   */
  const saveAbility = computed({
    get: () => model.value.savingThrows[0]?.ability,
    set: (ability) => {
      const dc = model.value.savingThrows[0]?.dc;

      model.value.savingThrows = ability ? [{ ability, dc }] : [];
    },
  });

  const saveDc = computed({
    get: () => model.value.savingThrows[0]?.dc,
    set: (dc) => {
      const ability = model.value.savingThrows[0]?.ability;

      model.value.savingThrows = ability ? [{ ability, dc }] : [];
    },
  });

  /**
   * Спасбросок заменяет бросок попадания — то же правило, что в форме системы:
   * по цели либо попадают, либо она защищается сама.
   */
  const hasSave = computed(() => saveAbility.value !== undefined);

  /**
   * Сколько частей механики заполнено — числом в шапке раздела. Раздел
   * сворачивается вместе с записью, и без бейджа заведённая механика ничем не
   * отличалась бы от пустой.
   */
  const filledCount = computed(() =>
    getCreatureActionCombatFilledCount(model.value),
  );

  /** Второе значение области: только у линии (ширина) и цилиндра (высота). */
  const areaSecondLabel = computed(() => {
    const type = model.value.areaOfEffect.type;

    if (type === 'LINE') {
      return CREATURE_ACTION_LABELS.areaWidth;
    }

    return type === 'CYLINDER' ? CREATURE_ACTION_LABELS.areaHeight : undefined;
  });
</script>

<template>
  <EditorNestedSection
    :title="CREATURE_ACTION_SECTIONS.combat"
    :hint="CREATURE_ACTION_SECTIONS.combatHint"
    :count="filledCount"
  >
    <!-- Сетка в 24 колонки только с планшета — см. `CreatureActionList` -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
      <UFormField
        class="col-span-full md:col-span-8"
        :label="CREATURE_ACTION_LABELS.attackType"
        :name="`${fieldNamePrefix}.attackType`"
      >
        <SelectAttackType v-model="model.attackType" />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-8"
        :label="CREATURE_ACTION_LABELS.attackBonus"
        :help="
          hasSave
            ? CREATURE_ACTION_LABELS.attackBonusReplaced
            : CREATURE_ACTION_LABELS.attackBonusHint
        "
        :name="`${fieldNamePrefix}.attackBonus`"
      >
        <UInputNumber
          v-model="model.attackBonus"
          :disabled="hasSave"
          :placeholder="CREATURE_ACTION_LABELS.attackBonusPlaceholder"
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-8"
        :label="CREATURE_ACTION_LABELS.reach"
        :name="`${fieldNamePrefix}.reach`"
      >
        <UInputNumber
          v-model="model.reach"
          :min="0"
          :placeholder="CREATURE_ACTION_LABELS.distancePlaceholder"
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-12"
        :label="CREATURE_ACTION_LABELS.rangeNormal"
        :name="`${fieldNamePrefix}.rangeNormal`"
      >
        <UInputNumber
          v-model="model.rangeNormal"
          :min="0"
          :placeholder="CREATURE_ACTION_LABELS.distancePlaceholder"
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-12"
        :label="CREATURE_ACTION_LABELS.rangeLong"
        :name="`${fieldNamePrefix}.rangeLong`"
      >
        <UInputNumber
          v-model="model.rangeLong"
          :min="0"
          :placeholder="CREATURE_ACTION_LABELS.distancePlaceholder"
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-8"
        :label="CREATURE_ACTION_LABELS.saveAbility"
        :name="`${fieldNamePrefix}.savingThrows`"
      >
        <SelectAbilities
          v-model="saveAbility"
          :placeholder="CREATURE_ACTION_LABELS.saveAbilityPlaceholder"
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-8"
        :label="CREATURE_ACTION_LABELS.saveDc"
        :name="`${fieldNamePrefix}.saveDc`"
      >
        <UInputNumber
          v-model="saveDc"
          :min="0"
          :disabled="!hasSave"
          :placeholder="CREATURE_ACTION_LABELS.saveDcPlaceholder"
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-8"
        :label="CREATURE_ACTION_LABELS.saveEffect"
        :name="`${fieldNamePrefix}.saveEffect`"
      >
        <USelect
          v-model="model.saveEffect"
          :items="CREATURE_SAVE_EFFECT_OPTIONS"
          :disabled="!hasSave"
          :placeholder="CREATURE_ACTION_LABELS.saveEffectPlaceholder"
          clearable
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-8"
        :label="CREATURE_ACTION_LABELS.areaType"
        :name="`${fieldNamePrefix}.areaOfEffect.type`"
      >
        <SelectSpellArea v-model="model.areaOfEffect.type" />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-8"
        :label="CREATURE_ACTION_LABELS.areaSize"
        :name="`${fieldNamePrefix}.areaOfEffect.value1`"
      >
        <UInputNumber
          v-model="model.areaOfEffect.value1"
          :min="0"
          :disabled="!model.areaOfEffect.type"
          :placeholder="CREATURE_ACTION_LABELS.distancePlaceholder"
        />
      </UFormField>

      <UFormField
        v-if="areaSecondLabel"
        class="col-span-full md:col-span-8"
        :label="areaSecondLabel"
        :name="`${fieldNamePrefix}.areaOfEffect.value2`"
      >
        <UInputNumber
          v-model="model.areaOfEffect.value2"
          :min="0"
          :placeholder="CREATURE_ACTION_LABELS.distancePlaceholder"
        />
      </UFormField>

      <!-- Модификаторы скрыты: у существа они уже вшиты в плоское число, а
        @mod/@prof/@level в формуле VTTG считает ошибкой -->
      <DamageParts
        v-model="model.damageParts"
        hide-modifiers
        :damage-type-options="damageTypeOptions"
        :damage-types-pending="damageTypesPending"
        :empty-label="CREATURE_DAMAGE_PART_EMPTY"
        :field-name-prefix="`${fieldNamePrefix}.damageParts`"
      />
    </div>
  </EditorNestedSection>
</template>
