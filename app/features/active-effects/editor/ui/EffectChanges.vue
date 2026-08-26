<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { EffectChange, EffectModifierPreset } from '../../model';

  import { InputWithLibrary } from '~ui/input';

  import {
    ACTIVE_EFFECT_LABELS,
    createEmptyEffectChange,
    DEFAULT_EFFECT_CHANGE_PRIORITY,
    DEFAULT_EFFECT_CHANGE_VALUE,
    EFFECT_CHANGE_MODE_OPTIONS,
    EFFECT_CONDITION_EXPR_SUGGESTIONS,
    EFFECT_MODIFIER_MENU,
    EFFECT_TARGET_KEY_SUGGESTIONS,
    EFFECT_VALUE_SUGGESTIONS,
  } from '../../model';

  const model = defineModel<Array<EffectChange>>({ default: () => [] });

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

  function removeChange(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium">
        {{ ACTIVE_EFFECT_LABELS.changesTitle }}
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
            :title="ACTIVE_EFFECT_LABELS.presetsChangesHint"
          >
            {{ ACTIVE_EFFECT_LABELS.presets }}
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
      {{ ACTIVE_EFFECT_LABELS.changesEmpty }}
    </p>

    <div
      v-for="(change, index) in model"
      :key="index"
      class="grid grid-cols-24 items-end gap-2 rounded-lg border border-default bg-elevated/50 p-3"
    >
      <UFormField
        :label="ACTIVE_EFFECT_LABELS.changeKey"
        class="col-span-full md:col-span-8"
      >
        <InputWithLibrary
          v-model="change.key"
          :options="EFFECT_TARGET_KEY_SUGGESTIONS"
          :placeholder="ACTIVE_EFFECT_LABELS.changeKeyPlaceholder"
        />
      </UFormField>

      <UFormField
        :label="ACTIVE_EFFECT_LABELS.changeMode"
        class="col-span-full md:col-span-5"
      >
        <USelect
          v-model="change.mode"
          :items="EFFECT_CHANGE_MODE_OPTIONS"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="ACTIVE_EFFECT_LABELS.changeValue"
        class="col-span-full md:col-span-7"
      >
        <InputWithLibrary
          v-model="change.value"
          :options="EFFECT_VALUE_SUGGESTIONS"
          :placeholder="ACTIVE_EFFECT_LABELS.changeValuePlaceholder"
        />
      </UFormField>

      <UFormField
        :label="ACTIVE_EFFECT_LABELS.changePriority"
        class="col-span-12 md:col-span-3"
      >
        <UInputNumber
          v-model="change.priority"
          :min="0"
          :max="100"
        />
      </UFormField>

      <UFormField class="col-span-12 flex items-end md:col-span-1">
        <UButton
          icon="tabler:trash"
          color="error"
          variant="soft"
          @click.left.exact.prevent="removeChange(index)"
        />
      </UFormField>

      <UFormField
        :label="ACTIVE_EFFECT_LABELS.changeCondition"
        class="col-span-full"
      >
        <InputWithLibrary
          v-model="change.condition"
          :options="EFFECT_CONDITION_EXPR_SUGGESTIONS"
          :placeholder="ACTIVE_EFFECT_LABELS.changeConditionPlaceholder"
        />
      </UFormField>
    </div>
  </div>
</template>
