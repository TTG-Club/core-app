<script setup lang="ts">
  import {
    IMAGE_CROP_HANDLES,
    IMAGE_CROP_LABELS,
    IMAGE_CROP_PREVIEW_SIZE,
  } from './constants';

  const props = defineProps<{
    /** Файл, выбранный пользователем: из него вырезается квадрат. */
    file: File;
  }>();

  const emit = defineEmits<{
    /** Закрытие: файл с вырезанной областью либо ничего, если отменили. */
    close: [file?: File];
  }>();

  const toast = useToast();

  // Ссылка на файл живёт, пока открыт редактор: useObjectUrl отзовёт её сам.
  const sourceUrl = useObjectUrl(() => props.file);

  const imageRef = useTemplateRef<HTMLImageElement>('imageRef');

  const {
    area,
    areaRatio,
    naturalSize,
    cropSize,
    minSize,
    maxSize,
    isReady,
    initialize,
    startMove,
    startResize,
    moveArea,
    growArea,
    shrinkArea,
    crop,
  } = useImageCrop({ imageElement: imageRef });

  /** Файл не открылся: вырезать нечего, остаётся только закрыть редактор. */
  const isBroken = ref(false);

  const isApplying = ref(false);

  const isApplyDisabled = computed(() => !isReady.value || isBroken.value);

  /**
   * Короткая сторона картинки не больше минимальной области: менять размер
   * нечем — остаётся только сдвигать рамку по длинной стороне.
   */
  const isSizeLocked = computed(() => maxSize.value <= minSize.value);

  /** Положение рамки над картинкой — в долях, а не в пикселях экрана. */
  const areaStyle = computed(() => ({
    left: `${areaRatio.value.left}%`,
    top: `${areaRatio.value.top}%`,
    width: `${areaRatio.value.width}%`,
    height: `${areaRatio.value.height}%`,
  }));

  /**
   * Затемнение вокруг рамки — четыре полосы по её сторонам. Одним слоем с
   * «дырой» такое не собрать, а полосы считаются в долях изображения и потому
   * не зависят от размера превью на экране.
   */
  const dimmingStrips = computed(() => {
    const { left, top, width, height } = areaRatio.value;

    return [
      {
        key: 'top',
        style: { left: '0', top: '0', width: '100%', height: `${top}%` },
      },
      {
        key: 'bottom',
        style: {
          left: '0',
          top: `${top + height}%`,
          width: '100%',
          bottom: '0',
        },
      },
      {
        key: 'left',
        style: {
          left: '0',
          top: `${top}%`,
          width: `${left}%`,
          height: `${height}%`,
        },
      },
      {
        key: 'right',
        style: {
          left: `${left + width}%`,
          top: `${top}%`,
          right: '0',
          height: `${height}%`,
        },
      },
    ];
  });

  /** Предпросмотр: выбранная область, вписанная в круг размером с аватар. */
  const previewStyle = computed(() => {
    const size = {
      width: `${IMAGE_CROP_PREVIEW_SIZE}px`,
      height: `${IMAGE_CROP_PREVIEW_SIZE}px`,
    };

    const image = naturalSize.value;

    if (!image || !area.value.size || !sourceUrl.value) {
      return size;
    }

    // Фон — вся картинка, уменьшенная так, чтобы выбранная область заняла круг
    // целиком, и сдвинутая на её отступы.
    const scale = IMAGE_CROP_PREVIEW_SIZE / area.value.size;

    return {
      ...size,
      backgroundImage: `url("${sourceUrl.value}")`,
      backgroundSize: `${image.width * scale}px ${image.height * scale}px`,
      backgroundPosition: `${-area.value.x * scale}px ${-area.value.y * scale}px`,
    };
  });

  /** Готовит область к работе: размеры исходника известны только после load. */
  function handleImageLoad(): void {
    isBroken.value = false;
    initialize();
  }

  /** Помечает файл нечитаемым — вместо редактора показывается ошибка. */
  function handleImageError(): void {
    isBroken.value = true;
  }

  /**
   * Колесо мыши меняет размер области: от себя — область меньше и кадр крупнее,
   * к себе — наоборот.
   *
   * @param event прокрутка над изображением.
   */
  function handleWheel(event: WheelEvent): void {
    if (event.deltaY < 0) {
      shrinkArea();

      return;
    }

    growArea();
  }

  /** Вырезает выбранную область и отдаёт файл открывшему редактор. */
  async function handleApply(): Promise<void> {
    isApplying.value = true;

    try {
      const cropped = await crop(props.file.name);

      if (cropped) {
        emit('close', cropped);
      }
    } catch (error) {
      consola.error(error);

      toast.add({
        color: 'error',
        title: IMAGE_CROP_LABELS.cropErrorTitle,
      });
    } finally {
      isApplying.value = false;
    }
  }

  /** Закрытие без результата — изображение остаётся прежним. */
  function handleCancel(): void {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="IMAGE_CROP_LABELS.title"
    :description="IMAGE_CROP_LABELS.description"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UAlert
          v-if="isBroken"
          icon="tabler:photo-off"
          color="error"
          variant="subtle"
          :title="IMAGE_CROP_LABELS.loadErrorTitle"
          :description="IMAGE_CROP_LABELS.loadErrorDescription"
        />

        <!-- touch-none висит на самой рамке, а не здесь: свайп по картинке
             должен прокручивать модалку на узких экранах. -->
        <div
          class="relative mx-auto w-fit bg-elevated select-none"
          @wheel.prevent="handleWheel"
        >
          <img
            ref="imageRef"
            :src="sourceUrl"
            :alt="IMAGE_CROP_LABELS.imageAlt"
            draggable="false"
            class="block max-h-[45vh] max-w-full sm:max-h-[55vh]"
            @load="handleImageLoad"
            @error="handleImageError"
          />

          <template v-if="isReady">
            <div
              v-for="strip in dimmingStrips"
              :key="strip.key"
              class="pointer-events-none absolute bg-elevated/80"
              :style="strip.style"
            />

            <div
              class="absolute cursor-move touch-none border-2 border-primary outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
              tabindex="0"
              :aria-label="IMAGE_CROP_LABELS.frame"
              :style="areaStyle"
              @pointerdown="startMove"
              @keydown.left.prevent="moveArea('left')"
              @keydown.right.prevent="moveArea('right')"
              @keydown.up.prevent="moveArea('up')"
              @keydown.down.prevent="moveArea('down')"
            >
              <!-- Уголки — только для мыши и касаний: с клавиатуры размер
                   меняется ползунком, поэтому в фокус они не попадают. -->
              <span
                v-for="handle in IMAGE_CROP_HANDLES"
                :key="handle.corner"
                aria-hidden="true"
                class="absolute size-5 rounded-full border-2 border-primary bg-default"
                :class="handle.class"
                @pointerdown.stop="startResize($event, handle.corner)"
              />
            </div>
          </template>
        </div>

        <!-- Управление появляется вместе с размерами картинки: до загрузки
             ползунку нечего показывать, а его границы были бы нулевыми. -->
        <div
          v-if="isReady"
          class="flex items-center gap-4"
        >
          <div class="flex shrink-0 flex-col items-center gap-1">
            <div
              class="rounded-full border-2 border-default bg-elevated bg-no-repeat"
              :style="previewStyle"
            />

            <span class="text-xs text-muted">
              {{ IMAGE_CROP_LABELS.preview }}
            </span>
          </div>

          <UFormField
            v-if="!isSizeLocked"
            :label="IMAGE_CROP_LABELS.size"
            class="grow"
          >
            <div class="flex items-center gap-3">
              <UTooltip :text="IMAGE_CROP_LABELS.shrink">
                <UButton
                  icon="tabler:minus"
                  color="neutral"
                  variant="subtle"
                  square
                  :aria-label="IMAGE_CROP_LABELS.shrink"
                  @click.left.exact.prevent="shrinkArea"
                />
              </UTooltip>

              <USlider
                v-model="cropSize"
                :min="minSize"
                :max="maxSize"
                :aria-label="IMAGE_CROP_LABELS.size"
                class="grow"
              />

              <UTooltip :text="IMAGE_CROP_LABELS.grow">
                <UButton
                  icon="tabler:plus"
                  color="neutral"
                  variant="subtle"
                  square
                  :aria-label="IMAGE_CROP_LABELS.grow"
                  @click.left.exact.prevent="growArea"
                />
              </UTooltip>
            </div>
          </UFormField>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="IMAGE_CROP_LABELS.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="IMAGE_CROP_LABELS.apply"
          color="primary"
          icon="tabler:crop"
          :loading="isApplying"
          :disabled="isApplyDisabled"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
