<script setup lang="ts">
  const { text = undefined, icon = undefined } = defineProps<{
    text?: string;
    icon?: string;
  }>();

  const slots = useSlots();
  const { isDesktop } = useDevice();

  if (!text && !slots.content) {
    throw new Error('Text or content slot is required');
  }
</script>

<template>
  <div class="flex items-center-safe gap-1">
    <slot name="default" />

    <UPopover
      :mode="isDesktop ? 'hover' : 'click'"
      :delay-duration="300"
      disable-hoverable-content
    >
      <template #default>
        <UIcon
          :name="icon || 'i-ttg-info'"
          class="cursor-help text-current"
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
