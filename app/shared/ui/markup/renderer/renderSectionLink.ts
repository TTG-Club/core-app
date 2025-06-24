import { SectionMarker } from '../types';

import { ULink } from '#components';
import { BackgroundDrawer } from '~backgrounds/drawer';
import { CreatureDrawer } from '~bestiary/drawer';
import { FeatDrawer } from '~feats/drawer';
import { GlossaryDrawer } from '~glossary/drawer';
import { MagicItemDrawer } from '~magic-items/drawer';
import { SpellDrawer } from '~spells/drawer';

import type { SectionNode } from '../types';

const MARKER_URL_MAP: Record<SectionMarker, string> = {
  [SectionMarker.Spell]: 'spells',
  [SectionMarker.Feat]: 'feats',
  [SectionMarker.Background]: 'backgrounds',
  [SectionMarker.MagicItem]: 'magic-item',
  [SectionMarker.Creature]: 'bestiary',
  [SectionMarker.Glossary]: 'glossary',
} as const;

const DRAWER_COMPONENT_MAP = {
  [SectionMarker.Background]: () => BackgroundDrawer,
  [SectionMarker.Creature]: () => CreatureDrawer,
  [SectionMarker.Feat]: () => FeatDrawer,
  [SectionMarker.Glossary]: () => GlossaryDrawer,
  [SectionMarker.MagicItem]: () => MagicItemDrawer,
  [SectionMarker.Spell]: () => SpellDrawer,
} as const;

function drawerFactory(marker: SectionMarker, url: string) {
  const component = DRAWER_COMPONENT_MAP[marker];

  const overlay = useOverlay();

  const drawer = overlay.create(component(), {
    props: {
      url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });

  const isOpened = computed(() => overlay.isOpen(drawer.id));

  return {
    isOpened,
    open: drawer.open,
  };
}

export function renderSectionLinkNode(
  node: SectionNode,
  renderChildren: () => VNode[],
) {
  const { url } = node.attrs;

  if (!url) {
    throw new Error('[Markup] Feature link node must have a `url`');
  }

  const { open, isOpened } = drawerFactory(node.type, url);
  const path = MARKER_URL_MAP[node.type];
  const to = `/${path}/${url}`;

  return h(
    ULink,
    {
      to,
      target: '_self',
      isOpened: isOpened.value,
      onClick: withModifiers(() => {
        open();
      }, ['left', 'exact', 'prevent', 'stop']),
    },
    {
      default: () =>
        renderChildren()
          ? renderChildren()
          : 'Ошибка рендеринга дочернего элемента',
    },
  );
}
