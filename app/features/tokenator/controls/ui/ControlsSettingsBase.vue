<script setup lang="ts">
  import { useTokenatorStore } from '~tokenator/composables';

  const store = useTokenatorStore();

  const resetMaskScaleButtonClass = computed(() =>
    store.isMaskScaleChanged
      ? 'cursor-pointer text-primary-500'
      : 'cursor-default text-neutral-500',
  );

  const resetMaskRotateButtonClass = computed(() =>
    store.isMaskRotateChanged
      ? 'cursor-pointer text-primary-500'
      : 'cursor-default text-neutral-500',
  );

  const resetMaskSidesButtonClass = computed(() =>
    store.isMaskSidesChanged
      ? 'cursor-pointer text-primary-500'
      : 'cursor-default text-neutral-500',
  );

  const resetPositionButtonClass = computed(() =>
    store.isPositionChanged
      ? 'cursor-pointer text-primary-500'
      : 'cursor-default text-neutral-500',
  );

  const resetScaleButtonClass = computed(() =>
    store.isScaleChanged
      ? 'cursor-pointer text-primary-500'
      : 'cursor-default text-neutral-500',
  );

  const resetRotateButtonClass = computed(() =>
    store.isRotateChanged
      ? 'cursor-pointer text-primary-500'
      : 'cursor-default text-neutral-500',
  );
</script>

<template>
  <div class="grid gap-6">
    <div class="grid gap-2">
      <div class="text-xs font-medium text-neutral-400">Настройка маски</div>

      <div class="grid gap-2">
        <div class="grid gap-1">
          <div class="flex h-5 items-center justify-between">
            <button
              type="button"
              class="flex items-center gap-1.5 text-xs transition-colors"
              :class="resetMaskScaleButtonClass"
              :disabled="!store.isMaskScaleChanged"
              title="Сбросить масштаб маски"
              @click.left.exact.prevent="store.resetMaskScale"
            >
              <span>Размер</span>

              <UIcon
                v-if="store.isMaskScaleChanged"
                name="i-fluent-arrow-undo-20-regular"
                class="size-3"
              />
            </button>

            <span class="font-mono text-xs text-neutral-400">{{
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

        <div class="grid grid-cols-2 gap-6">
          <div class="grid gap-1">
            <div class="flex h-5 items-center justify-between">
              <button
                type="button"
                class="flex items-center gap-1.5 text-xs transition-colors"
                :class="resetMaskRotateButtonClass"
                :disabled="!store.isMaskRotateChanged"
                title="Сбросить поворот маски"
                @click.left.exact.prevent="store.resetMaskRotate"
              >
                <span>Поворот</span>

                <UIcon
                  v-if="store.isMaskRotateChanged"
                  name="i-fluent-arrow-undo-20-regular"
                  class="size-3"
                />
              </button>

              <span class="font-mono text-xs text-neutral-400"
                >{{ store.transform.maskRotate }}°</span
              >
            </div>

            <USlider
              v-model.number="store.transform.maskRotate"
              size="xs"
              :min="-180"
              :max="180"
              :step="1"
            />
          </div>

          <div class="grid gap-1">
            <div class="flex h-5 items-center justify-between">
              <button
                type="button"
                class="flex items-center gap-1.5 text-xs transition-colors"
                :class="resetMaskSidesButtonClass"
                :disabled="!store.isMaskSidesChanged"
                title="Сбросить форму маски"
                @click.left.exact.prevent="store.resetMaskSides"
              >
                <span>Углы</span>

                <UIcon
                  v-if="store.isMaskSidesChanged"
                  name="i-fluent-arrow-undo-20-regular"
                  class="size-3"
                />
              </button>

              <span class="font-mono text-xs text-neutral-400">{{
                store.transform.maskSides === 0
                  ? '∞'
                  : store.transform.maskSides
              }}</span>
            </div>

            <USlider
              v-model.number="store.maskSidesIndex"
              size="xs"
              :min="0"
              :max="10"
              :step="1"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="grid gap-2">
      <div class="text-xs font-medium text-neutral-400">Настройка картинки</div>

      <div class="grid gap-2">
        <div class="grid gap-1">
          <div class="flex h-5 items-center justify-between">
            <button
              type="button"
              class="flex items-center gap-1.5 text-xs transition-colors"
              :class="resetPositionButtonClass"
              :disabled="!store.isPositionChanged"
              title="Вернуть изображение в центр"
              @click.left.exact.prevent="store.resetPosition"
            >
              <span>Позиция</span>

              <UIcon
                v-if="store.isPositionChanged"
                name="i-fluent-arrow-undo-20-regular"
                class="size-3"
              />
            </button>

            <span class="font-mono text-xs text-neutral-400"
              >X: {{ store.transform.position.x.toFixed(0) }} / Y:
              {{ store.transform.position.y.toFixed(0) }}</span
            >
          </div>
        </div>

        <div class="grid gap-1">
          <div class="flex h-5 items-center justify-between">
            <button
              type="button"
              class="flex items-center gap-1.5 text-xs transition-colors"
              :class="resetScaleButtonClass"
              :disabled="!store.isScaleChanged"
              title="Сбросить общий масштаб"
              @click.left.exact.prevent="store.resetScale"
            >
              <span>Масштаб</span>

              <UIcon
                v-if="store.isScaleChanged"
                name="i-fluent-arrow-undo-20-regular"
                class="size-3"
              />
            </button>

            <span class="font-mono text-xs text-neutral-400">{{
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

        <div class="grid gap-1">
          <div class="flex h-5 items-center justify-between">
            <button
              type="button"
              class="flex items-center gap-1.5 text-xs transition-colors"
              :class="resetRotateButtonClass"
              :disabled="!store.isRotateChanged"
              title="Сбросить поворот изображения"
              @click.left.exact.prevent="store.resetRotation"
            >
              <span>Поворот</span>

              <UIcon
                v-if="store.isRotateChanged"
                name="i-fluent-arrow-undo-20-regular"
                class="size-3"
              />
            </button>

            <div class="flex items-center gap-1.5">
              <UButton
                size="sm"
                color="neutral"
                variant="soft"
                class="flex h-5 w-6 items-center justify-center text-xs font-medium"
                @click.left.exact.prevent="store.toggleFlipX"
              >
                X
              </UButton>

              <UButton
                size="sm"
                color="neutral"
                variant="soft"
                class="flex h-5 w-6 items-center justify-center text-xs font-medium"
                @click.left.exact.prevent="store.toggleFlipY"
              >
                Y
              </UButton>

              <span class="font-mono text-xs text-neutral-400"
                >{{ store.transform.rotate }}°</span
              >
            </div>
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
  </div>
</template>
