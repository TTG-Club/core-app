import type { CellSide, DoorKind, RoomKind, StairKind } from './plan-schema';

/** Ограничения плана — те же, что проверяет сервер (`PlanRules`). */
export const PLAN_LIMITS = {
  /** Сторона участка в клетках: 200 клеток — 1000 футов. */
  gridSize: 200,
  maxFloors: 10,
  minLevel: -3,
  maxLevel: 9,
  minTowerRadius: 1,
  maxTowerRadius: 25,
  maxStairSide: 10,
  /** Шаг угла проёма в стене башни, градусы. */
  towerAngleStep: 22.5,
  /** Цена клетки защитной стены, зм, и срок постройки, дни. */
  wallCostPerCell: 250,
  wallDaysPerCell: 10,
} as const;

/** Футов в одной клетке. */
export const PLAN_FEET_PER_CELL = 5;
/** Размер клетки на холсте при масштабе 1, пикселей. */
export const PLAN_CELL_PIXELS = 24;
/** Куда смотрит пустой план на старте: немного от угла участка, в клетках. */
export const PLAN_START_FOCUS = { x: 12, y: 12 } as const;
export const PLAN_ZOOM_MIN = 0.25;
export const PLAN_ZOOM_MAX = 4;
export const PLAN_ZOOM_STEP = 1.1;
/** Сколько шагов отмены хранит редактор. */
export const PLAN_HISTORY_LIMIT = 100;
/** Ширина коридора по умолчанию и варианты, клеток. */
export const PLAN_CORRIDOR_WIDTHS = [1, 2, 3] as const;

/**
 * Насколько близко к ребру или кольцу башни нужно щёлкнуть, чтобы попасть в
 * дверь, окно или колонну, — в долях клетки.
 */
export const PLAN_HIT_TOLERANCE = {
  edge: 0.25,
  tower: 0.6,
  column: 0.35,
} as const;

/**
 * Пропорции элементов карты в долях клетки: толщина стен, размеры дверей и
 * окон, радиус колонны.
 */
export const PLAN_SHAPES = {
  wallWidth: 0.18,
  towerWallWidth: 0.5,
  doorLength: 0.7,
  doorThickness: 0.26,
  windowLength: 0.8,
  windowThickness: 0.18,
  columnRadius: 0.26,
  stepsPerCell: 3,
} as const;

/** Инструменты редактора плана. */
export const PLAN_TOOLS = [
  'select',
  'pan',
  'room',
  'tower',
  'corridor',
  'eraser',
  'door',
  'window',
  'stairs',
  'column',
  'wall',
] as const;

export type PlanTool = (typeof PLAN_TOOLS)[number];

/** Инструменты, которыми можно рисовать; в режиме просмотра их нет. */
export const PLAN_EDIT_TOOLS: ReadonlySet<PlanTool> = new Set(
  PLAN_TOOLS.filter((tool) => tool !== 'pan'),
);

/** Группы инструментов на панели: навигация, пол, детали. */
export const PLAN_TOOL_GROUPS: ReadonlyArray<
  ReadonlyArray<{ tool: PlanTool; icon: string; label: string; key: string }>
> = [
  [
    {
      tool: 'select',
      icon: 'tabler:pointer',
      label: 'Выбрать и двигать комнату',
      key: 'v',
    },
    { tool: 'pan', icon: 'tabler:hand-stop', label: 'Двигать лист', key: 'h' },
  ],
  [
    { tool: 'room', icon: 'tabler:square', label: 'Комната', key: 'r' },
    { tool: 'tower', icon: 'tabler:circle', label: 'Круглая башня', key: 't' },
    { tool: 'corridor', icon: 'tabler:route', label: 'Коридор', key: 'c' },
    { tool: 'eraser', icon: 'tabler:eraser', label: 'Ластик', key: 'e' },
  ],
  [
    { tool: 'door', icon: 'tabler:door', label: 'Дверь', key: 'd' },
    { tool: 'window', icon: 'tabler:window', label: 'Окно', key: 'w' },
    { tool: 'stairs', icon: 'tabler:stairs', label: 'Лестница', key: 's' },
    { tool: 'column', icon: 'tabler:circle-dot', label: 'Колонна', key: 'o' },
    { tool: 'wall', icon: 'tabler:wall', label: 'Защитная стена', key: 'g' },
  ],
];

/** Подсказка к инструменту под холстом. */
export const PLAN_TOOL_HINTS: Record<PlanTool, string> = {
  select:
    'Щёлкните комнату, чтобы выбрать её; тяните, чтобы переставить. Delete удаляет.',
  pan: 'Тяните лист. Колесо — масштаб.',
  room: 'Тяните прямоугольник. Если начать внутри выбранной комнаты, она расширится.',
  tower: 'Тяните от центра башни наружу.',
  corridor:
    'Ведите по клеткам. Коридор, начатый на другом коридоре, продолжает его.',
  eraser:
    'Щёлкните дверь, окно, колонну или лестницу, чтобы убрать их; ведите по клеткам, чтобы стереть пол.',
  door: 'Щёлкните по стене или по кольцу башни. Повторный щелчок по двери меняет её вид.',
  window: 'Щёлкните по стене или по кольцу башни.',
  stairs:
    'Щёлкните клетку или тяните в сторону подъёма: рамка задаёт длину и ширину.',
  column: 'Щёлкните в центр клетки или на пересечение линий сетки.',
  wall: 'Ведите по клеткам снаружи комнат первого этажа.',
};

export const ROOM_KIND_LABELS: Record<RoomKind, string> = {
  ROOM: 'Комната',
  CORRIDOR: 'Коридор',
  COURTYARD: 'Двор',
  TOWER: 'Башня',
};

/** Виды, между которыми можно переключить нарисованную на сетке комнату. */
export const GRID_ROOM_KINDS: ReadonlyArray<RoomKind> = [
  'ROOM',
  'CORRIDOR',
  'COURTYARD',
];

export const DOOR_KIND_LABELS: Record<DoorKind, string> = {
  DOOR: 'Дверь',
  LOCKED: 'Запертая',
  SECRET: 'Потайная',
  PORTCULLIS: 'Решётка',
  ARCH: 'Проём',
};

export const STAIR_KIND_LABELS: Record<StairKind, string> = {
  STRAIGHT: 'Прямая',
  SPIRAL: 'Винтовая',
};

/** Куда ведёт новая лестница: на ближайший этаж выше или ниже. */
export const STAIR_TARGETS = ['up', 'down'] as const;

export type StairTarget = (typeof STAIR_TARGETS)[number];

export const STAIR_TARGET_LABELS: Record<StairTarget, string> = {
  up: 'Вверх',
  down: 'Вниз',
};

export const DIRECTION_ICONS: Record<CellSide, string> = {
  N: 'tabler:arrow-up',
  E: 'tabler:arrow-right',
  S: 'tabler:arrow-down',
  W: 'tabler:arrow-left',
};

export const DIRECTION_LABELS: Record<CellSide, string> = {
  N: 'Подъём на север',
  E: 'Подъём на восток',
  S: 'Подъём на юг',
  W: 'Подъём на запад',
};

/**
 * Цвета сооружений в списке и метки на холсте. Холст рисует WebGL, CSS-токены
 * туда не доходят, поэтому палитра задана числами; подобраны так, чтобы
 * читаться и на светлом, и на тёмном фоне.
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
  zoomIn: 'Крупнее',
  zoomOut: 'Мельче',
  level: 'Этаж',
  addLevelUp: 'Добавить этаж выше',
  addLevelDown: 'Добавить подвал',
  removeLevel: 'Убрать этаж',
  removeLevelHint: 'Убрать можно только пустой верхний этаж или нижний подвал',
  levelLabel: '{floor} этаж',
  basementLabel: 'Подвал {depth}',
  rooms: 'Комнаты этажа',
  noRooms: 'На этаже пусто. Нарисуйте комнату (R) или башню (T).',
  roomName: 'Название',
  roomKind: 'Вид',
  roomFacility: 'Сооружение',
  noFacility: 'Без сооружения',
  roomArea: '{cells} кл. · {feet} кв. фт.',
  removeRoom: 'Удалить',
  facilities: 'Сооружения',
  noFacilities:
    'У персонажей ещё нет сооружений — выберите их на странице бастиона.',
  area: '{used} / {max}',
  areaLabel: '{used} / {max} кл.',
  doorKind: 'Вид двери',
  stairKind: 'Вид лестницы',
  stairTarget: 'Куда ведёт',
  stairDirection: 'Подъём при щелчке',
  stairNoTarget: 'Нет этажа выше или ниже — добавьте его.',
  stairLeadsTo: 'Ведёт на: {level}',
  stairUp: 'Вверх',
  stairDown: 'Вниз',
  secretDoorMark: 'С',
  corridorWidth: 'Ширина коридора',
  feet: '{feet} фт.',
  rectangleSize: '{width}×{height} фт.',
  walls: 'Защитная стена',
  wallsSummary: '{cells} кл. · {cost} зм · {days} дн. постройки',
  wallsGroundOnly: 'Защитная стена строится только на первом этаже.',
  newRoom: '{kind} {number}',
} as const;
