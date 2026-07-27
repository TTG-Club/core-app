<script setup lang="ts">
  const { section, maxSize = undefined } = defineProps<{
    section: string;
    /**
     * Максимальная длина короткой стороны
     */
    maxSize?: string | number;
  }>();

  const maxSizeConverted = Number(maxSize);

  if (!Number.isFinite(maxSizeConverted)) {
    throw new TypeError('maxSize must be a Number or number in String');
  }

  if (maxSizeConverted > 2048) {
    throw new Error('maxSize must be lower or equal to 2048');
  }

  const $toast = useToast();

  const imageUploaded = defineModel<string>();

  const { uploadImage, removeImage } = useImageUpload({
    section: () => section,
    maxSize: () => maxSize,
  });

  /**
   * Загрузка выбранного (или перетащенного) файла.
   *
   * @param files выбор из диалога или из перетаскивания.
   */
  async function handleFiles(files: File[] | FileList) {
    const file = Array.from(files)[0];

    if (!file) {
      return;
    }

    const uploadedUrl = await uploadImage(file);

    if (!uploadedUrl) {
      return;
    }

    // Прежний файл стираем только после успешной загрузки нового — при сбое
    // загрузки картинка остаётся на месте.
    const previousUrl = imageUploaded.value;

    imageUploaded.value = uploadedUrl;

    if (previousUrl) {
      await removeImage(previousUrl);
    }

    $toast.add({
      color: 'success',
      title: 'Успех',
      description: 'Изображение успешно загружено',
    });
  }

  const dropZoneRef = useTemplateRef<HTMLElement>('dropZoneRef');

  const { open: openDialog, onChange } = useFileDialog({
    accept: IMAGE_UPLOAD_ACCEPT,
    multiple: false,
  });

  onChange((files) => handleFiles(files || []));

  const { isOverDropZone } = useDropZone(dropZoneRef, {
    dataTypes: IMAGE_UPLOAD_TYPES,
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
