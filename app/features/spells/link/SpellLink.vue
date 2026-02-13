<script setup lang="ts">
  import { SpellDrawer } from '~spells/drawer';
  import { SmallLink } from '~ui/link';

  import { SpellLinkComponents, SpellLinkFlags } from './ui';

  import type { SpellLinkResponse } from '~spells/model';

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
    :source="spell.source"
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

      <span>
        {{ spell.school }}
      </span>

      <SpellLinkComponents :components="spell.components" />
    </template>
  </SmallLink>
</template>
