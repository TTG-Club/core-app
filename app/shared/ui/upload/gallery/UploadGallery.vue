<script setup lang="ts">
  import {
    GALLERY_PLACEHOLDER_COUNT,
    UPLOAD_PLACEHOLDER_IMAGE,
    UPLOAD_SUCCESS_DESCRIPTION,
    UPLOAD_SUCCESS_TITLE,
  } from '../constants';

  const { section } = defineProps<{
    section: string;
  }>();

  const imagesUploaded = defineModel<string[]>();

  const $toast = useToast();

  // Проверка файла, сжатие на сервере и тосты ошибок — общие с одиночной
  // загрузкой картинки.
  const { uploadImage } = useImageUpload({ section: () => section });

  /**
   * Убирает картинку из галереи. Файл в хранилище не удаляется: форму ещё
   * можно закрыть без сохранения, и запись должна остаться со своей галереей.
   *
   * @param link ссылка на убираемую картинку.
   */
  function removeLoadedImage(link: string): void {
    imagesUploaded.value = (imagesUploaded.value ?? []).filter(
      (url) => url !== link,
    );
  }

  /**
   * Загружает файлы по одному и дописывает их ссылки в галерею.
   *
   * @param files выбор из диалога или из перетаскивания.
   */
  async function handleFiles(files: File[] | FileList): Promise<void> {
    for (const file of Array.from(files)) {
      const url = await uploadImage(file);

      if (!url) {
        continue;
      }

      imagesUploaded.value = [...(imagesUploaded.value ?? []), url];

      $toast.add({
        color: 'success',
        title: UPLOAD_SUCCESS_TITLE,
        description: UPLOAD_SUCCESS_DESCRIPTION,
      });
    }
  }

  const dropZoneRef = useTemplateRef<HTMLElement>('dropZoneRef');

  const { open: openDialog, onChange } = useFileDialog({
    accept: IMAGE_UPLOAD_ACCEPT,
    multiple: true,
  });

  onChange((files) => handleFiles(files || []));

  const { isOverDropZone } = useDropZone(dropZoneRef, {
    dataTypes: IMAGE_UPLOAD_TYPES,
    multiple: true,
    onDrop: (files) => handleFiles(files || []),
  });

  // Пока над зоной тащат файл, рамка подсвечена, как при наведении мыши.
  const dropZoneBorderClass = computed(() =>
    isOverDropZone.value ? 'border-primary' : 'border-default',
  );
</script>

<template>
  <div
    ref="dropZoneRef"
    :class="[
      'w-full bg-muted p-6 text-center transition-colors',
      'rounded-lg border-2 border-dashed hover:border-primary',
      dropZoneBorderClass,
    ]"
    @click.left.exact.prevent="openDialog()"
  >
    <span class="text-sm">
      Перетащи или нажми сюда, чтобы загрузить картинку в форматах: .webp, .jpg,
      .jpeg, .png
    </span>
  </div>

  <div
    v-if="imagesUploaded?.length"
    class="mt-4 grid grid-cols-3 gap-4"
  >
    <div
      v-for="image in imagesUploaded"
      :key="image"
      class="group relative overflow-hidden rounded-lg"
    >
      <img
        :src="image"
        alt="Uploaded image"
        class="h-full w-full object-contain"
      />

      <div
        class="absolute top-0 right-0 p-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
      >
        <UButton
          icon="tabler:trash"
          color="error"
          size="xs"
          aria-label="Удалить изображение"
          @click.left.exact.prevent="removeLoadedImage(image)"
        />
      </div>
    </div>
  </div>

  <div
    v-else
    class="mt-4 grid grid-cols-3 gap-4"
  >
    <div
      v-for="index in GALLERY_PLACEHOLDER_COUNT"
      :key="index"
      class="relative overflow-hidden rounded-lg"
    >
      <img
        :src="UPLOAD_PLACEHOLDER_IMAGE"
        alt="Placeholder"
        class="h-full w-full object-contain"
      />
    </div>
  </div>
</template>
