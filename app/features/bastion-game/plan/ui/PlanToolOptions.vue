<script setup lang="ts">
  import type {
    CellSide,
    DoorKind,
    PlanTool,
    StairKind,
    StairTarget,
    TowerShape,
  } from '../../model';

  import { fillTemplate } from '~bastions/model';

  import {
    CELL_SIDES,
    DIRECTION_ICONS,
    DIRECTION_LABELS,
    DOOR_KIND_LABELS,
    DOOR_KINDS,
    getLevelLabel,
    PLAN_CORRIDOR_WIDTHS,
    PLAN_FEET_PER_CELL,
    PLAN_FURNITURE_ROTATION_STEP,
    PLAN_LABELS,
    PLAN_LIMITS,
    STAIR_KIND_ICONS,
    STAIR_KIND_LABELS,
    STAIR_KINDS,
    STAIR_TARGET_LABELS,
    STAIR_TARGETS,
    TOWER_SHAPE_ICONS,
    TOWER_SHAPE_LABELS,
    TOWER_SHAPES,
  } from '../../model';

  /**
   * Настройки выбранного инструмента: форма башни, вид двери, вид,
   * направление лестницы и размер винтовой, ширина коридора, поворот мебели.
   * У остальных инструментов настроек нет.
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

  /** Заданная сторона винтовой лестницы; undefined — наибольшая. */
  const spiralSide = defineModel<number | undefined>('spiralSide', {
    required: true,
  });

  const towerShape = defineModel<TowerShape>('towerShape', {
    required: true,
  });

  const corridorWidth = defineModel<number>('corridorWidth', {
    required: true,
  });

  const furnitureRotation = defineModel<number>('furnitureRotation', {
    required: true,
  });

  const rotationText = computed(() =>
    fillTemplate(PLAN_LABELS.degrees, { degrees: furnitureRotation.value }),
  );

  /** Поворачивает предмет, который поставит инструмент мебели. */
  function rotateFurniture(): void {
    furnitureRotation.value =
      (furnitureRotation.value + PLAN_FURNITURE_ROTATION_STEP) % 360;
  }

  const isSpiral = computed(() => stairKind.value === 'SPIRAL');

  const spiralText = computed(() =>
    spiralSide.value === undefined
      ? PLAN_LABELS.spiralSizeAuto
      : getWidthLabel(spiralSide.value),
  );

  /**
   * Меняет заданный размер винтовой лестницы на две клетки — так она
   * остаётся по центру башни.
   *
   * @param direction 1 — больше, -1 — меньше.
   */
  function resizeSpiral(direction: 1 | -1): void {
    const current = spiralSide.value ?? PLAN_LIMITS.maxStairSide;

    spiralSide.value = Math.min(
      PLAN_LIMITS.maxStairSide,
      Math.max(1, current + direction * 2),
    );
  }

  const doorItems = DOOR_KINDS.map((kind) => ({
    label: DOOR_KIND_LABELS[kind],
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
    v-if="tool === 'tower'"
    class="flex flex-col gap-2"
  >
    <UFormField :label="PLAN_LABELS.towerShape">
      <div class="flex gap-1">
        <UButton
          v-for="shape in TOWER_SHAPES"
          :key="shape"
          size="xs"
          :icon="TOWER_SHAPE_ICONS[shape]"
          v-bind="getChoiceLook(towerShape === shape)"
          @click.left.exact.prevent="towerShape = shape"
        >
          {{ TOWER_SHAPE_LABELS[shape] }}
        </UButton>
      </div>
    </UFormField>
  </section>

  <section
    v-else-if="tool === 'door'"
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
      <div class="flex gap-1">
        <UButton
          v-for="kind in STAIR_KINDS"
          :key="kind"
          size="xs"
          :icon="STAIR_KIND_ICONS[kind]"
          v-bind="getChoiceLook(stairKind === kind)"
          @click.left.exact.prevent="stairKind = kind"
        >
          {{ STAIR_KIND_LABELS[kind] }}
        </UButton>
      </div>
    </UFormField>

    <p
      v-if="isSpiral"
      class="text-xs text-muted"
    >
      {{ PLAN_LABELS.spiralHint }}
    </p>

    <UFormField
      :label="PLAN_LABELS.spiralSize"
      :help="PLAN_LABELS.spiralSizeHint"
    >
      <div class="flex items-center gap-1">
        <UButton
          icon="tabler:minus"
          size="xs"
          color="neutral"
          variant="outline"
          :aria-label="PLAN_LABELS.spiralSmaller"
          :disabled="spiralSide === 1"
          @click.left.exact.prevent="resizeSpiral(-1)"
        />

        <span class="min-w-20 text-center text-sm text-muted tabular-nums">
          {{ spiralText }}
        </span>

        <UButton
          icon="tabler:plus"
          size="xs"
          color="neutral"
          variant="outline"
          :aria-label="PLAN_LABELS.spiralLarger"
          :disabled="spiralSide === undefined"
          @click.left.exact.prevent="resizeSpiral(1)"
        />

        <UButton
          v-if="spiralSide !== undefined"
          size="xs"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="spiralSide = undefined"
        >
          {{ PLAN_LABELS.spiralSizeAuto }}
        </UButton>
      </div>
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

    <UFormField
      v-if="!isSpiral"
      :label="PLAN_LABELS.stairDirection"
    >
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
    <UFormField :label="PLAN_LABELS.furnitureRotation">
      <div class="flex items-center gap-2">
        <UButton
          icon="tabler:rotate-clockwise"
          size="xs"
          color="neutral"
          variant="outline"
          @click.left.exact.prevent="rotateFurniture"
        >
          {{ PLAN_LABELS.rotateFurniture }}
        </UButton>

        <span class="text-sm text-muted tabular-nums">{{ rotationText }}</span>
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
