import type { Ref, ShallowRef } from 'vue';

import type {
  BuildingKind,
  DoorKind,
  PassageKind,
  PlanCell,
  PlanDocument,
  PlanOutline,
  PlanTool,
} from '../model';

import { fillTemplate } from '~bastions/model';

import {
  addBuilding,
  BUILDING_KIND_LABELS,
  eraseAt,
  findBuildingAt,
  getCellAt,
  getNearestEdge,
  isCellInside,
  moveBuilding,
  OUTLINE_BUILDING_KINDS,
  paintFacilityCell,
  paintPassage,
  paintWall,
  PLAN_LABELS,
  PLAN_LIMITS,
  snapToGrid,
  toggleDoor,
  toggleStair,
  toggleWindow,
} from '../model';

/** Черновик корпуса, пока его рисуют. */
export type PlanDraft =
  | { kind: 'outline'; outline: PlanOutline }
  | {
      kind: 'polyline';
      points: Array<[number, number]>;
      cursor: [number, number] | undefined;
    };

/** Точка холста в клетках (дробная). */
export interface PlanPoint {
  x: number;
  y: number;
}

interface PlanEditorApi {
  document: ShallowRef<PlanDocument>;
  commit: (next: PlanDocument) => void;
  beginStroke: () => void;
  applyInStroke: (next: PlanDocument) => void;
  endStroke: () => void;
}

interface PlanInteractionOptions {
  editor: PlanEditorApi;
  tool: Ref<PlanTool>;
  level: Ref<number>;
  selectedBuildingId: Ref<string | undefined>;
  selectedFacilityId: Ref<string | undefined>;
  doorKind: Ref<DoorKind>;
  passageKind: Ref<PassageKind>;
  /** Сооружение персонажа → площадь его пространства, клеток. */
  facilitySquares: Ref<Map<string, number>>;
}

/**
 * Прямоугольник по двум углам на сетке.
 *
 * @param anchor Угол, где начали тянуть.
 * @param point Текущая точка.
 * @returns Контур-прямоугольник не меньше клетки.
 */
function createRectangle(anchor: PlanPoint, point: PlanPoint): PlanOutline {
  const endX = snapToGrid(point.x, 1);
  const endY = snapToGrid(point.y, 1);

  const x = Math.min(anchor.x, endX);
  const y = Math.min(anchor.y, endY);

  return {
    type: 'RECTANGLE',
    x,
    y,
    width: Math.max(1, Math.abs(endX - anchor.x)),
    height: Math.max(1, Math.abs(endY - anchor.y)),
  };
}

/**
 * Окружность с центром на сетке (шаг полклетки) до текущей точки.
 *
 * @param center Центр.
 * @param point Текущая точка.
 * @returns Контур-окружность радиусом не меньше полклетки.
 */
function createCircle(center: PlanPoint, point: PlanPoint): PlanOutline {
  const radius = Math.hypot(point.x - center.x, point.y - center.y);

  return {
    type: 'CIRCLE',
    cx: center.x,
    cy: center.y,
    r: Math.max(0.5, snapToGrid(radius, 0.5)),
  };
}

/**
 * Лежит ли контур целиком на участке — иначе сервер его не примет.
 *
 * @param outline Контур.
 * @returns true, если на участке.
 */
function isOutlineOnGrid(outline: PlanOutline): boolean {
  const size = PLAN_LIMITS.gridSize;
  const inRange = (value: number) => value >= 0 && value <= size;

  switch (outline.type) {
    case 'CIRCLE':
      return (
        inRange(outline.cx - outline.r)
        && inRange(outline.cx + outline.r)
        && inRange(outline.cy - outline.r)
        && inRange(outline.cy + outline.r)
      );
    case 'RECTANGLE':
      return (
        inRange(outline.x)
        && inRange(outline.x + outline.width)
        && inRange(outline.y)
        && inRange(outline.y + outline.height)
      );
    default:
      return outline.points.every(([x, y]) => inRange(x) && inRange(y));
  }
}

/**
 * Инструменты редактора плана: что делает нажатие, движение и отпускание
 * указателя для каждого инструмента. Холст сообщает только точки в клетках,
 * вся логика — здесь.
 *
 * @param options Редактор, выбранные инструмент, этаж, корпус и сооружение.
 * @returns Черновик корпуса, клетка под указателем и обработчики.
 */
export function usePlanInteraction(options: PlanInteractionOptions) {
  const { editor, tool, level } = options;

  const draft = ref<PlanDraft>();
  const hoverCell = ref<PlanCell>();

  let anchor: PlanPoint | undefined;
  let dragCell: PlanCell | undefined;
  let isStroke = false;

  /**
   * Добавляет корпус по нарисованному контуру и выбирает его.
   *
   * @param outline Контур.
   */
  function finishBuilding(outline: PlanOutline): void {
    draft.value = undefined;

    if (!isOutlineOnGrid(outline)) {
      return;
    }

    const kind: BuildingKind = OUTLINE_BUILDING_KINDS[outline.type];
    const id = crypto.randomUUID();

    const number =
      editor.document.value.buildings.filter(
        (building) => building.kind === kind,
      ).length + 1;

    editor.commit(
      addBuilding(
        editor.document.value,
        {
          id,
          name: fillTemplate(PLAN_LABELS.newBuilding, {
            kind: BUILDING_KIND_LABELS[kind],
            number,
          }),
          kind,
          outline,
        },
        level.value,
      ),
    );

    options.selectedBuildingId.value = id;
  }

  /**
   * Правка в клетке для «рисующих» инструментов: кисть, ластик, переход, стена.
   *
   * @param cell Клетка под указателем.
   * @returns Новый документ.
   */
  function paintAt(cell: PlanCell): PlanDocument {
    const document = editor.document.value;

    switch (tool.value) {
      case 'brush': {
        const facilityId = options.selectedFacilityId.value;

        const squares = facilityId
          ? options.facilitySquares.value.get(facilityId)
          : undefined;

        return facilityId && squares
          ? paintFacilityCell(document, level.value, cell, {
              id: facilityId,
              squares,
            })
          : document;
      }
      case 'eraser':
        return eraseAt(document, level.value, cell);
      case 'passage':
        return paintPassage(
          document,
          level.value,
          cell,
          options.passageKind.value,
        );
      case 'wall':
        return level.value === 0 ? paintWall(document, cell) : document;
      default:
        return document;
    }
  }

  /**
   * Нажатие указателя.
   *
   * @param point Точка в клетках.
   */
  function handleDown(point: PlanPoint): void {
    const cell = getCellAt(point.x, point.y);
    const document = editor.document.value;

    switch (tool.value) {
      case 'select': {
        const building =
          findBuildingAt(document, level.value, cell)
          ?? document.buildings.findLast((item) =>
            isCellInside(item.outline, cell),
          );

        options.selectedBuildingId.value = building?.id;

        if (building) {
          dragCell = cell;
          editor.beginStroke();
          isStroke = true;
        }

        break;
      }
      case 'rectangle':
        anchor = { x: snapToGrid(point.x, 1), y: snapToGrid(point.y, 1) };

        draft.value = {
          kind: 'outline',
          outline: createRectangle(anchor, point),
        };

        break;
      case 'circle':
        anchor = { x: snapToGrid(point.x, 0.5), y: snapToGrid(point.y, 0.5) };
        draft.value = { kind: 'outline', outline: createCircle(anchor, point) };

        break;
      case 'polygon':
        addPolygonPoint(point);

        break;
      case 'door':
        editor.commit(
          toggleDoor(
            document,
            level.value,
            getNearestEdge(point.x, point.y),
            options.doorKind.value,
          ),
        );

        break;
      case 'window':
        editor.commit(
          toggleWindow(document, level.value, getNearestEdge(point.x, point.y)),
        );

        break;
      case 'stairs':
        editor.commit(toggleStair(document, level.value, cell));

        break;
      case 'brush':
      case 'eraser':
      case 'passage':
      case 'wall':
        editor.beginStroke();
        isStroke = true;
        editor.applyInStroke(paintAt(cell));

        break;
      default:
        break;
    }
  }

  /**
   * Движение указателя.
   *
   * @param point Точка в клетках.
   * @param isPressed Кнопка нажата.
   */
  function handleMove(point: PlanPoint, isPressed: boolean): void {
    const cell = getCellAt(point.x, point.y);

    hoverCell.value = cell;

    if (tool.value === 'polygon' && draft.value?.kind === 'polyline') {
      draft.value = {
        ...draft.value,
        cursor: [snapToGrid(point.x, 1), snapToGrid(point.y, 1)],
      };

      return;
    }

    if (!isPressed) {
      return;
    }

    switch (tool.value) {
      case 'select': {
        const buildingId = options.selectedBuildingId.value;

        if (!dragCell || !buildingId) {
          return;
        }

        const dx = cell.x - dragCell.x;
        const dy = cell.y - dragCell.y;

        if (dx || dy) {
          editor.applyInStroke(
            moveBuilding(editor.document.value, buildingId, dx, dy),
          );

          dragCell = cell;
        }

        break;
      }
      case 'rectangle':
        if (anchor) {
          draft.value = {
            kind: 'outline',
            outline: createRectangle(anchor, point),
          };
        }

        break;
      case 'circle':
        if (anchor) {
          draft.value = {
            kind: 'outline',
            outline: createCircle(anchor, point),
          };
        }

        break;
      case 'brush':
      case 'eraser':
      case 'passage':
      case 'wall':
        if (isStroke) {
          editor.applyInStroke(paintAt(cell));
        }

        break;
      default:
        break;
    }
  }

  /** Отпускание указателя: заканчивает мазок или рисование корпуса. */
  function handleUp(): void {
    if (isStroke) {
      editor.endStroke();
      isStroke = false;
    }

    dragCell = undefined;

    const isOutlineTool = tool.value === 'rectangle' || tool.value === 'circle';

    if (isOutlineTool && draft.value?.kind === 'outline') {
      finishBuilding(draft.value.outline);
    }

    anchor = undefined;
  }

  /**
   * Добавляет вершину многоугольника; щелчок по первой вершине замыкает его.
   *
   * @param point Точка в клетках.
   */
  function addPolygonPoint(point: PlanPoint): void {
    const vertex: [number, number] = [
      snapToGrid(point.x, 1),
      snapToGrid(point.y, 1),
    ];

    const points = draft.value?.kind === 'polyline' ? draft.value.points : [];
    const [first] = points;

    if (
      first
      && points.length >= 3
      && first[0] === vertex[0]
      && first[1] === vertex[1]
    ) {
      closePolygon();

      return;
    }

    if (points.length >= PLAN_LIMITS.maxPolygonPoints) {
      return;
    }

    draft.value = {
      kind: 'polyline',
      points: [...points, vertex],
      cursor: vertex,
    };
  }

  /** Замыкает многоугольник, если у него хотя бы три вершины. */
  function closePolygon(): void {
    if (draft.value?.kind !== 'polyline' || draft.value.points.length < 3) {
      return;
    }

    finishBuilding({ type: 'POLYGON', points: draft.value.points });
  }

  /** Бросает рисуемый корпус. */
  function cancelDraft(): void {
    draft.value = undefined;
    anchor = undefined;
  }

  // Смена инструмента бросает недорисованный корпус: иначе черновик остался бы
  // висеть на холсте без способа его закончить.
  watch(tool, cancelDraft);

  return {
    draft,
    hoverCell,
    handleDown,
    handleMove,
    handleUp,
    closePolygon,
    cancelDraft,
  };
}
