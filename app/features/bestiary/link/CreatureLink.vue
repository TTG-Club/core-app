<script setup lang="ts">
  import { CreatureDrawer } from '~bestiary/drawer';
  import { SmallLink } from '~ui/link';

  import type { CreatureLinkResponse } from '~bestiary/types';

  const { creature } = defineProps<{
    creature: CreatureLinkResponse;
  }>();

  const overlay = useOverlay();

  const drawer = overlay.create(CreatureDrawer, {
    props: {
      url: creature.url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });

  const isOpened = computed(() => overlay.isOpen(drawer.id));
</script>

<template>
  <SmallLink
    :to="{ name: 'bestiary-url', params: { url: creature.url } }"
    :title="`${creature.name.rus} [${creature.name.eng}]`"
    :source="creature.source"
    :is-opened
    @open-drawer="drawer.open()"
  >
    <template #icon>
      {{ creature.challengeRailing }}
    </template>

    <template #default>
      {{ creature.name.rus }}
    </template>

    <template #english>
      {{ creature.name.eng }}
    </template>

    <template #caption>
      <span>
        {{ creature.type }}
      </span>
    </template>
  </SmallLink>
</template>
