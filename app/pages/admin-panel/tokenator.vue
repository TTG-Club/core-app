<script setup lang="ts">
  useSeoMeta({
    title: 'Токенатор: Настройки',
  });

  // 1. Получаем список рамок
  const { data: frames, refresh } = await useFetch<string[]>(
    '/s3/tokenator/frames',
  );

  // 2. Логика загрузки
  const isUploading = ref(false);
  const toast = useToast();

  async function handleFileUpload(files: FileList) {
    if (!files.length) {
      return;
    }

    isUploading.value = true;

    // Загружаем файлы по одному
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files.item(i);

        if (!file) {
          continue;
        }

        const formData = new FormData();

        formData.append('file', file);

        await $fetch('/s3/upload', {
          method: 'POST',
          body: formData,
          params: { section: 'tokenator' },
        });
      }

      await refresh();
      toast.add({ title: 'Файлы успешно загружены', color: 'success' });
    } catch (e) {
      console.error(e);
      toast.add({ title: 'Ошибка при загрузке', color: 'error' });
    } finally {
      isUploading.value = false;
    }
  }

  // 3. Логика удаления
  const isDeleting = ref<string | null>(null);

  async function deleteFrame(url: string) {
    // eslint-disable-next-line no-alert
    if (!confirm('Удалить эту рамку?')) {
      return;
    }

    isDeleting.value = url;

    try {
      await $fetch(url, { method: 'DELETE' });
      await refresh();
    } catch (e) {
      console.error('Failed to delete:', e);
      // eslint-disable-next-line no-alert
      alert('Ошибка при удалении');
    } finally {
      isDeleting.value = null;
    }
  }

  // 4. Форматирование имени для отображения
  function getFrameName(url: string) {
    return url.split('/').pop() || 'Рамка';
  }

  // 5. Drag and Drop
  const draggedIndex = ref<number | null>(null);
  const dragOverIndex = ref<number | null>(null);
  const isSavingOrder = ref(false);

  function onDragStart(index: number, event: DragEvent) {
    draggedIndex.value = index;

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.dropEffect = 'move';
    }
  }

  function onDragEnter(index: number) {
    if (draggedIndex.value !== null && draggedIndex.value !== index) {
      dragOverIndex.value = index;
    }
  }

  async function onDrop(index: number) {
    const fromIndex = draggedIndex.value;

    draggedIndex.value = null;
    dragOverIndex.value = null;

    if (fromIndex === null || fromIndex === index || !frames.value) {
      return;
    }

    // Update local state optimistic
    const newFrames = [...frames.value];
    const [movedItem] = newFrames.splice(fromIndex, 1);

    if (movedItem !== undefined) {
      newFrames.splice(index, 0, movedItem);
      frames.value = newFrames;
    }

    // Save to server
    isSavingOrder.value = true;

    try {
      await $fetch('/s3/tokenator/order', {
        method: 'POST',
        body: { frames: newFrames },
      });

      toast.add({ title: 'Порядок сохранен', color: 'success' });
    } catch (e) {
      console.error(e);
      toast.add({ title: 'Ошибка сохранения порядка', color: 'error' });
      await refresh(); // Revert on error
    } finally {
      isSavingOrder.value = false;
    }
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    title="Токенатор: Настройки"
  >
    <div class="space-y-6">
      <!-- Блок загрузки -->
      <UCard variant="subtle">
        <template #header>
          <h2 class="truncate text-base text-highlighted">
            Загрузить новые рамки
          </h2>
        </template>

        <div class="flex flex-col gap-4">
          <UInput
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp"
            icon="i-ttg-plus"
            :loading="isUploading"
            @change="
              (e: Event) =>
                handleFileUpload((e.target as HTMLInputElement).files!)
            "
          />

          <p class="text-xs text-neutral-500">
            Поддерживаются форматы: .webp, .jpg, .jpeg, .png
          </p>
        </div>
      </UCard>

      <!-- Список рамок -->
      <div
        v-if="frames?.length"
        class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      >
        <UCard
          v-for="(url, index) in frames"
          :key="url"
          :class="[
            'cursor-move transition-all duration-200',
            draggedIndex === index ? 'scale-95 opacity-50' : '',
            dragOverIndex === index
              ? 'ring-2 ring-primary-500 ring-offset-2'
              : '',
          ]"
          draggable="true"
          @dragstart="onDragStart(index, $event)"
          @dragenter.prevent="onDragEnter(index)"
          @dragover.prevent
          @drop="onDrop(index)"
        >
          <!-- Картинка в теле карточки -->
          <div class="relative aspect-square w-full overflow-hidden rounded">
            <img
              :src="url"
              class="pointer-events-none h-full w-full object-contain"
              loading="lazy"
              alt="Frame"
            />
          </div>

          <!-- Футер с именем и кнопкой -->
          <template #footer>
            <div class="flex items-center justify-between gap-2">
              <span
                class="truncate text-xs text-neutral-500"
                :title="getFrameName(url)"
              >
                {{ getFrameName(url) }}
              </span>

              <UButton
                color="error"
                variant="ghost"
                icon="i-ttg-remove"
                size="xs"
                :loading="isDeleting === url"
                @click="deleteFrame(url)"
              />
            </div>
          </template>
        </UCard>
      </div>

      <div
        v-else
        class="py-8 text-center text-neutral-500"
      >
        Список рамок пуст
      </div>
    </div>
  </NuxtLayout>
</template>
