<script setup lang="ts">
  import type { ImageFrame } from '~/shared/types';

  import { ImageFrameEditor } from '~ui/image-frame';

  import { UPLOAD_PLACEHOLDER_IMAGE } from '../constants';
  import { UploadImage } from '../image';

  const {
    section,
    maxSize,
    alt = '',
  } = defineProps<{
    section: string;
    /** Максимальная длина короткой стороны. */
    maxSize: string | number;
    alt?: string;
  }>();

  /** Ссылка на картинку обложки. */
  const imageModel = defineModel<string | undefined>();

  /** Кадр обложки: какая часть картинки видна в квадрате и в карточке. */
  const frameModel = defineModel<ImageFrame | null | undefined>('frame');

  /**
   * Новая или убранная картинка: прежний кадр к ней не относится. Сбрасываем
   * только здесь, по действию пользователя, а не наблюдателем за ссылкой —
   * иначе кадр стёрся бы и при первой загрузке формы.
   *
   * @param image новая ссылка на картинку.
   */
  function handleImageChange(image: string | undefined): void {
    imageModel.value = image;
    frameModel.value = null;
  }
</script>

<template>
  <UploadImage
    :model-value="imageModel"
    :section="section"
    :max-size="maxSize"
    @update:model-value="handleImageChange"
  >
    <template #preview>
      <ImageFrameEditor
        v-if="imageModel"
        v-model="frameModel"
        :src="imageModel"
        :alt="alt"
      />

      <img
        v-else
        class="w-full rounded-lg object-contain"
        :src="UPLOAD_PLACEHOLDER_IMAGE"
        alt=""
      />
    </template>
  </UploadImage>
</template>
