<script setup lang="ts">
  import { useTokenatorStore } from '~tokenator/composables';

  const store = useTokenatorStore();

  const resetZoomButtonClass = computed(() =>
    store.isZoomChanged
      ? 'cursor-pointer text-primary-500'
      : 'cursor-default text-neutral-500',
  );

  const resetPanButtonClass = computed(() =>
    store.isPanChanged
      ? 'cursor-pointer text-primary-500'
      : 'cursor-default text-neutral-500',
  );
</script>

<template>
  <div class="grid gap-6 pt-2">
    <!-- Секция 3D маски -->
    <div class="grid gap-3">
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
          :variant="store.isMoveMode ? 'solid' : 'soft'"
          :color="store.isMoveMode ? 'primary' : 'neutral'"
          label="Двигать"
          icon="i-fluent-cursor-20-regular"
          @click.left.exact.prevent="store.activateMoveMode"
        />

        <UButton
          size="sm"
          class="flex-1"
          :variant="store.isBrushAddMode ? 'solid' : 'soft'"
          :color="store.isBrushAddMode ? 'primary' : 'neutral'"
          label="Рисовать"
          icon="i-fluent-edit-20-regular"
          @click.left.exact.prevent="store.activateDrawMode"
        />

        <UButton
          size="sm"
          class="flex-1"
          :variant="store.isBrushRemoveMode ? 'solid' : 'soft'"
          :color="store.isBrushRemoveMode ? 'primary' : 'neutral'"
          label="Стереть"
          icon="i-fluent-backspace-20-regular"
          @click.left.exact.prevent="store.activateEraseMode"
        />
      </div>

      <div
        class="space-y-1.5 transition-opacity duration-200"
        :class="{
          'pointer-events-none opacity-50': store.isBrushControlsDisabled,
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

    <!-- Секция управления холстом -->
    <div class="grid gap-3">
      <div class="text-xs font-medium text-neutral-400">Управление холстом</div>

      <div class="grid gap-2">
        <div class="grid gap-1">
          <div class="flex h-5 items-center justify-between">
            <button
              type="button"
              class="flex items-center gap-1.5 text-xs transition-colors"
              :class="resetZoomButtonClass"
              :disabled="!store.isZoomChanged"
              title="Сбросить масштаб холста"
              @click.left.exact.prevent="store.resetCanvasZoom"
            >
              <span>Масштаб</span>

              <UIcon
                v-if="store.isZoomChanged"
                name="i-fluent-arrow-undo-20-regular"
                class="size-3"
              />
            </button>

            <span class="font-mono text-xs text-neutral-400">{{
              store.canvasViewport.zoom.toFixed(2)
            }}</span>
          </div>

          <USlider
            v-model.number="store.canvasViewport.zoom"
            size="xs"
            :min="0.5"
            :max="3"
            :step="0.1"
          />
        </div>

        <div class="grid gap-2">
          <div class="flex h-5 items-center justify-between">
            <button
              type="button"
              class="flex items-center gap-1.5 text-xs transition-colors"
              :class="resetPanButtonClass"
              :disabled="!store.isPanChanged"
              title="Сбросить позицию холста"
              @click.left.exact.prevent="store.resetPan"
            >
              <span>Позиция</span>

              <UIcon
                v-if="store.isPanChanged"
                name="i-fluent-arrow-undo-20-regular"
                class="size-3"
              />
            </button>

            <span class="font-mono text-xs text-neutral-400"
              >X: {{ store.canvasViewport.pan.x.toFixed(0) }} / Y:
              {{ store.canvasViewport.pan.y.toFixed(0) }}</span
            >
          </div>

          <UButton
            size="sm"
            :variant="store.canvasViewport.isPanning ? 'solid' : 'soft'"
            :color="store.canvasViewport.isPanning ? 'primary' : 'neutral'"
            label="Переместить холст"
            icon="i-fluent-arrow-move-20-regular"
            block
            @click.left.exact.prevent="store.togglePanMode"
          />
        </div>
      </div>
    </div>
  </div>
</template>
