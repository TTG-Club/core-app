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
</script>

<template>
  <div
    class="flex size-[220px] shrink-0 items-center justify-center rounded-md border border-dashed border-default"
  >
    <template v-if="persona.image">
      <div class="group relative size-full overflow-hidden rounded-md">
        <img
          :src="persona.image"
          class="size-full object-cover transition-opacity"
          :class="{ 'opacity-50': isDeletingImage }"
          alt="Аватар персоны"
        />

        <div
          class="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 opacity-0 transition-all duration-200"
          :class="{
            'opacity-100': isDeletingImage,
            'group-hover:opacity-100': !isDeletingImage,
          }"
          title="Удалить картинку"
          @click.left.exact.prevent="deleteImage"
        >
          <UIcon
            v-if="isDeletingImage"
            name="tabler:loader-2"
            class="size-8 animate-spin text-white"
          />

          <UIcon
            v-else
            name="tabler:trash"
            class="size-8 text-white transition-colors hover:text-error"
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
</template>
