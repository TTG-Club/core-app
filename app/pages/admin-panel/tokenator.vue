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
          v-for="url in frames"
          :key="url"
        >
          <!-- Картинка в теле карточки -->
          <div
            class="relative aspect-square w-full overflow-hidden rounded bg-neutral-100 dark:bg-neutral-900"
          >
            <img
              :src="url"
              class="h-full w-full object-contain"
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
