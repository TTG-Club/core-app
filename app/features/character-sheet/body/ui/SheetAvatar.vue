<script setup lang="ts">
  import { ImageCropModal } from '~ui/image-crop';

  import { useCharacterSheet, useSheetAvatar } from '../../composables';

  const { character, canEdit, ensureEditable } = useCharacterSheet();

  const { avatarUrl, isUploading, replaceAvatar, clearAvatar } =
    useSheetAvatar();

  const overlay = useOverlay();

  /** Ссылка есть, но файл не открылся (пропал из хранилища). */
  const isImageBroken = ref(false);

  watch(avatarUrl, () => {
    isImageBroken.value = false;
  });

  const hasImage = computed(
    () => Boolean(avatarUrl.value) && !isImageBroken.value,
  );

  const imageSource = computed(() => avatarUrl.value ?? undefined);

  /** Помечает картинку битой — на её месте рисуется заглушка. */
  function handleImageError(): void {
    isImageBroken.value = true;
  }

  /**
   * Выбор области и загрузка результата. Редактор создаётся на каждый файл:
   * `destroyOnClose` снимает его после закрытия, поэтому следующий выбор
   * открывает редактор с новой картинкой, а не с прежней.
   *
   * @param file выбранный файл.
   */
  async function cropAndUpload(file: File): Promise<void> {
    const cropModal = overlay.create(ImageCropModal, {
      destroyOnClose: true,
      props: { file },
    });

    const cropped = await cropModal.open();

    if (!cropped) {
      return;
    }

    await replaceAvatar(cropped);
  }

  /**
   * Загрузка выбранного (или перетащенного) файла. Право на правку проверяется
   * до редактора: выбирать область на запертом или чужом листе бессмысленно.
   *
   * @param files выбор из диалога или из перетаскивания.
   */
  function handleFiles(files: File[] | FileList | null): void {
    const file = files ? Array.from(files)[0] : undefined;

    if (!file || !ensureEditable()) {
      return;
    }

    void cropAndUpload(file);
  }

  const { open: openFileDialog, onChange } = useFileDialog({
    accept: IMAGE_UPLOAD_ACCEPT,
    multiple: false,
  });

  onChange(handleFiles);

  /** Открывает выбор файла (добавление или замена изображения). */
  function handleUploadClick(): void {
    openFileDialog();
  }

  /** Удаляет изображение персонажа вместе с файлом в хранилище. */
  function handleRemoveClick(): void {
    void clearAvatar();
  }

  const dropZoneRef = useTemplateRef<HTMLElement>('dropZoneRef');

  const { isOverDropZone } = useDropZone(dropZoneRef, {
    dataTypes: IMAGE_UPLOAD_TYPES,
    multiple: false,
    onDrop: handleFiles,
  });

  // Подсветка рамки — только когда файл действительно примут: у запертого и у
  // чужого листа перетаскивание ничего не меняет, обещать приём нельзя.
  const borderClass = computed(() =>
    isOverDropZone.value && canEdit.value
      ? 'border-primary'
      : 'border-warning/70',
  );

  // Действия проявляются при наведении (и при переходе с клавиатуры), а на
  // сенсорных экранах наведения нет — там они видны всегда.
  const overlayClass =
    'absolute inset-0 flex items-center justify-center gap-1 bg-elevated/85 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100';
</script>

<template>
  <div
    ref="dropZoneRef"
    class="group relative size-24 overflow-hidden rounded-full border-2 bg-elevated"
    :class="borderClass"
  >
    <img
      v-if="hasImage"
      :src="imageSource"
      :alt="character.name"
      class="size-full object-cover"
      @error="handleImageError"
    />

    <div
      v-else
      class="grid size-full place-items-center"
    >
      <UIcon
        name="tabler:user"
        class="size-10 text-muted"
      />
    </div>

    <div
      v-if="isUploading"
      class="absolute inset-0 grid place-items-center bg-elevated/85"
    >
      <UIcon
        name="tabler:loader-2"
        class="size-7 animate-spin text-muted"
      />
    </div>

    <template v-else-if="canEdit">
      <UTooltip
        v-if="!hasImage"
        text="Добавить изображение"
      >
        <button
          type="button"
          :class="overlayClass"
          class="cursor-pointer"
          aria-label="Добавить изображение персонажа"
          @click.left.exact.prevent="handleUploadClick"
        >
          <UIcon
            name="tabler:camera-plus"
            class="size-8 text-highlighted"
          />
        </button>
      </UTooltip>

      <div
        v-else
        :class="overlayClass"
      >
        <UTooltip text="Заменить изображение">
          <UButton
            icon="tabler:photo-edit"
            color="neutral"
            variant="soft"
            size="sm"
            square
            class="rounded-full"
            aria-label="Заменить изображение персонажа"
            @click.left.exact.prevent="handleUploadClick"
          />
        </UTooltip>

        <UTooltip text="Удалить изображение">
          <UButton
            icon="tabler:trash"
            color="error"
            variant="soft"
            size="sm"
            square
            class="rounded-full"
            aria-label="Удалить изображение персонажа"
            @click.left.exact.prevent="handleRemoveClick"
          />
        </UTooltip>
      </div>
    </template>
  </div>
</template>
