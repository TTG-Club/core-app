<script setup lang="ts">
  import bytes from 'bytes';
  import { chunk } from 'lodash-es';
  import { getStatusMessage } from '#shared/utils';
  import type { UploadResponse } from '~/shared/types';

  const { section } = defineProps<{
    section: string;
  }>();

  const maxFileWeight = bytes('5MB')!;
  const maxFileSize = 2048;

  const $toast = useToast();

  const actionUrl = computed(() => `/s3/upload?section=${getSlug(section)}`);

  function hasStatusCode(x: unknown): x is { statusCode: unknown } {
    return typeof x === 'object' && x !== null && 'statusCode' in x;
  }

  function toError(x: unknown): Error {
    return x instanceof Error ? x : new Error('Неизвестная ошибка');
  }

  function onError(error: Error, statusCode: number) {
    $toast.add({
      color: 'error',
      title: 'Неизвестная ошибка',
      description: getStatusMessage(statusCode),
    });
  }

  const imagesUploaded = defineModel<string[]>();

  const chunkedPreview = computed(() => chunk(imagesUploaded.value, 3));

  function bufferToBase64(buf: ArrayBuffer) {
    const chunks = [];
    const uint8 = new Uint8Array(buf);
    const chunkSize = 0x8000;

    for (let i = 0; i < uint8.length; i += chunkSize) {
      const item = uint8.subarray(i, Math.min(i + chunkSize, uint8.length));

      chunks.push(String.fromCharCode(...item));
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

  async function removeLoadedImage(link: string) {
    try {
      await $fetch(link, { method: 'DELETE' });

      imagesUploaded.value =
        imagesUploaded.value?.filter((url) => url !== link) || [];

      $toast.add({
        color: 'success',
        title: 'Успех',
        description: 'Изображение успешно удалено',
      });
    } catch (e) {
      $toast.add({
        color: 'error',
        title: 'Ошибка при удалении',
        description: 'Не удалось удалить изображение',
      });
    }
  }

  async function handleFiles(files: File[] | FileList) {
    const fileArray = Array.from(files);

    if (!fileArray.length) return;

    isImageLoading.value = true;

    for (const file of fileArray) {
      const isValid = await beforeUpload(file);

      if (!isValid) continue;

      try {
        const formData = new FormData();

        formData.append('file', file);

        const response = await $fetch<UploadResponse>(actionUrl.value, {
          method: 'POST',
          body: formData,
        });

        imagesUploaded.value = [...(imagesUploaded.value || []), response.url];

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
      }
    }

    isImageLoading.value = false;
  }

  const dropZoneRef = useTemplateRef<HTMLElement>('dropZoneRef');

  const { open: openDialog, onChange } = useFileDialog({
    accept: 'image/webp,image/jpeg,image/png',
    multiple: true,
  });

  onChange((files) => handleFiles(files || []));

  const { isOverDropZone } = useDropZone(dropZoneRef, {
    dataTypes: ['image/webp', 'image/jpeg', 'image/png'],
    multiple: true,
    onDrop: (files) => handleFiles(files || []),
  });
</script>

<template>
  <div
    ref="dropZoneRef"
    class="w-full rounded-lg border-2 border-dashed border-default bg-(--ui-bg-muted) p-6 text-center transition-colors hover:border-primary"
    :class="isOverDropZone ? 'hover:border-primary' : undefined"
    @click.left.exact.prevent="() => openDialog()"
  >
    <span class="text-sm">
      Перетащи или нажми сюда, чтобы загрузить картинку в форматах: .webp, .jpg,
      .jpeg, .png
    </span>
  </div>

  <div
    v-if="chunkedPreview?.length"
    class="mt-4"
  >
    <div
      v-for="(row, index) in chunkedPreview"
      :key="index"
      class="grid grid-cols-3 gap-4"
    >
      <div
        v-for="image in row"
        :key="image"
        class="relative overflow-hidden rounded-lg"
      >
        <img
          :src="image || '/img/no-img.webp'"
          alt="Uploaded image"
          class="h-full w-full object-contain"
        />

        <div
          class="absolute top-0 right-0 p-2 opacity-0 transition-opacity hover:opacity-100"
        >
          <UButton
            icon="i-ttg-remove"
            color="error"
            size="xs"
            @click.left.exact.prevent="removeLoadedImage(image)"
          />
        </div>
      </div>
    </div>
  </div>

  <div
    v-else
    class="mt-4 grid grid-cols-3 gap-4"
  >
    <div
      v-for="index in 3"
      :key="index"
      class="relative overflow-hidden rounded-lg"
    >
      <img
        src="/img/no-img.webp"
        alt="Placeholder"
        class="h-full w-full object-contain"
      />
    </div>
  </div>
</template>
