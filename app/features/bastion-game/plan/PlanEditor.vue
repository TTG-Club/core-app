<script setup lang="ts">
  import type { PlanPoint } from '../composables';
  import type {
    CellSide,
    DoorKind,
    FurnitureKind,
    PlanSelection,
    PlanTool,
    PlayerBastion,
    RoomKind,
    StairKind,
    StairTarget,
    TowerShape,
  } from '../model';

  import { fillTemplate } from '~bastions/model';
  import { UiResult } from '~ui/result';

  import { usePlanEditor, usePlanInteraction } from '../composables';
  import {
    addLevel,
    canMergeRooms,
    canRemoveLevel,
    createPaletteFacilities,
    getPlanLevels,
    getSelectedRooms,
    getStairTargetLevel,
    getTowerStairFrame,
    mergeRooms,
    PLAN_CORRIDOR_WIDTHS,
    PLAN_EDIT_TOOLS,
    PLAN_FURNITURE_ROTATION_STEP,
    PLAN_LABELS,
    PLAN_LIMITS,
    PLAN_TOOL_GROUPS,
    PLAN_TOOL_HINTS,
    pruneSelection,
    removeLevel,
    removeObjects,
    updateRoom,
  } from '../model';
  import {
    PlanCanvas,
    PlanFacilityList,
    PlanLevelBar,
    PlanParticipants,
    PlanRoomList,
    PlanRoomPanel,
    PlanToolbar,
    PlanToolOptions,
  } from './ui';

  /**
   * Редактор плана бастиона — упрощённый редактор карт: комнаты на сетке,
   * стены по их границам, двери, окна, лестницы, колонны и башни: круглые,
   * квадратные, пятиугольные и восьмиугольные.
   * Смотреть план могут все участники игры, рисовать — мастер и игроки с
   * доступом; для остальных и по ссылке «поделиться» редактор открывается
   * только на просмотр.
   */
  const { bastion, shareToken = undefined } = defineProps<{
    bastion: PlayerBastion;
    /** Секрет ссылки, если план открыт по ней. */
    shareToken?: string;
  }>();

  const editor = usePlanEditor(
    () => bastion.id,
    () => shareToken,
  );

  const canvas = useTemplateRef('canvas');

  const tool = ref<PlanTool>('select');
  const level = ref(0);
  const selection = shallowRef<PlanSelection>([]);

  /** Единственная выбранная комната: её показывает карточка комнаты. */
  const selectedRoomId = computed<string | undefined>({
    get: () => {
      const [first] = selection.value;

      return selection.value.length === 1 && first?.kind === 'room'
        ? first.id
        : undefined;
    },
    set: (id) => {
      selection.value = id ? [{ kind: 'room', id }] : [];
    },
  });

  const doorKind = ref<DoorKind>('DOOR');
  const stairKind = ref<StairKind>('STRAIGHT');
  const stairTarget = ref<StairTarget>();
  const stairDirection = ref<CellSide>('N');
  const spiralSide = ref<number>();
  const towerShape = ref<TowerShape>('ROUND');
  const corridorWidth = ref<number>(PLAN_CORRIDOR_WIDTHS[0]);
  const furnitureKind = ref<FurnitureKind>('TABLE');
  const furnitureRotation = ref(0);

  const interaction = usePlanInteraction({
    editor,
    tool,
    level,
    selection,
    selectedRoomId,
    doorKind,
    stairKind,
    stairTarget,
    stairDirection,
    spiralSide,
    towerShape,
    corridorWidth,
    furnitureKind,
    furnitureRotation,
  });

  /**
   * Поворачивает предмет, который сейчас поставит инструмент мебели.
   *
   * @param direction 1 — по часовой, -1 — против.
   */
  function rotateFurniture(direction: 1 | -1 = 1): void {
    furnitureRotation.value =
      (furnitureRotation.value + direction * PLAN_FURNITURE_ROTATION_STEP + 360)
      % 360;
  }

  /**
   * Меняет размер винтовой лестницы на шаг в две клетки — так она остаётся
   * по центру башни. Над башней размер отсчитывается от того, что в неё
   * встанет, и не выходит за то, что она вмещает.
   *
   * @param direction -1 — больше, 1 — меньше.
   */
  function resizeSpiral(direction: 1 | -1): void {
    const point = interaction.hoverPoint.value;

    const frame = point
      ? getTowerStairFrame(
          editor.document.value,
          level.value,
          point,
          spiralSide.value,
        )
      : undefined;

    const largest = point
      ? getTowerStairFrame(editor.document.value, level.value, point)
      : undefined;

    const current =
      frame?.width ?? spiralSide.value ?? PLAN_LIMITS.maxStairSide;

    const limit = largest?.width ?? PLAN_LIMITS.maxStairSide;

    spiralSide.value = Math.min(limit, Math.max(1, current - direction * 2));
  }

  /**
   * Ctrl+колесо: у мебели поворот, у лестницы размер винтовой.
   *
   * @param direction Куда повернули колесо.
   */
  function handleWheelStep(direction: 1 | -1): void {
    if (tool.value === 'stairs') {
      resizeSpiral(direction);
    } else {
      rotateFurniture(direction);
    }
  }

  const facilities = computed(() =>
    createPaletteFacilities(bastion.members, editor.document.value),
  );

  const facilityColors = computed(
    () =>
      new Map(
        facilities.value.map((facility) => [facility.id, facility.color]),
      ),
  );

  const facilityAreas = computed(
    () =>
      new Map(
        facilities.value.map((facility) => [
          facility.id,
          { used: facility.used, squares: facility.squares },
        ]),
      ),
  );

  const levels = computed(() => getPlanLevels(editor.document.value));

  const levelRooms = computed(() =>
    editor.document.value.rooms.filter((room) => room.level === level.value),
  );

  const selectedRoom = computed(() =>
    editor.document.value.rooms.find(
      (room) => room.id === selectedRoomId.value,
    ),
  );

  const stairLevel = computed(() =>
    getStairTargetLevel(editor.document.value, level.value, stairTarget.value),
  );

  const hasLevelAbove = computed(() => levels.value.includes(level.value + 1));
  const hasLevelBelow = computed(() => levels.value.includes(level.value - 1));

  const canRemoveCurrentLevel = computed(() =>
    canRemoveLevel(editor.document.value, level.value),
  );

  /** Указатели соавторов на текущем этаже. */
  const cursors = computed(() =>
    editor.participants.value.flatMap((participant) =>
      participant.pointer?.level === level.value
        ? [
            {
              point: { x: participant.pointer.x, y: participant.pointer.y },
              name: participant.name,
              color: participant.color,
            },
          ]
        : [],
    ),
  );

  /** Состояние сохранения для значка рядом с кнопкой. */
  const saveState = computed(() => {
    if (!editor.canEdit.value) {
      return { label: PLAN_LABELS.readOnly, color: 'neutral' as const };
    }

    if (!editor.isConnected.value) {
      return { label: PLAN_LABELS.offline, color: 'warning' as const };
    }

    if (editor.isSaving.value) {
      return { label: PLAN_LABELS.saving, color: 'neutral' as const };
    }

    if (editor.isDirty.value) {
      return { label: PLAN_LABELS.unsaved, color: 'warning' as const };
    }

    return { label: PLAN_LABELS.allSaved, color: 'success' as const };
  });

  const toolHint = computed(() => {
    if (tool.value === 'wall' && level.value !== 0) {
      return PLAN_LABELS.wallsGroundOnly;
    }

    if (tool.value === 'tower' && towerShape.value === 'SQUARE') {
      return PLAN_LABELS.squareTowerHint;
    }

    return PLAN_TOOL_HINTS[tool.value];
  });

  const wallsText = computed(() => {
    const cells = editor.document.value.defenseWalls.length;

    return cells
      ? fillTemplate(PLAN_LABELS.wallsSummary, {
          cells,
          cost: (cells * PLAN_LIMITS.wallCostPerCell).toLocaleString('ru-RU'),
          days: cells * PLAN_LIMITS.wallDaysPerCell,
        })
      : '';
  });

  const toolByKey = new Map(
    PLAN_TOOL_GROUPS.flat().map((option) => [option.key, option.tool]),
  );

  // Без права правки остаётся только панорама; инструмент рисования в режиме
  // просмотра ничего бы не делал. Право приходит с загрузкой плана — тогда
  // редактор открывается с выбором комнат.
  watch(
    editor.canEdit,
    (canEdit) => {
      tool.value = canEdit ? 'select' : 'pan';
    },
    { immediate: true },
  );

  // Удалённые или отменённые объекты больше не выбраны; на другом этаже
  // выбор тоже снимается — он относится к текущему этажу. Цикла нет:
  // выбор не источник этого наблюдателя, а pruneSelection возвращает тот же
  // массив, если ничего не ушло.
  watch([editor.document, level], ([document, currentLevel]) => {
    selection.value = pruneSelection(document, selection.value, currentLevel);
  });

  // Этаж мог пропасть после отмены — тогда показывается первый.
  watch(levels, (current) => {
    if (!current.includes(level.value)) {
      level.value = 0;
    }
  });

  /**
   * Нажатие в поле ввода не должно переключать инструменты.
   *
   * @param target Элемент, где нажата клавиша.
   * @returns true, если это поле ввода.
   */
  function isTyping(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || (target instanceof HTMLElement && target.isContentEditable)
    );
  }

  /**
   * Горячие клавиши: отмена и повтор, удаление комнаты, сброс жеста и буквы
   * инструментов.
   *
   * @param event Нажатие клавиши.
   */
  function handleKeydown(event: KeyboardEvent): void {
    if (isTyping(event.target)) {
      return;
    }

    const key = event.key.toLowerCase();

    if ((event.ctrlKey || event.metaKey) && key === 'z') {
      event.preventDefault();

      if (event.shiftKey) {
        editor.redo();
      } else {
        editor.undo();
      }

      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (event.key === 'Escape') {
      interaction.cancel();
      selection.value = [];

      return;
    }

    if (
      (event.key === 'Delete' || event.key === 'Backspace')
      && editor.canEdit.value
    ) {
      deleteSelection();

      return;
    }

    // У мебели R поворачивает предмет перед установкой, а не берёт комнату.
    if (key === 'r' && tool.value === 'furniture' && editor.canEdit.value) {
      rotateFurniture();

      return;
    }

    const next = toolByKey.get(key);

    if (next && (editor.canEdit.value || !PLAN_EDIT_TOOLS.has(next))) {
      tool.value = next;
    }
  }

  useEventListener('keydown', handleKeydown);

  /**
   * Переименовывает выбранную комнату.
   *
   * @param name Новое название.
   */
  function renameRoom(name: string): void {
    if (selectedRoomId.value) {
      editor.commit(
        updateRoom(editor.document.value, selectedRoomId.value, { name }),
      );
    }
  }

  /**
   * Меняет вид выбранной комнаты.
   *
   * @param kind Вид.
   */
  function changeRoomKind(kind: RoomKind): void {
    if (selectedRoomId.value) {
      editor.commit(
        updateRoom(editor.document.value, selectedRoomId.value, { kind }),
      );
    }
  }

  /**
   * Назначает выбранной комнате сооружение или снимает его.
   *
   * @param facilityId Сооружение или undefined.
   */
  function changeRoomFacility(facilityId: string | undefined): void {
    if (selectedRoomId.value) {
      editor.commit(
        updateRoom(editor.document.value, selectedRoomId.value, { facilityId }),
      );
    }
  }

  const selectedRooms = computed(() =>
    getSelectedRooms(editor.document.value, selection.value),
  );

  const canMergeSelected = computed(() => canMergeRooms(selectedRooms.value));

  /** Удаляет все выбранные объекты одним шагом истории. */
  function deleteSelection(): void {
    if (selection.value.length) {
      editor.commit(removeObjects(editor.document.value, selection.value));
      selection.value = [];
    }
  }

  /** Объединяет выбранные комнаты в первую выбранную и выбирает её. */
  function mergeSelectedRooms(): void {
    const [target] = selectedRooms.value;

    if (target && canMergeSelected.value) {
      editor.commit(
        mergeRooms(
          editor.document.value,
          selectedRooms.value.map((room) => room.id),
        ),
      );

      selection.value = [{ kind: 'room', id: target.id }];
    }
  }

  const isContextMenuOpen = ref(false);
  const contextMenuPosition = shallowRef({ x: 0, y: 0 });

  /** Невидимая точка, у которой открывается контекстное меню. */
  const contextMenuContent = computed(() => {
    const { x, y } = contextMenuPosition.value;

    return {
      align: 'start' as const,
      side: 'bottom' as const,
      reference: { getBoundingClientRect: () => new DOMRect(x, y, 0, 0) },
    };
  });

  const contextMenuItems = computed(() => [
    {
      label: PLAN_LABELS.mergeRooms,
      description: canMergeSelected.value
        ? undefined
        : PLAN_LABELS.mergeRoomsHint,
      icon: 'tabler:layers-union',
      disabled: !canMergeSelected.value,
      onSelect: mergeSelectedRooms,
    },
    {
      label: PLAN_LABELS.removeSelected,
      icon: 'tabler:trash',
      color: 'error' as const,
      kbds: ['delete'],
      onSelect: deleteSelection,
    },
  ]);

  /**
   * Правая кнопка без панорамы: меню над несколькими выбранными комнатами.
   *
   * @param position Точка окна, где отпустили кнопку.
   */
  function handleContextMenu(position: { x: number; y: number }): void {
    if (editor.canEdit.value && selectedRooms.value.length > 1) {
      contextMenuPosition.value = position;
      isContextMenuOpen.value = true;
    }
  }

  /**
   * Добавляет этаж выше или подвал и переходит на него.
   *
   * @param direction Вверх или вниз.
   */
  function handleAddLevel(direction: 'up' | 'down'): void {
    const result = addLevel(editor.document.value, direction);

    if (result.level !== undefined) {
      editor.commit(result.document);
      level.value = result.level;
    }
  }

  /** Убирает пустой текущий этаж и переходит на первый. */
  function handleRemoveLevel(): void {
    editor.commit(removeLevel(editor.document.value, level.value));
    level.value = 0;
  }

  /**
   * Движение указателя: жест редактора и указатель для соавторов.
   *
   * @param point Точка на плане.
   */
  function handlePointMove(point: PlanPoint): void {
    interaction.handleMove(point);
    editor.setPointer({ ...point, level: level.value });
  }

  /** Указатель ушёл с холста. */
  function handlePointLeave(): void {
    interaction.handleLeave();
    editor.setPointer(undefined);
  }

  /**
   * Зум кнопками.
   *
   * @param direction Крупнее или мельче.
   */
  function zoom(direction: 'in' | 'out'): void {
    canvas.value?.zoomStep(direction);
  }

  /** Ставит середину плана в центр холста. */
  function centerPlan(): void {
    canvas.value?.centerPlan();
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <PlanToolbar
        v-model:tool="tool"
        v-model:furniture-kind="furnitureKind"
        v-model:tower-shape="towerShape"
        :can-edit="editor.canEdit.value"
        :premium="editor.isPremium.value"
        :can-undo="editor.canUndo.value"
        :can-redo="editor.canRedo.value"
        @undo="editor.undo"
        @redo="editor.redo"
      />

      <div class="flex flex-wrap items-center gap-2">
        <PlanLevelBar
          v-model:level="level"
          :levels
          :can-edit="editor.canEdit.value"
          :can-remove="canRemoveCurrentLevel"
          @add="handleAddLevel"
          @remove="handleRemoveLevel"
        />

        <PlanParticipants :participants="editor.participants.value" />

        <UBadge
          :color="saveState.color"
          variant="subtle"
        >
          {{ saveState.label }}
        </UBadge>

        <UTooltip
          v-if="editor.canEdit.value"
          :text="PLAN_LABELS.save"
        >
          <UButton
            icon="tabler:device-floppy"
            :aria-label="PLAN_LABELS.save"
            :loading="editor.isSaving.value"
            :disabled="!editor.isDirty.value"
            @click.left.exact.prevent="editor.save"
          />
        </UTooltip>
      </div>
    </div>

    <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div class="relative h-[70vh] min-h-[28rem]">
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
            ref="canvas"
            :document="editor.document.value"
            :level
            :tool
            :selection
            :facility-colors="facilityColors"
            :facility-areas="facilityAreas"
            :preview="interaction.preview.value"
            :hover-point="interaction.hoverPoint.value"
            :cursors
            :furniture-kind="furnitureKind"
            :furniture-rotation="furnitureRotation"
            :spiral-side="spiralSide"
            @point-down="interaction.handleDown"
            @point-move="handlePointMove"
            @point-up="interaction.handleUp"
            @point-leave="handlePointLeave"
            @wheel-step="handleWheelStep"
            @context-menu="handleContextMenu"
          />

          <UDropdownMenu
            v-model:open="isContextMenuOpen"
            :items="contextMenuItems"
            :content="contextMenuContent"
          />

          <div class="absolute top-2 right-2 flex gap-1">
            <UTooltip :text="PLAN_LABELS.centerPlan">
              <UButton
                icon="tabler:focus-centered"
                :aria-label="PLAN_LABELS.centerPlan"
                color="neutral"
                variant="outline"
                size="xs"
                @click.left.exact.prevent="centerPlan"
              />
            </UTooltip>

            <UButton
              icon="tabler:minus"
              :aria-label="PLAN_LABELS.zoomOut"
              color="neutral"
              variant="outline"
              size="xs"
              @click.left.exact.prevent="zoom('out')"
            />

            <UButton
              icon="tabler:plus"
              :aria-label="PLAN_LABELS.zoomIn"
              color="neutral"
              variant="outline"
              size="xs"
              @click.left.exact.prevent="zoom('in')"
            />
          </div>

          <p
            class="pointer-events-none absolute right-3 bottom-2 left-3 text-xs text-muted"
          >
            {{ toolHint }}
          </p>
        </ClientOnly>
      </div>

      <aside
        class="flex flex-col gap-5 rounded-lg border border-default bg-muted p-3"
      >
        <PlanToolOptions
          v-if="editor.canEdit.value"
          v-model:door-kind="doorKind"
          v-model:stair-kind="stairKind"
          v-model:stair-target="stairTarget"
          v-model:stair-direction="stairDirection"
          v-model:spiral-side="spiralSide"
          v-model:corridor-width="corridorWidth"
          v-model:furniture-rotation="furnitureRotation"
          :tool
          :stair-level="stairLevel"
          :has-level-above="hasLevelAbove"
          :has-level-below="hasLevelBelow"
        />

        <PlanRoomPanel
          v-if="selectedRoom"
          :room="selectedRoom"
          :facilities
          :can-edit="editor.canEdit.value"
          @rename="renameRoom"
          @change-kind="changeRoomKind"
          @change-facility="changeRoomFacility"
          @remove="deleteSelection"
        />

        <PlanRoomList
          v-model:selected="selectedRoomId"
          :rooms="levelRooms"
        />

        <PlanFacilityList :facilities />

        <section
          v-if="wallsText"
          class="flex flex-col gap-1"
        >
          <h3 class="text-sm font-semibold text-highlighted">
            {{ PLAN_LABELS.walls }}
          </h3>

          <p class="text-xs text-muted tabular-nums">
            {{ wallsText }}
          </p>
        </section>
      </aside>
    </div>
  </div>
</template>
