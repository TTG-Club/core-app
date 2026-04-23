<script setup lang="ts">
  import type { JSONContent } from '@tiptap/core';

  import { UEditor } from '#components';

  import { MARKUP_EXTENSIONS } from '../extensions';

  const props = defineProps<{
    content: JSONContent | JSONContent[];
  }>();

  const normalizedContent = computed(() => {
    if (Array.isArray(props.content)) {
      return { type: 'doc', content: props.content };
    }

    return props.content;
  });
</script>

<template>
  <ClientOnly>
    <UEditor
      :model-value="normalizedContent"
      content-type="json"
      :editable="false"
      :extensions="MARKUP_EXTENSIONS"
      :ui="{ content: 'prose-sm max-w-none' }"
    />
  </ClientOnly>
</template>
