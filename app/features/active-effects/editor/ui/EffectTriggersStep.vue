<script setup lang="ts">
  import type {
    ActiveEffect,
    EffectFormLayout,
    EffectTrigger,
    EffectTriggerPreset,
  } from '../../model';

  import {
    createEffectTriggerPreset,
    EFFECT_TRIGGER_PRESET_ICONS,
    EFFECT_TRIGGER_PRESET_LABELS,
    EFFECT_TRIGGERS_STEP_LABELS,
    listEffectListTriggers,
    listEffectTriggerPresets,
    listTriggerTags,
    writeEffectTriggerRow,
  } from '../../model';
  import EffectTriggerRow from './EffectTriggerRow.vue';

  /**
   * Шаг «Срабатывания»: урон каждый ход, повторный спасбросок, снятие после
   * атаки и свои срабатывания одним списком. Запись — «сначала старые поля»:
   * то, что выражает старое поле, пишется в него, остальное — в `triggers`.
   */
  const { layout, sourceSaveDc = undefined } = defineProps<{
    /** Раскладка формы. */
    layout: EffectFormLayout;
    /** Сл источника для «Авто», если форма её знает. */
    sourceSaveDc?: number;
  }>();

  /** Эффект формы: строки списка пишутся в него «сначала старые поля». */
  const effect = defineModel<ActiveEffect>('effect', { required: true });

  const rows = computed(() => listEffectListTriggers(effect.value));

  const knownTags = computed(() => listTriggerTags(rows.value));

  /**
   * Строки с ключом для списка: номер и `id` — после записи легаси-строка
   * может сменить `id` и должна перерисоваться.
   */
  const rowEntries = computed(() =>
    rows.value.map((trigger, index) => ({
      trigger,
      key: `${index}-${trigger.id}`,
    })),
  );

  const presets = computed(() =>
    listEffectTriggerPresets(layout).map((preset) => ({
      preset,
      label: EFFECT_TRIGGER_PRESET_LABELS[preset],
      icon: EFFECT_TRIGGER_PRESET_ICONS[preset],
    })),
  );

  /**
   * Записывает строку.
   *
   * @param index номер строки.
   * @param trigger новая строка; `null` — убрать.
   */
  function writeRow(index: number, trigger: EffectTrigger | null): void {
    effect.value = writeEffectTriggerRow(effect.value, index, trigger);
  }

  /**
   * Убирает строку.
   *
   * @param index номер строки.
   */
  function removeRow(index: number): void {
    writeRow(index, null);
  }

  /**
   * Добавляет готовое срабатывание в конец списка.
   *
   * @param preset пресет.
   */
  function addPreset(preset: EffectTriggerPreset): void {
    writeRow(
      rows.value.length,
      createEffectTriggerPreset(preset, effect.value, layout),
    );
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <p class="text-xs text-muted">
      {{ EFFECT_TRIGGERS_STEP_LABELS.hint }}
    </p>

    <p
      v-if="rows.length === 0"
      class="rounded-md border border-dashed border-default px-3 py-2 text-center text-xs text-dimmed"
    >
      {{ EFFECT_TRIGGERS_STEP_LABELS.empty }}
    </p>

    <EffectTriggerRow
      v-for="(rowEntry, index) in rowEntries"
      :key="rowEntry.key"
      :trigger="rowEntry.trigger"
      :layout="layout"
      :source-save-dc="sourceSaveDc"
      :known-tags="knownTags"
      @update:trigger="writeRow(index, $event)"
      @remove="removeRow(index)"
    />

    <div class="flex flex-wrap items-center gap-1.5">
      <span class="text-xs text-muted">
        {{ EFFECT_TRIGGERS_STEP_LABELS.addTitle }}
      </span>

      <UButton
        v-for="presetOption in presets"
        :key="presetOption.preset"
        color="primary"
        variant="soft"
        size="xs"
        :icon="presetOption.icon"
        :label="presetOption.label"
        @click.left.exact.prevent="addPreset(presetOption.preset)"
      />
    </div>
  </div>
</template>
