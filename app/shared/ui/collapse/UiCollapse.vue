<script setup lang="ts">
  import type { ClassValue } from 'tailwind-variants';

  interface CollapsibleProps {
    defaultOpen?: boolean;
    open?: boolean;
    disabled?: boolean;
    unmountOnHide?: boolean;
    class?: any;
    ui?: {
      root?: ClassValue;
      content?: ClassValue;
    };
  }

  const props = withDefaults(defineProps<CollapsibleProps>(), {
    defaultOpen: undefined,
    open: undefined,
    disabled: undefined,
    unmountOnHide: undefined,
    class: undefined,
    ui: undefined,
  });

  defineEmits<{
    (e: 'update:open', open: boolean): void;
  }>();
</script>

<template>
  <UCollapsible
    v-bind="props"
    @update:open="$emit('update:open', $event)"
  >
    <template #default="{ open: opened }">
      <h4 class="flex cursor-pointer items-center gap-2 text-xl font-semibold">
        <UIcon
          name="i-fluent-chevron-down-16-regular"
          class="transition-transform duration-150 ease-in-out"
          :class="opened ? '-rotate-180' : ''"
        />

        <span>
          <slot
            name="default"
            :open="opened"
          />
        </span>
      </h4>
    </template>

    <template #content>
      <template v-if="$slots.subtitle">
        <USeparator />

        <div class="mb-4 ml-1 italic">
          <slot name="subtitle" />
        </div>
      </template>

      <slot name="content" />
    </template>
  </UCollapsible>
</template>
