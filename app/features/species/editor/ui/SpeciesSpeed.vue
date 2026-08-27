<script setup lang="ts">
  import type { SpeciesCreateSpeed } from '../../model';

  import { InfoTooltip } from '~ui/tooltip';

  import {
    SPECIES_OPTIONAL_SPEED_KINDS,
    SPECIES_SPEED_EDITOR,
  } from '../../model';

  /**
   * Скорости вида одной сеткой, как в форме вида системы D&D: ходьба и три
   * необязательных способа передвижения видны сразу, пустой показывается нулём.
   */
  const speed = defineModel<SpeciesCreateSpeed>({ required: true });

  type OptionalSpeedKind = (typeof SPECIES_OPTIONAL_SPEED_KINDS)[number];

  /**
   * Значение поля необязательной скорости: пустая показывается нулём.
   *
   * @param kind вид скорости.
   * @returns дальность в футах либо 0.
   */
  function getSpeedValue(kind: OptionalSpeedKind): number {
    return speed.value[kind] ?? 0;
  }

  /**
   * Записывает необязательную скорость. Ноль в поле — способа передвижения нет:
   * в записи скорость остаётся пустой, а не нулём. Вместе с полётом снимается и
   * признак «Парит» — без полёта он не имеет смысла.
   *
   * @param kind вид скорости.
   * @param value значение поля.
   */
  function setSpeedValue(
    kind: OptionalSpeedKind,
    value: number | null | undefined,
  ): void {
    const next = typeof value === 'number' && value > 0 ? value : undefined;

    speed.value = {
      ...speed.value,
      [kind]: next,
      hover: kind === 'fly' && next === undefined ? false : speed.value.hover,
    };
  }

  const hasFlight = computed(() => (speed.value.fly ?? 0) > 0);
</script>

<template>
  <div class="col-span-full flex flex-col gap-3">
    <InfoTooltip
      :text="SPECIES_SPEED_EDITOR.titleHint"
      icon="tabler:info-circle-filled"
      class="text-sm font-medium text-highlighted"
    >
      <span class="flex items-center gap-2">
        <UIcon
          name="tabler:run"
          class="size-4 text-primary"
        />

        {{ SPECIES_SPEED_EDITOR.title }}
      </span>
    </InfoTooltip>

    <UForm
      class="grid grid-cols-2 gap-3 md:grid-cols-4"
      attach
      :state="speed"
    >
      <UFormField
        :label="SPECIES_SPEED_EDITOR.labels.walk"
        name="base"
      >
        <UInputNumber
          v-model="speed.base"
          :min="0"
          :max="SPECIES_SPEED_EDITOR.max"
          class="w-full"
        />
      </UFormField>

      <UFormField
        v-for="kind in SPECIES_OPTIONAL_SPEED_KINDS"
        :key="kind"
        :label="SPECIES_SPEED_EDITOR.labels[kind]"
        :name="kind"
      >
        <UInputNumber
          :model-value="getSpeedValue(kind)"
          :min="0"
          :max="SPECIES_SPEED_EDITOR.max"
          class="w-full"
          @update:model-value="setSpeedValue(kind, $event)"
        />
      </UFormField>
    </UForm>

    <UCheckbox
      v-if="hasFlight"
      v-model="speed.hover"
      :label="SPECIES_SPEED_EDITOR.hover"
    />

    <p class="text-xs text-dimmed">
      {{ SPECIES_SPEED_EDITOR.levelHint }}
    </p>
  </div>
</template>
