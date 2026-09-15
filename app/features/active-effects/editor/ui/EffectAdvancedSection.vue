<script setup lang="ts">
  import { EFFECT_ADVANCED_LABELS } from '../../model';

  /**
   * Сворачиваемый раздел «Для опытных»: включает у модификаторов приоритет.
   * Порядок применения большинству эффектов не нужен.
   */
  const showPriorityField = defineModel<boolean>('showPriorityField', {
    required: true,
  });
</script>

<template>
  <UCollapsible class="flex flex-col gap-2">
    <UButton
      color="neutral"
      variant="ghost"
      size="sm"
      icon="tabler:settings"
      trailing-icon="tabler:chevron-down"
      :label="EFFECT_ADVANCED_LABELS.title"
      class="w-full justify-start"
      :ui="{
        trailingIcon:
          'ms-auto transition-transform duration-200 group-data-[state=open]:rotate-180',
      }"
    />

    <template #content>
      <div class="px-1 pb-1">
        <USwitch
          v-model="showPriorityField"
          :label="EFFECT_ADVANCED_LABELS.priorityField"
          :description="EFFECT_ADVANCED_LABELS.priorityFieldHint"
        />
      </div>
    </template>
  </UCollapsible>
</template>
