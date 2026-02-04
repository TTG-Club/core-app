<script setup lang="ts">
  import { useTokenatorStore } from '~tokenator/composables';
  import { BACKGROUND_BLEND_MODES, DEFAULT_COLORS } from '~tokenator/model';

  import { useColorWithOpacity } from '../composables';

  const store = useTokenatorStore();

  const { hex: bgColorHex, opacity: bgOpacity } = useColorWithOpacity(
    toRef(store, 'backgroundColor'),
    DEFAULT_COLORS.BACKGROUND,
  );

  const isBgColorChanged = computed(
    () => bgColorHex.value !== DEFAULT_COLORS.BACKGROUND,
  );

  function resetBackgroundColor() {
    const currentAlpha = store.backgroundColor.slice(7);

    store.backgroundColor = `${DEFAULT_COLORS.BACKGROUND}${currentAlpha}`;
  }
</script>

<template>
  <div class="grid gap-6">
    <!-- Цвет фона -->
    <div class="grid gap-2 pt-2">
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

            <span class="font-mono text-xs text-neutral-400"
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

    <!-- Фоновое изображение -->
    <div class="grid gap-2">
      <div class="text-xs font-medium text-neutral-400">
        Фоновое изображение
      </div>

      <div class="grid gap-3">
        <div class="grid gap-1">
          <div class="flex h-5 items-center justify-between">
            <button
              type="button"
              class="flex items-center gap-1.5 text-xs transition-colors"
              :class="
                store.backgroundStyle.opacity !== 100
                  ? 'cursor-pointer text-primary-500'
                  : 'cursor-default text-neutral-500'
              "
              :disabled="store.backgroundStyle.opacity === 100"
              title="Сбросить прозрачность"
              @click.left.exact.prevent="store.backgroundStyle.opacity = 100"
            >
              <span>Прозрачность</span>

              <UIcon
                v-if="store.backgroundStyle.opacity !== 100"
                name="i-fluent-arrow-undo-20-regular"
                class="size-3"
              />
            </button>

            <span class="font-mono text-xs text-neutral-400"
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

        <div class="grid gap-1">
          <div class="flex h-5 items-center justify-between">
            <button
              type="button"
              class="flex items-center gap-1.5 text-xs transition-colors"
              :class="
                store.backgroundStyle.scale !== 1
                  ? 'cursor-pointer text-primary-500'
                  : 'cursor-default text-neutral-500'
              "
              :disabled="store.backgroundStyle.scale === 1"
              title="Сбросить масштаб"
              @click.left.exact.prevent="store.backgroundStyle.scale = 1"
            >
              <span>Масштаб</span>

              <UIcon
                v-if="store.backgroundStyle.scale !== 1"
                name="i-fluent-arrow-undo-20-regular"
                class="size-3"
              />
            </button>

            <span class="font-mono text-xs text-neutral-400">{{
              store.backgroundStyle.scale.toFixed(2)
            }}</span>
          </div>

          <USlider
            v-model.number="store.backgroundStyle.scale"
            size="xs"
            :min="0.1"
            :max="3"
            :step="0.01"
          />
        </div>

        <div class="grid flex-1 gap-1">
          <div class="flex h-5 items-center justify-between">
            <button
              type="button"
              class="flex items-center gap-1.5 text-xs transition-colors"
              :class="
                store.backgroundStyle.rotate !== 0
                  ? 'cursor-pointer text-primary-500'
                  : 'cursor-default text-neutral-500'
              "
              :disabled="store.backgroundStyle.rotate === 0"
              title="Сбросить вращение"
              @click.left.exact.prevent="store.backgroundStyle.rotate = 0"
            >
              <span>Вращение</span>

              <UIcon
                v-if="store.backgroundStyle.rotate !== 0"
                name="i-fluent-arrow-undo-20-regular"
                class="size-3"
              />
            </button>

            <span class="font-mono text-xs text-neutral-400"
              >{{ store.backgroundStyle.rotate }}°</span
            >
          </div>

          <USlider
            v-model.number="store.backgroundStyle.rotate"
            size="xs"
            :min="-180"
            :max="180"
            :step="1"
          />
        </div>

        <div class="flex items-center gap-2 pt-2">
          <UButton
            :variant="store.editMode === 'background' ? 'solid' : 'soft'"
            :color="store.editMode === 'background' ? 'primary' : 'neutral'"
            size="sm"
            icon="i-fluent-arrow-move-20-regular"
            :label="
              store.editMode === 'background'
                ? 'Режим перемещения активен'
                : 'Переместить фон'
            "
            class="flex-1"
            @click.left.exact.prevent="
              store.editMode =
                store.editMode === 'background' ? 'none' : 'background'
            "
          />

          <USelectMenu
            v-model="store.backgroundStyle.blendMode"
            :items="BACKGROUND_BLEND_MODES"
            value-key="value"
            size="sm"
            placeholder="Режим наложения"
            :popper="{ placement: 'top' }"
            class="w-36"
          />
        </div>
      </div>
    </div>
  </div>
</template>
