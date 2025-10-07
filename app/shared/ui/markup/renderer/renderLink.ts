import { useRouter } from 'vue-router';

import { ULink } from '#components';

import type { LinkNode } from '../types';

export function renderLink(node: LinkNode, renderChildren: () => VNode[]) {
  const { url, target } = node.attrs;

  if (!url) {
    throw new Error(
      `[Markup] Link node must have a \`url\`: ${JSON.stringify(node)}`,
    );
  }

  if (target && target !== '_blank') {
    throw new Error(
      `[Markup] \`target\` must be "_blank": ${JSON.stringify(node)}`,
    );
  }

  const external = isExternal(url);
  const isNewTab = target === '_blank' || external;

  return h(
    ULink,
    {
      external,
      to: url,
      target: isNewTab ? '_blank' : '_self',
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
