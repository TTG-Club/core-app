<script setup lang="ts">
  import { computed } from 'vue';
  import { render } from './renderer';
  import type { Group, RenderNode, RenderResult } from './types';
  import { isBlockNode } from './utils';

  const { renderNode } = defineProps<{
    renderNode: RenderNode;
  }>();

  const rendered = computed<RenderResult>(() => {
    try {
      // Одиночный элемент
      if (!Array.isArray(renderNode)) {
        return {
          isSingle: true,
          vnodes: render(renderNode),
        };
      }

      // Группируем последовательные inline элементы
      const groups: Group[] = [];

      let groupId = 0;

      for (const entry of renderNode) {
        groups.push({
          id: groupId++,
          isBlock: isBlockNode(entry),
          vnodes: render(entry),
        });
      }

      return {
        isSingle: false,
        groups,
      };
    } catch (e) {
      console.error('[Markup] Error rendering entries:', e);

      return { isSingle: true, vnodes: [] };
    }
  });
</script>

<template>
  <ClientOnly>
    <template v-if="rendered.isSingle">
      <component
        :is="vnode"
        v-for="(vnode, index) in rendered.vnodes"
        :key="index"
      />
    </template>

    <template v-else>
      <template
        v-for="group in rendered.groups"
        :key="group.id"
      >
        <template v-if="group.isBlock">
          <component
            :is="vnode"
            v-for="(vnode, index) in group.vnodes"
            :key="index"
            class="mb-2"
          />
        </template>

        <p
          v-else
          class="mb-2"
        >
          <component
            :is="vnode"
            v-for="(vnode, index) in group.vnodes"
            :key="index"
          />
        </p>
      </template>
    </template>
  </ClientOnly>
</template>
