<script setup lang="ts">
  import { useDrawer } from '~/shared/composables';
  import { SmallLink } from '~ui/link';

  import type { GlossaryLinkResponse } from '~/shared/types';

  const { glossary } = defineProps<{
    glossary: GlossaryLinkResponse;
  }>();

  const { open } = useDrawer('glossary-detail');
</script>

<template>
  <SmallLink
    :to="{ name: 'glossary-url', params: { url: glossary.url } }"
    :title="`${glossary.name.rus} [${glossary.name.eng}]`"
    :group="glossary.source?.group"
    @open-drawer="open(glossary.url)"
  >
    <template #default>
      {{ glossary.name.rus }}
    </template>

    <template #english>
      {{ glossary.name.eng }}
    </template>

    <template #caption>
      <span :style="{ color: 'var(--color-text-gray)' }">
        {{ glossary.tagCategory ?? '—' }}
      </span>
    </template>
  </SmallLink>
</template>
