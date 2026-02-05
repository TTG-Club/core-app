<script setup lang="ts">
  import { useTokenatorStore } from '~tokenator/composables';
  import { BLEND_MODES, DEFAULT_COLORS } from '~tokenator/model';

  import { useColorWithOpacity } from '../composables';

  const store = useTokenatorStore();

  // Refs для цветов тонировки с прозрачностью
  const tintColor1Ref = computed({
    get: () => store.frameTint.colors[0] || DEFAULT_COLORS.TINT,
    set: (val) => {
      store.frameTint.colors[0] = val;
    },
  });

  const { hex: tintColor1Hex, opacity: tintColor1Opacity } =
    useColorWithOpacity(tintColor1Ref, DEFAULT_COLORS.TINT, () => {
      if (!store.frameTint.enabled) {
        store.frameTint.enabled = true;
      }
    });

  const tintColor2Ref = computed({
    get: () => store.frameTint.colors[1] || DEFAULT_COLORS.TINT_TRANSPARENT,
    set: (val) => {
      if (store.frameTint.colors.length < 2) {
        store.frameTint.colors.push(val);
      } else {
        store.frameTint.colors[1] = val;
      }
    },
  });

  const { hex: tintColor2Hex, opacity: tintColor2Opacity } =
    useColorWithOpacity(tintColor2Ref, DEFAULT_COLORS.TINT_TRANSPARENT, () => {
      if (!store.frameTint.enabled) {
        store.frameTint.enabled = true;
      }
    });

  const isTintColorChanged = computed(
    () => tintColor1Hex.value !== DEFAULT_COLORS.TINT,
  );

  const isTintColor2Changed = computed(
    () => tintColor2Hex.value !== DEFAULT_COLORS.TINT_TRANSPARENT.slice(0, 7),
  );

  const resetFrameScaleButtonClass = computed(() =>
    store.isFrameScaleChanged
      ? 'cursor-pointer text-primary-500'
      : 'cursor-default text-neutral-500',
  );

  const resetFrameRotateButtonClass = computed(() =>
    store.isFrameRotateChanged
      ? 'cursor-pointer text-primary-500'
      : 'cursor-default text-neutral-500',
  );

  const resetTint1ButtonClass = computed(() =>
    isTintColorChanged.value
      ? 'cursor-pointer text-primary-500'
      : 'cursor-default text-neutral-500',
  );

  const resetTint2ButtonClass = computed(() =>
    isTintColor2Changed.value
      ? 'cursor-pointer text-primary-500'
      : 'cursor-default text-neutral-500',
  );
</script>

<template>
  <div class="grid gap-6">
    <!-- Размер и поворот рамки -->
    <div class="grid gap-3 pt-2">
      <div class="grid gap-1">
        <div class="flex h-5 items-center justify-between">
          <button
            type="button"
            class="flex items-center gap-1.5 text-xs transition-colors"
            :class="resetFrameScaleButtonClass"
            :disabled="!store.isFrameScaleChanged"
            title="Сбросить масштаб рамки"
            @click.left.exact.prevent="store.resetFrameScale"
          >
            <span>Размер</span>

            <UIcon
              v-if="store.isFrameScaleChanged"
              name="i-fluent-arrow-undo-20-regular"
              class="size-3"
            />
          </button>

          <span class="font-mono text-xs text-neutral-400">{{
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

      <div class="grid gap-1">
        <div class="flex h-5 items-center justify-between">
          <button
            type="button"
            class="flex items-center gap-1.5 text-xs transition-colors"
            :class="resetFrameRotateButtonClass"
            :disabled="!store.isFrameRotateChanged"
            title="Сбросить поворот рамки"
            @click.left.exact.prevent="store.resetFrameRotation"
          >
            <span>Поворот</span>

            <UIcon
              v-if="store.isFrameRotateChanged"
              name="i-fluent-arrow-undo-20-regular"
              class="size-3"
            />
          </button>

          <span class="font-mono text-xs text-neutral-400"
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
    </div>

    <!-- Тонировка рамки -->
    <div class="grid gap-2">
      <div class="flex items-center justify-between gap-2">
        <div class="text-xs font-medium text-neutral-400">Тонировка</div>
      </div>

      <div class="flex items-center gap-3">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <UPopover
              mode="click"
              :popper="{ placement: 'bottom-start' }"
            >
              <UButton
                color="neutral"
                variant="outline"
                size="xs"
                class="flex size-8 shrink-0 items-center justify-center p-0"
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

            <div class="grid w-full gap-1">
              <div class="flex h-5 items-center justify-between">
                <button
                  type="button"
                  class="flex items-center gap-1.5 text-xs transition-colors"
                  :class="resetTint1ButtonClass"
                  :disabled="!isTintColorChanged"
                  title="Сбросить цвет 1"
                  @click.left.exact.prevent="store.resetTint1"
                >
                  <span>Цвет 1</span>

                  <UIcon
                    v-if="isTintColorChanged"
                    name="i-fluent-arrow-undo-20-regular"
                    class="size-3"
                  />
                </button>

                <span class="font-mono text-[10px] text-neutral-400"
                  >{{ tintColor1Opacity }}%</span
                >
              </div>

              <USlider
                v-model.number="tintColor1Opacity"
                size="xs"
                :min="0"
                :max="100"
              />
            </div>
          </div>
        </div>

        <div class="flex h-full items-end pb-1.5">
          <UButton
            icon="i-fluent-arrow-swap-20-regular"
            size="xs"
            variant="ghost"
            color="neutral"
            class="p-1"
            title="Поменять цвета местами"
            @click.left.exact.prevent="store.swapTintColors"
          />
        </div>

        <div class="flex-1">
          <div class="flex items-end gap-2">
            <UPopover
              mode="click"
              :popper="{ placement: 'bottom-end' }"
            >
              <UButton
                color="neutral"
                variant="outline"
                size="xs"
                class="flex size-8 shrink-0 items-center justify-center p-0"
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

            <div class="grid w-full gap-1">
              <div class="flex h-5 items-center justify-between">
                <button
                  type="button"
                  class="flex items-center gap-1.5 text-xs transition-colors"
                  :class="resetTint2ButtonClass"
                  :disabled="!isTintColor2Changed"
                  title="Сбросить цвет 2"
                  @click.left.exact.prevent="store.resetTint2"
                >
                  <span>Цвет 2</span>

                  <UIcon
                    v-if="isTintColor2Changed"
                    name="i-fluent-arrow-undo-20-regular"
                    class="size-3"
                  />
                </button>

                <span class="font-mono text-[10px] text-neutral-400"
                  >{{ tintColor2Opacity }}%</span
                >
              </div>

              <USlider
                v-model.number="tintColor2Opacity"
                size="xs"
                :min="0"
                :max="100"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 pt-2">
        <UButton
          size="sm"
          variant="soft"
          icon="i-fluent-sparkle-20-regular"
          title="Случайные цвета"
          label="Случайные цвета"
          class="w-full"
          @click.left.exact.prevent="store.randomizeTint"
        />

        <USelectMenu
          v-model="store.frameTint.blendMode"
          :items="BLEND_MODES"
          value-key="value"
          size="sm"
          :popper="{ placement: 'top' }"
          class="w-full"
        />
      </div>
    </div>
  </div>
</template>
