<script setup lang="ts">
  const { text = undefined, icon = undefined } = defineProps<{
    text?: string;
    icon?: string;
  }>();

  const slots = useSlots();

  if (!text && !slots.content) {
    throw new Error('Text or content slot is required');
  }
</script>

<template>
  <div class="flex items-center-safe gap-1">
    <slot name="default" />

    <UTooltip :delay-duration="300">
      <template #default>
        <UIcon
          :name="icon || 'i-ttg-info'"
          class="cursor-help text-current hover:text-gray-700"
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
    </UTooltip>
  </div>
</template>
