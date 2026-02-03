let webpEncoder: typeof import('@jsquash/webp/encode').default | null = null;
let importPromise: Promise<void> | null = null;

async function loadWebpEncoder(): Promise<void> {
  if (webpEncoder) {
    return;
  }

  if (!importPromise) {
    importPromise = import('@jsquash/webp/encode').then((module) => {
      webpEncoder = module.default;
    });
  }

  try {
    await importPromise;
  } catch (error) {
    importPromise = null;

    throw error;
  }
}

export function useCanvasExport() {
  const { isIos } = useDevice();
  const toast = useToast();

  const isExportingPng = ref(false);
  const isExportingWebp = ref(false);

  /**
   * Экспортирует canvas в формат PNG.
   *
   * @param canvas - HTML canvas элемент
   * @param filename - Имя файла (без расширения)
   */
  async function exportToPng(
    canvas: HTMLCanvasElement,
    filename: string,
  ): Promise<void> {
    isExportingPng.value = true;

    try {
      const blob = await nativeToBlob(canvas, 'image/png', 0.92);

      if (blob && blob.type === 'image/png') {
        downloadBlob(blob, `${filename}.png`);
      }
    } catch (error) {
      console.error('PNG export failed:', error);

      toast.add({
        title: 'Ошибка экспорта в PNG',
        description: 'Не удалось сохранить в PNG.',
        color: 'error',
      });
    } finally {
      isExportingPng.value = false;
    }
  }

  /**
   * Экспортирует canvas используя библиотеку @jsquash/webp.
   * Используется как фоллбек или основной метод для iOS.
   *
   * @param canvas - HTML canvas элемент
   * @param filename - Имя файла (без расширения)
   * @param quality - Качество изображения (0-1)
   */
  async function exportWithJsquash(
    canvas: HTMLCanvasElement,
    filename: string,
    quality: number,
  ) {
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get 2d context');
    }

    // Если библиотека еще не загружена, ждем завершения загрузки
    if (!webpEncoder) {
      await loadWebpEncoder();
    }

    if (!webpEncoder) {
      throw new Error('WebP encoder library not loaded');
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const arrayBuffer = await webpEncoder(imageData, { quality });
    const blob = new Blob([arrayBuffer], { type: 'image/webp' });

    downloadBlob(blob, `${filename}.webp`);
  }

  /**
   * Экспортирует canvas в формат WebP.
   * Автоматически выбирает стратегию экспорта:
   * - Для iOS: используется @jsquash/webp
   * - Для остальных: нативный экспорт с фоллбеком на @jsquash/webp
   *
   * При ошибке показывает уведомление пользователю.
   *
   * @param canvas - HTML canvas элемент
   * @param filename - Имя файла (без расширения)
   * @param quality - Качество изображения (по умолчанию 0.92)
   */
  async function exportToWebp(
    canvas: HTMLCanvasElement,
    filename: string,
    quality = 0.92,
  ): Promise<void> {
    isExportingWebp.value = true;

    if (isIos) {
      try {
        await exportWithJsquash(canvas, filename, quality);
      } catch (error) {
        console.error('Failed to export using @jsquash/webp on iOS:', error);

        toast.add({
          title: 'Ошибка экспорта в WebP',
          description: 'Не удалось сохранить в WebP. Попробуйте PNG.',
          color: 'error',
        });
      } finally {
        isExportingWebp.value = false;
      }

      return;
    }

    try {
      const blob = await nativeToBlob(canvas, 'image/webp', quality);

      if (blob && blob.type === 'image/webp') {
        downloadBlob(blob, `${filename}.webp`);

        return;
      }

      await exportWithJsquash(canvas, filename, quality);
    } catch (error) {
      console.error('WebP export failed:', error);

      toast.add({
        title: 'Ошибка экспорта в WebP',
        description: 'Не удалось сохранить в WebP. Попробуйте PNG.',
        color: 'error',
      });
    } finally {
      isExportingWebp.value = false;
    }
  }

  /**
   * Скачивает Blob как файл.
   *
   * @param blob - Объект Blob для скачивания
   * @param filename - Полное имя файла с расширением
   */
  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function nativeToBlob(
    canvas: HTMLCanvasElement,
    type: string,
    quality: number,
  ): Promise<Blob | null> {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, type, quality);
    });
  }

  return {
    exportToPng,
    exportToWebp,
    isExportingPng,
    isExportingWebp,
  };
}
