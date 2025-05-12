import { useDrawer } from '~/shared/composables';

import type { FeatureMarker, FeatureNode } from '../types';

const drawerMap: Partial<
  Record<FeatureMarker, () => ReturnType<typeof useDrawer>>
> = {
  spell: () => useDrawer('spell-detail'),
  feat: () => useDrawer('feat-detail'),
  background: () => useDrawer('background-detail'),
  magicItem: () => useDrawer('magic-item-detail'),
  bestiary: () => useDrawer('bestiary-detail'),
  glossary: () => useDrawer('glossary-detail'),
};

const markerToUrlPath: Record<FeatureMarker, string> = {
  spell: 'spells',
  feat: 'feats',
  bestiary: 'bestiary',
  background: 'backgrounds',
  magicItem: 'magic-item',
  glossary: 'glossary',
};

export function renderFeatureNode(
  node: FeatureNode,
  renderChildren: () => VNode[],
) {
  const { url } = node.attrs;

  if (!url) {
    throw new Error('[Markup] Feature link node must have a `url`');
  }

  const drawerFactory = drawerMap[node.type as FeatureMarker];
  const path = markerToUrlPath[node.type as FeatureMarker];

  if (!drawerFactory) {
    throw new Error(`[Markup] No drawer registered for: ${node.type}`);
  }

  const { open } = drawerFactory();

  const handleClick = () => {
    open(url);
  };

  return h(
    'a',
    {
      href: `/${path}/${url}`,
      target: '_self',
      onClick: withModifiers(handleClick, ['left', 'exact', 'prevent', 'stop']),
    },
    renderChildren() ? renderChildren() : 'Ошибка рендринга Child элемента',
  );
}
