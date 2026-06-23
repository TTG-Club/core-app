<script setup lang="ts">
  import {
    DEFAULT_SPELL_EFFECT_FLAG,
    SPELL_EFFECT_FLAG_LABEL_MAP,
    SPELL_EFFECT_FLAG_OPTIONS,
  } from '../../model';
  import SpellEffectLibraryInput from './SpellEffectLibraryInput.vue';

  const model = defineModel<Array<string>>({ default: () => [] });

  function addFlag() {
    model.value = [...model.value, DEFAULT_SPELL_EFFECT_FLAG];
  }

  function removeFlag(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }

  function updateFlag(index: number, value: string) {
    model.value = model.value.map((flag, position) =>
      position === index ? value : flag,
    );
  }

  function getFlagLabel(flag: string): string | undefined {
    return SPELL_EFFECT_FLAG_LABEL_MAP[flag];
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium">Флаги (состояния и иммунитеты)</span>

      <UButton
        icon="tabler:plus"
        size="xs"
        variant="ghost"
        @click.left.exact.prevent="addFlag"
      >
        Добавить
      </UButton>
    </div>

    <p
      v-if="!model.length"
      class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
    >
      Нет активных флагов.
    </p>

    <div
      v-for="(flag, index) in model"
      :key="index"
      class="flex flex-col gap-1 rounded-lg border border-default bg-elevated/50 p-3"
    >
      <div class="flex items-center gap-2">
        <SpellEffectLibraryInput
          :model-value="flag"
          :options="SPELL_EFFECT_FLAG_OPTIONS"
          placeholder="Напр.: vision.blinded"
          @update:model-value="updateFlag(index, $event)"
        />

        <UButton
          icon="tabler:trash"
          color="error"
          variant="soft"
          @click.left.exact.prevent="removeFlag(index)"
        />
      </div>

      <span
        v-if="getFlagLabel(flag)"
        class="text-xs text-muted italic"
      >
        {{ getFlagLabel(flag) }}
      </span>

      <span
        v-else-if="flag"
        class="text-xs text-warning/80 italic"
      >
        Кастомный или неизвестный флаг
      </span>
    </div>
  </div>
</template>
