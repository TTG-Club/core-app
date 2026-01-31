<script setup lang="ts">
  import {
    DEFAULT_BACKGROUND_COLOR,
    DEFAULT_GRADIENT_COLOR,
    DEFAULT_TINT_COLOR,
    DEFAULT_TINT_COLOR_TRANSPARENT,
    useTokenatorStore,
  } from '../composables/useTokenatorStore';
  import { CANVAS_SIZE, drawToken } from '../utils/draw';

  import type { TokenatorFrame } from '../types';

  const store = useTokenatorStore();

  const { data: bordersData } = await useAsyncData('token-borders', () =>
    $fetch<Array<TokenatorFrame>>('/api/v2/token-border'),
  );

  const frames = computed<Array<TokenatorFrame>>(() =>
    (bordersData.value ?? []).map((border) => {
      let url = border.url;

      if (url.startsWith('http')) {
        const match = url.match(/(token-borders\/|tokenator\/)(.+)/);

        if (match) {
          url = `/s3/${match[0]}`;
        }
      }

      return {
        ...border,
        url,
      };
    }),
  );

  const imageInput = ref<HTMLInputElement | null>(null);
  const frameInput = ref<HTMLInputElement | null>(null);
  const bgInput = ref<HTMLInputElement | null>(null);
  const selectedTab = ref(0);
  const textInput = ref('');

  const activeText = computed(() =>
    store.texts.find((t) => t.id === store.activeTextId),
  );

  function addNewText() {
    if (!textInput.value.trim()) {
      return;
    }

    store.addText(textInput.value);
    textInput.value = '';
  }

  function onImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      store.setImage(file);
      input.value = '';
    }
  }

  function onFrameUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      store.setCustomFrame(file);
      input.value = '';
    }
  }

  function onBgUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      store.setCustomBackground(file);
      input.value = '';
    }
  }

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
      texts: store.texts,
      customBackground: store.customBackground,
      maskImage: store.maskImageCanvas || undefined,
      maskTokenSize: store.maskTokenSize,
      halfMask: store.brush.halfMask,
    });

    const url = canvas.toDataURL(`image/${format}`, 0.9);
    const link = document.createElement('a');

    link.download = `token-${Date.now()}.${format}`;
    link.href = url;
    link.click();
  }

  function resetBackgroundColor() {
    const currentAlpha = store.backgroundColor.slice(7);

    store.backgroundColor = `${DEFAULT_BACKGROUND_COLOR}${currentAlpha}`;
  }

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

  watchEffect(() => {
    if (store.transform.maskScale === undefined) {
      store.transform.maskScale = 1;
    }
  });

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

  watch(selectedTab, (val) => {
    if (val !== 2) {
      store.brush.enabled = false;
    }
  });

  const activeTab = ref(0);

  function onOuterTabChange(index: number) {
    activeTab.value = index;

    // Ensure selectedTab is valid
    if (
      index === 1 &&
      (selectedTab.value === undefined || selectedTab.value === -1)
    ) {
      selectedTab.value = 0;
    }

    // Disable brush if switching to Library (index 0)
    if (index === 0) {
      store.brush.enabled = false;
    }
  }

  const tintColor1Hex = computed({
    get: () => store.frameTint.colors[0]?.slice(0, 7) || DEFAULT_TINT_COLOR,
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

      const base = store.frameTint.colors[0]?.slice(0, 7) || DEFAULT_TINT_COLOR;

      store.frameTint.colors[0] = base + (val < 100 ? hexAlpha : '');

      if (!store.frameTint.enabled) {
        store.frameTint.enabled = true;
      }
    },
  });

  const tintColor2Hex = computed({
    get: () => store.frameTint.colors[1]?.slice(0, 7) || DEFAULT_GRADIENT_COLOR,
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

      const base =
        store.frameTint.colors[1]?.slice(0, 7) || DEFAULT_GRADIENT_COLOR;

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

  const isBgColorChanged = computed(
    () => bgColorHex.value !== DEFAULT_BACKGROUND_COLOR,
  );

  const isTintColorChanged = computed(
    () => tintColor1Hex.value !== DEFAULT_TINT_COLOR,
  );

  const isTintColor2Changed = computed(
    () => tintColor2Hex.value !== DEFAULT_GRADIENT_COLOR,
  );

  function resetTint2() {
    const currentColor =
      store.frameTint.colors[1] || DEFAULT_TINT_COLOR_TRANSPARENT;

    const currentAlpha = currentColor.slice(7) || '00';

    store.frameTint.colors[1] = `${DEFAULT_GRADIENT_COLOR}${currentAlpha}`;
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <UTabs
      :items="[
        { label: 'Библиотека', slot: 'library' },
        { label: 'Настройки', slot: 'settings' },
      ]"
      :ui="{
        content: 'space-y-4',
      }"
      @change="onOuterTabChange"
    >
      <template #library>
        <div class="space-y-6">
          <div class="space-y-3">
            <h3
              class="text-sm font-medium tracking-wider text-neutral-500 uppercase"
            >
              Загрузка
            </h3>

            <div class="grid grid-cols-2 gap-2">
              <div class="col-span-2">
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
                    class="flex-1 justify-center rounded-r-none px-1"
                    :ui="{ leadingIcon: 'mr-1' }"
                    label="Изображение"
                    @click.left.exact.prevent="imageInput?.click()"
                  />

                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="i-ttg-x"
                    class="rounded-l-none border-l-0 px-2"
                    @click.left.exact.prevent.stop="store.currentImage = null"
                  />
                </UButtonGroup>

                <UButton
                  v-else
                  block
                  color="neutral"
                  variant="outline"
                  label="Изображение"
                  @click.left.exact.prevent="imageInput?.click()"
                />
              </div>

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
                    class="flex-1 justify-center rounded-r-none px-1"
                    :ui="{ leadingIcon: 'mr-1' }"
                    label="Рамка"
                    @click.left.exact.prevent="frameInput?.click()"
                  />

                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="i-ttg-x"
                    class="rounded-l-none border-l-0 px-2"
                    @click.left.exact.prevent.stop="store.customFrame = null"
                  />
                </UButtonGroup>

                <UButton
                  v-else
                  block
                  color="neutral"
                  variant="outline"
                  label="Рамка"
                  @click.left.exact.prevent="frameInput?.click()"
                />
              </div>

              <div>
                <input
                  ref="bgInput"
                  type="file"
                  class="hidden"
                  accept="image/*"
                  @change="onBgUpload"
                />

                <UButtonGroup
                  v-if="store.customBackground"
                  class="flex w-full"
                  orientation="horizontal"
                >
                  <UButton
                    color="neutral"
                    variant="outline"
                    class="flex-1 justify-center rounded-r-none px-1"
                    :ui="{ leadingIcon: 'mr-1' }"
                    label="Фон"
                    @click.left.exact.prevent="bgInput?.click()"
                  />

                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="i-ttg-x"
                    class="rounded-l-none border-l-0 px-2"
                    @click.left.exact.prevent.stop="
                      store.customBackground = null
                    "
                  />
                </UButtonGroup>

                <UButton
                  v-else
                  block
                  color="neutral"
                  variant="outline"
                  label="Фон"
                  @click.left.exact.prevent="bgInput?.click()"
                />
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-if="frames && frames.length"
              class="grid grid-cols-5 gap-2"
            >
              <button
                class="flex aspect-square items-center justify-center rounded-md border-2 border-dashed border-neutral-300 text-neutral-400 hover:border-primary hover:text-primary"
                :class="
                  !store.currentFrame && !store.customFrame
                    ? 'border-primary text-primary'
                    : ''
                "
                @click.left.exact.prevent="
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
                    : 'border-neutral-200'
                "
                @click.left.exact.prevent="store.selectFrame(frame)"
              >
                <img
                  :src="frame.url"
                  :alt="'Рамка'"
                  class="size-full object-contain"
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

      <template #settings>
        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
            <UButton
              size="xs"
              block
              :variant="selectedTab === 0 ? 'solid' : 'ghost'"
              :color="selectedTab === 0 ? 'primary' : 'neutral'"
              label="Основа"
              @click.left.exact.prevent="selectedTab = 0"
            />

            <UButton
              size="xs"
              block
              :variant="selectedTab === 1 ? 'solid' : 'ghost'"
              :color="selectedTab === 1 ? 'primary' : 'neutral'"
              label="Стиль"
              @click.left.exact.prevent="selectedTab = 1"
            />

            <UButton
              size="xs"
              block
              :variant="selectedTab === 2 ? 'solid' : 'ghost'"
              :color="selectedTab === 2 ? 'primary' : 'neutral'"
              label="3D"
              @click.left.exact.prevent="selectedTab = 2"
            />

            <UButton
              size="xs"
              block
              :variant="selectedTab === 3 ? 'solid' : 'ghost'"
              :color="selectedTab === 3 ? 'primary' : 'neutral'"
              label="Текст"
              @click.left.exact.prevent="selectedTab = 3"
            />
          </div>

          <div
            v-if="selectedTab === 0"
            class="space-y-3 pt-1"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span
                  class="mr-1 text-xs tracking-wide text-neutral-500 uppercase"
                >
                  Отразить:
                </span>

                <UButton
                  size="sm"
                  color="neutral"
                  variant="soft"
                  :padded="false"
                  class="flex h-7 w-8 items-center justify-center text-xs font-medium"
                  @click.left.exact.prevent="
                    store.transform.flip.x = !store.transform.flip.x
                  "
                >
                  X
                </UButton>

                <UButton
                  size="sm"
                  color="neutral"
                  variant="soft"
                  :padded="false"
                  class="flex h-7 w-8 items-center justify-center text-xs font-medium"
                  @click.left.exact.prevent="
                    store.transform.flip.y = !store.transform.flip.y
                  "
                >
                  Y
                </UButton>
              </div>
            </div>

            <div class="space-y-4 px-1">
              <div class="space-y-1.5">
                <div class="flex h-5 items-center justify-between">
                  <button
                    type="button"
                    class="flex items-center gap-1.5 text-xs transition-colors"
                    :class="
                      store.transform.maskScale !== 1
                        ? 'cursor-pointer text-primary-500'
                        : 'cursor-default text-neutral-500'
                    "
                    :disabled="store.transform.maskScale === 1"
                    title="Сбросить масштаб маски"
                    @click.left.exact.prevent="store.transform.maskScale = 1"
                  >
                    <span>Маска</span>

                    <UIcon
                      v-if="store.transform.maskScale !== 1"
                      name="i-heroicons-arrow-uturn-left-20-solid"
                      class="size-3"
                    />
                  </button>

                  <span class="font-mono text-[10px] text-neutral-400">{{
                    store.transform.maskScale.toFixed(2)
                  }}</span>
                </div>

                <USlider
                  v-model.number="store.transform.maskScale"
                  size="xs"
                  :min="0.5"
                  :max="1.5"
                  :step="0.01"
                />
              </div>

              <div class="space-y-1.5">
                <div class="flex h-5 items-center justify-between">
                  <button
                    type="button"
                    class="flex items-center gap-1.5 text-xs transition-colors"
                    :class="
                      store.transform.frameScale !== 1
                        ? 'cursor-pointer text-primary-500'
                        : 'cursor-default text-neutral-500'
                    "
                    :disabled="store.transform.frameScale === 1"
                    title="Сбросить масштаб рамки"
                    @click.left.exact.prevent="store.transform.frameScale = 1"
                  >
                    <span>Рамка</span>

                    <UIcon
                      v-if="store.transform.frameScale !== 1"
                      name="i-heroicons-arrow-uturn-left-20-solid"
                      class="size-3"
                    />
                  </button>

                  <span class="font-mono text-[10px] text-neutral-400">{{
                    store.transform.frameScale.toFixed(2)
                  }}</span>
                </div>

                <USlider
                  v-model.number="store.transform.frameScale"
                  size="xs"
                  :min="0.5"
                  :max="1.5"
                  :step="0.01"
                />
              </div>

              <div class="space-y-1.5">
                <div class="flex h-5 items-center justify-between">
                  <button
                    type="button"
                    class="flex items-center gap-1.5 text-xs transition-colors"
                    :class="
                      store.transform.frameRotate !== 0
                        ? 'cursor-pointer text-primary-500'
                        : 'cursor-default text-neutral-500'
                    "
                    :disabled="store.transform.frameRotate === 0"
                    title="Сбросить поворот рамки"
                    @click.left.exact.prevent="store.transform.frameRotate = 0"
                  >
                    <span>Поворот рамки</span>

                    <UIcon
                      v-if="store.transform.frameRotate !== 0"
                      name="i-heroicons-arrow-uturn-left-20-solid"
                      class="size-3"
                    />
                  </button>

                  <span class="font-mono text-[10px] text-neutral-400"
                    >{{ store.transform.frameRotate }}°</span
                  >
                </div>

                <USlider
                  v-model.number="store.transform.frameRotate"
                  size="xs"
                  :min="-180"
                  :max="180"
                  :step="1"
                />
              </div>

              <div class="space-y-1.5">
                <div class="flex h-5 items-center justify-between">
                  <button
                    type="button"
                    class="flex items-center gap-1.5 text-xs transition-colors"
                    :class="
                      store.transform.scale !== 1
                        ? 'cursor-pointer text-primary-500'
                        : 'cursor-default text-neutral-500'
                    "
                    :disabled="store.transform.scale === 1"
                    title="Сбросить общий масштаб"
                    @click.left.exact.prevent="store.transform.scale = 1"
                  >
                    <span>Масштаб</span>

                    <UIcon
                      v-if="store.transform.scale !== 1"
                      name="i-heroicons-arrow-uturn-left-20-solid"
                      class="size-3"
                    />
                  </button>

                  <span class="font-mono text-[10px] text-neutral-400">{{
                    store.transform.scale.toFixed(2)
                  }}</span>
                </div>

                <USlider
                  v-model.number="store.transform.scale"
                  size="xs"
                  :min="0.1"
                  :max="3"
                  :step="0.05"
                />
              </div>

              <div class="space-y-1.5">
                <div class="flex h-5 items-center justify-between">
                  <button
                    type="button"
                    class="flex items-center gap-1.5 text-xs transition-colors"
                    :class="
                      store.transform.rotate !== 0
                        ? 'cursor-pointer text-primary-500'
                        : 'cursor-default text-neutral-500'
                    "
                    :disabled="store.transform.rotate === 0"
                    title="Сбросить поворот изображения"
                    @click.left.exact.prevent="store.transform.rotate = 0"
                  >
                    <span>Поворот изображения</span>

                    <UIcon
                      v-if="store.transform.rotate !== 0"
                      name="i-heroicons-arrow-uturn-left-20-solid"
                      class="size-3"
                    />
                  </button>

                  <span class="font-mono text-[10px] text-neutral-400"
                    >{{ store.transform.rotate }}°</span
                  >
                </div>

                <USlider
                  v-model.number="store.transform.rotate"
                  size="xs"
                  :min="-180"
                  :max="180"
                  :step="1"
                />
              </div>
            </div>
          </div>

          <div
            v-if="selectedTab === 1"
            class="space-y-4 px-1 pt-1"
          >
            <div class="grid grid-cols-[auto_1fr] items-center gap-3">
              <UPopover
                mode="click"
                :popper="{ placement: 'bottom-start' }"
              >
                <UButton
                  color="neutral"
                  variant="outline"
                  size="xs"
                  class="flex size-8 items-center justify-center p-0"
                >
                  <span
                    class="size-5 rounded-full border border-neutral-200"
                    :style="{ backgroundColor: bgColorHex }"
                  />
                </UButton>

                <template #content>
                  <div class="p-2">
                    <UColorPicker v-model="bgColorHex" />
                  </div>
                </template>
              </UPopover>

              <div class="space-y-1">
                <div class="flex h-5 items-center justify-between">
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="flex items-center gap-1.5 text-xs transition-colors"
                      :class="
                        isBgColorChanged
                          ? 'cursor-pointer text-primary-500'
                          : 'cursor-default text-neutral-500'
                      "
                      :disabled="!isBgColorChanged"
                      title="Сбросить цвет фона"
                      @click.left.exact.prevent="resetBackgroundColor"
                    >
                      <span>Цвет фона</span>

                      <UIcon
                        v-if="isBgColorChanged"
                        name="i-heroicons-arrow-uturn-left-20-solid"
                        class="size-3"
                      />
                    </button>

                    <UButton
                      v-if="store.customBackground"
                      icon="i-heroicons-x-mark-20-solid"
                      variant="ghost"
                      size="xs"
                      color="error"
                      :padded="false"
                      title="Удалить фон"
                      @click.left.exact.prevent="store.customBackground = null"
                    />
                  </div>

                  <span class="font-mono text-[10px] text-neutral-400"
                    >{{ bgOpacity }}%</span
                  >
                </div>

                <USlider
                  v-model.number="bgOpacity"
                  size="xs"
                  :min="0"
                  :max="100"
                  :step="1"
                />
              </div>
            </div>

            <div class="flex flex-col gap-4">
              <div class="flex items-end gap-3">
                <div class="flex-1 space-y-1">
                  <div class="flex h-5 items-center justify-between">
                    <button
                      type="button"
                      class="flex items-center gap-1.5 text-xs transition-colors"
                      :class="
                        isTintColorChanged
                          ? 'cursor-pointer text-primary-500'
                          : 'cursor-default text-neutral-500'
                      "
                      :disabled="!isTintColorChanged"
                      title="Сбросить цвет рамки 1"
                      @click.left.exact.prevent="
                        store.frameTint.colors[0] = DEFAULT_TINT_COLOR
                      "
                    >
                      <span>Рамка 1</span>

                      <UIcon
                        v-if="isTintColorChanged"
                        name="i-heroicons-arrow-uturn-left-20-solid"
                        class="size-3"
                      />
                    </button>

                    <span class="font-mono text-[10px] text-neutral-400"
                      >{{ tintColor1Opacity }}%</span
                    >
                  </div>

                  <div class="flex items-center gap-2">
                    <UPopover
                      mode="click"
                      :popper="{ placement: 'bottom-start' }"
                    >
                      <UButton
                        color="neutral"
                        variant="outline"
                        size="xs"
                        class="flex size-8 items-center justify-center p-0"
                      >
                        <span
                          class="size-5 rounded-full border border-neutral-200"
                          :style="{ backgroundColor: tintColor1Hex }"
                        />
                      </UButton>

                      <template #content>
                        <div class="p-2">
                          <UColorPicker v-model="tintColor1Hex" />
                        </div>
                      </template>
                    </UPopover>

                    <USlider
                      v-model.number="tintColor1Opacity"
                      size="xs"
                      :min="0"
                      :max="100"
                      class="flex-1"
                    />
                  </div>
                </div>

                <div class="flex h-full items-end pb-1.5">
                  <UButton
                    icon="i-fluent-arrow-swap-20-regular"
                    size="xs"
                    variant="ghost"
                    color="neutral"
                    :padded="false"
                    class="p-1"
                    @click.left.exact.prevent="store.swapTintColors"
                  />
                </div>

                <div class="flex-1 space-y-1">
                  <div class="flex h-5 items-center justify-between">
                    <button
                      type="button"
                      class="flex items-center gap-1.5 text-xs transition-colors"
                      :class="
                        isTintColor2Changed
                          ? 'cursor-pointer text-primary-500'
                          : 'cursor-default text-neutral-500'
                      "
                      :disabled="!isTintColor2Changed"
                      title="Сбросить цвет рамки 2"
                      @click.left.exact.prevent="resetTint2"
                    >
                      <span>Рамка 2</span>

                      <UIcon
                        v-if="isTintColor2Changed"
                        name="i-heroicons-arrow-uturn-left-20-solid"
                        class="size-3"
                      />
                    </button>

                    <span class="font-mono text-[10px] text-neutral-400"
                      >{{ tintColor2Opacity }}%</span
                    >
                  </div>

                  <div class="flex items-center gap-2">
                    <USlider
                      v-model.number="tintColor2Opacity"
                      size="xs"
                      :min="0"
                      :max="100"
                      class="flex-1"
                    />

                    <UPopover
                      mode="click"
                      :popper="{ placement: 'bottom-end' }"
                    >
                      <UButton
                        color="neutral"
                        variant="outline"
                        size="xs"
                        class="flex size-8 items-center justify-center p-0"
                      >
                        <span
                          class="size-5 rounded-full border border-neutral-200"
                          :style="{ backgroundColor: tintColor2Hex }"
                        />
                      </UButton>

                      <template #content>
                        <div class="p-2">
                          <UColorPicker v-model="tintColor2Hex" />
                        </div>
                      </template>
                    </UPopover>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2 pt-1">
                <UButton
                  size="sm"
                  variant="soft"
                  icon="i-heroicons-sparkles-20-solid"
                  label="Случайный"
                  @click.left.exact.prevent="store.randomizeTint"
                />

                <USelectMenu
                  v-model="store.frameTint.blendMode"
                  :items="blendModes"
                  value-key="value"
                  size="sm"
                  :popper="{ placement: 'top' }"
                />
              </div>
            </div>
          </div>

          <div
            v-if="selectedTab === 2"
            class="space-y-4 px-1 pt-1"
          >
            <div class="flex items-center gap-2">
              <UCheckbox
                v-model="store.brush.halfMask"
                color="primary"
              />

              <span class="text-xs text-neutral-500">Верхняя половина</span>
            </div>

            <div class="flex gap-2">
              <UButton
                size="sm"
                class="flex-1"
                :variant="!store.brush.enabled ? 'solid' : 'soft'"
                :color="!store.brush.enabled ? 'primary' : 'neutral'"
                label="Двигать"
                icon="i-heroicons-cursor-arrow-rays-20-solid"
                @click.left.exact.prevent="store.brush.enabled = false"
              />

              <UButton
                size="sm"
                class="flex-1"
                :variant="
                  store.brush.enabled && store.brush.mode === 'add'
                    ? 'solid'
                    : 'soft'
                "
                :color="
                  store.brush.enabled && store.brush.mode === 'add'
                    ? 'primary'
                    : 'neutral'
                "
                label="Рисовать"
                icon="i-heroicons-pencil-20-solid"
                @click.left.exact.prevent="
                  store.brush.enabled = true;
                  store.brush.mode = 'add';
                "
              />

              <UButton
                size="sm"
                class="flex-1"
                :variant="
                  store.brush.enabled && store.brush.mode === 'remove'
                    ? 'solid'
                    : 'soft'
                "
                :color="
                  store.brush.enabled && store.brush.mode === 'remove'
                    ? 'primary'
                    : 'neutral'
                "
                label="Стереть"
                icon="i-heroicons-backspace-20-solid"
                @click.left.exact.prevent="
                  store.brush.enabled = true;
                  store.brush.mode = 'remove';
                "
              />
            </div>

            <div
              class="space-y-1.5 transition-opacity duration-200"
              :class="{
                'pointer-events-none opacity-50': !store.brush.enabled,
              }"
            >
              <div class="flex h-5 items-center justify-between">
                <span class="text-xs text-neutral-500">Размер кисти</span>

                <span class="font-mono text-[10px] text-neutral-400"
                  >{{ store.brush.size }}px</span
                >
              </div>

              <USlider
                v-model.number="store.brush.size"
                size="xs"
                :min="1"
                :max="100"
                :step="1"
              />
            </div>
          </div>

          <div
            v-if="selectedTab === 3"
            class="space-y-4 px-1 pt-1"
          >
            <div class="flex gap-2">
              <UInput
                v-model="textInput"
                placeholder="Введите текст"
                class="flex-1"
                size="sm"
                @keyup.enter="addNewText"
              />

              <UButton
                label="Добавить"
                size="sm"
                :disabled="!textInput.trim()"
                @click.left.exact.prevent="addNewText"
              />
            </div>

            <div
              v-if="activeText"
              class="space-y-3 rounded-md bg-muted p-2"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UButton
                    icon="i-heroicons-arrow-left-20-solid"
                    variant="ghost"
                    size="xs"
                    :padded="false"
                    title="Назад к списку"
                    @click.left.exact.prevent="store.activeTextId = null"
                  />

                  <span
                    class="max-w-[120px] truncate text-xs font-medium text-primary-500"
                    >{{ activeText.content }}</span
                  >
                </div>

                <UButton
                  icon="i-heroicons-trash-20-solid"
                  color="error"
                  variant="ghost"
                  size="xs"
                  :padded="false"
                  @click.left.exact.prevent="store.removeText(activeText.id)"
                />
              </div>

              <!-- Position -->
              <div class="space-y-2">
                <div
                  class="flex items-center justify-between text-xs text-neutral-500"
                >
                  <button
                    type="button"
                    class="flex items-center gap-1.5 transition-colors"
                    :class="
                      activeText.x !== 0
                        ? 'cursor-pointer text-primary-500'
                        : 'cursor-default text-neutral-500'
                    "
                    :disabled="activeText.x === 0"
                    title="Сбросить X"
                    @click.left.exact.prevent="activeText.x = 0"
                  >
                    <span>Позиция X</span>

                    <UIcon
                      v-if="activeText.x !== 0"
                      name="i-heroicons-arrow-uturn-left-20-solid"
                      class="size-3"
                    />
                  </button>

                  <span class="font-mono">{{ activeText.x }}</span>
                </div>

                <USlider
                  v-model="activeText.x"
                  :min="-250"
                  :max="250"
                  :step="1"
                  size="xs"
                />

                <div
                  class="flex items-center justify-between text-xs text-neutral-500"
                >
                  <button
                    type="button"
                    class="flex items-center gap-1.5 transition-colors"
                    :class="
                      activeText.y !== 0
                        ? 'cursor-pointer text-primary-500'
                        : 'cursor-default text-neutral-500'
                    "
                    :disabled="activeText.y === 0"
                    title="Сбросить Y"
                    @click.left.exact.prevent="activeText.y = 0"
                  >
                    <span>Позиция Y</span>

                    <UIcon
                      v-if="activeText.y !== 0"
                      name="i-heroicons-arrow-uturn-left-20-solid"
                      class="size-3"
                    />
                  </button>

                  <span class="font-mono">{{ activeText.y }}</span>
                </div>

                <USlider
                  v-model="activeText.y"
                  :min="-250"
                  :max="250"
                  :step="1"
                  size="xs"
                />
              </div>

              <div class="space-y-2">
                <div
                  class="flex items-center justify-between text-xs text-neutral-500"
                >
                  <button
                    type="button"
                    class="flex items-center gap-1.5 transition-colors"
                    :class="
                      activeText.fontSize !== 40
                        ? 'cursor-pointer text-primary-500'
                        : 'cursor-default text-neutral-500'
                    "
                    :disabled="activeText.fontSize === 40"
                    title="Сбросить размер"
                    @click.left.exact.prevent="activeText.fontSize = 40"
                  >
                    <span>Размер</span>

                    <UIcon
                      v-if="activeText.fontSize !== 40"
                      name="i-heroicons-arrow-uturn-left-20-solid"
                      class="size-3"
                    />
                  </button>

                  <span class="font-mono">{{ activeText.fontSize }}px</span>
                </div>

                <USlider
                  v-model="activeText.fontSize"
                  :min="10"
                  :max="200"
                  :step="1"
                  size="xs"
                />

                <div
                  class="flex items-center justify-between text-xs text-neutral-500"
                >
                  <button
                    type="button"
                    class="flex items-center gap-1.5 transition-colors"
                    :class="
                      activeText.rotation !== 0
                        ? 'cursor-pointer text-primary-500'
                        : 'cursor-default text-neutral-500'
                    "
                    :disabled="activeText.rotation === 0"
                    title="Сбросить поворот"
                    @click.left.exact.prevent="activeText.rotation = 0"
                  >
                    <span>Поворот</span>

                    <UIcon
                      v-if="activeText.rotation !== 0"
                      name="i-heroicons-arrow-uturn-left-20-solid"
                      class="size-3"
                    />
                  </button>

                  <span class="font-mono">{{ activeText.rotation }}°</span>
                </div>

                <USlider
                  v-model="activeText.rotation"
                  :min="-180"
                  :max="180"
                  :step="1"
                  size="xs"
                />

                <div
                  class="flex items-center justify-between text-xs text-neutral-500"
                >
                  <button
                    type="button"
                    class="flex items-center gap-1.5 transition-colors"
                    :class="
                      activeText.arc !== 0
                        ? 'cursor-pointer text-primary-500'
                        : 'cursor-default text-neutral-500'
                    "
                    :disabled="activeText.arc === 0"
                    title="Сбросить изгиб"
                    @click.left.exact.prevent="activeText.arc = 0"
                  >
                    <span>Изгиб</span>

                    <UIcon
                      v-if="activeText.arc !== 0"
                      name="i-heroicons-arrow-uturn-left-20-solid"
                      class="size-3"
                    />
                  </button>

                  <span class="font-mono">{{ activeText.arc }}°</span>
                </div>

                <USlider
                  v-model="activeText.arc"
                  :min="-360"
                  :max="360"
                  :step="5"
                  size="xs"
                />
              </div>

              <div class="flex items-center gap-2">
                <UPopover
                  mode="click"
                  :popper="{ placement: 'bottom-start' }"
                >
                  <UButton
                    color="neutral"
                    variant="outline"
                    size="xs"
                    class="flex size-6 items-center justify-center p-0"
                  >
                    <span
                      class="size-4 rounded-full border border-neutral-200"
                      :style="{ backgroundColor: activeText.color }"
                    />
                  </UButton>

                  <template #content>
                    <div class="p-2">
                      <UColorPicker v-model="activeText.color" />
                    </div>
                  </template>
                </UPopover>

                <span class="text-xs text-neutral-500">Цвет</span>
              </div>
            </div>

            <div
              v-else-if="store.texts.length > 0"
              class="space-y-2"
            >
              <div class="text-xs text-neutral-500">Выберите текст:</div>

              <div class="flex flex-col gap-2">
                <UButton
                  v-for="text in store.texts"
                  :key="text.id"
                  :label="text.content"
                  size="sm"
                  variant="soft"
                  color="neutral"
                  class="justify-start truncate"
                  @click.left.exact.prevent="store.activeTextId = text.id"
                />
              </div>
            </div>

            <div
              v-else
              class="py-4 text-center text-xs text-neutral-400"
            >
              Нет текстов
            </div>
          </div>
        </div>
      </template>
    </UTabs>

    <USeparator class="my-1" />

    <div class="grid shrink-0 grid-cols-2 gap-3">
      <UButton
        size="lg"
        block
        @click.left.exact.prevent="downloadToken('png')"
        >Скачать PNG</UButton
      >

      <UButton
        size="lg"
        block
        color="neutral"
        variant="outline"
        @click.left.exact.prevent="downloadToken('webp')"
        >WEBP</UButton
      >
    </div>
  </div>
</template>
