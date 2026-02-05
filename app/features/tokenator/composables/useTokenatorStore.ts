import { defineStore } from 'pinia';
import { BrushMode, TokenatorEditMode } from '~tokenator/model';

import { useTokenatorBrush } from './useTokenatorBrush';
import { useTokenatorLayers } from './useTokenatorLayers';
import { useTokenatorStyles } from './useTokenatorStyles';
import { useTokenatorTexts } from './useTokenatorTexts';
import { useTokenatorTransforms } from './useTokenatorTransforms';
import { useTokenatorViewport } from './useTokenatorViewport';

/**
 * Основной Pinia store для редактора токенов.
 * Управляет состоянием изображений, рамок, трансформаций, текста и кисти.
 * Поддерживает персистентность через IndexedDB (Dexie) и undo/redo функциональность.
 */
export const useTokenatorStore = defineStore('tokenator', () => {
  // Modules
  const layers = useTokenatorLayers();
  const texts = useTokenatorTexts();
  const transforms = useTokenatorTransforms();
  const styles = useTokenatorStyles();
  const brushModule = useTokenatorBrush();
  const viewport = useTokenatorViewport();

  // Режим редактирования (не сохраняется в IDB)
  const editMode = ref<TokenatorEditMode>(TokenatorEditMode.None);

  // Computed Properties (Cross-module)
  const isBackgroundMoveMode = computed(
    () => editMode.value === TokenatorEditMode.Background,
  );

  const isBrushMode = computed(
    () =>
      editMode.value === TokenatorEditMode.Brush && !!layers.currentImage.value,
  );

  const isMoveMode = computed(
    () =>
      editMode.value === TokenatorEditMode.None &&
      !viewport.canvasViewport.value.isPanning,
  );

  const isBrushAddMode = computed(
    () =>
      editMode.value === TokenatorEditMode.Brush &&
      brushModule.brush.value.mode === 'add',
  );

  const isBrushRemoveMode = computed(
    () =>
      editMode.value === TokenatorEditMode.Brush &&
      brushModule.brush.value.mode === 'remove',
  );

  const isBrushControlsDisabled = computed(
    () => editMode.value !== TokenatorEditMode.Brush,
  );

  // Actions (Coordinating)

  /**
   * Переключает режим перемещения фона.
   */
  function toggleBackgroundMoveMode() {
    editMode.value =
      editMode.value === TokenatorEditMode.Background
        ? TokenatorEditMode.None
        : TokenatorEditMode.Background;
  }

  /**
   * Активирует режим перемещения.
   */
  function activateMoveMode() {
    editMode.value = TokenatorEditMode.None;
    viewport.canvasViewport.value.isPanning = false;
  }

  /**
   * Активирует режим рисования маски.
   */
  function activateDrawMode() {
    editMode.value = TokenatorEditMode.Brush;
    brushModule.brush.value.mode = BrushMode.Add;
    viewport.canvasViewport.value.isPanning = false;
  }

  /**
   * Активирует режим стирания маски.
   */
  function activateEraseMode() {
    editMode.value = TokenatorEditMode.Brush;
    brushModule.brush.value.mode = BrushMode.Remove;
    viewport.canvasViewport.value.isPanning = false;
  }

  /**
   * Переключает режим панорамирования холста.
   */
  function togglePanMode() {
    viewport.canvasViewport.value.isPanning =
      !viewport.canvasViewport.value.isPanning;

    if (viewport.canvasViewport.value.isPanning) {
      editMode.value = TokenatorEditMode.None;
    }
  }

  /**
   * Сбрасывает настройки 3D (кисть/маска).
   */
  function reset3DSettings() {
    brushModule.resetBrush();
    editMode.value = TokenatorEditMode.None;
  }

  /**
   * Сбрасывает настройки фона (цвет, фоновое изображение).
   */
  function resetBackgroundSettings() {
    styles.resetBackgroundColor();
    styles.resetBackgroundStyle();
    editMode.value = TokenatorEditMode.None;
  }

  /**
   * Сбрасывает настройки рамки (размер, поворот, тонировка).
   */
  function resetFrameSettings() {
    transforms.resetFrameTransform();
    styles.resetFrameTint();
  }

  /**
   * Сбрасывает настройки стиля (для обратной совместимости).
   */
  function resetStyleSettings() {
    resetFrameSettings();
    resetBackgroundSettings();
  }

  /**
   * Сбрасывает все настройки редактора на значения по умолчанию.
   */
  function resetSettings() {
    transforms.resetBaseSettings();
    resetStyleSettings();
    reset3DSettings();
    texts.resetTextSettings();
    viewport.resetCanvasSettings();
  }

  /**
   * Полный сброс всего.
   */
  function resetAll() {
    resetSettings();
    layers.resetLibrarySettings();
  }

  /**
   * Загружает изображение персонажа из файла.
   * Сохраняет настройки маски и рамки при сбросе трансформаций.
   */
  function setImage(file: File) {
    if (
      layers.currentImage.value &&
      layers.currentImage.value.startsWith('blob:')
    ) {
      URL.revokeObjectURL(layers.currentImage.value);
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        // Сохраняем настройки маски и рамки перед сбросом
        const savedMaskScale = transforms.transform.value.maskScale;
        const savedMaskSides = transforms.transform.value.maskSides;
        const savedMaskRotate = transforms.transform.value.maskRotate;
        const savedFrameScale = transforms.transform.value.frameScale;
        const savedFrameRotate = transforms.transform.value.frameRotate;

        layers.currentImage.value = e.target.result;
        transforms.resetTransform();

        // Восстанавливаем сохранённые настройки
        transforms.transform.value.maskScale = savedMaskScale;
        transforms.transform.value.maskSides = savedMaskSides;
        transforms.transform.value.maskRotate = savedMaskRotate;
        transforms.transform.value.frameScale = savedFrameScale;
        transforms.transform.value.frameRotate = savedFrameRotate;
      }
    };

    reader.onerror = () => {
      console.error('Failed to load image file');
    };

    reader.readAsDataURL(file);
  }

  return {
    // Re-export everything from modules
    ...layers,
    ...texts,
    ...transforms,
    ...styles,
    ...brushModule,
    ...viewport,

    // Local State
    editMode,

    // Computed
    isBackgroundMoveMode,
    isBrushMode,
    isMoveMode,
    isBrushAddMode,
    isBrushRemoveMode,
    isBrushControlsDisabled,

    // Actions
    toggleBackgroundMoveMode,
    activateMoveMode,
    activateDrawMode,
    activateEraseMode,
    togglePanMode,
    reset3DSettings,
    resetBackgroundSettings,
    resetFrameSettings,
    resetStyleSettings,
    resetSettings,
    resetAll,
    setImage,
  };
});
