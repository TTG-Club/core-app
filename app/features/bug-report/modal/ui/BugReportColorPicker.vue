<script setup lang="ts">
  import type { BrushColor } from '../../model';

  import { BRUSH_COLORS } from '../../model';

  defineProps<{
    /** Блокирует выбор цвета */
    disabled?: boolean;

    /** Вертикальная раскладка */
    vertical?: boolean;
  }>();

  const selectedColor = defineModel<string>({ required: true });

  function selectColor(brushColor: BrushColor) {
    selectedColor.value = brushColor.value;
  }

  function isSelected(brushColor: BrushColor): boolean {
    return selectedColor.value === brushColor.value;
  }
</script>

<template>
  <div :class="['flex items-center gap-1.5', { 'flex-col': vertical }]">
    <button
      v-for="brushColor in BRUSH_COLORS"
      :key="brushColor.name"
      :class="[
        'size-6 cursor-pointer rounded-full border-2 border-transparent transition-all duration-150',
        'hover:enabled:scale-115 disabled:cursor-not-allowed disabled:opacity-50',
      ]"
      :style="{
        backgroundColor: brushColor.value,
        borderColor: isSelected(brushColor)
          ? 'var(--ui-text-highlighted)'
          : undefined,
        boxShadow: isSelected(brushColor)
          ? `0 0 0 2px var(--ui-bg), 0 0 0 4px ${brushColor.value}`
          : undefined,
      }"
      :title="brushColor.name"
      :disabled="disabled"
      type="button"
      @click.left.exact.prevent="selectColor(brushColor)"
    />
  </div>
</template>
