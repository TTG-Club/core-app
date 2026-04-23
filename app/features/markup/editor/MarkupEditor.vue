<script setup lang="ts">
  import type { JSONContent } from '@tiptap/core';

  import { UEditor } from '#components';

  import { MARKUP_EXTENSIONS } from '../extensions';

  const modelValue = defineModel<JSONContent | JSONContent[] | null>();

  const normalizedContent = computed({
    get() {
      if (Array.isArray(modelValue.value)) {
        return { type: 'doc', content: modelValue.value };
      }

      return modelValue.value || { type: 'doc', content: [] };
    },
    set(value: JSONContent | undefined) {
      if (!value) {
        modelValue.value = null;

        return;
      }

      modelValue.value = value;
    },
  });
</script>

<template>
  <ClientOnly>
    <UEditor
      v-model="normalizedContent"
      content-type="json"
      :editable="true"
      :extensions="MARKUP_EXTENSIONS"
      :ui="{
        content:
          'prose-sm max-w-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md border border-gray-300 p-2 min-h-[100px]',
      }"
    />
  </ClientOnly>
</template>
