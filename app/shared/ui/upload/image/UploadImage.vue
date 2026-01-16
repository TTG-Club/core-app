<script setup lang="ts">
  import bytes from 'bytes';
  import { toNumber } from 'lodash-es';

  import { getStatusMessage } from '#shared/utils';

  import type { UploadResponse } from '~/shared/types';

  const { section, maxSize = undefined } = defineProps<{
    section: string;
    /**
     * Максимальная длина короткой стороны
     */
    maxSize?: string | number;
  }>();

  if (typeof maxSize === 'string' && !/\d+/.test(maxSize)) {
    throw new Error('maxSize must be a Number or number in String');
  }

  if (maxSize && toNumber(maxSize) > 2048) {
    throw new Error('maxSize must be lower or equal to 2048');
  }

  const maxFileWeight = bytes('5MB')!;
  const maxFileSize = 2048;

  const $toast = useToast();

  const actionUrl = computed(() => {
    const params = new URLSearchParams();

    if (section) {
      params.set('section', getSlug(section));
    }

    if (maxSize) {
      params.set('maxSize', maxSize.toString());
    }

    return `/s3/upload?${params.toString()}`;
  });

  // function onError(error: Error, responseError: NuxtError) {
  //   $toast.add({
  //     color: 'error',
  //     title: 'Неизвестная ошибка',
  //     description: getStatusMessage(responseError.statusCode),
  //   });
  // }

  const imageUploaded = defineModel<string>();

  function bufferToBase64(buf: ArrayBuffer) {
    const chunks = [];
    const uint8 = new Uint8Array(buf);
    const chunkSize = 0x8000;

    for (let i = 0; i < uint8.length; i += chunkSize) {
      const chunk = uint8.subarray(i, Math.min(i + chunkSize, uint8.length));

      chunks.push(String.fromCharCode(...chunk));
    }

    return btoa(chunks.join(''));
  }

  function getImageSize(provideFile: File): Promise<{
    width: number;
    height: number;
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.readAsDataURL(provideFile);

      reader.onload = () => {
        const img = new Image();

        if (!reader.result) {
          reject('Неизвестная ошибка');

          return;
        }

        img.src =
          reader.result instanceof ArrayBuffer
            ? bufferToBase64(reader.result)
            : reader.result;

        img.onload = () => {
          if (!img.width || !img.height) {
            reject('Неизвестная ошибка');

            return;
          }

          resolve({
            width: img.width,
            height: img.height,
          });
        };
      };
    });
  }

  function removeLoadedImage(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!imageUploaded.value) {
        resolve();

        return;
      }

      $fetch(imageUploaded.value, { method: 'delete' })
        .then(() => {
          imageUploaded.value = undefined;
          resolve();
        })
        .catch(reject);
    });
  }

  async function beforeUpload(file: File) {
    const isExtensionSuccess =
      file.type === 'image/jpeg' ||
      file.type === 'image/png' ||
      file.type === 'image/webp';

    if (!isExtensionSuccess) {
      $toast.add({
        color: 'error',
        title: 'Ошибка при загрузке файла',
        description: 'Недопустимый формат изображения',
      });

      return false;
    }

    if (file.size > maxFileWeight) {
      $toast.add({
        color: 'error',
        title: 'Ошибка при загрузке файла',
        description: `Размер изображения не должен превышать ${bytes(maxFileWeight)}`,
      });

      return false;
    }

    try {
      const imageSize = await getImageSize(file);

      if (imageSize.width > maxFileSize || imageSize.height > maxFileSize) {
        $toast.add({
          color: 'error',
          title: 'Ошибка при загрузке файла',
          description: `Изображение должно быть меньше ${maxFileSize}px по длинной стороне`,
        });

        return false;
      }

      return true;
    } catch (err) {
      $toast.add({
        color: 'error',
        title: 'Ошибка при загрузке файла',
        description: 'Неизвестная ошибка',
      });

      return false;
    }
  }

  const isImageLoading = ref(false);

  function hasStatusCode(x: unknown): x is { statusCode: unknown } {
    return typeof x === 'object' && x !== null && 'statusCode' in x;
  }

  function toError(x: unknown): Error {
    return x instanceof Error ? x : new Error('Неизвестная ошибка');
  }

  function onError(error: Error, statusCode: number) {
    console.error(error);

    $toast.add({
      color: 'error',
      title: 'Ошибка при загрузке файла',
      description: getStatusMessage(statusCode),
    });
  }

  async function handleFiles(files: File[] | FileList) {
    const file = Array.from(files)[0];

    if (!file) {
      return;
    }

    const isValid = await beforeUpload(file);

    if (!isValid) {
      return;
    }

    isImageLoading.value = true;

    try {
      const formData = new FormData();

      formData.append('file', file);

      const response = await $fetch<UploadResponse>(actionUrl.value, {
        method: 'POST',
        body: formData,
      });

      if (imageUploaded.value) {
        await removeLoadedImage();
      }

      imageUploaded.value = response.url;

      $toast.add({
        color: 'success',
        title: 'Успех',
        description: 'Изображение успешно загружено',
      });
    } catch (err) {
      const status =
        hasStatusCode(err) && typeof err.statusCode === 'number'
          ? err.statusCode
          : 500;

      onError(toError(err), status);
    } finally {
      isImageLoading.value = false;
    }
  }

  const dropZoneRef = useTemplateRef<HTMLElement>('dropZoneRef');

  const { open: openDialog, onChange } = useFileDialog({
    accept: 'image/webp, image/jpeg, image/png',
    multiple: false,
  });

  onChange((files) => handleFiles(files || []));

  const { isOverDropZone } = useDropZone(dropZoneRef, {
    dataTypes: ['image/webp', 'image/jpeg', 'image/png'],
    multiple: false,
    onDrop: (files) => handleFiles(files || []),
  });
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      ref="dropZoneRef"
      :class="[
        'w-full bg-muted p-6 text-center transition-colors',
        'rounded-lg border-2 border-dashed border-default hover:border-primary',
        isOverDropZone ? 'hover:border-primary' : undefined,
      ]"
      @click.left.exact.prevent="() => openDialog()"
    >
      <span class="text-sm">
        Перетащи или нажми сюда, чтобы загрузить картинку в форматах: .webp,
        .jpg, .jpeg, .png
      </span>
    </div>

    <div
      v-if="$slots.preview"
      class="w-full"
    >
      <slot name="preview" />
    </div>
  </div>
</template>
