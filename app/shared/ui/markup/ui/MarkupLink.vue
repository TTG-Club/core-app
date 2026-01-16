<script setup lang="ts">
  import { computed } from 'vue';
  import { useRouter } from 'vue-router';

  import { ULink } from '#components';

  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  const url = node.attrs?.url?.toString();
  const target = node.attrs?.target?.toString();

  if (!url) {
    throw new Error(`[Markup] Link must have url: ${JSON.stringify(node)}`);
  }

  if (target && target !== '_blank') {
    throw new Error(
      `[Markup] target must be "_blank": ${JSON.stringify(node)}`,
    );
  }

  const isExternal = computed(() => {
    try {
      const parsedUrl = new URL(url, window.location.origin);

      if (parsedUrl.origin !== window.location.origin) {
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
  });

  const isNewTab = computed(() => target === '_blank' || isExternal.value);

  const children = computed(() =>
    node.content ? renderNodes(node.content) : [],
  );
</script>

<template>
  <ULink
    :external="isExternal"
    :to="url"
    :target="isNewTab ? '_blank' : '_self'"
  >
    <component
      :is="vnode"
      v-for="(vnode, index) in children"
      :key="index"
    />
  </ULink>
</template>
