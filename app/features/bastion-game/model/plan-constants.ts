import type {
  BuildingKind,
  DoorKind,
  OutlineType,
  PassageKind,
} from './plan-schema';

/** Ограничения плана — те же, что проверяет сервер (`PlanRules`). */
export const PLAN_LIMITS = {
  /** Сторона участка в клетках: 200 клеток — 1000 футов. */
  gridSize: 200,
  maxFloors: 10,
  minLevel: -3,
  maxLevel: 9,
  maxPolygonPoints: 64,
  /** Цена клетки защитной стены, зм, и срок постройки, дни. */
  wallCostPerCell: 250,
  wallDaysPerCell: 10,
} as const;

/** Размер клетки на холсте при масштабе 1, пикселей. */
export const PLAN_CELL_PIXELS = 24;
/** Куда смотрит пустой план на старте: немного от угла участка, в клетках. */
export const PLAN_START_FOCUS = { x: 10, y: 10 } as const;
export const PLAN_ZOOM_MIN = 0.25;
export const PLAN_ZOOM_MAX = 4;
export const PLAN_ZOOM_STEP = 1.1;
/** Сколько шагов отмены хранит редактор. */
export const PLAN_HISTORY_LIMIT = 100;

/** Инструменты редактора плана. */
export const PLAN_TOOLS = [
  'select',
  'pan',
  'rectangle',
  'circle',
  'polygon',
  'brush',
  'eraser',
  'door',
  'window',
  'stairs',
  'passage',
  'wall',
] as const;

export type PlanTool = (typeof PLAN_TOOLS)[number];

/** Инструменты, которыми можно рисовать; в режиме просмотра их нет. */
export const PLAN_EDIT_TOOLS: ReadonlySet<PlanTool> = new Set(
  PLAN_TOOLS.filter((tool) => tool !== 'pan'),
);

export const PLAN_TOOL_OPTIONS: ReadonlyArray<{
  tool: PlanTool;
  icon: string;
  label: string;
}> = [
  { tool: 'select', icon: 'tabler:pointer', label: 'Выбрать и двигать корпус' },
  { tool: 'pan', icon: 'tabler:hand-stop', label: 'Двигать холст' },
  { tool: 'rectangle', icon: 'tabler:square', label: 'Корпус-прямоугольник' },
  { tool: 'circle', icon: 'tabler:circle', label: 'Круглый корпус' },
  { tool: 'polygon', icon: 'tabler:polygon', label: 'Корпус-многоугольник' },
  { tool: 'brush', icon: 'tabler:brush', label: 'Кисть сооружения' },
  { tool: 'eraser', icon: 'tabler:eraser', label: 'Ластик' },
  { tool: 'door', icon: 'tabler:door', label: 'Дверь' },
  { tool: 'window', icon: 'tabler:window', label: 'Окно' },
  { tool: 'stairs', icon: 'tabler:stairs', label: 'Лестница' },
  { tool: 'passage', icon: 'tabler:route', label: 'Переход' },
  { tool: 'wall', icon: 'tabler:wall', label: 'Защитная стена' },
];

/** Вид нового корпуса по инструменту, которым нарисован контур. */
export const OUTLINE_BUILDING_KINDS: Record<OutlineType, BuildingKind> = {
  CIRCLE: 'TOWER',
  RECTANGLE: 'KEEP',
  POLYGON: 'WING',
};

export const BUILDING_KIND_LABELS: Record<BuildingKind, string> = {
  TOWER: 'Башня',
  KEEP: 'Донжон',
  WING: 'Крыло',
  HALL: 'Зал',
  OUTBUILDING: 'Флигель',
};

export const DOOR_KIND_LABELS: Record<DoorKind, string> = {
  DOOR: 'Дверь',
  LOCKED: 'Запертая дверь',
  SECRET: 'Секретная дверь',
  PORTCULLIS: 'Решётка',
};

export const PASSAGE_KIND_LABELS: Record<PassageKind, string> = {
  CORRIDOR: 'Коридор',
  RAMP: 'Пандус',
  GALLERY: 'Галерея',
  BRIDGE: 'Мост',
};

/**
 * Цвета сооружений на холсте. Холст рисует WebGL, CSS-токены туда не
 * доходят, поэтому палитра задана числами; подобраны так, чтобы читаться и
 * на светлом, и на тёмном фоне.
 */
export const PLAN_FACILITY_COLORS = [
  0x5b8def, 0xd9a441, 0x5fb37a, 0xc2645a, 0x9b6fd1, 0x3fb0b8, 0xd07cb0,
  0x8a9a5b, 0xe07b39, 0x6c7fd8,
] as const;

export const PLAN_LABELS = {
  title: 'План бастиона',
  open: 'План бастиона',
  back: 'К бастиону',
  save: 'Сохранить',
  saved: 'План сохранён',
  saveError: 'Не удалось сохранить план',
  loadError: 'Не удалось загрузить план',
  unsaved: 'Есть несохранённые изменения',
  readOnly: 'Только просмотр',
  undo: 'Отменить',
  redo: 'Повторить',
  level: 'Этаж',
  groundLevel: '1 этаж',
  levelLabel: '{floor} этаж',
  basementLabel: 'Подвал {depth}',
  buildings: 'Корпуса',
  noBuildings:
    'Корпусов пока нет. Нарисуйте прямоугольник, круг или многоугольник.',
  buildingName: 'Название',
  buildingKind: 'Вид',
  floors: 'Этажи',
  addFloorUp: 'Этаж выше',
  addFloorDown: 'Подвал',
  removeFloor: 'Убрать этаж',
  removeBuilding: 'Удалить корпус',
  facilities: 'Сооружения',
  noFacilities:
    'У персонажей ещё нет сооружений — выберите их на странице бастиона.',
  area: '{used} / {max}',
  doorKind: 'Вид двери',
  passageKind: 'Вид перехода',
  walls: 'Защитная стена: {cells} кл. — {cost} зм, {days} дн.',
  polygonHint: 'Щёлкайте вершины; замкните, щёлкнув первую, или нажмите Enter.',
  brushHint: 'Выберите сооружение справа и закрашивайте клетки внутри корпуса.',
  newBuilding: '{kind} {number}',
  cellsPerFloor: '{cells} кл. на этаж',
} as const;
