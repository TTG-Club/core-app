<script setup lang="ts">
  const {
    text = undefined,
    icon = undefined,
    inline = false,
  } = defineProps<{
    text?: string;
    icon?: string;

    /**
     * Значок идёт следом за текстом, а не отдельной колонкой строки: длинная
     * подпись переносится, и значок остаётся у последнего слова, а не
     * улетает к правому краю.
     */
    inline?: boolean;
  }>();

  const slots = useSlots();
  const { isDesktop } = useDevice();

  if (!text && !slots.content) {
    throw new Error('Text or content slot is required');
  }
</script>

<template>
  <div :class="inline ? 'inline' : 'flex items-center-safe gap-1'">
    <slot name="default" />

    <UPopover
      :mode="isDesktop ? 'hover' : 'click'"
      :delay-duration="300"
      disable-hoverable-content
    >
      <template #default>
        <!-- shrink-0 обязателен: значок — элемент flex-строки, и длинная
          подпись ужимала его в овал -->
        <UIcon
          :name="icon || 'tabler:info-circle'"
          class="shrink-0 cursor-help text-current"
          :class="inline ? 'ml-1 inline-block align-text-bottom' : ''"
        />
      </template>

      <template #content>
        <slot
          v-if="$slots.content"
          name="content"
        />

        <template v-else>
          {{ text }}
        </template>
      </template>
    </UPopover>
  </div>
</template>
