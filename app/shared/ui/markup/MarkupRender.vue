<script setup lang="ts">
  import type { Group, RenderNode, RenderResult } from './types';

  import { computed } from 'vue';

  import { render, toBlockGroups } from './renderer';

  const { renderNode } = defineProps<{
    renderNode: RenderNode;
  }>();

  const rendered = computed<RenderResult>(() => {
    try {
      // Одиночный элемент (строка «{@...}»-разметки, MarkerNode или SimpleTextNode).
      if (!Array.isArray(renderNode)) {
        return {
          isSingle: true,
          vnodes: render(renderNode),
        };
      }

      // Каждый элемент описания разбиваем на блочные/инлайновые группы, чтобы
      // блочные маркеры ({@h}/{@list}/{@quote}/…) рисовались вне <p>, а не внутри.
      const groups: Group[] = [];

      let groupId = 0;

      for (const entry of renderNode) {
        for (const group of toBlockGroups(entry)) {
          groups.push({ id: groupId++, ...group });
        }
      }

      return {
        isSingle: false,
        groups,
      };
    } catch (e) {
      consola.error('[Markup] Error rendering entries:', e);

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
