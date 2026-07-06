<script setup lang="ts">
  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  import { computed } from 'vue';
  import { useRouter } from 'vue-router';

  import { ULink } from '#components';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  const router = useRouter();

  const url = computed(() => node.attrs?.url?.toString() ?? '');

  // Внешняя ссылка ждёт target="_blank"; любое иное значение игнорируем (раньше
  // здесь бросалось исключение — незаполненный/кривой атрибут ронял всю страницу).
  const isBlankTarget = computed(
    () => node.attrs?.target?.toString() === '_blank',
  );

  const isExternal = computed(() => {
    try {
      const parsedUrl = new URL(url.value, window.location.origin);

      if (parsedUrl.origin !== window.location.origin) {
        return true;
      }

      const resolvedRoute = router.resolve(parsedUrl.pathname);

      return !resolvedRoute.matched.length;
    } catch {
      return true;
    }
  });

  const isNewTab = computed(() => isBlankTarget.value || isExternal.value);

  const children = computed(() =>
    node.content ? renderNodes(node.content) : [],
  );
</script>

<template>
  <!-- Пустой url — не роняем рендер: показываем содержимое обычным текстом. -->
  <ULink
    v-if="url"
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

  <span v-else>
    <component
      :is="vnode"
      v-for="(vnode, index) in children"
      :key="index"
    />
  </span>
</template>
