<script setup lang="ts">
  import { computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { ULink } from '#components';
  import type { LinkNode } from '../../types';

  const { node } = defineProps<{
    node: LinkNode;
  }>();

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
</script>

<template>
  <ULink
    :external="isExternal"
    :to="url"
    :target="isNewTab ? '_blank' : '_self'"
  >
    <slot />
  </ULink>
</template>
