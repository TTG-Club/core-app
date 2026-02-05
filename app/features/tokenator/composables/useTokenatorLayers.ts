import type { TokenatorFrame } from '~tokenator/model';

export function useTokenatorLayers() {
  const currentImage = ref<string | null>(null);
  const currentFrame = ref<TokenatorFrame | null>(null);
  const customFrame = ref<string | null>(null);
  const customBackground = ref<string | null>(null);

  const activeFrameUrl = computed(
    () => customFrame.value || currentFrame.value?.url || null,
  );

  const isNoFrameSelected = computed(
    () => !currentFrame.value && !customFrame.value,
  );

  /**
   * Выбирает рамку из библиотеки.
   * Автоматически очищает кастомную рамку при выборе.
   */
  function selectFrame(frame: TokenatorFrame) {
    if (customFrame.value) {
      URL.revokeObjectURL(customFrame.value);
      customFrame.value = null;
    }

    currentFrame.value = frame;
  }

  /**
   * Сбрасывает выбор рамки (убирает и библиотечную, и кастомную).
   */
  function selectNoFrame() {
    currentFrame.value = null;
    customFrame.value = null;
  }

  /**
   * Загружает кастомную рамку из файла.
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
   * Сбрасывает настройки библиотеки (контент).
   */
  function resetLibrarySettings() {
    currentImage.value = null;
    customFrame.value = null;
    currentFrame.value = null;
    customBackground.value = null;
  }

  return {
    currentImage,
    currentFrame,
    customFrame,
    customBackground,
    activeFrameUrl,
    isNoFrameSelected,
    selectFrame,
    selectNoFrame,
    setCustomFrame,
    setCustomBackground,
    resetLibrarySettings,
  };
}
