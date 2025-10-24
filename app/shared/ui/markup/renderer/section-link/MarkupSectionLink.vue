<script setup lang="ts">
  import { computed } from 'vue';
  import type { SectionNode } from '../../types';
  import { SectionMarker } from '../../enums';
  import { ULink } from '#components';
  import { BackgroundDrawer } from '~backgrounds/drawer';
  import { CreatureDrawer } from '~bestiary/drawer';
  import { FeatDrawer } from '~feats/drawer';
  import { GlossaryDrawer } from '~glossary/drawer';
  import { MagicItemDrawer } from '~magic-items/drawer';
  import { ItemDrawer } from '~items/drawer';
  import { SpellDrawer } from '~spells/drawer';
  import { ClassDrawer } from '~classes/drawer';

  const { node } = defineProps<{
    node: SectionNode;
  }>();

  const MARKER_URL_MAP: Record<SectionMarker, string> = {
    [SectionMarker.Class]: 'classes',
    [SectionMarker.Spell]: 'spells',
    [SectionMarker.Feat]: 'feats',
    [SectionMarker.Background]: 'backgrounds',
    [SectionMarker.MagicItem]: 'magic-items',
    [SectionMarker.Item]: 'items',
    [SectionMarker.Creature]: 'bestiary',
    [SectionMarker.Glossary]: 'glossary',
  } as const;

  const DRAWER_COMPONENT_MAP = {
    [SectionMarker.Class]: () => ClassDrawer,
    [SectionMarker.Background]: () => BackgroundDrawer,
    [SectionMarker.Creature]: () => CreatureDrawer,
    [SectionMarker.Feat]: () => FeatDrawer,
    [SectionMarker.Glossary]: () => GlossaryDrawer,
    [SectionMarker.MagicItem]: () => MagicItemDrawer,
    [SectionMarker.Item]: () => ItemDrawer,
    [SectionMarker.Spell]: () => SpellDrawer,
  } as const;

  const { url } = node.attrs;

  if (!url) {
    throw new Error(
      `[Markup] Feature link node must have a \`url\`: ${JSON.stringify(node)}`,
    );
  }

  const component = DRAWER_COMPONENT_MAP[node.type];
  const overlay = useOverlay();

  const drawer = overlay.create(component(), {
    props: {
      url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });

  const isOpened = computed(() => overlay.isOpen(drawer.id));

  const path = computed(() => MARKER_URL_MAP[node.type]);
  const to = computed(() => `/${path.value}/${url}`);

  function handleClick() {
    drawer.open();
  }
</script>

<template>
  <ULink
    :to="to"
    target="_self"
    :is-opened="isOpened"
    @click.left.exact.prevent.stop="handleClick"
  >
    <slot />
  </ULink>
</template>
