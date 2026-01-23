<script setup lang="ts">
  import { useTokenatorStore } from '../composables/useTokenatorStore';
  import { CANVAS_SIZE, drawToken } from '../utils/draw';

  const store = useTokenatorStore();

  // Frames Data - simple array of URLs
  const { data: frameUrls } = await useFetch<string[]>('/s3/tokenator/frames');

  // Convert URLs to frame objects for compatibility
  const frames = computed(() => {
    return (
      frameUrls.value?.map((url, index) => ({
        id: `frame-${index}`,
        url,
        name: `Рамка ${index + 1}`,
        visible: true,
        order: index,
      })) || []
    );
  });

  // Upload Handlers
  const imageInput = ref<HTMLInputElement | null>(null);
  const frameInput = ref<HTMLInputElement | null>(null);

  function onImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      store.setImage(file);
      input.value = ''; // Reset to allow re-uploading same file
    }
  }

  function onFrameUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      store.setCustomFrame(file);
      input.value = ''; // Reset
    }
  }

  // Export
  async function downloadToken(format: 'png' | 'jpeg' | 'webp') {
    const canvas = document.createElement('canvas');

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    await drawToken({
      ctx,
      backgroundColor: store.backgroundColor,
      currentImage: store.currentImage,
      activeFrameUrl: store.activeFrameUrl,
      frameTint: store.frameTint,
      transform: store.transform,
      clip: true,
    });

    const url = canvas.toDataURL(`image/${format}`, 0.9);
    const link = document.createElement('a');

    link.download = `token-${Date.now()}.${format}`;
    link.href = url;
    link.click();
  }

  // Colors
  function resetBackgroundColor() {
    store.backgroundColor = '#ffffff00';
  }

  function resetTint() {
    store.frameTint = { enabled: false, type: 'solid', colors: ['#ff0000'] };
  }

  // Auto-select first frame
  watch(
    frames,
    (newFrames) => {
      if (
        newFrames?.length &&
        newFrames[0] &&
        !store.currentFrame &&
        !store.customFrame
      ) {
        store.selectFrame(newFrames[0]);
      }
    },
    { immediate: true },
  );

  // Ensure new state properties exist
  watchEffect(() => {
    if (store.transform.maskScale === undefined) {
      store.transform.maskScale = 1;
    }
  });
</script>

<template>
  <div class="flex flex-col gap-4">
    <UTabs
      :items="[
        { label: 'Библиотека', slot: 'library' },
        { label: 'Настройки', slot: 'settings' },
      ]"
      :ui="{
        content: 'pt-4 space-y-4',
      }"
    >
      <!-- Library Tab -->
      <template #library>
        <div class="space-y-6">
          <!-- Uploads -->
          <div class="space-y-3">
            <h3
              class="text-sm font-medium tracking-wider text-neutral-500 uppercase"
            >
              Загрузка
            </h3>

            <div class="grid grid-cols-2 gap-2">
              <!-- Image Upload -->
              <div>
                <input
                  ref="imageInput"
                  type="file"
                  class="hidden"
                  accept="image/*"
                  @change="onImageUpload"
                />

                <UButtonGroup
                  v-if="store.currentImage"
                  class="flex w-full"
                  orientation="horizontal"
                >
                  <UButton
                    color="neutral"
                    variant="outline"
                    class="flex-1 justify-center"
                    @click="imageInput?.click()"
                  >
                    Изображение
                  </UButton>

                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="i-ttg-x"
                    @click.stop="store.currentImage = null"
                  />
                </UButtonGroup>

                <UButton
                  v-else
                  block
                  color="neutral"
                  variant="outline"
                  @click="imageInput?.click()"
                >
                  Изображение
                </UButton>
              </div>

              <!-- Custom Frame Upload -->
              <div>
                <input
                  ref="frameInput"
                  type="file"
                  class="hidden"
                  accept="image/*"
                  @change="onFrameUpload"
                />

                <UButtonGroup
                  v-if="store.customFrame"
                  class="flex w-full"
                  orientation="horizontal"
                >
                  <UButton
                    color="neutral"
                    variant="outline"
                    class="flex-1 justify-center"
                    @click="frameInput?.click()"
                  >
                    Своя рамка
                  </UButton>

                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="i-ttg-x"
                    @click.stop="store.customFrame = null"
                  />
                </UButtonGroup>

                <UButton
                  v-else
                  block
                  color="neutral"
                  variant="outline"
                  @click="frameInput?.click()"
                >
                  Своя рамка
                </UButton>
              </div>
            </div>
          </div>

          <!-- Default Frames -->
          <div class="space-y-3">
            <h3
              class="text-sm font-medium tracking-wider text-neutral-500 uppercase"
            >
              Рамки
            </h3>

            <div
              v-if="frames && frames.length"
              class="grid grid-cols-5 gap-2"
            >
              <button
                class="flex aspect-square items-center justify-center rounded-md border-2 border-dashed border-neutral-300 text-neutral-400 hover:border-primary hover:text-primary dark:border-neutral-700"
                :class="
                  !store.currentFrame && !store.customFrame
                    ? 'border-primary text-primary'
                    : ''
                "
                @click="
                  store.currentFrame = null;
                  store.customFrame = null;
                "
              >
                <UIcon
                  name="i-ttg-x"
                  class="size-6"
                />
              </button>

              <button
                v-for="frame in frames"
                :key="frame.id"
                class="relative aspect-square overflow-hidden rounded-md border-2 p-1 transition-all hover:border-primary-500/50"
                :class="
                  store.currentFrame?.id === frame.id
                    ? 'border-primary'
                    : 'border-neutral-200 dark:border-neutral-800'
                "
                @click="store.selectFrame(frame)"
              >
                <img
                  :src="frame.url"
                  :alt="frame.name"
                  class="size-full object-contain"
                  crossorigin="anonymous"
                  loading="lazy"
                />
              </button>
            </div>

            <div
              v-else
              class="py-4 text-center text-sm text-neutral-400"
            >
              Нет доступных рамок
            </div>
          </div>
        </div>
      </template>

      <!-- Settings Tab -->
      <template #settings>
        <div class="space-y-6">
          <!-- Transform -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3
                class="text-sm font-medium tracking-wider text-neutral-500 uppercase"
              >
                Трансформация
              </h3>

              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                @click="store.resetTransform"
                >Сбросить</UButton
              >
            </div>

            <!-- Scale -->
            <div class="space-y-2">
              <div
                class="flex justify-between text-xs text-neutral-600 dark:text-neutral-400"
              >
                <span>Масштаб</span>

                <span>{{ store.transform.scale.toFixed(2) }}x</span>
              </div>

              <input
                type="range"
                v-model.number="store.transform.scale"
                :min="0.1"
                :max="3"
                :step="0.05"
                class="w-full accent-primary-500"
              />
            </div>

            <!-- Mask Scale -->
            <div class="space-y-2">
              <div
                class="flex justify-between text-xs text-neutral-600 dark:text-neutral-400"
              >
                <span>Размер маски</span>

                <span>{{ (store.transform.maskScale || 1).toFixed(2) }}x</span>
              </div>

              <input
                type="range"
                v-model.number="store.transform.maskScale"
                :min="0.5"
                :max="1.5"
                :step="0.01"
                class="w-full accent-primary-500"
              />
            </div>

            <!-- Rotate -->
            <div class="space-y-2">
              <div
                class="flex justify-between text-xs text-neutral-600 dark:text-neutral-400"
              >
                <span>Поворот</span>

                <span>{{ store.transform.rotate }}°</span>
              </div>

              <input
                type="range"
                v-model.number="store.transform.rotate"
                :min="-180"
                :max="180"
                :step="1"
                class="w-full accent-primary-500"
              />
            </div>

            <!-- Flip -->
            <div class="grid grid-cols-2 gap-2">
              <UButton
                block
                size="xs"
                :color="store.transform.flip.x ? 'primary' : 'neutral'"
                :variant="store.transform.flip.x ? 'solid' : 'outline'"
                icon="i-heroicons-arrows-right-left"
                @click="store.transform.flip.x = !store.transform.flip.x"
              >
                Отразить X
              </UButton>

              <UButton
                block
                size="xs"
                :color="store.transform.flip.y ? 'primary' : 'neutral'"
                :variant="store.transform.flip.y ? 'solid' : 'outline'"
                icon="i-heroicons-arrows-up-down"
                @click="store.transform.flip.y = !store.transform.flip.y"
              >
                Отразить Y
              </UButton>
            </div>
          </div>

          <USeparator />

          <!-- Style -->
          <div class="space-y-4">
            <h3
              class="text-sm font-medium tracking-wider text-neutral-500 uppercase"
            >
              Стиль
            </h3>

            <!-- Background -->
            <div class="flex items-center justify-between">
              <span class="text-sm">Фон</span>

              <div class="flex items-center gap-2">
                <input
                  type="color"
                  v-model="store.backgroundColor"
                  class="h-6 w-8 cursor-pointer rounded border border-neutral-300 p-0 dark:border-neutral-700"
                />

                <UButton
                  icon="i-heroicons-arrow-path"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  @click="resetBackgroundColor"
                />
              </div>
            </div>

            <!-- Frame Tint -->
            <div class="flex items-center justify-between">
              <span class="text-sm">Покраска рамки</span>

              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  v-model="store.frameTint.enabled"
                  class="size-5 accent-primary-500"
                />

                <UButton
                  icon="i-heroicons-arrow-path"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  @click="resetTint"
                />
              </div>
            </div>

            <div
              v-if="store.frameTint.enabled"
              class="space-y-3 rounded-md bg-neutral-100 p-3 dark:bg-neutral-800"
            >
              <div class="flex gap-1">
                <UButton
                  size="xs"
                  block
                  class="flex-1"
                  :variant="
                    store.frameTint.type === 'solid' ? 'solid' : 'outline'
                  "
                  @click="store.frameTint.type = 'solid'"
                  >Solid</UButton
                >

                <UButton
                  size="xs"
                  block
                  class="flex-1"
                  :variant="
                    store.frameTint.type === 'gradient' ? 'solid' : 'outline'
                  "
                  @click="store.frameTint.type = 'gradient'"
                  >Gradient</UButton
                >
              </div>

              <div class="flex gap-2">
                <input
                  type="color"
                  v-model="store.frameTint.colors[0]"
                  class="h-8 w-full cursor-pointer rounded border border-neutral-300 p-0 dark:border-neutral-600"
                />

                <input
                  v-if="store.frameTint.type === 'gradient'"
                  type="color"
                  v-model="store.frameTint.colors[1]"
                  class="h-8 w-full cursor-pointer rounded border border-neutral-300 p-0 dark:border-neutral-600"
                />
              </div>

              <UButton
                size="xs"
                block
                icon="i-heroicons-sparkles"
                variant="soft"
                @click="store.randomizeTint"
                >Случайный цвет</UButton
              >
            </div>
          </div>
        </div>
      </template>
    </UTabs>

    <!-- Export Actions -->
    <div class="grid shrink-0 grid-cols-2 gap-3">
      <UButton
        size="lg"
        block
        @click="downloadToken('png')"
        >Скачать PNG</UButton
      >

      <UButton
        size="lg"
        block
        color="neutral"
        variant="outline"
        @click="downloadToken('webp')"
        >WEBP</UButton
      >
    </div>
  </div>
</template>
