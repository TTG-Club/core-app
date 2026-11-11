import type { VkVideoId } from '#shared/types';

import { VK_VIDEO_ADMIN_COVER_API_PATH } from '#shared/consts';
import { vkVideoCoverResponseSchema } from '#shared/utils';

import { VK_VIDEO_COVER_TEXT } from '../model';

interface UseVkVideoCoverOptions {
  /** Раздел загрузок обложки (как у формы загрузки). */
  section: string;
  /** Предел размера картинки для компрессора (как у `UploadImage`). */
  maxSize?: string | number;
}

/**
 * Предел размера обложки числом; нечисловой — без предела.
 *
 * @param maxSize предел, как его принимает `UploadImage`
 * @returns число или `undefined`
 */
function toMaxSize(maxSize: string | number | undefined): number | undefined {
  const converted = Number(maxSize);

  return Number.isFinite(converted) ? converted : undefined;
}

/**
 * Кадр ролика ВК → обложка записи через ВК редактора.
 *
 * @param options раздел и предел размера обложки
 * @returns загрузка кадра и признак, что она идёт
 */
export function useVkVideoCover(options: UseVkVideoCoverOptions) {
  const $toast = useToast();
  const isLoading = ref(false);

  const maxSize = toMaxSize(options.maxSize);

  /**
   * Берёт кадр ролика обложкой.
   *
   * @param video ролик ВК
   * @returns адрес обложки на сайте или `null` при ошибке
   */
  async function takeCover(video: VkVideoId): Promise<string | null> {
    if (isLoading.value) {
      return null;
    }

    isLoading.value = true;

    try {
      const { url } = vkVideoCoverResponseSchema.parse(
        await $fetch<unknown>(VK_VIDEO_ADMIN_COVER_API_PATH, {
          method: 'POST',
          body: { ...video, section: options.section, maxSize },
        }),
      );

      $toast.add({ color: 'success', title: VK_VIDEO_COVER_TEXT.success });

      return url;
    } catch (coverError) {
      consola.error(coverError);

      $toast.add({
        color: 'error',
        title: VK_VIDEO_COVER_TEXT.error,
        description: getUploadErrorMessage(coverError),
      });

      return null;
    } finally {
      isLoading.value = false;
    }
  }

  return { isLoading, takeCover };
}
