<script setup lang="ts">
  import { GlossaryDrawer } from '~glossary/drawer';
  import { SmallLink } from '~ui/link';

  import type { GlossaryLinkResponse } from '~/shared/types';

  const { glossary } = defineProps<{
    glossary: GlossaryLinkResponse;
  }>();

  const overlay = useOverlay();

  const drawer = overlay.create(GlossaryDrawer, {
    props: {
      url: glossary.url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });

  const isOpened = computed(() => overlay.isOpen(drawer.id));
</script>

<template>
  <SmallLink
    :to="{ name: 'glossary-url', params: { url: glossary.url } }"
    :title="`${glossary.name.rus} [${glossary.name.eng}]`"
    :group="glossary.source?.group"
    :is-opened
    @open-drawer="drawer.open()"
  >
    <template #default>
      {{ glossary.name.rus }}
    </template>

    <template #english>
      {{ glossary.name.eng }}
    </template>

    <template #caption>
      <span :style="{ color: 'var(--ui-text-highlighted)' }">
        {{ glossary.tagCategory ?? '—' }}
      </span>
    </template>
  </SmallLink>
</template>
