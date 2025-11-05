<script setup lang="ts">
  import { computed, type VNode } from 'vue';
  import { render, MARKER_MAP } from './renderer';
  import type { RenderNode } from './renderer';

  const { renderNode } = defineProps<{
    renderNode: RenderNode;
  }>();

  interface Group {
    id: number;
    isBlock: boolean;
    vnodes: VNode[];
  }

  interface RenderResult {
    isSingle: boolean;
    vnodes?: VNode[];
    groups?: Group[];
  }

  function isBlockMarker(node: unknown): boolean {
    if (typeof node !== 'object' || node === null) return false;
    if (Array.isArray(node)) return false;
    if (!('type' in node)) return false;

    const nodeType = node.type;

    if (nodeType === 'text') return false;
    if (typeof nodeType !== 'string') return false;

    const config = MARKER_MAP.get(nodeType);

    return config?.isBlock === true;
  }

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
          isBlock: isBlockMarker(entry),
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
