import type { MaybeRefOrGetter } from 'vue';

import { clamp } from 'es-toolkit';

/** Квадратная область кадрирования в пикселях исходного изображения. */
export interface CropArea {
  /** Отступ области от левого края изображения. */
  x: number;

  /** Отступ области от верхнего края изображения. */
  y: number;

  /** Сторона квадрата: ширина и высота области всегда равны. */
  size: number;
}

/** Размеры изображения в пикселях. */
export interface ImageSize {
  width: number;
  height: number;
}

/** Угол области, за который её тянут при изменении размера. */
export type CropCorner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

/** Направление сдвига области стрелками на клавиатуре. */
export type CropDirection = 'left' | 'right' | 'up' | 'down';

/** Доли изображения (проценты) — положение области в превью. */
interface CropAreaRatio {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Края, к которым примыкает угол: от них зависит, куда растёт область. */
const CROP_CORNER_EDGES: Record<
  CropCorner,
  { isLeft: boolean; isTop: boolean }
> = {
  topLeft: { isLeft: true, isTop: true },
  topRight: { isLeft: false, isTop: true },
  bottomLeft: { isLeft: true, isTop: false },
  bottomRight: { isLeft: false, isTop: false },
};

/** Куда сдвигается область по каждой из стрелок. */
const CROP_DIRECTION_OFFSETS: Record<CropDirection, { x: number; y: number }> =
  {
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
  };

/** Минимальная сторона области кадрирования в пикселях исходника. */
const MIN_CROP_SIZE = 48;

/**
 * Максимальная сторона результата. Больше не нужно: изображение персонажа
 * рисуется мелко, а сервер всё равно сжимает загруженный файл.
 */
const MAX_OUTPUT_SIZE = 1024;

/** Качество кодирования результата. */
const OUTPUT_QUALITY = 0.92;

/**
 * Формат результата. Браузер без поддержки кодирования webp вернёт png —
 * оба формата разрешены при загрузке, поэтому подмена безопасна.
 */
const OUTPUT_TYPE = 'image/webp';

/** Доля наибольшего квадрата, на которую меняется сторона за один шаг. */
const SIZE_STEP_RATIO = 0.05;

/** Доля наибольшего квадрата, на которую область сдвигается одной стрелкой. */
const MOVE_STEP_RATIO = 0.02;

/** Расширение файла, когда тип результата неизвестен. */
const FALLBACK_EXTENSION = 'png';

/** Имя файла результата, когда у исходника пустое имя. */
const FALLBACK_FILE_NAME = 'image';

const CANVAS_ERROR_MESSAGE = 'Canvas 2d context is not available';
const BLOB_ERROR_MESSAGE = 'Canvas encoding failed';

/**
 * Сторона наибольшего квадрата, который влезает в изображение.
 *
 * @param image размеры изображения.
 * @returns сторона в пикселях.
 */
function getMaxCropSize(image: ImageSize): number {
  return Math.min(image.width, image.height);
}

/**
 * Ограничивает сторону области: не меньше минимума — или всей картинки, если
 * она мельче минимума, — и не больше меньшей стороны изображения.
 *
 * @param size желаемая сторона в пикселях.
 * @param image размеры исходного изображения.
 * @returns допустимая сторона.
 */
function clampCropSize(size: number, image: ImageSize): number {
  const maxSize = getMaxCropSize(image);

  return clamp(size, Math.min(MIN_CROP_SIZE, maxSize), maxSize);
}

/**
 * Прижимает область к границам изображения: сторона не больше меньшей стороны
 * картинки, а сама область целиком внутри неё.
 *
 * @param area область кадрирования.
 * @param image размеры исходного изображения.
 * @returns область внутри границ изображения.
 */
export function clampCropArea(area: CropArea, image: ImageSize): CropArea {
  const size = clampCropSize(area.size, image);

  return {
    size,
    x: clamp(area.x, 0, image.width - size),
    y: clamp(area.y, 0, image.height - size),
  };
}

/**
 * Начальная область — наибольший квадрат по центру изображения.
 *
 * @param image размеры исходного изображения.
 * @returns область кадрирования.
 */
export function createInitialCropArea(image: ImageSize): CropArea {
  const size = getMaxCropSize(image);

  return {
    size,
    x: (image.width - size) / 2,
    y: (image.height - size) / 2,
  };
}

/**
 * Область после перетаскивания угла: противоположный угол остаётся на месте, а
 * сторона меняется на больший из сдвигов курсора — так область остаётся
 * квадратной при любом направлении перетаскивания.
 *
 * @param start область на момент нажатия.
 * @param corner угол, за который тянут.
 * @param delta сдвиг курсора в пикселях исходного изображения.
 * @param delta.x сдвиг по горизонтали.
 * @param delta.y сдвиг по вертикали.
 * @param image размеры исходного изображения.
 * @returns новая область кадрирования.
 */
export function resizeCropArea(
  start: CropArea,
  corner: CropCorner,
  delta: { x: number; y: number },
  image: ImageSize,
): CropArea {
  const { isLeft, isTop } = CROP_CORNER_EDGES[corner];
  const right = start.x + start.size;
  const bottom = start.y + start.size;

  const growth = Math.max(
    isLeft ? -delta.x : delta.x,
    isTop ? -delta.y : delta.y,
  );

  // Дальше неподвижного угла область не растёт: за ним начинается край картинки.
  const maxSize = Math.min(
    isLeft ? right : image.width - start.x,
    isTop ? bottom : image.height - start.y,
  );

  const size = clamp(
    start.size + growth,
    Math.min(MIN_CROP_SIZE, maxSize),
    maxSize,
  );

  return clampCropArea(
    {
      size,
      x: isLeft ? right - size : start.x,
      y: isTop ? bottom - size : start.y,
    },
    image,
  );
}

/**
 * Меняет сторону области, оставляя её центр на месте — так работают ползунок
 * размера и колесо мыши.
 *
 * @param area область кадрирования.
 * @param size желаемая сторона в пикселях исходника.
 * @param image размеры исходного изображения.
 * @returns новая область кадрирования.
 */
export function resizeCropAreaFromCenter(
  area: CropArea,
  size: number,
  image: ImageSize,
): CropArea {
  // Сторону ограничиваем до расчёта отступов: иначе центр съедет ровно на
  // половину той части запроса, которую ограничение отрезало.
  const nextSize = clampCropSize(size, image);
  const centerX = area.x + area.size / 2;
  const centerY = area.y + area.size / 2;

  return clampCropArea(
    { size: nextSize, x: centerX - nextSize / 2, y: centerY - nextSize / 2 },
    image,
  );
}

/**
 * Кодирует содержимое canvas. Тип результата может отличаться от запрошенного:
 * браузер без поддержки формата отдаёт png.
 *
 * @param canvas холст с вырезанной областью.
 * @returns закодированный файл или null, если кодирование не удалось.
 */
function encodeCanvas(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, OUTPUT_TYPE, OUTPUT_QUALITY);
  });
}

/**
 * Имя файла результата: имя исходника с расширением по типу результата.
 *
 * @param sourceName имя исходного файла.
 * @param type mime-тип результата.
 * @returns имя файла с расширением.
 */
function getCroppedFileName(sourceName: string, type: string): string {
  const extension = type.split('/').at(1) ?? FALLBACK_EXTENSION;
  const dotIndex = sourceName.lastIndexOf('.');
  const baseName = dotIndex > 0 ? sourceName.slice(0, dotIndex) : sourceName;

  return `${baseName.trim() || FALLBACK_FILE_NAME}.${extension}`;
}

/**
 * Вырезает выбранную область в новый файл. Сторона результата не превышает
 * `MAX_OUTPUT_SIZE`, а исходник не растягивается: мелкая область останется
 * мелкой, вместо того чтобы стать мыльной.
 *
 * @param image загруженное изображение.
 * @param area выбранная область в пикселях исходника.
 * @param sourceName имя исходного файла.
 * @returns файл с вырезанным квадратом.
 */
export async function createCroppedImageFile(
  image: HTMLImageElement,
  area: CropArea,
  sourceName: string,
): Promise<File> {
  const side = Math.round(Math.min(area.size, MAX_OUTPUT_SIZE));
  const canvas = document.createElement('canvas');

  canvas.width = side;
  canvas.height = side;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error(CANVAS_ERROR_MESSAGE);
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  context.drawImage(
    image,
    area.x,
    area.y,
    area.size,
    area.size,
    0,
    0,
    side,
    side,
  );

  const blob = await encodeCanvas(canvas);

  if (!blob) {
    throw new Error(BLOB_ERROR_MESSAGE);
  }

  return new File([blob], getCroppedFileName(sourceName, blob.type), {
    type: blob.type,
  });
}

/** Параметры кадрирования. */
interface UseImageCropOptions {
  /**
   * Элемент с загруженным изображением. По его размеру считается масштаб между
   * превью и исходником, а из него же вырезается результат.
   */
  imageElement: MaybeRefOrGetter<HTMLImageElement | null>;
}

/** Текущее перетаскивание: с какой точки и какой области оно началось. */
interface CropGesture {
  /** Угол, за который тянут; null — область перемещают целиком. */
  corner: CropCorner | null;
  pointerX: number;
  pointerY: number;
  area: CropArea;
}

/**
 * Выбор квадратной области на изображении: перемещение, изменение размера и
 * вырезание результата в файл. Соотношение сторон области всегда 1:1 и
 * пользователем не меняется.
 *
 * @param options элемент с изображением.
 * @returns состояние области, обработчики жестов и вырезание результата.
 */
export function useImageCrop(options: UseImageCropOptions) {
  const naturalSize = shallowRef<ImageSize | null>(null);

  // shallowRef: область всегда заменяется целиком, следить за её полями незачем.
  const area = shallowRef<CropArea>({ x: 0, y: 0, size: 0 });

  // Жест не влияет на разметку — держим его вне реактивности.
  let gesture: CropGesture | null = null;

  const { width: previewWidth } = useElementSize(options.imageElement);

  const isReady = computed(() => Boolean(naturalSize.value));

  /** Отношение превью к исходнику: переводит сдвиг курсора в пиксели картинки. */
  const previewScale = computed(() => {
    const image = naturalSize.value;

    return image && previewWidth.value ? previewWidth.value / image.width : 1;
  });

  const maxSize = computed(() =>
    naturalSize.value ? getMaxCropSize(naturalSize.value) : 0,
  );

  const minSize = computed(() => Math.min(MIN_CROP_SIZE, maxSize.value));

  /** Сторона области — значение ползунка размера. */
  const cropSize = computed({
    get: () => area.value.size,
    set: (value: number) => {
      if (naturalSize.value) {
        area.value = resizeCropAreaFromCenter(
          area.value,
          value,
          naturalSize.value,
        );
      }
    },
  });

  /** Область в долях изображения — по ним она позиционируется над превью. */
  const areaRatio = computed<CropAreaRatio>(() => {
    const image = naturalSize.value;

    if (!image) {
      return { left: 0, top: 0, width: 0, height: 0 };
    }

    return {
      left: (area.value.x / image.width) * 100,
      top: (area.value.y / image.height) * 100,
      width: (area.value.size / image.width) * 100,
      height: (area.value.size / image.height) * 100,
    };
  });

  /**
   * Запоминает начало жеста: дальше область считается от неё и сдвига курсора.
   *
   * @param event нажатие на область или на маркер угла.
   * @param corner угол при изменении размера; null — перемещение.
   */
  function startGesture(event: PointerEvent, corner: CropCorner | null): void {
    if (!naturalSize.value) {
      return;
    }

    gesture = {
      corner,
      pointerX: event.clientX,
      pointerY: event.clientY,
      area: area.value,
    };
  }

  /**
   * Начинает перемещение области целиком.
   *
   * @param event нажатие на область.
   */
  function startMove(event: PointerEvent): void {
    startGesture(event, null);
  }

  /**
   * Начинает изменение размера области за указанный угол.
   *
   * @param event нажатие на маркер угла.
   * @param corner угол, за который тянут.
   */
  function startResize(event: PointerEvent, corner: CropCorner): void {
    startGesture(event, corner);
  }

  /**
   * Двигает или растягивает область следом за курсором.
   *
   * @param event перемещение курсора.
   */
  function handlePointerMove(event: PointerEvent): void {
    const image = naturalSize.value;

    if (!gesture || !image) {
      return;
    }

    const delta = {
      x: (event.clientX - gesture.pointerX) / previewScale.value,
      y: (event.clientY - gesture.pointerY) / previewScale.value,
    };

    area.value = gesture.corner
      ? resizeCropArea(gesture.area, gesture.corner, delta, image)
      : clampCropArea(
          {
            ...gesture.area,
            x: gesture.area.x + delta.x,
            y: gesture.area.y + delta.y,
          },
          image,
        );
  }

  /** Завершает жест: следующее перемещение курсора область не тронет. */
  function stopGesture(): void {
    gesture = null;
  }

  // Слушатели на окне, а не на области: курсор во время перетаскивания уходит
  // за её границы, и события до самой области уже не доходят.
  //
  // Своя обработка, а не useDraggable: перетаскиваемых элементов пять (рамка и
  // четыре уголка), а обработчику нужно знать, за какой из них тянут, чтобы
  // считать сторону и прижимать область к границам одним общим кодом. Плюс
  // useDraggable не слушает pointercancel — прерванное касание оставляло бы
  // рамку приклеенной к пальцу.
  useEventListener('pointermove', handlePointerMove);
  useEventListener(['pointerup', 'pointercancel'], stopGesture);

  /**
   * Сдвигает область стрелками на клавиатуре — мышью то же делает
   * перетаскивание.
   *
   * @param direction направление сдвига.
   */
  function moveArea(direction: CropDirection): void {
    const image = naturalSize.value;

    if (!image) {
      return;
    }

    const offset = CROP_DIRECTION_OFFSETS[direction];
    const step = maxSize.value * MOVE_STEP_RATIO;

    area.value = clampCropArea(
      {
        ...area.value,
        x: area.value.x + offset.x * step,
        y: area.value.y + offset.y * step,
      },
      image,
    );
  }

  /** Увеличивает область на один шаг — в кадр попадёт больше картинки. */
  function growArea(): void {
    cropSize.value = area.value.size + maxSize.value * SIZE_STEP_RATIO;
  }

  /** Уменьшает область на один шаг — кадр становится крупнее. */
  function shrinkArea(): void {
    cropSize.value = area.value.size - maxSize.value * SIZE_STEP_RATIO;
  }

  /**
   * Читает размеры загруженного изображения и ставит начальную область.
   * Вызывается на `load` элемента: до него размеров исходника ещё нет.
   */
  function initialize(): void {
    const element = toValue(options.imageElement);

    if (!element?.naturalWidth || !element.naturalHeight) {
      return;
    }

    const image = {
      width: element.naturalWidth,
      height: element.naturalHeight,
    };

    naturalSize.value = image;
    area.value = createInitialCropArea(image);
  }

  /**
   * Вырезает выбранную область в файл.
   *
   * @param sourceName имя исходного файла — от него зависит имя результата.
   * @returns файл с вырезанным квадратом; null — изображение ещё не готово.
   */
  async function crop(sourceName: string): Promise<File | null> {
    const element = toValue(options.imageElement);

    if (!element || !naturalSize.value) {
      return null;
    }

    return await createCroppedImageFile(element, area.value, sourceName);
  }

  // Область меняют только функции композабла — снаружи она только читается.
  return {
    area: readonly(area),
    areaRatio,
    naturalSize: readonly(naturalSize),
    cropSize,
    minSize,
    maxSize,
    isReady,
    initialize,
    startMove,
    startResize,
    moveArea,
    growArea,
    shrinkArea,
    crop,
  };
}
