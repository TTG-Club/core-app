<script setup lang="ts">
  import type { DefineComponent } from 'vue';

  import {
    NodeViewContent,
    nodeViewProps,
    NodeViewWrapper,
  } from '@tiptap/vue-3';

  import { ULink } from '#components';

  // eslint-disable-next-line vue/define-props-declaration
  const props = defineProps(nodeViewProps);

  type SectionLinkType =
    | 'class'
    | 'spell'
    | 'feat'
    | 'background'
    | 'magicItem'
    | 'item'
    | 'creature'
    | 'glossary';

  type DrawerComponent = DefineComponent<{
    url: string;
    onClose: () => void;
  }>;

  const MARKER_URL_MAP: Record<SectionLinkType, string> = {
    class: 'classes',
    spell: 'spells',
    feat: 'feats',
    background: 'backgrounds',
    magicItem: 'magic-items',
    item: 'items',
    creature: 'bestiary',
    glossary: 'glossary',
  } as const;

  const DRAWER_COMPONENT_MAP: Record<SectionLinkType, DrawerComponent> = {
    class: defineAsyncComponent(() =>
      import('~classes/drawer').then((m) => m.ClassDrawer),
    ) as unknown as DrawerComponent,
    background: defineAsyncComponent(() =>
      import('~backgrounds/drawer').then((m) => m.BackgroundDrawer),
    ) as unknown as DrawerComponent,
    creature: defineAsyncComponent(() =>
      import('~bestiary/drawer').then((m) => m.CreatureDrawer),
    ) as unknown as DrawerComponent,
    feat: defineAsyncComponent(() =>
      import('~feats/drawer').then((m) => m.FeatDrawer),
    ) as unknown as DrawerComponent,
    glossary: defineAsyncComponent(() =>
      import('~glossary/drawer').then((m) => m.GlossaryDrawer),
    ) as unknown as DrawerComponent,
    magicItem: defineAsyncComponent(() =>
      import('~magic-items/drawer').then((m) => m.MagicItemDrawer),
    ) as unknown as DrawerComponent,
    item: defineAsyncComponent(() =>
      import('~items/drawer').then((m) => m.ItemDrawer),
    ) as unknown as DrawerComponent,
    spell: defineAsyncComponent(() =>
      import('~spells/drawer').then((m) => m.SpellDrawer),
    ) as unknown as DrawerComponent,
  } as const;

  function isSectionLinkType(type: string): type is SectionLinkType {
    return type in DRAWER_COMPONENT_MAP;
  }

  const sectionType = computed(() => {
    const type = props.node.attrs.sectionType as string;

    if (!isSectionLinkType(type)) {
      console.error(`[Markup] Unknown section link type: ${type}`);

      return 'spell';
    }

    return type;
  });

  const url = computed(() => props.node.attrs.url as string);
  const component = computed(() => DRAWER_COMPONENT_MAP[sectionType.value]);
  const overlay = useOverlay();

  let drawerInstance: ReturnType<
    typeof overlay.create<DrawerComponent>
  > | null = null;

  function handleClick() {
    if (!url.value) {
      return;
    }

    const drawer = overlay.create(component.value, {
      props: {
        url: url.value,
        onClose: () => {
          drawer.close();
        },
      },
      destroyOnClose: true,
    });

    drawerInstance = drawer;
    drawer.open();
  }

  const path = computed(() => MARKER_URL_MAP[sectionType.value]);
  const to = computed(() => `/${path.value}/${url.value}`);

  const isOpened = computed(() =>
    drawerInstance ? overlay.isOpen(drawerInstance.id) : false,
  );
</script>

<template>
  <NodeViewWrapper as="span">
    <ULink
      :to="to"
      target="_self"
      :is-opened="isOpened"
      @click.left.exact.prevent.stop="handleClick"
    >
      <NodeViewContent as="span" />
    </ULink>
  </NodeViewWrapper>
</template>
