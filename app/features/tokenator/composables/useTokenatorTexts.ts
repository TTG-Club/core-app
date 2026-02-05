import { v4 as uuid } from 'uuid';
import {
  DEFAULT_TEXT_CONFIG,
  validateFontSize,
  validateRotation,
} from '~tokenator/model';

import type { TokenText } from '~tokenator/model';

export function useTokenatorTexts() {
  const texts = ref<TokenText[]>([]);
  const activeTextId = ref<string | null>(null);

  const activeText = computed<TokenText | undefined>(() =>
    texts.value.find((t) => t.id === activeTextId.value),
  );

  const isActiveTextXChanged = computed(() => activeText.value?.x !== 0);
  const isActiveTextYChanged = computed(() => activeText.value?.y !== 0);

  const isActiveTextRotationChanged = computed(
    () => activeText.value?.rotation !== 0,
  );

  const isActiveTextArcChanged = computed(() => activeText.value?.arc !== 0);

  /**
   * Добавляет новый текстовый элемент на токен.
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
   */
  function updateText(id: string, updates: Partial<TokenText>) {
    const text = texts.value.find((t) => t.id === id);

    if (text) {
      if (updates.fontSize !== undefined) {
        updates.fontSize = validateFontSize(updates.fontSize);
      }

      if (updates.rotation !== undefined) {
        updates.rotation = validateRotation(updates.rotation);
      }

      Object.assign(text, updates);
    }
  }

  function selectText(id: string) {
    activeTextId.value = id;
  }

  function deselectText() {
    activeTextId.value = null;
  }

  function removeActiveText() {
    if (activeTextId.value) {
      removeText(activeTextId.value);
    }
  }

  function resetActiveTextX() {
    if (activeText.value) {
      activeText.value.x = 0;
    }
  }

  function resetActiveTextY() {
    if (activeText.value) {
      activeText.value.y = 0;
    }
  }

  function resetActiveTextRotation() {
    if (activeText.value) {
      activeText.value.rotation = 0;
    }
  }

  function resetActiveTextArc() {
    if (activeText.value) {
      activeText.value.arc = 0;
    }
  }

  function resetTextSettings() {
    texts.value = [];
    activeTextId.value = null;
  }

  return {
    texts,
    activeTextId,
    activeText,
    isActiveTextXChanged,
    isActiveTextYChanged,
    isActiveTextRotationChanged,
    isActiveTextArcChanged,
    addText,
    removeText,
    updateText,
    selectText,
    deselectText,
    removeActiveText,
    resetActiveTextX,
    resetActiveTextY,
    resetActiveTextRotation,
    resetActiveTextArc,
    resetTextSettings,
  };
}
