import { useRefHistory } from '@vueuse/core';
import { liveQuery } from 'dexie';
import { cloneDeep } from 'es-toolkit';
import { defineStore } from 'pinia';
import { v4 as uuid } from 'uuid';

import {
  BACKGROUND_BLEND_MODES,
  BLEND_MODES,
  DEFAULT_BACKGROUND_STYLE,
  DEFAULT_BRUSH_CONFIG,
  DEFAULT_COLORS,
  DEFAULT_FRAME_TINT,
  DEFAULT_TEXT_CONFIG,
  DEFAULT_TRANSFORM,
} from '../model/consts';
import { db } from '../model/db';
import {
  validateBrushSize,
  validateFontSize,
  validateRotation,
  validateScale,
} from '../model/utils';

import type {
  BackgroundStyle,
  BrushState,
  FrameTint,
  TokenatorFrame,
  TokenText,
  TransformState,
} from '../model/types';

/**
 * Helper function to sync a ref with Dexie DB.
 * Handles 2-way binding with loop protection.
 */
function useTokenatorSetting<T>(key: string, defaultValue: T) {
  const data = ref<T>(defaultValue) as Ref<T>;

  let isSyncing = false;

  // Sync from DB (Reactive read)
  if (import.meta.client) {
    liveQuery(async () => {
      const result = await db.settings.get(key);

      return result ? (result.value as T) : defaultValue;
    }).subscribe((val) => {
      isSyncing = true;
      data.value = val;

      nextTick(() => {
        isSyncing = false;
      });
    });
  }

  // Sync to DB (Write on change)
  watch(
    data,
    async (newValue) => {
      if (isSyncing) {
        return;
      }

      // Use raw value to avoid proxy issues and deep clone to ensure data integrity
      const rawValue = cloneDeep(newValue);

      await db.settings.put({ key, value: rawValue });
    },
    { deep: true },
  );

  return { data };
}

/**
 * Основной Pinia store для редактора токенов.
 * Управляет состоянием изображений, рамок, трансформаций, текста и кисти.
 * Поддерживает персистентность через IndexedDB (Dexie) и undo/redo функциональность.
 */
export const useTokenatorStore = defineStore('tokenator', () => {
  // Изображения
  const currentImage = ref<string | null>(null);
  const currentFrame = ref<TokenatorFrame | null>(null);
  const customFrame = ref<string | null>(null);
  const customBackground = ref<string | null>(null);

  // Текст
  const texts = ref<TokenText[]>([]);
  const activeTextId = ref<string | null>(null);

  // Маска
  const maskImageCanvas = ref<HTMLCanvasElement | null>(null);
  const maskVersion = ref(0);
  const maskTokenSize = ref(500);

  // Цвета и стили (с IDB персистентностью)
  const { data: backgroundColor } = useTokenatorSetting<string>(
    'background-color',
    DEFAULT_COLORS.BACKGROUND,
  );

  const { data: frameTint } = useTokenatorSetting<FrameTint>(
    'frame-tint',
    DEFAULT_FRAME_TINT,
  );

  const { data: backgroundStyle } = useTokenatorSetting<BackgroundStyle>(
    'background-style',
    DEFAULT_BACKGROUND_STYLE,
  );

  // Трансформации (с IDB и undo/redo)
  const { data: transform } = useTokenatorSetting<TransformState>(
    'transform',
    DEFAULT_TRANSFORM,
  );

  const { undo, redo, canUndo, canRedo } = useRefHistory(transform, {
    deep: true,
    capacity: 20,
  });

  // Кисть (с IDB)
  const { data: brush } = useTokenatorSetting<BrushState>(
    'brush',
    DEFAULT_BRUSH_CONFIG,
  );

  // Computed
  const activeFrameUrl = computed(
    () => customFrame.value || currentFrame.value?.url || null,
  );

  /**
   * Добавляет новый текстовый элемент на токен.
   *
   * @param content - Текст для добавления
   */
  function addText(content: string) {
    if (!content.trim()) {
      return;
    }

    const id = uuid();

    texts.value.push({
      id,
      content,
      ...DEFAULT_TEXT_CONFIG,
    });

    activeTextId.value = id;
  }

  /**
   * Удаляет текстовый элемент по ID.
   * Автоматически снимает выделение, если удаляемый элемент был активным.
   *
   * @param id - Уникальный идентификатор текстового элемента
   */
  function removeText(id: string) {
    const index = texts.value.findIndex((t) => t.id === id);

    if (index !== -1) {
      texts.value.splice(index, 1);

      if (activeTextId.value === id) {
        activeTextId.value = null;
      }
    }
  }

  /**
   * Обновляет свойства текстового элемента.
   *
   * @param id - Уникальный идентификатор текстового элемента
   * @param updates - Объект с обновляемыми свойствами
   */
  function updateText(id: string, updates: Partial<TokenText>) {
    const text = texts.value.find((t) => t.id === id);

    if (text) {
      // Применяем валидацию для числовых значений
      if (updates.fontSize !== undefined) {
        updates.fontSize = validateFontSize(updates.fontSize);
      }

      if (updates.rotation !== undefined) {
        updates.rotation = validateRotation(updates.rotation);
      }

      Object.assign(text, updates);
    }
  }

  /**
   * Загружает изображение персонажа из файла.
   * Сохраняет текущие значения maskScale и frameScale при сбросе трансформаций.
   *
   * @param file - Файл изображения для загрузки
   */
  function setImage(file: File) {
    if (currentImage.value && currentImage.value.startsWith('blob:')) {
      URL.revokeObjectURL(currentImage.value);
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        // Сохраняем настройки маски и рамки перед сбросом
        const savedMaskScale = transform.value.maskScale;
        const savedFrameScale = transform.value.frameScale;
        const savedMaskSides = transform.value.maskSides;
        const savedMaskRotate = transform.value.maskRotate;

        currentImage.value = e.target.result;
        resetTransform();

        // Восстанавливаем сохранённые настройки
        transform.value.maskScale = savedMaskScale;
        transform.value.frameScale = savedFrameScale;
        transform.value.maskSides = savedMaskSides;
        transform.value.maskRotate = savedMaskRotate;
      }
    };

    reader.onerror = () => {
      console.error('Failed to load image file');
    };

    reader.readAsDataURL(file);
  }

  /**
   * Загружает кастомную рамку из файла.
   *
   * @param file - Файл рамки для загрузки
   */
  function setCustomFrame(file: File) {
    if (customFrame.value && customFrame.value.startsWith('blob:')) {
      URL.revokeObjectURL(customFrame.value);
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        customFrame.value = e.target.result;
      }
    };

    reader.onerror = () => {
      console.error('Failed to load frame file');
    };

    reader.readAsDataURL(file);
  }

  /**
   * Загружает кастомное фоновое изображение из файла.
   *
   * @param file - Файл фонового изображения для загрузки
   */
  function setCustomBackground(file: File) {
    if (customBackground.value && customBackground.value.startsWith('blob:')) {
      URL.revokeObjectURL(customBackground.value);
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        customBackground.value = e.target.result;
      }
    };

    reader.onerror = () => {
      console.error('Failed to load background file');
    };

    reader.readAsDataURL(file);
  }

  /**
   * Выбирает рамку из библиотеки.
   * Автоматически очищает кастомную рамку при выборе.
   *
   * @param frame - Объект рамки из библиотеки
   */
  function selectFrame(frame: TokenatorFrame) {
    if (customFrame.value) {
      URL.revokeObjectURL(customFrame.value);
      customFrame.value = null;
    }

    currentFrame.value = frame;
  }

  /**
   * Сбрасывает базовые настройки (трансформации).
   */
  function resetBaseSettings() {
    transform.value = cloneDeep(DEFAULT_TRANSFORM);
  }

  /**
   * Алиас для сброса трансформаций (обратная совместимость)
   */
  function resetTransform() {
    resetBaseSettings();
  }

  /**
   * Сбрасывает настройки стиля (цвета).
   */
  function resetStyleSettings() {
    backgroundColor.value = DEFAULT_COLORS.BACKGROUND;
    frameTint.value = cloneDeep(DEFAULT_FRAME_TINT);
    backgroundStyle.value = cloneDeep(DEFAULT_BACKGROUND_STYLE);
  }

  /**
   * Сбрасывает настройки 3D (кисть/маска).
   */
  function reset3DSettings() {
    brush.value = cloneDeep(DEFAULT_BRUSH_CONFIG);
  }

  /**
   * Очищает нарисованную маску.
   */
  function clearMask() {
    if (!maskImageCanvas.value) {
      return;
    }

    const ctx = maskImageCanvas.value.getContext('2d');

    if (ctx) {
      ctx.clearRect(
        0,
        0,
        maskImageCanvas.value.width,
        maskImageCanvas.value.height,
      );
    }

    maskVersion.value++;
  }

  /**
   * Сбрасывает настройки текста.
   */
  function resetTextSettings() {
    texts.value = [];
    activeTextId.value = null;
  }

  /**
   * Сбрасывает настройки библиотеки (контент).
   */
  function resetLibrarySettings() {
    currentImage.value = null;
    customFrame.value = null;
    currentFrame.value = null;
    customBackground.value = null;
  }

  /**
   * Сбрасывает все настройки редактора на значения по умолчанию.
   * Не затрагивает загруженное изображение и рамку (если они не часть настроек, но здесь мы сбрасываем всё, что в табах настроек).
   */
  function resetSettings() {
    resetBaseSettings();
    resetStyleSettings();
    reset3DSettings();
    resetTextSettings();
  }

  /**
   * Полный сброс всего.
   */
  function resetAll() {
    resetSettings();
    resetLibrarySettings();
  }

  /**
   * Генерирует случайные цвета для градиентной тонировки рамки.
   */
  function randomizeTint() {
    const randomColor = () =>
      `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0')}`;

    frameTint.value.colors = [randomColor(), randomColor()];
    frameTint.value.enabled = true;
  }

  /**
   * Меняет местами цвета градиента тонировки.
   */
  function swapTintColors() {
    const c1 = frameTint.value.colors[0];
    const c2 = frameTint.value.colors[1];

    if (c2) {
      frameTint.value.colors = [c2, c1 || DEFAULT_COLORS.TINT_TRANSPARENT];
    }
  }

  /**
   * Устанавливает масштаб с валидацией.
   */
  function setScale(scale: number) {
    transform.value.scale = validateScale(scale);
  }

  /**
   * Устанавливает поворот с валидацией.
   */
  function setRotation(rotation: number) {
    transform.value.rotate = validateRotation(rotation);
  }

  /**
   * Устанавливает поворот рамки с валидацией.
   */
  function setFrameRotation(rotation: number) {
    transform.value.frameRotate = validateRotation(rotation);
  }

  /**
   * Устанавливает размер кисти с валидацией.
   */
  function setBrushSize(size: number) {
    brush.value.size = validateBrushSize(size);
  }

  return {
    // State
    currentImage,
    currentFrame,
    customFrame,
    customBackground,
    activeFrameUrl,
    backgroundColor,
    backgroundStyle,
    frameTint,
    transform,
    brush,
    texts,
    activeTextId,
    maskImageCanvas,
    maskVersion,
    maskTokenSize,

    // Constants (re-export для удобства)
    BLEND_MODES,
    BACKGROUND_BLEND_MODES,
    DEFAULT_COLORS,

    // Actions
    addText,
    removeText,
    updateText,
    setImage,
    setCustomFrame,
    setCustomBackground,
    selectFrame,
    randomizeTint,
    swapTintColors,
    setScale,
    setRotation,
    setFrameRotation,
    setBrushSize,

    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo,

    resetTransform,
    resetAll,
    resetBaseSettings,
    reset3DSettings,
    resetStyleSettings,
    resetTextSettings,
    resetSettings,
    resetLibrarySettings,
    clearMask,
  };
});
