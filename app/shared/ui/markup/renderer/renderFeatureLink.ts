import { NuxtLink } from '#components';
import { useDrawer } from '~/shared/composables';

import type { FeatureMarker, FeatureNode } from '../types';

const drawerMap: Partial<
  Record<FeatureMarker, () => ReturnType<typeof useDrawer>>
> = {
  'spell': () => useDrawer('spell-detail'),
  'feat': () => useDrawer('feat-detail'),
  'background': () => useDrawer('background-detail'),
  'magic-item': () => useDrawer('magic-item-detail'),
  'bestiary': () => useDrawer('bestiary-detail'),
  'glossary': () => useDrawer('glossary-detail'),
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

  if (!drawerFactory) {
    throw new Error(`[Markup] No drawer registered for: ${node.type}`);
  }

  const { open } = drawerFactory();

  const handleClick = () => {
    open(url);
  };

  return h(
    NuxtLink,
    {
      to: `/${node.type}/${url}`,
      target: '_self',
      onClick: withModifiers(() => handleClick(), ['left', 'exact', 'prevent']),
    },
    renderChildren,
  );
}
