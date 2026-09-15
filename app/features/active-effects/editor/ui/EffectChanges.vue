<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    EffectChange,
    EffectChangeMode,
    EffectModifierPreset,
  } from '../../model';

  import { InputWithLibrary } from '~ui/input';

  import {
    ACTIVE_EFFECT_LABELS,
    createEmptyEffectChange,
    DEFAULT_EFFECT_CHANGE_PRIORITY,
    DEFAULT_EFFECT_CHANGE_VALUE,
    EFFECT_CHANGE_MODE_OPTIONS,
    EFFECT_CONDITION_EXPR_SUGGESTIONS,
    EFFECT_MODIFIER_MENU,
    EFFECT_MODIFIERS_STEP_LABELS,
    EFFECT_TARGET_KEY_SUGGESTIONS,
    EFFECT_VALUE_SUGGESTIONS,
  } from '../../model';

  /**
   * Строки модификаторов эффекта: что меняется, режим, значение и условие.
   * Приоритет показывается в режиме «Для опытных» или когда у строки он уже
   * задан не по умолчанию — прятать заданное нельзя.
   */
  const { showPriorityField = false } = defineProps<{
    /** Показывать приоритет у всех строк. */
    showPriorityField?: boolean;
  }>();

  const model = defineModel<Array<EffectChange>>({ default: () => [] });

  /**
   * Строки с вычисленной видимостью приоритета и ошибками. Строку без ключа
   * или значения сохранять не запрещаем — движок VTTG её пропускает, — но
   * молчать о ней нельзя. Строка из пункта-условия без ключа заведена ради
   * условия: ключ автор выберет сам, и подсказка ему как раз об этом.
   */
  const rows = computed(() =>
    model.value.map((change) => ({
      change,
      showPriority:
        showPriorityField || change.priority !== DEFAULT_EFFECT_CHANGE_PRIORITY,
      keyError: change.key.trim()
        ? undefined
        : ACTIVE_EFFECT_LABELS.changeKeyRequired,
      valueError: change.value.trim()
        ? undefined
        : ACTIVE_EFFECT_LABELS.changeValueRequired,
    })),
  );

  function addChange() {
    model.value = [...model.value, createEmptyEffectChange()];
  }

  /**
   * Добавляет строку по готовому пункту меню: ключ, режим и (где он осмыслен)
   * значение уже проставлены — автору остаётся поправить число.
   *
   * Пункт-условие оставляет ключ и значение пустыми намеренно: он отвечает
   * только за «когда», а «что менять» автор называет сам.
   *
   * @param preset пункт меню «Готовые».
   */
  function addChangeFromPreset(preset: EffectModifierPreset) {
    const isConditionPreset = Boolean(preset.condition);

    model.value = [
      ...model.value,
      {
        key: preset.key,
        mode: preset.mode,
        value:
          preset.value
          ?? (isConditionPreset ? '' : DEFAULT_EFFECT_CHANGE_VALUE),
        condition: preset.condition ?? '',
        priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
      },
    ];
  }

  const modifierMenuItems = computed<Array<Array<DropdownMenuItem>>>(() =>
    EFFECT_MODIFIER_MENU.map((group) => [
      {
        label: group.label,
        children: group.items.map((preset) => ({
          label: preset.label,
          onSelect: () => addChangeFromPreset(preset),
        })),
      },
    ]),
  );

  /**
   * Удаляет строку.
   *
   * @param index номер строки.
   */
  function removeChange(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }

  /**
   * Меняет поля строки.
   *
   * @param index номер строки.
   * @param patch изменённые поля.
   */
  function updateChange(index: number, patch: Partial<EffectChange>) {
    model.value = model.value.map((change, position) =>
      position === index ? { ...change, ...patch } : change,
    );
  }

  /**
   * Меняет ключ строки.
   *
   * @param index номер строки.
   * @param key ключ атрибута.
   */
  function updateKey(index: number, key: string) {
    updateChange(index, { key });
  }

  /**
   * Меняет режим строки.
   *
   * @param index номер строки.
   * @param mode режим применения.
   */
  function updateMode(index: number, mode: EffectChangeMode) {
    updateChange(index, { mode });
  }

  /**
   * Меняет значение строки.
   *
   * @param index номер строки.
   * @param value значение или формула.
   */
  function updateValue(index: number, value: string) {
    updateChange(index, { value });
  }

  /**
   * Меняет приоритет строки; очищенное поле — приоритет по умолчанию.
   *
   * @param index номер строки.
   * @param priority приоритет из поля.
   */
  function updatePriority(index: number, priority: number | null) {
    updateChange(index, {
      priority: priority ?? DEFAULT_EFFECT_CHANGE_PRIORITY,
    });
  }

  /**
   * Меняет условие строки.
   *
   * @param index номер строки.
   * @param condition условие.
   */
  function updateCondition(index: number, condition: string) {
    updateChange(index, { condition });
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium">
        {{ EFFECT_MODIFIERS_STEP_LABELS.changesTitle }}
      </span>

      <div class="flex items-center gap-1">
        <UDropdownMenu
          :items="modifierMenuItems"
          :content="{ align: 'end' }"
          :ui="{ content: 'max-h-96 overflow-y-auto' }"
        >
          <UButton
            icon="tabler:list-search"
            size="xs"
            variant="soft"
            :title="EFFECT_MODIFIERS_STEP_LABELS.changePresetHint"
          >
            {{ EFFECT_MODIFIERS_STEP_LABELS.presets }}
          </UButton>
        </UDropdownMenu>

        <UButton
          icon="tabler:plus"
          size="xs"
          variant="ghost"
          @click.left.exact.prevent="addChange"
        >
          {{ ACTIVE_EFFECT_LABELS.addRow }}
        </UButton>
      </div>
    </div>

    <p
      v-if="!model.length"
      class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
    >
      {{ EFFECT_MODIFIERS_STEP_LABELS.changesEmpty }}
    </p>

    <div
      v-for="(row, index) in rows"
      :key="index"
      class="grid grid-cols-24 items-start gap-2 rounded-lg border border-default bg-elevated/50 p-3"
    >
      <UFormField
        :label="ACTIVE_EFFECT_LABELS.changeKey"
        :error="row.keyError"
        class="col-span-full md:col-span-8"
      >
        <InputWithLibrary
          :model-value="row.change.key"
          :options="EFFECT_TARGET_KEY_SUGGESTIONS"
          :placeholder="ACTIVE_EFFECT_LABELS.changeKeyPlaceholder"
          @update:model-value="updateKey(index, $event)"
        />
      </UFormField>

      <UFormField
        :label="ACTIVE_EFFECT_LABELS.changeMode"
        class="col-span-full md:col-span-5"
      >
        <USelect
          :model-value="row.change.mode"
          :items="EFFECT_CHANGE_MODE_OPTIONS"
          class="w-full"
          @update:model-value="updateMode(index, $event)"
        />
      </UFormField>

      <UFormField
        :label="ACTIVE_EFFECT_LABELS.changeValue"
        :error="row.valueError"
        class="col-span-full md:col-span-7"
      >
        <InputWithLibrary
          :model-value="row.change.value"
          :options="EFFECT_VALUE_SUGGESTIONS"
          :placeholder="ACTIVE_EFFECT_LABELS.changeValuePlaceholder"
          @update:model-value="updateValue(index, $event)"
        />
      </UFormField>

      <UFormField
        v-if="row.showPriority"
        :label="ACTIVE_EFFECT_LABELS.changePriority"
        class="col-span-12 md:col-span-3"
      >
        <UInputNumber
          :model-value="row.change.priority"
          :min="0"
          :max="100"
          @update:model-value="updatePriority(index, $event)"
        />
      </UFormField>

      <div class="col-span-12 flex items-end self-end md:col-span-1">
        <UButton
          icon="tabler:trash"
          color="error"
          variant="soft"
          :aria-label="ACTIVE_EFFECT_LABELS.changeRemove"
          @click.left.exact.prevent="removeChange(index)"
        />
      </div>

      <UFormField
        :label="ACTIVE_EFFECT_LABELS.changeCondition"
        class="col-span-full"
      >
        <InputWithLibrary
          :model-value="row.change.condition ?? ''"
          :options="EFFECT_CONDITION_EXPR_SUGGESTIONS"
          :placeholder="ACTIVE_EFFECT_LABELS.changeConditionPlaceholder"
          @update:model-value="updateCondition(index, $event)"
        />
      </UFormField>
    </div>
  </div>
</template>
