<script setup lang="ts">
  import { useTokenatorStore } from '../../composables';

  const store = useTokenatorStore();
</script>

<template>
  <div class="space-y-4 px-1 pt-1">
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
        icon="i-fluent-cursor-20-regular"
        @click.left.exact.prevent="store.brush.enabled = false"
      />

      <UButton
        size="sm"
        class="flex-1"
        :variant="
          store.brush.enabled && store.brush.mode === 'add' ? 'solid' : 'soft'
        "
        :color="
          store.brush.enabled && store.brush.mode === 'add'
            ? 'primary'
            : 'neutral'
        "
        label="Рисовать"
        icon="i-fluent-edit-20-regular"
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
        icon="i-fluent-backspace-20-regular"
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
</template>
