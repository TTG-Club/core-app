<script setup lang="ts">
  import type {
    CatalogFacility,
    FacilitySetupDraft,
    SpecialFacilityDraft,
  } from '../../model';

  import { fillTemplate } from '~bastions/model';

  import {
    canAddSpecial,
    countSelected,
    FACILITY_SETUP_LABELS,
  } from '../../model';

  /**
   * Список специализированных сооружений, доступных персонажу, с кнопками
   * «Добавить» и выборами для уже добавленных (тип сада и т.п.).
   */
  const { facilities, limit } = defineProps<{
    facilities: ReadonlyArray<CatalogFacility>;
    limit: number;
  }>();

  const draft = defineModel<FacilitySetupDraft>({ required: true });

  const counterText = computed(() =>
    fillTemplate(FACILITY_SETUP_LABELS.specialCounter, {
      count: draft.value.special.length,
      limit,
    }),
  );

  /**
   * Добавленные экземпляры сооружения вместе с их номерами в черновике.
   *
   * @param facility Сооружение справочника.
   * @returns Экземпляры с позициями в черновике.
   */
  function getSelections(
    facility: CatalogFacility,
  ): Array<{ index: number; selection: SpecialFacilityDraft }> {
    return draft.value.special.flatMap((selection, index) =>
      selection.facilityUrl === facility.url ? [{ index, selection }] : [],
    );
  }

  /**
   * Подпись сооружения: уровень, пространство, приказы, «можно несколько».
   *
   * @param facility Сооружение справочника.
   * @returns Строка подробностей.
   */
  function getDetails(facility: CatalogFacility): string {
    return [
      facility.level
        ? fillTemplate(FACILITY_SETUP_LABELS.levelGroup, {
            level: facility.level,
          })
        : '',
      facility.space?.name ?? '',
      (facility.orders ?? []).map((order) => order.name).join(', '),
      facility.repeatable ? FACILITY_SETUP_LABELS.repeatable : '',
    ]
      .filter(Boolean)
      .join(' · ');
  }

  /**
   * Выборы сооружения с вариантами для селекта.
   *
   * @param facility Сооружение справочника.
   * @returns Выборы с названием, числом вариантов и списком.
   */
  function getChoices(facility: CatalogFacility) {
    return (facility.choices ?? []).flatMap((choice) =>
      choice.name
        ? [
            {
              name: choice.name,
              count: choice.count ?? 1,
              items: (choice.options ?? []).flatMap((option) =>
                option.name ? [option.name] : [],
              ),
            },
          ]
        : [],
    );
  }

  /**
   * Добавляет сооружение в черновик.
   *
   * @param facility Сооружение справочника.
   */
  function add(facility: CatalogFacility): void {
    draft.value.special = [
      ...draft.value.special,
      { facilityUrl: facility.url, choices: {} },
    ];
  }

  /**
   * Убирает экземпляр сооружения из черновика.
   *
   * @param index Позиция в черновике.
   */
  function remove(index: number): void {
    draft.value.special = draft.value.special.filter(
      (_, position) => position !== index,
    );
  }

  /**
   * Варианты выбора одного экземпляра для селекта: одиночный выбор хранится
   * массивом из одного элемента, как и множественный.
   *
   * @param selection Экземпляр сооружения.
   * @param choiceName Название выбора.
   * @returns Выбранные варианты.
   */
  function getChoiceValue(
    selection: SpecialFacilityDraft,
    choiceName: string,
  ): Array<string> {
    return selection.choices[choiceName] ?? [];
  }

  /**
   * Запоминает выбранные варианты, не больше положенного числа.
   *
   * @param selection Экземпляр сооружения.
   * @param choice Выбор: название и сколько вариантов можно взять.
   * @param choice.name Название выбора.
   * @param choice.count Сколько вариантов можно взять.
   * @param value Выбранные варианты.
   */
  function setChoice(
    selection: SpecialFacilityDraft,
    choice: { name: string; count: number },
    value: Array<string>,
  ): void {
    selection.choices = {
      ...selection.choices,
      [choice.name]: value.slice(0, choice.count),
    };
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between gap-2">
      <span class="text-sm text-muted tabular-nums">{{ counterText }}</span>
    </div>

    <div
      v-for="facility in facilities"
      :key="facility.url"
      class="flex flex-col gap-2 rounded-lg border border-default p-3"
    >
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div class="flex min-w-0 flex-col">
          <span class="font-medium text-highlighted">
            {{ facility.name.rus }}
          </span>

          <span class="text-xs text-muted">{{ getDetails(facility) }}</span>

          <span
            v-if="facility.prerequisite"
            class="text-xs text-warning"
          >
            {{ FACILITY_SETUP_LABELS.prerequisite }}:
            {{ facility.prerequisite.name }}
          </span>
        </div>

        <UButton
          icon="tabler:plus"
          size="sm"
          variant="subtle"
          :disabled="!canAddSpecial(draft, facility, limit)"
          @click.left.exact.prevent="add(facility)"
        >
          {{ FACILITY_SETUP_LABELS.add }}
          <template v-if="countSelected(draft, facility.url) > 0">
            ({{ countSelected(draft, facility.url) }})
          </template>
        </UButton>
      </div>

      <div
        v-for="{ index, selection } in getSelections(facility)"
        :key="index"
        class="flex flex-wrap items-end gap-2 border-l-2 border-primary/60 pl-3"
      >
        <UFormField
          v-for="choice in getChoices(facility)"
          :key="choice.name"
          :label="choice.name"
          class="min-w-48 flex-1"
        >
          <USelectMenu
            :model-value="getChoiceValue(selection, choice.name)"
            :items="choice.items"
            :placeholder="FACILITY_SETUP_LABELS.choicePlaceholder"
            multiple
            class="w-full"
            @update:model-value="setChoice(selection, choice, $event)"
          />
        </UFormField>

        <UButton
          icon="tabler:trash"
          color="error"
          variant="ghost"
          size="sm"
          :aria-label="FACILITY_SETUP_LABELS.remove"
          @click.left.exact.prevent="remove(index)"
        >
          {{ FACILITY_SETUP_LABELS.remove }}
        </UButton>
      </div>
    </div>
  </div>
</template>
