<script setup lang="ts">
  import { computed } from 'vue';
  import { BackgroundDrawer } from '~backgrounds/drawer';
  import { CreatureDrawer } from '~bestiary/drawer';
  import { ClassDrawer } from '~classes/drawer';
  import { FeatDrawer } from '~feats/drawer';
  import { GlossaryDrawer } from '~glossary/drawer';
  import { ItemDrawer } from '~items/drawer';
  import { MagicItemDrawer } from '~magic-items/drawer';
  import { SpellDrawer } from '~spells/drawer';

  import { ULink } from '#components';

  import type { DefineComponent, VNode } from 'vue';

  import type { MarkerType } from '../config';
  import type { MarkerNode, RenderNode } from '../types';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  // Тип только для секционных ссылок из MarkerType
  type SectionLinkType = Extract<
    MarkerType,
    | 'class'
    | 'spell'
    | 'feat'
    | 'background'
    | 'magicItem'
    | 'item'
    | 'creature'
    | 'glossary'
  >;

  // Тип для компонента drawer
  type DrawerComponent = DefineComponent<{
    url: string;
    onClose: () => void;
  }>;

  // Маппинг URL путей - все ключи обязательны
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

  // Маппинг компонентов - все ключи обязательны
  const DRAWER_COMPONENT_MAP: Record<SectionLinkType, DrawerComponent> = {
    class: ClassDrawer,
    background: BackgroundDrawer,
    creature: CreatureDrawer,
    feat: FeatDrawer,
    glossary: GlossaryDrawer,
    magicItem: MagicItemDrawer,
    item: ItemDrawer,
    spell: SpellDrawer,
  } as const;

  const url = node.attrs?.url?.toString();

  if (!url) {
    throw new Error(
      `[Markup] Section link must have url: ${JSON.stringify(node)}`,
    );
  }

  // Type guard с использованием ключей из маппинга
  function isSectionLinkType(type: string): type is SectionLinkType {
    return type in DRAWER_COMPONENT_MAP;
  }

  if (!isSectionLinkType(node.type)) {
    throw new Error(`[Markup] Unknown section link type: ${node.type}`);
  }

  const sectionType: SectionLinkType = node.type;
  const component: DrawerComponent = DRAWER_COMPONENT_MAP[sectionType];

  const overlay = useOverlay();

  // Решение циклической зависимости через let и колбэк
  const drawer: ReturnType<typeof overlay.create<DrawerComponent>> =
    overlay.create(component, {
      props: {
        url,
        onClose: () => {
          drawer.close();
        },
      },
      destroyOnClose: true,
    });

  const isOpened = computed(() => overlay.isOpen(drawer.id));
  const path = computed(() => MARKER_URL_MAP[sectionType]);
  const to = computed(() => `/${path.value}/${url}`);

  function handleClick() {
    drawer.open();
  }

  const children = computed(() =>
    node.content ? renderNodes(node.content) : [],
  );
</script>

<template>
  <ULink
    :to="to"
    target="_self"
    :is-opened="isOpened"
    @click.left.exact.prevent.stop="handleClick"
  >
    <component
      :is="vnode"
      v-for="(vnode, index) in children"
      :key="index"
    />
  </ULink>
</template>
