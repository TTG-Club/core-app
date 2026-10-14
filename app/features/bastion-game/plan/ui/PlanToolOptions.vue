<script setup lang="ts">
  import type {
    CellSide,
    DoorKind,
    FurnitureKind,
    PlanTool,
    StairKind,
    StairTarget,
  } from '../../model';

  import { fillTemplate } from '~bastions/model';

  import {
    CELL_SIDES,
    DIRECTION_ICONS,
    DIRECTION_LABELS,
    DOOR_KIND_LABELS,
    DOOR_KINDS,
    FURNITURE_KIND_LABELS,
    FURNITURE_KINDS,
    getLevelLabel,
    PLAN_CORRIDOR_WIDTHS,
    PLAN_FEET_PER_CELL,
    PLAN_LABELS,
    STAIR_KIND_LABELS,
    STAIR_KINDS,
    STAIR_TARGET_LABELS,
    STAIR_TARGETS,
  } from '../../model';

  /**
   * Настройки выбранного инструмента: вид двери, вид и направление лестницы,
   * ширина коридора, предмет мебели. У остальных инструментов настроек нет.
   */
  const { tool, stairLevel } = defineProps<{
    tool: PlanTool;
    /** Куда поведёт новая лестница; undefined — некуда. */
    stairLevel: number | undefined;
    /** Есть ли этаж выше и ниже текущего. */
    hasLevelAbove: boolean;
    hasLevelBelow: boolean;
  }>();

  const doorKind = defineModel<DoorKind>('doorKind', { required: true });
  const stairKind = defineModel<StairKind>('stairKind', { required: true });

  const stairTarget = defineModel<StairTarget | undefined>('stairTarget', {
    required: true,
  });

  const stairDirection = defineModel<CellSide>('stairDirection', {
    required: true,
  });

  const corridorWidth = defineModel<number>('corridorWidth', {
    required: true,
  });

  const furnitureKind = defineModel<FurnitureKind>('furnitureKind', {
    required: true,
  });

  const doorItems = DOOR_KINDS.map((kind) => ({
    label: DOOR_KIND_LABELS[kind],
    value: kind,
  }));

  const stairKindItems = STAIR_KINDS.map((kind) => ({
    label: STAIR_KIND_LABELS[kind],
    value: kind,
  }));

  const stairText = computed(() =>
    stairLevel === undefined
      ? PLAN_LABELS.stairNoTarget
      : fillTemplate(PLAN_LABELS.stairLeadsTo, {
          level: getLevelLabel(stairLevel),
        }),
  );

  const stairTextClass = computed(() =>
    stairLevel === undefined ? 'text-error' : 'text-muted',
  );

  /**
   * Подпись ширины коридора в футах.
   *
   * @param width Ширина в клетках.
   * @returns «10 фт.».
   */
  function getWidthLabel(width: number): string {
    return fillTemplate(PLAN_LABELS.feet, { feet: width * PLAN_FEET_PER_CELL });
  }

  /**
   * Вид кнопки выбора: выбранная подсвечена.
   *
   * @param isActive Выбрана ли.
   * @returns Цвет и вид кнопки.
   */
  function getChoiceLook(isActive: boolean): {
    color: 'primary' | 'neutral';
    variant: 'solid' | 'outline';
  } {
    return isActive
      ? { color: 'primary', variant: 'solid' }
      : { color: 'neutral', variant: 'outline' };
  }

  /**
   * Выбирает, куда ведёт лестница; повторный щелчок снимает выбор.
   *
   * @param target Вверх или вниз.
   */
  function toggleStairTarget(target: StairTarget): void {
    stairTarget.value = stairTarget.value === target ? undefined : target;
  }

  /**
   * Есть ли этаж в выбранную сторону.
   *
   * @param target Вверх или вниз.
   * @param above Есть ли этаж выше.
   * @param below Есть ли этаж ниже.
   * @returns true, если есть.
   */
  function hasTarget(
    target: StairTarget,
    above: boolean,
    below: boolean,
  ): boolean {
    return target === 'up' ? above : below;
  }
</script>

<template>
  <section
    v-if="tool === 'door'"
    class="flex flex-col gap-2"
  >
    <UFormField :label="PLAN_LABELS.doorKind">
      <USelect
        id="plan-door-kind"
        v-model="doorKind"
        :items="doorItems"
        value-key="value"
        class="w-full"
      />
    </UFormField>
  </section>

  <section
    v-else-if="tool === 'stairs'"
    class="flex flex-col gap-3"
  >
    <UFormField :label="PLAN_LABELS.stairKind">
      <USelect
        id="plan-stair-kind"
        v-model="stairKind"
        :items="stairKindItems"
        value-key="value"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="PLAN_LABELS.stairTarget">
      <div class="flex gap-1">
        <UButton
          v-for="target in STAIR_TARGETS"
          :key="target"
          size="xs"
          v-bind="getChoiceLook(stairTarget === target)"
          :disabled="!hasTarget(target, hasLevelAbove, hasLevelBelow)"
          @click.left.exact.prevent="toggleStairTarget(target)"
        >
          {{ STAIR_TARGET_LABELS[target] }}
        </UButton>
      </div>
    </UFormField>

    <UFormField :label="PLAN_LABELS.stairDirection">
      <div class="flex gap-1">
        <UButton
          v-for="side in CELL_SIDES"
          :key="side"
          size="xs"
          :icon="DIRECTION_ICONS[side]"
          :aria-label="DIRECTION_LABELS[side]"
          v-bind="getChoiceLook(stairDirection === side)"
          @click.left.exact.prevent="stairDirection = side"
        />
      </div>
    </UFormField>

    <p
      class="text-xs"
      :class="stairTextClass"
    >
      {{ stairText }}
    </p>
  </section>

  <section
    v-else-if="tool === 'furniture'"
    class="flex flex-col gap-2"
  >
    <UFormField :label="PLAN_LABELS.furnitureKind">
      <div class="flex flex-wrap gap-1">
        <UButton
          v-for="kind in FURNITURE_KINDS"
          :key="kind"
          size="xs"
          v-bind="getChoiceLook(furnitureKind === kind)"
          @click.left.exact.prevent="furnitureKind = kind"
        >
          {{ FURNITURE_KIND_LABELS[kind] }}
        </UButton>
      </div>
    </UFormField>
  </section>

  <section
    v-else-if="tool === 'corridor'"
    class="flex flex-col gap-2"
  >
    <UFormField :label="PLAN_LABELS.corridorWidth">
      <div class="flex gap-1">
        <UButton
          v-for="width in PLAN_CORRIDOR_WIDTHS"
          :key="width"
          size="xs"
          v-bind="getChoiceLook(corridorWidth === width)"
          @click.left.exact.prevent="corridorWidth = width"
        >
          {{ getWidthLabel(width) }}
        </UButton>
      </div>
    </UFormField>
  </section>
</template>
