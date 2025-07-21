import { useRouter } from 'vue-router';

import { NuxtLink } from '#components';

import type { LinkNode } from '../types';

export function renderLink(node: LinkNode, renderChildren: () => VNode[]) {
  const { url } = node.attrs;

  if (!url) {
    throw new Error('[Markup] Link node must have a `url`');
  }

  const external = isExternal(url);

  return h(
    NuxtLink,
    {
      external,
      to: url,
      target: external ? '_blank' : '_self',
    },
    renderChildren,
  );
}

function isExternal(url: string) {
  try {
    const parsedUrl = new URL(url, getOrigin());

    if (parsedUrl.origin !== getOrigin()) {
      return true;
    }

    const router = useRouter();

    if (router) {
      const resolvedRoute = router.resolve(parsedUrl.pathname);

      return !resolvedRoute.matched.length;
    }

    return false;
  } catch {
    return true;
  }
}
