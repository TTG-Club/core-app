<script setup lang="ts">
  import { SpellLinkComponents, SpellLinkFlags } from './ui';

  import { SpellDrawer } from '~spells/drawer';
  import { SmallLink } from '~ui/link';

  import type { SpellLinkResponse } from '~/shared/types';

  const { spell } = defineProps<{
    spell: SpellLinkResponse;
  }>();

  const overlay = useOverlay();

  const drawer = overlay.create(SpellDrawer, {
    props: {
      url: spell.url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });

  const isOpened = computed(() => overlay.isOpen(drawer.id));
</script>

<template>
  <SmallLink
    :to="{ name: 'spells-url', params: { url: spell.url } }"
    :title="`${spell.name.rus} [${spell.name.eng}]`"
    :group="spell.source.group"
    :is-opened
    @open-drawer="drawer.open()"
  >
    <template #icon>
      {{ spell.level || '◐' }}
    </template>

    <template #default>
      {{ spell.name.rus }}
    </template>

    <template #english>
      {{ spell.name.eng }}
    </template>

    <template #caption>
      <SpellLinkFlags
        :ritual="spell.ritual"
        :concentration="spell.concentration"
      />

      <span class="text-(--ui-text-gray)">
        {{ spell.school }}
      </span>

      <SpellLinkComponents :components="spell.components" />
    </template>
  </SmallLink>
</template>
