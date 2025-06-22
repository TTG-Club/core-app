<script setup lang="ts">
  import { GlossaryBody } from '~glossary/body';
  import { UiDrawer } from '~ui/drawer';

  import type { GlossaryDetailResponse } from '~/shared/types';

  const { glossary = undefined } = defineProps<{
    glossary?: GlossaryDetailResponse;
    isError?: boolean;
    isLoading?: boolean;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const urlForCopy = computed(() =>
    glossary ? `${getOrigin()}/glossary/${glossary.url}` : undefined,
  );

  const editUrl = computed(() =>
    glossary ? `/workshop/glossary/${glossary.url}` : undefined,
  );
</script>

<template>
  <UiDrawer
    :title="glossary?.name"
    :source="glossary?.source"
    :date-time="glossary?.updatedAt"
    :url="urlForCopy"
    :edit-url="editUrl"
    :is-loading
    :is-error
    copy-title
    @close="$emit('close')"
  >
    <GlossaryBody
      v-if="glossary"
      :glossary
    />
  </UiDrawer>
</template>
