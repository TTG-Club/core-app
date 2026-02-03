<script setup lang="ts">
  import { useTokenatorStore } from '~tokenator/composables';
  import {
    BACKGROUND_BLEND_MODES,
    BLEND_MODES,
    DEFAULT_COLORS,
  } from '~tokenator/model';

  import { useColorWithOpacity } from '../composables';

  const store = useTokenatorStore();

  const { hex: bgColorHex, opacity: bgOpacity } = useColorWithOpacity(
    toRef(store, 'backgroundColor'),
    DEFAULT_COLORS.BACKGROUND,
  );

  // We need refs/computed that can be passed to useColorWithOpacity for array elements
  // Since store.frameTint.colors is an array, we need a way to reference elements reactively.
  // The composable takes Ref<string>.
  // We can use a computed with get/set that proxies to the array element.

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

  const isBgColorChanged = computed(
    () => bgColorHex.value !== DEFAULT_COLORS.BACKGROUND,
  );

  const isTintColorChanged = computed(
    () => tintColor1Hex.value !== DEFAULT_COLORS.TINT,
  );

  const isTintColor2Changed = computed(
    () => tintColor2Hex.value !== DEFAULT_COLORS.TINT_TRANSPARENT.slice(0, 7),
  );

  function resetBackgroundColor() {
    const currentAlpha = store.backgroundColor.slice(7);

    store.backgroundColor = `${DEFAULT_COLORS.BACKGROUND}${currentAlpha}`;
  }

  function resetTint2() {
    store.frameTint.colors[1] = DEFAULT_COLORS.TINT_TRANSPARENT;
  }
</script>

<template>
  <div class="grid gap-6 pt-2">
    <!-- Фон -->
    <div class="grid gap-1">
      <div class="text-xs font-medium text-neutral-400">Настрйока фона</div>

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

        <div class="grid gap-1">
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
                <span>Прозрачность</span>

                <UIcon
                  v-if="isBgColorChanged"
                  name="i-fluent-arrow-undo-20-regular"
                  class="size-3"
                />
              </button>
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
    </div>

    <!-- Настройки фонового изображения -->
    <div class="grid gap-1">
      <div class="text-xs font-medium text-neutral-400">
        Фоновое изображение
      </div>

      <div class="flex items-end gap-6">
        <div class="grid flex-2 gap-1">
          <div class="flex h-5 items-center justify-between">
            <span class="text-xs text-neutral-500">Прозрачность</span>

            <span class="font-mono text-[10px] text-neutral-400"
              >{{ store.backgroundStyle.opacity }}%</span
            >
          </div>

          <USlider
            v-model.number="store.backgroundStyle.opacity"
            size="xs"
            :min="0"
            :max="100"
            :step="1"
          />
        </div>

        <USelectMenu
          v-model="store.backgroundStyle.blendMode"
          :items="BACKGROUND_BLEND_MODES"
          value-key="value"
          size="sm"
          placeholder="Режим наложения"
          :popper="{ placement: 'top' }"
          class="flex-1"
        />
      </div>
    </div>

    <!-- Рамка -->
    <div class="grid gap-1">
      <div class="text-xs font-medium text-neutral-400">Настройка рамки</div>

      <div class="flex items-end gap-3">
        <div class="flex-1">
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
                store.frameTint.colors[0] = DEFAULT_COLORS.TINT
              "
            >
              <span>Рамка 1</span>

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
            class="p-1"
            @click.left.exact.prevent="store.swapTintColors"
          />
        </div>

        <div class="flex-1">
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
                name="i-fluent-arrow-undo-20-regular"
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
          icon="i-fluent-sparkle-20-regular"
          label="Случайный"
          @click.left.exact.prevent="store.randomizeTint"
        />

        <USelectMenu
          v-model="store.frameTint.blendMode"
          :items="BLEND_MODES"
          value-key="value"
          size="sm"
          :popper="{ placement: 'top' }"
        />
      </div>
    </div>
  </div>
</template>
