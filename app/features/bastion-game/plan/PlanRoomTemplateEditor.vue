<script setup lang="ts">
  import type {
    FacilityRoomTemplate,
    FurnitureKind,
    PlanDocument,
    PlanSelection,
    PlanTool,
    StairTarget,
  } from '../model';

  import { usePlanInteraction } from '../composables';
  import {
    createEmptyPlan,
    createTemplatePlan,
    FURNITURE_KIND_ICONS,
    FURNITURE_KIND_LABELS,
    FURNITURE_KINDS,
    getFurnitureSize,
    getSelectedIds,
    PLAN_CORRIDOR_WIDTHS,
    PLAN_FURNITURE_ROTATION_STEP,
    PLAN_LABELS,
    readTemplatePlan,
  } from '../model';
  import { PlanCanvas } from './ui';

  /**
   * Редактор шаблона готовой комнаты сооружения: та же сетка и мебель, что на
   * плане бастиона, но с одной комнатой. Шаблон правится инструментами
   * «Выбрать» (перетащить, повернуть щелчком, Delete — убрать) и «Интерьер».
   * Мебель, вынесенная за стены комнаты, в шаблон не попадает.
   */
  const { name } = defineProps<{
    /** Подпись комнаты на холсте. */
    name: string;
  }>();

  const template = defineModel<FacilityRoomTemplate>({ required: true });

  const canvas = useTemplateRef('canvas');

  const tool = ref<PlanTool>('select');
  const selection = shallowRef<PlanSelection>([]);
  const furnitureKind = ref<FurnitureKind>('TABLE');
  const furnitureRotation = ref(0);

  const document = shallowRef<PlanDocument>(createEmptyPlan());

  /** Шаблон, который редактор сам отдал наружу: на него план не пересобирается. */
  let emitted: FacilityRoomTemplate | undefined;

  /**
   * Отдаёт шаблон по текущему плану.
   *
   * @param next План редактора.
   */
  function emitTemplate(next: PlanDocument): void {
    emitted = readTemplatePlan(next, template.value);
    template.value = emitted;
  }

  // Шаблон пришёл снаружи (открытие, смена размера) — план собирается заново.
  // Свой же отданный шаблон пропускается, иначе правка сбрасывала бы выделение.
  watch(
    template,
    (next) => {
      if (next !== emitted) {
        document.value = createTemplatePlan(next, name);
        selection.value = [];
        nextTick(() => canvas.value?.centerPlan());
      }
    },
    { immediate: true },
  );

  const editor = {
    document,
    isPremium: computed(() => true),
    commit: (next: PlanDocument) => {
      document.value = next;
      emitTemplate(next);
    },
    beginStroke: () => undefined,
    applyInStroke: (next: PlanDocument) => {
      document.value = next;
    },
    endStroke: () => emitTemplate(document.value),
  };

  const interaction = usePlanInteraction({
    editor,
    tool,
    level: ref(0),
    selection,
    selectedRoomId: computed<string | undefined>({
      get: () => undefined,
      set: (id) => {
        selection.value = id ? [{ kind: 'room', id }] : [];
      },
    }),
    doorKind: ref('DOOR'),
    stairKind: ref('STRAIGHT'),
    stairTarget: ref<StairTarget>(),
    stairDirection: ref('N'),
    spiralSide: ref<number>(),
    towerShape: ref('ROUND'),
    corridorWidth: ref(PLAN_CORRIDOR_WIDTHS[0]),
    furnitureKind,
    furnitureRotation,
    wallLimit: ref<number>(),
  });

  // У шаблона нет сооружений с цветами и соавторов: холсту отдаются пустые.
  const noFacilityColors = new Map<string, number>();

  const noFacilityAreas = new Map<string, { used: number; squares: number }>();

  const furnitureItems = FURNITURE_KINDS.map((kind) => ({
    label: FURNITURE_KIND_LABELS[kind],
    value: kind,
    icon: FURNITURE_KIND_ICONS[kind],
  }));

  const selectedFurnitureIds = computed(() =>
    getSelectedIds(selection.value, 'furniture'),
  );

  /**
   * Берёт предмет для расстановки.
   *
   * @param kind Предмет.
   */
  function chooseFurniture(kind: FurnitureKind): void {
    furnitureKind.value = kind;
    tool.value = 'furniture';
  }

  /** Поворачивает предмет, который сейчас поставит инструмент мебели. */
  function rotateFurniture(): void {
    furnitureRotation.value =
      (furnitureRotation.value + PLAN_FURNITURE_ROTATION_STEP) % 360;
  }

  /** Убирает выбранные предметы; комнату шаблона убрать нельзя. */
  function removeSelected(): void {
    const ids = selectedFurnitureIds.value;

    if (!ids.size) {
      return;
    }

    editor.commit({
      ...document.value,
      furniture: document.value.furniture.filter((item) => !ids.has(item.id)),
    });

    selection.value = [];
  }

  /**
   * Delete убирает выбранное, пока фокус не в поле ввода формы.
   *
   * @param event Нажатие клавиши.
   */
  function handleKeydown(event: KeyboardEvent): void {
    const target = event.target;

    const isTyping =
      target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || (target instanceof HTMLElement && target.isContentEditable);

    if (!isTyping && (event.key === 'Delete' || event.key === 'Backspace')) {
      removeSelected();
    }
  }

  useEventListener('keydown', handleKeydown);

  const furnitureSizeText = computed(() => {
    const { width, depth } = getFurnitureSize({
      kind: furnitureKind.value,
      rotation: furnitureRotation.value,
    });

    return `${width}×${depth}`;
  });
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap items-center gap-1">
      <UTooltip :text="PLAN_LABELS.templateSelect">
        <UButton
          icon="tabler:pointer"
          :aria-label="PLAN_LABELS.templateSelect"
          :color="tool === 'select' ? 'primary' : 'neutral'"
          :variant="tool === 'select' ? 'solid' : 'ghost'"
          size="sm"
          @click.left.exact.prevent="tool = 'select'"
        />
      </UTooltip>

      <USelectMenu
        :model-value="furnitureKind"
        :items="furnitureItems"
        value-key="value"
        :icon="FURNITURE_KIND_ICONS[furnitureKind]"
        :color="tool === 'furniture' ? 'primary' : 'neutral'"
        size="sm"
        class="w-52"
        @update:model-value="chooseFurniture"
      />

      <UTooltip :text="PLAN_LABELS.templateRotate">
        <UButton
          icon="tabler:rotate-clockwise"
          :aria-label="PLAN_LABELS.templateRotate"
          color="neutral"
          variant="ghost"
          size="sm"
          :label="furnitureSizeText"
          @click.left.exact.prevent="rotateFurniture"
        />
      </UTooltip>

      <UButton
        icon="tabler:trash"
        :label="PLAN_LABELS.templateRemove"
        color="neutral"
        variant="ghost"
        size="sm"
        :disabled="!selectedFurnitureIds.size"
        @click.left.exact.prevent="removeSelected"
      />

      <div class="ml-auto flex items-center gap-1">
        <UButton
          icon="tabler:focus-centered"
          :aria-label="PLAN_LABELS.centerPlan"
          color="neutral"
          variant="ghost"
          size="sm"
          @click.left.exact.prevent="canvas?.centerPlan()"
        />

        <UButton
          icon="tabler:zoom-out"
          :aria-label="PLAN_LABELS.zoomOut"
          color="neutral"
          variant="ghost"
          size="sm"
          @click.left.exact.prevent="canvas?.zoomStep('out')"
        />

        <UButton
          icon="tabler:zoom-in"
          :aria-label="PLAN_LABELS.zoomIn"
          color="neutral"
          variant="ghost"
          size="sm"
          @click.left.exact.prevent="canvas?.zoomStep('in')"
        />
      </div>
    </div>

    <div class="h-80">
      <PlanCanvas
        ref="canvas"
        :document
        :level="0"
        :tool
        :selection
        :facility-colors="noFacilityColors"
        :facility-areas="noFacilityAreas"
        :preview="interaction.preview.value"
        :hover-point="interaction.hoverPoint.value"
        :cursors="[]"
        :furniture-kind="furnitureKind"
        :furniture-rotation="furnitureRotation"
        :spiral-side="undefined"
        @point-down="interaction.handleDown"
        @point-move="interaction.handleMove"
        @point-up="interaction.handleUp"
        @point-cancel="interaction.cancel"
        @point-leave="interaction.handleLeave"
      />
    </div>

    <p class="text-xs text-muted">
      {{ PLAN_LABELS.templateHint }}
    </p>
  </div>
</template>
