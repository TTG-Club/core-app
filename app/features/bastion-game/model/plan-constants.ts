import type {
  CellSide,
  DoorKind,
  FurnitureKind,
  RoomKind,
  StairKind,
  TowerShape,
} from './plan-schema';

/** Ограничения плана — те же, что проверяет сервер (`PlanRules`). */
export const PLAN_LIMITS = {
  /** Сторона участка в клетках: 200 клеток — 1000 футов. */
  gridSize: 200,
  maxFloors: 10,
  minLevel: -3,
  maxLevel: 9,
  minTowerRadius: 1,
  maxTowerRadius: 25,
  /** Сторона квадратной башни в клетках. */
  minSquareTowerSide: 2,
  maxSquareTowerSide: 50,
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
/** Шаг поворота мебели, градусы. */
export const PLAN_FURNITURE_ROTATION_STEP = 90;
/** Не чаще одного шага Ctrl+колесом (поворот мебели, размер лестницы) за столько миллисекунд. */
export const PLAN_WHEEL_ROTATE_MS = 150;

/**
 * Размер мебели в клетках без поворота: ширина по x, глубина по y. Те же
 * числа у сервера (`PlanDocument.FurnitureKind`).
 */
export const PLAN_FURNITURE_SIZES: Record<
  FurnitureKind,
  { width: number; depth: number }
> = {
  TABLE: { width: 2, depth: 1 },
  CHAIR: { width: 1, depth: 1 },
  WARDROBE: { width: 2, depth: 1 },
  SOFA: { width: 2, depth: 1 },
  BED: { width: 1, depth: 2 },
  CHEST: { width: 1, depth: 1 },
  STATUE: { width: 1, depth: 1 },
  FOUNTAIN: { width: 2, depth: 2 },
  ALTAR: { width: 2, depth: 1 },
  THRONE: { width: 1, depth: 1 },
  BOOKSHELF: { width: 2, depth: 1 },
  FIREPLACE: { width: 2, depth: 1 },
  DINING_TABLE: { width: 4, depth: 2 },
  BARREL: { width: 1, depth: 1 },
  PANTRY_RACK: { width: 2, depth: 1 },
  WORKBENCH: { width: 2, depth: 1 },
  ANVIL: { width: 1, depth: 1 },
  ALCHEMY_TABLE: { width: 2, depth: 1 },
  WEAPON_RACK: { width: 2, depth: 1 },
  TRAINING_DUMMY: { width: 1, depth: 1 },
  CAGE: { width: 2, depth: 2 },
  RUG: { width: 3, depth: 2 },
  TAPESTRY: { width: 2, depth: 1 },
  WELL: { width: 1, depth: 1 },
  TREE: { width: 2, depth: 2 },
  FLOWERBED: { width: 2, depth: 1 },
  TELESCOPE: { width: 1, depth: 1 },
  MAGIC_CIRCLE: { width: 3, depth: 3 },
};

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

/**
 * Насколько можно сдвинуть указатель с зажатой правой кнопкой, чтобы это
 * считалось щелчком (контекстное меню), а не панорамой, — пикселей экрана.
 */
export const PLAN_CONTEXT_MENU_TOLERANCE = 4;

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
  'furniture',
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
      label: 'Выбрать и двигать',
      key: 'v',
    },
    { tool: 'pan', icon: 'tabler:hand-stop', label: 'Двигать лист', key: 'h' },
  ],
  [
    { tool: 'room', icon: 'tabler:square', label: 'Комната', key: 'r' },
    {
      tool: 'tower',
      icon: 'tabler:building-castle',
      label: 'Башня',
      key: 't',
    },
    { tool: 'corridor', icon: 'tabler:route', label: 'Коридор', key: 'c' },
    { tool: 'eraser', icon: 'tabler:eraser', label: 'Ластик', key: 'e' },
  ],
  [
    { tool: 'door', icon: 'tabler:door', label: 'Дверь', key: 'd' },
    { tool: 'window', icon: 'tabler:window', label: 'Окно', key: 'w' },
    { tool: 'stairs', icon: 'tabler:stairs', label: 'Лестница', key: 's' },
    { tool: 'column', icon: 'tabler:circle-dot', label: 'Колонна', key: 'o' },
    { tool: 'wall', icon: 'tabler:wall', label: 'Защитная стена', key: 'g' },
    { tool: 'furniture', icon: 'tabler:armchair', label: 'Интерьер', key: 'f' },
  ],
];

/** Подсказка к инструменту под холстом. */
export const PLAN_TOOL_HINTS: Record<PlanTool, string> = {
  select:
    'Щёлкните объект, чтобы выбрать его; Shift+щелчок добавляет к выбору, рамка с пустого места выбирает всё внутри. Тяните выбранное, чтобы переставить. Delete удаляет выбранное, правая кнопка над несколькими комнатами открывает меню.',
  pan: 'Тяните лист. Колесо — масштаб.',
  room: 'Тяните прямоугольник. Если начать внутри выбранной комнаты, она расширится.',
  tower: 'Тяните от центра башни наружу. Форму выбирают на кнопке «Башня».',
  corridor:
    'Ведите по клеткам. Коридор, начатый на другом коридоре, продолжает его.',
  eraser:
    'Щёлкните дверь, окно, колонну или лестницу, чтобы убрать их; ведите по клеткам, чтобы стереть пол.',
  door: 'Щёлкните по стене или по кольцу башни. Повторный щелчок по двери меняет её вид. На защитной стене дверь становится воротами: ведите вдоль стены, чтобы сделать их шире, щелчок по воротам закладывает проём.',
  window: 'Щёлкните по стене или по кольцу башни.',
  stairs:
    'Щёлкните клетку или тяните в сторону подъёма: рамка задаёт длину и ширину. Щелчок внутри башни ставит винтовую лестницу, Ctrl+колесо меняет её размер.',
  column: 'Щёлкните в центр клетки или на пересечение линий сетки.',
  wall: 'Ведите по клеткам снаружи комнат первого этажа. Ворота ставит инструмент «Дверь».',
  furniture:
    'Выберите предмет на кнопке «Интерьер». Ctrl+колесо или R поворачивают его до установки. Стоящий предмет можно перетащить, щелчок по нему поворачивает его.',
};

export const ROOM_KIND_LABELS: Record<RoomKind, string> = {
  ROOM: 'Комната',
  CORRIDOR: 'Коридор',
  COURTYARD: 'Двор',
  TOWER: 'Круглая башня',
  SQUARE_TOWER: 'Квадратная башня',
};

export const TOWER_SHAPE_LABELS: Record<TowerShape, string> = {
  ROUND: 'Круглая',
  SQUARE: 'Квадратная',
  PENTAGON: 'Пятиугольная',
  OCTAGON: 'Восьмиугольная',
};

/** Вид башни в названии новой башни и в карточке комнаты. */
export const TOWER_SHAPE_ROOM_LABELS: Record<TowerShape, string> = {
  ROUND: 'Круглая башня',
  SQUARE: 'Квадратная башня',
  PENTAGON: 'Пятиугольная башня',
  OCTAGON: 'Восьмиугольная башня',
};

export const TOWER_SHAPE_ICONS: Record<TowerShape, string> = {
  ROUND: 'tabler:circle',
  SQUARE: 'tabler:square',
  PENTAGON: 'tabler:pentagon',
  OCTAGON: 'tabler:octagon',
};

/** Число сторон многоугольной башни; круглой и квадратной здесь нет. */
export const TOWER_SHAPE_SIDES: Partial<Record<TowerShape, number>> = {
  PENTAGON: 5,
  OCTAGON: 8,
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

export const FURNITURE_KIND_LABELS: Record<FurnitureKind, string> = {
  TABLE: 'Стол',
  CHAIR: 'Стул',
  WARDROBE: 'Шкаф',
  SOFA: 'Диван',
  BED: 'Кровать',
  CHEST: 'Сундук',
  STATUE: 'Статуя',
  FOUNTAIN: 'Фонтан',
  ALTAR: 'Алтарь',
  THRONE: 'Трон',
  BOOKSHELF: 'Книжный стеллаж',
  FIREPLACE: 'Камин',
  DINING_TABLE: 'Обеденный стол',
  BARREL: 'Бочка',
  PANTRY_RACK: 'Стеллаж кладовой',
  WORKBENCH: 'Верстак',
  ANVIL: 'Наковальня',
  ALCHEMY_TABLE: 'Алхимический стол',
  WEAPON_RACK: 'Оружейная стойка',
  TRAINING_DUMMY: 'Манекен',
  CAGE: 'Клетка',
  RUG: 'Ковёр',
  TAPESTRY: 'Гобелен',
  WELL: 'Колодец',
  TREE: 'Дерево',
  FLOWERBED: 'Клумба',
  TELESCOPE: 'Телескоп',
  MAGIC_CIRCLE: 'Магический круг',
};

export const FURNITURE_KIND_ICONS: Record<FurnitureKind, string> = {
  TABLE: 'tabler:table',
  CHAIR: 'tabler:chair-director',
  WARDROBE: 'tabler:layout-columns',
  SOFA: 'tabler:sofa',
  BED: 'tabler:bed',
  CHEST: 'tabler:box',
  STATUE: 'tabler:building-monument',
  FOUNTAIN: 'tabler:fountain',
  ALTAR: 'tabler:candle',
  THRONE: 'tabler:crown',
  BOOKSHELF: 'tabler:books',
  FIREPLACE: 'tabler:flame',
  DINING_TABLE: 'tabler:tools-kitchen-2',
  BARREL: 'tabler:barrel',
  PANTRY_RACK: 'tabler:packages',
  WORKBENCH: 'tabler:hammer',
  ANVIL: 'tabler:tools',
  ALCHEMY_TABLE: 'tabler:flask',
  WEAPON_RACK: 'tabler:sword',
  TRAINING_DUMMY: 'tabler:target',
  CAGE: 'tabler:border-all',
  RUG: 'tabler:rectangle',
  TAPESTRY: 'tabler:flag',
  WELL: 'tabler:bucket',
  TREE: 'tabler:tree',
  FLOWERBED: 'tabler:flower',
  TELESCOPE: 'tabler:telescope',
  MAGIC_CIRCLE: 'tabler:pentagram',
};

export const STAIR_KIND_LABELS: Record<StairKind, string> = {
  STRAIGHT: 'Прямая',
  SPIRAL: 'Винтовая',
};

export const STAIR_KIND_ICONS: Record<StairKind, string> = {
  STRAIGHT: 'tabler:stairs',
  SPIRAL: 'tabler:spiral',
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
  saving: 'Сохраняю…',
  allSaved: 'Сохранено',
  offline: 'Нет связи: соавторы не видят правок',
  participants: 'Сейчас рисуют',
  readOnly: 'Только просмотр',
  undo: 'Отменить',
  redo: 'Повторить',
  zoomIn: 'Крупнее',
  zoomOut: 'Мельче',
  centerPlan: 'Центрировать',
  level: 'Этаж',
  levelsMenu: 'Этаж',
  addLevelUp: 'Добавить этаж выше',
  addLevelDown: 'Добавить подвал',
  removeLevel: 'Убрать этаж',
  removeLevelHint: 'Убрать можно только пустой крайний этаж',
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
  removeSelected: 'Удалить',
  mergeRooms: 'Объединить',
  mergeRoomsHint: 'Башни и комнаты разных этажей не объединяются',
  facilities: 'Сооружения',
  noFacilities:
    'У персонажей ещё нет сооружений — выберите их на странице бастиона.',
  area: '{used} / {max}',
  areaLabel: '{used} / {max} кл.',
  doorKind: 'Вид двери',
  furnitureKind: 'Предмет',
  premiumFurniture: 'По подписке',
  premiumFurnitureLocked:
    'По подписке: доступно, когда подписка есть у владельца бастиона',
  furnitureRotation: 'Поворот',
  rotateFurniture: 'Повернуть (R, Ctrl+колесо)',
  degrees: '{degrees}°',
  stairKind: 'Вид лестницы',
  spiralHint: 'Щёлкните внутри башни — лестница займёт её середину.',
  spiralSize: 'Размер винтовой лестницы',
  spiralSizeAuto: 'Наибольший',
  spiralSizeHint: 'Ctrl+колесо над башней меняет размер.',
  spiralSmaller: 'Меньше',
  spiralLarger: 'Больше',
  squareTowerHint:
    'Тяните квадрат от угла башни. Форму выбирают на кнопке «Башня».',
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
  stairsNeedLevel: 'Лестница ведёт на другой этаж: сначала добавьте этаж.',
  wallsBlocks: 'Блоков стены: {placed} из {limit}',
  wallsLimitReached:
    'Все купленные блоки стены уже стоят на плане. Купите ещё блоки в бастионе.',
  wallsNoBlocks:
    'Блоки защитной стены ещё не куплены. Купите их в бастионе, чтобы поставить стену.',
  wallsOverLimit:
    'На плане больше блоков стены, чем куплено. Уберите лишние ластиком.',
  wallsEnclosed:
    'Бастион полностью окружён стеной: при атаке бросается на 2 кубика меньше.',
  wallsOpen: 'Стена не замыкает бастион: до комнат можно дойти снаружи.',
  newRoom: '{kind} {number}',
} as const;
