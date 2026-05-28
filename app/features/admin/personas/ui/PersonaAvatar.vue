<script setup lang="ts">
  import type { PersonaResponse } from '../model';

  import { FetchError } from 'ofetch';

  const { persona } = defineProps<{
    persona: PersonaResponse;
  }>();

  const emit = defineEmits<{
    edited: [];
  }>();

  const toast = useToast();

  const {
    open: openImageDialog,
    onChange: onImageDialogChange,
    onCancel: onImageDialogCancel,
    reset: resetImageDialog,
  } = useFileDialog({
    accept: 'image/webp, image/jpeg, image/png',
    multiple: false,
  });

  const isUploadingImage = ref(false);
  const isDeletingImage = ref(false);
  const isPreviewOpen = ref(false);
  const isConfirmDeleteOpen = ref(false);

  function triggerImageUpload() {
    resetImageDialog();
    openImageDialog();
  }

  onImageDialogChange(async (files) => {
    const file = files?.[0];

    if (!file) {
      return;
    }

    isUploadingImage.value = true;

    try {
      const formData = new FormData();

      formData.append('file', file);

      const response = await $fetch<{ url: string }>('/s3/upload', {
        method: 'POST',
        query: { section: 'persona' },
        body: formData,
      });

      await $fetch(`/api/v2/persona/${persona.id}`, {
        method: 'PATCH',
        body: { image: response.url },
      });

      emit('edited');
      toast.add({ title: 'Изображение загружено', color: 'success' });
    } catch (error) {
      const message =
        error instanceof FetchError
          ? error.data?.message || error.message
          : 'Неизвестная ошибка';

      toast.add({
        title: 'Ошибка при загрузке изображения',
        description: message,
        color: 'error',
      });
    } finally {
      isUploadingImage.value = false;
      resetImageDialog();
    }
  });

  onImageDialogCancel(() => {
    isUploadingImage.value = false;
  });

  async function deleteImage() {
    if (!persona.image) {
      return;
    }

    isDeletingImage.value = true;

    try {
      await $fetch(persona.image, { method: 'DELETE' }).catch(() => {});

      await $fetch(`/api/v2/persona/${persona.id}`, {
        method: 'PATCH',
        body: { image: '' },
      });

      emit('edited');
      toast.add({ title: 'Изображение удалено', color: 'success' });
    } catch (error) {
      const message =
        error instanceof FetchError
          ? error.data?.message || error.message
          : 'Неизвестная ошибка';

      toast.add({
        title: 'Ошибка при удалении изображения',
        description: message,
        color: 'error',
      });
    } finally {
      isDeletingImage.value = false;
    }
  }

  /**
   * Подтверждает удаление изображения и запускает процесс удаления.
   */
  async function confirmDelete() {
    isConfirmDeleteOpen.value = false;
    await deleteImage();
  }
</script>

<template>
  <div
    class="flex size-[220px] shrink-0 items-center justify-center rounded-md border border-dashed border-default"
  >
    <template v-if="persona.image">
      <div class="group relative size-full overflow-hidden rounded-md">
        <!-- Кликабельная область изображения для предпросмотра -->
        <button
          type="button"
          class="block size-full cursor-zoom-in overflow-hidden border-none bg-transparent p-0 focus:outline-none"
          @click.left.exact.prevent="isPreviewOpen = true"
        >
          <img
            :src="persona.image"
            class="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            :class="{ 'opacity-50': isDeletingImage }"
            alt="Аватар персоны"
          />

          <!-- Легкое затемнение при наведении + иконка лупы -->
          <div
            class="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          >
            <UIcon
              name="tabler:zoom-in"
              class="size-8 scale-90 text-white/90 transition-transform duration-200 group-hover:scale-100"
            />
          </div>
        </button>

        <!-- Кнопка удаления в углу -->
        <div
          class="absolute top-2 right-2 z-10"
          :class="{
            'opacity-100': isDeletingImage,
            'opacity-0 transition-opacity duration-200 group-hover:opacity-100':
              !isDeletingImage,
          }"
        >
          <UButton
            color="error"
            variant="solid"
            size="xs"
            icon="tabler:trash"
            :loading="isDeletingImage"
            class="rounded-full shadow-md"
            title="Удалить картинку"
            @click.left.exact.stop.prevent="isConfirmDeleteOpen = true"
          />
        </div>
      </div>
    </template>

    <div
      v-else
      class="flex flex-col items-center gap-3 text-neutral-500"
    >
      <div class="flex flex-col items-center gap-1">
        <UIcon
          name="tabler:photo"
          class="size-10"
        />

        <span class="text-sm">Нет изображения</span>
      </div>

      <UButton
        size="sm"
        variant="soft"
        :loading="isUploadingImage"
        @click.left.exact.prevent="triggerImageUpload"
      >
        Загрузить
      </UButton>
    </div>
  </div>

  <!-- Модальное окно просмотра оригинального изображения -->
  <UModal
    v-model:open="isPreviewOpen"
    title="Просмотр изображения"
    class="sm:max-w-[864px]"
  >
    <template #body>
      <div class="flex items-center justify-center overflow-hidden">
        <img
          :src="persona.image"
          class="h-auto max-h-[800px] w-auto max-w-[800px] rounded-md object-contain"
          alt="Просмотр аватара"
        />
      </div>
    </template>
  </UModal>

  <!-- Модальное окно подтверждения удаления -->
  <UModal
    v-model:open="isConfirmDeleteOpen"
    title="Удалить изображение?"
    description="Вы действительно хотите удалить изображение этой персоны?"
  >
    <template #body>
      <div class="flex justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          @click.left.exact.prevent="isConfirmDeleteOpen = false"
        >
          Отмена
        </UButton>

        <UButton
          color="error"
          :loading="isDeletingImage"
          @click.left.exact.prevent="confirmDelete"
        >
          Удалить
        </UButton>
      </div>
    </template>
  </UModal>
</template>
