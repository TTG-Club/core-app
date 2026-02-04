<script setup lang="ts">
  import { useTokenatorStore } from '~tokenator/composables';

  const store = useTokenatorStore();
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
          :variant="
            store.editMode === 'none' && !store.canvasViewport.isPanning
              ? 'solid'
              : 'soft'
          "
          :color="
            store.editMode === 'none' && !store.canvasViewport.isPanning
              ? 'primary'
              : 'neutral'
          "
          label="Двигать"
          icon="i-fluent-cursor-20-regular"
          @click.left.exact.prevent="
            store.editMode = 'none';
            store.canvasViewport.isPanning = false;
          "
        />

        <UButton
          size="sm"
          class="flex-1"
          :variant="
            store.editMode === 'brush' && store.brush.mode === 'add'
              ? 'solid'
              : 'soft'
          "
          :color="
            store.editMode === 'brush' && store.brush.mode === 'add'
              ? 'primary'
              : 'neutral'
          "
          label="Рисовать"
          icon="i-fluent-edit-20-regular"
          @click.left.exact.prevent="
            store.editMode = 'brush';
            store.brush.mode = 'add';
            store.canvasViewport.isPanning = false;
          "
        />

        <UButton
          size="sm"
          class="flex-1"
          :variant="
            store.editMode === 'brush' && store.brush.mode === 'remove'
              ? 'solid'
              : 'soft'
          "
          :color="
            store.editMode === 'brush' && store.brush.mode === 'remove'
              ? 'primary'
              : 'neutral'
          "
          label="Стереть"
          icon="i-fluent-backspace-20-regular"
          @click.left.exact.prevent="
            store.editMode = 'brush';
            store.brush.mode = 'remove';
            store.canvasViewport.isPanning = false;
          "
        />
      </div>

      <div
        class="space-y-1.5 transition-opacity duration-200"
        :class="{
          'pointer-events-none opacity-50': store.editMode !== 'brush',
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
              :class="
                store.canvasViewport.zoom !== 1
                  ? 'cursor-pointer text-primary-500'
                  : 'cursor-default text-neutral-500'
              "
              :disabled="store.canvasViewport.zoom === 1"
              title="Сбросить масштаб холста"
              @click.left.exact.prevent="store.canvasViewport.zoom = 1"
            >
              <span>Масштаб</span>

              <UIcon
                v-if="store.canvasViewport.zoom !== 1"
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
              :class="
                store.canvasViewport.pan.x !== 0 ||
                store.canvasViewport.pan.y !== 0
                  ? 'cursor-pointer text-primary-500'
                  : 'cursor-default text-neutral-500'
              "
              :disabled="
                store.canvasViewport.pan.x === 0 &&
                store.canvasViewport.pan.y === 0
              "
              title="Сбросить позицию холста"
              @click.left.exact.prevent="
                store.canvasViewport.pan.x = 0;
                store.canvasViewport.pan.y = 0;
              "
            >
              <span>Позиция</span>

              <UIcon
                v-if="
                  store.canvasViewport.pan.x !== 0 ||
                  store.canvasViewport.pan.y !== 0
                "
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
            @click.left.exact.prevent="
              store.canvasViewport.isPanning = !store.canvasViewport.isPanning;
              if (store.canvasViewport.isPanning) {
                store.editMode = 'none';
              }
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>
