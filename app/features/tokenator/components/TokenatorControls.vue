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
    const currentAlpha = store.backgroundColor.slice(7);

    store.backgroundColor = `#22c55e${currentAlpha}`;
  }

  function resetTint() {
    const currentColor = store.frameTint.colors[0] || '#ff000000';
    const currentAlpha = currentColor.slice(7) || '00';

    store.frameTint.colors[0] = `#ff0000${currentAlpha}`;
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

  // Background Color Helpers
  const bgColorHex = computed({
    get: () => store.backgroundColor.slice(0, 7),
    set: (val) => {
      const alpha = store.backgroundColor.slice(7) || 'ff';

      store.backgroundColor = val + alpha;
    },
  });

  const bgOpacity = computed({
    get: () => {
      const hex = store.backgroundColor.slice(7);

      if (!hex) {
        return 100;
      }

      return Math.round((Number.parseInt(hex, 16) / 255) * 100);
    },
    set: (val) => {
      const hexAlpha = Math.round((val / 100) * 255)
        .toString(16)
        .padStart(2, '0');

      store.backgroundColor = store.backgroundColor.slice(0, 7) + hexAlpha;
    },
  });

  // Tint Helpers
  const isTintGradient = computed({
    get: () => store.frameTint.type === 'gradient',
    set: (val) => {
      store.frameTint.type = val ? 'gradient' : 'solid';

      if (val && store.frameTint.colors.length < 2) {
        store.frameTint.colors.push('#0000ff');
      }
    },
  });

  const tintColor1Hex = computed({
    get: () => store.frameTint.colors[0]?.slice(0, 7) || '#ff0000',
    set: (val) => {
      const alpha = store.frameTint.colors[0]?.slice(7) || '';

      store.frameTint.colors[0] = val + alpha;

      if (!store.frameTint.enabled) {
        store.frameTint.enabled = true;
      }
    },
  });

  const tintColor1Opacity = computed({
    get: () => {
      const hex = store.frameTint.colors[0]?.slice(7);

      if (!hex) {
        return 100;
      }

      return Math.round((Number.parseInt(hex, 16) / 255) * 100);
    },
    set: (val) => {
      const hexAlpha = Math.round((val / 100) * 255)
        .toString(16)
        .padStart(2, '0');

      // Ensure we have a valid color first if somehow missing
      const base = store.frameTint.colors[0]?.slice(0, 7) || '#ff0000';

      store.frameTint.colors[0] = base + (val < 100 ? hexAlpha : '');

      if (!store.frameTint.enabled) {
        store.frameTint.enabled = true;
      }
    },
  });

  const tintColor2Hex = computed({
    get: () => store.frameTint.colors[1]?.slice(0, 7) || '#0000ff',
    set: (val) => {
      const alpha = store.frameTint.colors[1]?.slice(7) || '';

      if (store.frameTint.colors.length < 2) {
        store.frameTint.colors.push(val);
      } else {
        store.frameTint.colors[1] = val + alpha;
      }

      if (!store.frameTint.enabled) {
        store.frameTint.enabled = true;
      }
    },
  });

  const tintColor2Opacity = computed({
    get: () => {
      const hex = store.frameTint.colors[1]?.slice(7);

      if (!hex) {
        return 100;
      }

      return Math.round((Number.parseInt(hex, 16) / 255) * 100);
    },
    set: (val) => {
      const hexAlpha = Math.round((val / 100) * 255)
        .toString(16)
        .padStart(2, '0');

      const base = store.frameTint.colors[1]?.slice(0, 7) || '#0000ff';

      if (store.frameTint.colors.length < 2) {
        store.frameTint.colors.push(base + hexAlpha);
      } else {
        store.frameTint.colors[1] = base + (val < 100 ? hexAlpha : '');
      }

      if (!store.frameTint.enabled) {
        store.frameTint.enabled = true;
      }
    },
  });

  const blendModes = [
    { label: 'Обычный', value: 'source-atop' },
    { label: 'Умножение', value: 'multiply' },
    { label: 'Экран', value: 'screen' },
    { label: 'Перекрытие', value: 'overlay' },
    { label: 'Затемнение', value: 'darken' },
    { label: 'Осветление', value: 'lighten' },
    { label: 'Осветление основы', value: 'color-dodge' },
    { label: 'Затемнение основы', value: 'color-burn' },
    { label: 'Жёсткий свет', value: 'hard-light' },
    { label: 'Мягкий свет', value: 'soft-light' },
    { label: 'Разница', value: 'difference' },
    { label: 'Исключение', value: 'exclusion' },
    { label: 'Цветовой тон', value: 'hue' },
    { label: 'Насыщенность', value: 'saturation' },
    { label: 'Цветность', value: 'color' },
    { label: 'Яркость', value: 'luminosity' },
  ];
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
                    class="flex-1 justify-center rounded-r-none"
                    @click="imageInput?.click()"
                  >
                    Изображение
                  </UButton>

                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="i-ttg-x"
                    class="rounded-l-none border-l-0"
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
                    class="flex-1 justify-center rounded-r-none"
                    @click="frameInput?.click()"
                  >
                    Своя рамка
                  </UButton>

                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="i-ttg-x"
                    class="rounded-l-none border-l-0"
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
          <!-- Transform -->
          <div class="space-y-4">
            <!-- Mask Scale -->
            <div class="space-y-2">
              <div
                class="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400"
              >
                <span>Размер маски</span>

                <div class="flex items-center gap-2">
                  <UButton
                    v-if="store.transform.maskScale !== 1"
                    color="neutral"
                    variant="link"
                    size="xs"
                    class="p-0 text-xs font-normal"
                    @click="store.transform.maskScale = 1"
                  >
                    Сбросить
                  </UButton>

                  <span
                    >{{ (store.transform.maskScale || 1).toFixed(2) }}x</span
                  >
                </div>
              </div>

              <USlider
                v-model.number="store.transform.maskScale"
                :min="0.5"
                :max="1.5"
                :step="0.01"
                size="sm"
              />
            </div>

            <!-- Scale -->
            <div class="space-y-2">
              <div
                class="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400"
              >
                <span>Масштаб</span>

                <div class="flex items-center gap-2">
                  <UButton
                    v-if="store.transform.scale !== 1"
                    color="neutral"
                    variant="link"
                    size="xs"
                    class="p-0 text-xs font-normal"
                    @click="store.transform.scale = 1"
                  >
                    Сбросить
                  </UButton>

                  <span>{{ store.transform.scale.toFixed(2) }}x</span>
                </div>
              </div>

              <USlider
                v-model.number="store.transform.scale"
                :min="0.1"
                :max="3"
                :step="0.05"
                size="sm"
              />
            </div>

            <!-- Rotate -->
            <div class="space-y-2">
              <div
                class="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400"
              >
                <span>Поворот</span>

                <div class="flex items-center gap-2">
                  <UButton
                    v-if="store.transform.rotate !== 0"
                    color="neutral"
                    variant="link"
                    size="xs"
                    class="p-0 text-xs font-normal"
                    @click="store.transform.rotate = 0"
                  >
                    Сбросить
                  </UButton>

                  <span>{{ store.transform.rotate }}°</span>
                </div>
              </div>

              <USlider
                v-model.number="store.transform.rotate"
                :min="-180"
                :max="180"
                :step="1"
                size="sm"
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

          <!-- Style -->
          <!-- Style -->
          <!-- Style -->
          <div class="space-y-3">
            <!-- Background -->
            <div class="flex gap-2">
              <div class="flex items-center -space-x-px">
                <UPopover
                  mode="click"
                  :popper="{ placement: 'bottom-start' }"
                >
                  <UButton
                    color="neutral"
                    variant="outline"
                    :class="{
                      'rounded-r-none': bgColorHex !== '#22c55e',
                    }"
                  >
                    <div
                      class="h-3 w-3 rounded-full border border-neutral-200 dark:border-neutral-700"
                      :style="{ backgroundColor: bgColorHex }"
                    ></div>
                    Цвет фона
                  </UButton>

                  <template #content>
                    <div class="p-2">
                      <UColorPicker v-model="bgColorHex" />
                    </div>
                  </template>
                </UPopover>

                <UButton
                  v-if="bgColorHex !== '#22c55e'"
                  color="neutral"
                  variant="outline"
                  icon="i-ttg-x"
                  class="rounded-l-none"
                  @click="resetBackgroundColor"
                />
              </div>

              <USlider
                v-model.number="bgOpacity"
                :min="0"
                :max="100"
                :step="1"
                size="sm"
                class="flex-1"
              />
            </div>

            <!-- Frame Tint -->
            <!-- Color 1 -->
            <div class="flex gap-2">
              <div class="flex items-center -space-x-px">
                <UPopover
                  mode="click"
                  :popper="{ placement: 'bottom-start' }"
                >
                  <UButton
                    color="neutral"
                    variant="outline"
                    :class="{
                      'rounded-r-none': tintColor1Hex !== '#ff0000',
                    }"
                  >
                    <div
                      class="h-3 w-3 rounded-full border border-neutral-200 dark:border-neutral-700"
                      :style="{ backgroundColor: tintColor1Hex }"
                    ></div>
                    Цвет рамки 1
                  </UButton>

                  <template #content>
                    <div class="p-2">
                      <UColorPicker v-model="tintColor1Hex" />
                    </div>
                  </template>
                </UPopover>

                <UButton
                  v-if="tintColor1Hex !== '#ff0000'"
                  color="neutral"
                  variant="outline"
                  icon="i-ttg-x"
                  class="rounded-l-none"
                  @click="resetTint"
                />
              </div>

              <USlider
                v-model.number="tintColor1Opacity"
                :min="0"
                :max="100"
                size="sm"
                class="flex-1"
              />
            </div>

            <!-- Color 2 (Gradient) -->
            <div class="flex gap-2">
              <div class="flex items-center">
                <UCheckbox v-model="isTintGradient" />
              </div>

              <div
                class="flex flex-1 gap-2 transition-opacity"
                :class="{ 'pointer-events-none opacity-50': !isTintGradient }"
              >
                <UPopover
                  mode="click"
                  :popper="{ placement: 'bottom-start' }"
                >
                  <UButton
                    color="neutral"
                    variant="outline"
                  >
                    <div
                      class="h-3 w-3 rounded-full border border-neutral-200 dark:border-neutral-700"
                      :style="{ backgroundColor: tintColor2Hex }"
                    ></div>
                    Цвет рамки 2
                  </UButton>

                  <template #content>
                    <div class="p-2">
                      <UColorPicker v-model="tintColor2Hex" />
                    </div>
                  </template>
                </UPopover>

                <USlider
                  v-model.number="tintColor2Opacity"
                  :min="0"
                  :max="100"
                  size="sm"
                  class="flex-1"
                />
              </div>
            </div>

            <div class="flex gap-2">
              <UButton
                size="xs"
                block
                class="flex-1"
                variant="soft"
                @click="store.randomizeTint"
                :label="
                  isTintGradient ? 'Случайный градиент' : 'Случайный цвет'
                "
                icon="i-heroicons-sparkles"
              />

              <USelectMenu
                v-model="store.frameTint.blendMode"
                :items="blendModes"
                value-key="value"
                size="xs"
                class="w-36"
                :popper="{ placement: 'top' }"
              />
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
