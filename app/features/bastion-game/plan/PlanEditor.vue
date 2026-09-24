<script setup lang="ts">
  import type {
    BuildingKind,
    DoorKind,
    PassageKind,
    PlanTool,
    PlayerBastion,
  } from '../model';

  import { fillTemplate } from '~bastions/model';
  import { UiResult } from '~ui/result';

  import { usePlanEditor, usePlanInteraction } from '../composables';
  import {
    addFloor,
    createPaletteFacilities,
    DOOR_KIND_LABELS,
    DOOR_KINDS,
    getLevelLabel,
    getPlanLevels,
    PASSAGE_KIND_LABELS,
    PASSAGE_KINDS,
    PLAN_LABELS,
    PLAN_LIMITS,
    removeBuilding,
    removeFloor,
    updateBuilding,
  } from '../model';
  import {
    PlanBuildingPanel,
    PlanCanvas,
    PlanFacilityPalette,
    PlanToolbar,
  } from './ui';

  /**
   * Редактор плана бастиона: холст, инструменты, этажи, корпуса и палитра
   * сооружений. Смотреть план могут все участники игры, рисовать — мастер и
   * игроки с доступом; для остальных редактор открывается только на просмотр.
   */
  const { bastion } = defineProps<{
    bastion: PlayerBastion;
  }>();

  const editor = usePlanEditor(() => bastion.id);

  const tool = ref<PlanTool>('select');
  const level = ref(0);
  const selectedBuildingId = ref<string>();
  const selectedFacilityId = ref<string>();
  const doorKind = ref<DoorKind>('DOOR');
  const passageKind = ref<PassageKind>('CORRIDOR');

  const palette = computed(() =>
    createPaletteFacilities(bastion.members, editor.document.value),
  );

  const facilityColors = computed(
    () =>
      new Map(palette.value.map((facility) => [facility.id, facility.color])),
  );

  const facilitySquares = computed(
    () =>
      new Map(palette.value.map((facility) => [facility.id, facility.squares])),
  );

  const interaction = usePlanInteraction({
    editor,
    tool,
    level,
    selectedBuildingId,
    selectedFacilityId,
    doorKind,
    passageKind,
    facilitySquares,
  });

  const levelItems = computed(() =>
    getPlanLevels(editor.document.value).map((value) => ({
      label: getLevelLabel(value),
      value,
    })),
  );

  const doorItems = DOOR_KINDS.map((kind) => ({
    label: DOOR_KIND_LABELS[kind],
    value: kind,
  }));

  const passageItems = PASSAGE_KINDS.map((kind) => ({
    label: PASSAGE_KIND_LABELS[kind],
    value: kind,
  }));

  const selectedBuilding = computed(() =>
    editor.document.value.buildings.find(
      (building) => building.id === selectedBuildingId.value,
    ),
  );

  const wallsText = computed(() => {
    const cells = editor.document.value.walls.length;

    return cells
      ? fillTemplate(PLAN_LABELS.walls, {
          cells,
          cost: cells * PLAN_LIMITS.wallCostPerCell,
          days: cells * PLAN_LIMITS.wallDaysPerCell,
        })
      : '';
  });

  const toolHint = computed(() => {
    if (tool.value === 'polygon') {
      return PLAN_LABELS.polygonHint;
    }

    return tool.value === 'brush' && !selectedFacilityId.value
      ? PLAN_LABELS.brushHint
      : '';
  });

  // Без права правки остаётся только панорама; инструмент рисования в режиме
  // просмотра ничего бы не делал.
  watch(
    editor.canEdit,
    (canEdit) => {
      if (!canEdit) {
        tool.value = 'pan';
      }
    },
    { immediate: true },
  );

  // Выбор сооружения в палитре — намерение рисовать им.
  watch(selectedFacilityId, (facilityId) => {
    if (facilityId && editor.canEdit.value) {
      tool.value = 'brush';
    }
  });

  // Удалённый или отменённый корпус больше не выбран.
  watch(selectedBuilding, (building) => {
    if (!building) {
      selectedBuildingId.value = undefined;
    }
  });

  useEventListener('keydown', (event: KeyboardEvent) => {
    const target = event.target;

    if (
      target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    if (event.key === 'Enter') {
      interaction.closePolygon();
    } else if (event.key === 'Escape') {
      interaction.cancelDraft();
    } else if (
      (event.ctrlKey || event.metaKey)
      && event.key.toLowerCase() === 'z'
    ) {
      event.preventDefault();

      if (event.shiftKey) {
        editor.redo();
      } else {
        editor.undo();
      }
    }
  });

  /**
   * Переименовывает выбранный корпус.
   *
   * @param name Новое название.
   */
  function renameBuilding(name: string): void {
    const id = selectedBuildingId.value;

    if (id) {
      editor.commit(
        updateBuilding(editor.document.value, id, (building) => ({
          ...building,
          name,
        })),
      );
    }
  }

  /**
   * Меняет вид выбранного корпуса.
   *
   * @param kind Вид.
   */
  function changeBuildingKind(kind: BuildingKind): void {
    const id = selectedBuildingId.value;

    if (id) {
      editor.commit(
        updateBuilding(editor.document.value, id, (building) => ({
          ...building,
          kind,
        })),
      );
    }
  }

  /**
   * Добавляет выбранному корпусу этаж выше или подвал.
   *
   * @param direction Вверх или вниз.
   */
  function addBuildingFloor(direction: 'up' | 'down'): void {
    const id = selectedBuildingId.value;

    if (id) {
      editor.commit(addFloor(editor.document.value, id, direction));
    }
  }

  /**
   * Убирает этаж выбранного корпуса.
   *
   * @param floorLevel Уровень этажа.
   */
  function removeBuildingFloor(floorLevel: number): void {
    const id = selectedBuildingId.value;

    if (id) {
      editor.commit(removeFloor(editor.document.value, id, floorLevel));
    }
  }

  /** Удаляет выбранный корпус. */
  function deleteBuilding(): void {
    const id = selectedBuildingId.value;

    if (id) {
      editor.commit(removeBuilding(editor.document.value, id));
      selectedBuildingId.value = undefined;
    }
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <PlanToolbar
        v-model:tool="tool"
        :can-edit="editor.canEdit.value"
        :can-undo="editor.canUndo.value"
        :can-redo="editor.canRedo.value"
        @undo="editor.undo"
        @redo="editor.redo"
      />

      <div class="flex flex-wrap items-center gap-2">
        <USelect
          id="plan-level"
          v-model="level"
          :items="levelItems"
          value-key="value"
          size="sm"
          class="w-32"
        />

        <UBadge
          v-if="!editor.canEdit.value"
          color="neutral"
          variant="subtle"
        >
          {{ PLAN_LABELS.readOnly }}
        </UBadge>

        <UBadge
          v-else-if="editor.isDirty.value"
          color="warning"
          variant="subtle"
        >
          {{ PLAN_LABELS.unsaved }}
        </UBadge>

        <UButton
          v-if="editor.canEdit.value"
          icon="tabler:device-floppy"
          :loading="editor.isSaving.value"
          :disabled="!editor.isDirty.value"
          @click.left.exact.prevent="editor.save"
        >
          {{ PLAN_LABELS.save }}
        </UButton>
      </div>
    </div>

    <p
      v-if="toolHint"
      class="text-sm text-muted"
    >
      {{ toolHint }}
    </p>

    <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div class="h-[70vh] min-h-[28rem]">
        <UiResult
          v-if="editor.status.value === 'error'"
          status="error"
          :title="PLAN_LABELS.loadError"
          :sub-title="editor.loadErrorMessage.value"
        />

        <USkeleton
          v-else-if="editor.status.value !== 'success'"
          class="h-full w-full"
        />

        <ClientOnly v-else>
          <PlanCanvas
            :document="editor.document.value"
            :level
            :tool
            :selected-building-id="selectedBuildingId"
            :facility-colors="facilityColors"
            :draft="interaction.draft.value"
            :hover-cell="interaction.hoverCell.value"
            @point-down="interaction.handleDown"
            @point-move="interaction.handleMove"
            @point-up="interaction.handleUp"
          />
        </ClientOnly>
      </div>

      <aside
        class="flex flex-col gap-5 rounded-lg border border-default bg-muted p-3"
      >
        <UFormField
          v-if="tool === 'door'"
          :label="PLAN_LABELS.doorKind"
        >
          <USelect
            id="plan-door-kind"
            v-model="doorKind"
            :items="doorItems"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="tool === 'passage'"
          :label="PLAN_LABELS.passageKind"
        >
          <USelect
            id="plan-passage-kind"
            v-model="passageKind"
            :items="passageItems"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <section class="flex flex-col gap-2">
          <h3 class="text-sm font-semibold text-highlighted">
            {{ PLAN_LABELS.buildings }}
          </h3>

          <p
            v-if="!editor.document.value.buildings.length"
            class="text-sm text-muted"
          >
            {{ PLAN_LABELS.noBuildings }}
          </p>

          <PlanBuildingPanel
            v-if="selectedBuilding"
            :building="selectedBuilding"
            :can-edit="editor.canEdit.value"
            @rename="renameBuilding"
            @change-kind="changeBuildingKind"
            @add-floor="addBuildingFloor"
            @remove-floor="removeBuildingFloor"
            @remove="deleteBuilding"
          />
        </section>

        <PlanFacilityPalette
          v-model:selected="selectedFacilityId"
          :facilities="palette"
          :can-edit="editor.canEdit.value"
        />

        <p
          v-if="wallsText"
          class="text-xs text-muted"
        >
          {{ wallsText }}
        </p>
      </aside>
    </div>
  </div>
</template>
