<!--
  Урон «или» записи существа: варианты, каждый со своим набором частей урона и
  целиком заменяющий основной. Условие варианта — состояние в его формуле
  (вкладки «Статусы цели» и «Статусы атакующего»): такой вариант берётся сам.
  Без состояний — способ выбора: при броске или случайно. Зеркало
  `CreatureDamageAlternativesEditor.vue` системы VTTG.
-->
<script setup lang="ts">
  import type { SelectOption } from '~/shared/types';
  import type { DamageFormulaPart } from '~ui/damage-formula';

  import type { CreatureDamageAlternative } from '../../../model';

  import { DamageParts } from '~ui/damage-formula';

  import {
    createCreatureDamageAlternative,
    getCreatureDamageAlternativeView,
    isCreatureDamageCondition,
    MAX_CREATURE_DAMAGE_ALTERNATIVES,
    replaceCreatureDamageAlternativeParts,
  } from '../../../model';
  import {
    CREATURE_DAMAGE_ALTERNATIVE_LABELS,
    CREATURE_DAMAGE_CONDITION_OPTIONS,
    CREATURE_DAMAGE_PART_EMPTY,
  } from '../../constants';

  const {
    baseParts,
    hasArea,
    damageTypeOptions,
    damageTypesPending,
    fieldNamePrefix,
  } = defineProps<{
    /** Основной урон записи: с его копии начинается новый вариант. */
    baseParts: Array<DamageFormulaPart>;
    /** У записи задана область: одной цели у атаки нет. */
    hasArea: boolean;
    /** Типы урона справочника. */
    damageTypeOptions: Array<SelectOption>;
    /** Справочник ещё грузится. */
    damageTypesPending: boolean;
    /** Приставка имени поля формы механики, напр. `effect`. */
    fieldNamePrefix: string;
  }>();

  const model = defineModel<Array<CreatureDamageAlternative>>({
    required: true,
  });

  /**
   * Варианты с признаками показа (берётся ли сам, дописан ли, область) и
   * именем поля частей — по нему встаёт ошибка запрещённых токенов.
   */
  const rows = computed(() =>
    model.value.map((alternative, alternativeIndex) => ({
      alternative,
      view: getCreatureDamageAlternativeView(alternative, hasArea),
      partsFieldName: `${fieldNamePrefix}.damageAlternatives.${alternativeIndex}.damageParts`,
    })),
  );

  const canAdd = computed(
    () => model.value.length < MAX_CREATURE_DAMAGE_ALTERNATIVES,
  );

  /**
   * Заменяет вариант по месту.
   *
   * @param alternativeIndex место варианта.
   * @param nextAlternative новый вид варианта.
   */
  function replaceAlternative(
    alternativeIndex: number,
    nextAlternative: CreatureDamageAlternative,
  ) {
    model.value = model.value.map((currentAlternative, position) =>
      position === alternativeIndex ? nextAlternative : currentAlternative,
    );
  }

  /** Добавляет вариант с копией основного урона. */
  function addAlternative() {
    model.value = [...model.value, createCreatureDamageAlternative(baseParts)];
  }

  /**
   * Убирает вариант.
   *
   * @param alternativeIndex место варианта.
   */
  function removeAlternative(alternativeIndex: number) {
    model.value = model.value.filter(
      (_, position) => position !== alternativeIndex,
    );
  }

  /**
   * Меняет способ выбора варианта. Значение сверяется со списком: выпадающий
   * список отдаёт его без типа.
   *
   * @param alternativeIndex место варианта.
   * @param selectedCondition выбранный способ.
   */
  function updateCondition(
    alternativeIndex: number,
    selectedCondition: unknown,
  ) {
    const alternative = model.value[alternativeIndex];

    if (alternative && isCreatureDamageCondition(selectedCondition)) {
      replaceAlternative(alternativeIndex, {
        ...alternative,
        condition: selectedCondition,
      });
    }
  }

  /**
   * Меняет подпись варианта. Пустая строка в форме — «подписи нет»: обрезка и
   * отбрасывание пустой — при отправке.
   *
   * @param alternativeIndex место варианта.
   * @param labelText введённая подпись.
   */
  function updateLabel(alternativeIndex: number, labelText: string | number) {
    const alternative = model.value[alternativeIndex];

    if (alternative) {
      replaceAlternative(alternativeIndex, {
        ...alternative,
        label: String(labelText),
      });
    }
  }

  /**
   * Меняет части урона варианта; состояние в формуле само ставит способ «по
   * формуле».
   *
   * @param alternativeIndex место варианта.
   * @param damageParts новые части.
   */
  function updateParts(
    alternativeIndex: number,
    damageParts: Array<DamageFormulaPart>,
  ) {
    const alternative = model.value[alternativeIndex];

    if (alternative) {
      replaceAlternative(
        alternativeIndex,
        replaceCreatureDamageAlternativeParts(alternative, damageParts),
      );
    }
  }
</script>

<template>
  <div class="col-span-full flex flex-col gap-3">
    <div class="flex flex-col gap-1">
      <span class="text-sm font-semibold text-highlighted">
        {{ CREATURE_DAMAGE_ALTERNATIVE_LABELS.title }}
      </span>

      <p class="text-xs text-muted">
        {{ CREATURE_DAMAGE_ALTERNATIVE_LABELS.hint }}
      </p>
    </div>

    <div
      v-for="(row, alternativeIndex) in rows"
      :key="alternativeIndex"
      class="flex flex-col gap-3 rounded-lg border border-default bg-elevated/20 p-3"
    >
      <div class="flex items-center gap-2">
        <span
          class="shrink-0 text-xs font-semibold tracking-wide text-warning uppercase"
        >
          {{ CREATURE_DAMAGE_ALTERNATIVE_LABELS.or }}
        </span>

        <!-- Вариант с состоянием в формуле берётся сам — способ ему не нужен -->
        <span
          v-if="row.view.isAutomatic"
          class="min-w-0 flex-1 text-sm text-toned"
        >
          {{ row.view.automaticCaption }}
        </span>

        <USelect
          v-else
          :model-value="row.alternative.condition"
          :items="CREATURE_DAMAGE_CONDITION_OPTIONS"
          size="sm"
          class="min-w-0 flex-1"
          :aria-label="CREATURE_DAMAGE_ALTERNATIVE_LABELS.condition"
          @update:model-value="updateCondition(alternativeIndex, $event)"
        />

        <UButton
          color="error"
          variant="ghost"
          icon="tabler:trash"
          size="xs"
          :aria-label="CREATURE_DAMAGE_ALTERNATIVE_LABELS.remove"
          @click.left.exact.prevent="removeAlternative(alternativeIndex)"
        />
      </div>

      <p
        v-if="row.view.warnsArea"
        class="text-xs text-warning"
      >
        {{ CREATURE_DAMAGE_ALTERNATIVE_LABELS.areaTargetWarning }}
      </p>

      <p
        v-if="row.view.lacksStatus"
        class="text-xs text-warning"
      >
        {{ CREATURE_DAMAGE_ALTERNATIVE_LABELS.formulaWithoutStatus }}
      </p>

      <UFormField :label="CREATURE_DAMAGE_ALTERNATIVE_LABELS.label">
        <UInput
          :model-value="row.view.labelText"
          :placeholder="CREATURE_DAMAGE_ALTERNATIVE_LABELS.labelPlaceholder"
          class="w-full"
          @update:model-value="updateLabel(alternativeIndex, $event)"
        />
      </UFormField>

      <!-- Имя поля — путь ошибки запрещённых токенов у частей варианта -->
      <UFormField
        :name="row.partsFieldName"
        :ui="{ root: 'w-full', container: 'w-full' }"
      >
        <DamageParts
          hide-modifiers
          :model-value="row.alternative.damageParts"
          :damage-type-options="damageTypeOptions"
          :damage-types-pending="damageTypesPending"
          :empty-label="CREATURE_DAMAGE_PART_EMPTY"
          :field-name-prefix="row.partsFieldName"
          @update:model-value="updateParts(alternativeIndex, $event)"
        />
      </UFormField>
    </div>

    <UButton
      v-if="canAdd"
      icon="tabler:plus"
      size="sm"
      variant="soft"
      class="self-start"
      @click.left.exact.prevent="addAlternative"
    >
      {{ CREATURE_DAMAGE_ALTERNATIVE_LABELS.add }}
    </UButton>
  </div>
</template>
