<script setup lang="ts">
  import type { TokenatorFrame } from '~tokenator/model';

  useSeoMeta({
    title: 'Токенатор: Настройки',
  });

  const { data: borders, refresh } = await useAsyncData<Array<TokenatorFrame>>(
    'admin-token-borders',
    () => $fetch('/api/v2/token-border'),
  );

  const isUploading = ref(false);
  const toast = useToast();

  function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;

    if (input.files) {
      handleFileUpload(input.files);
    }
  }

  async function handleFileUpload(files: FileList) {
    if (!files.length) {
      return;
    }

    isUploading.value = true;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files.item(i);

        if (!file) {
          continue;
        }

        const formData = new FormData();

        formData.append('file', file);

        await $fetch<TokenatorFrame>('/api/v2/token-border', {
          method: 'POST',
          body: formData,
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

  const isDeleting = ref<string | null>(null);

  async function deleteBorder(id: string) {
    isDeleting.value = id;

    try {
      await $fetch(`/api/v2/token-border/${id}`, {
        method: 'DELETE',
      });

      await refresh();
      toast.add({ title: 'Рамка удалена', color: 'success' });
    } catch (e) {
      console.error('Failed to delete:', e);
      toast.add({ title: 'Ошибка при удалении', color: 'error' });
    } finally {
      isDeleting.value = null;
    }
  }

  function getBorderName(border: TokenatorFrame) {
    return border.url.split('/').pop() || 'Рамка';
  }

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

  function getBorderClass(index: number) {
    return [
      'cursor-move transition-all duration-200',
      draggedIndex.value === index ? 'scale-95 opacity-50' : '',
      dragOverIndex.value === index
        ? 'ring-2 ring-primary-500 ring-offset-2'
        : '',
    ];
  }

  async function onDrop(targetIndex: number) {
    const fromIndex = draggedIndex.value;

    draggedIndex.value = null;
    dragOverIndex.value = null;

    if (fromIndex === null || fromIndex === targetIndex || !borders.value) {
      return;
    }

    const movedBorder = borders.value[fromIndex];

    if (!movedBorder) {
      return;
    }

    const localBorders = [...borders.value];
    const [removed] = localBorders.splice(fromIndex, 1);

    if (removed) {
      localBorders.splice(targetIndex, 0, removed);
      borders.value = localBorders;
    }

    isSavingOrder.value = true;

    try {
      await $fetch('/api/v2/token-border', {
        method: 'PUT',
        body: {
          id: movedBorder.id,
          order: targetIndex + 1,
        },
      });

      toast.add({ title: 'Порядок сохранен', color: 'success' });
    } catch (e) {
      console.error(e);
      toast.add({ title: 'Ошибка сохранения порядка', color: 'error' });
      await refresh();
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
            @change="onFileChange"
          />

          <p class="text-xs text-neutral-500">
            Поддерживаются форматы: .webp, .jpg, .jpeg, .png
          </p>
        </div>
      </UCard>

      <div
        v-if="borders?.length"
        class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      >
        <UCard
          v-for="(border, index) in borders"
          :key="border.id"
          :class="getBorderClass(index)"
          draggable="true"
          @dragstart="onDragStart(index, $event)"
          @dragenter.prevent="onDragEnter(index)"
          @dragover.prevent
          @drop="onDrop(index)"
        >
          <div class="relative aspect-square w-full overflow-hidden rounded">
            <img
              :src="border.url"
              class="pointer-events-none h-full w-full object-contain"
              loading="lazy"
              alt="Рамка"
            />
          </div>

          <template #footer>
            <div class="flex items-center justify-between gap-2">
              <span
                class="truncate text-xs text-neutral-500"
                :title="getBorderName(border)"
              >
                {{ getBorderName(border) }}
              </span>

              <UButton
                color="error"
                variant="ghost"
                icon="i-ttg-remove"
                size="xs"
                :loading="isDeleting === border.id"
                @click.left.exact.prevent="deleteBorder(border.id)"
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
