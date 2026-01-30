<script setup lang="ts">
  import { computed } from 'vue';
  import { useDiceRoller, useDiceRollerState } from '~dice-roller/composables';
  import {
    extractDiceRollDetails,
    extractRollValue,
    formatDiceDetailsSummary,
  } from '~dice-roller/utils';

  import { isSimpleTextNode } from '../utils';

  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  const toast = useToast();
  const { validateWithError, roll } = useDiceRoller();

  const {
    isOpen,
    result,
    details,
    incrementResultKey,
    addHistoryEntry,
    notifyTableRoll,
  } = useDiceRollerState();

  function getNodeText(renderNode: RenderNode | RenderNode[]): string {
    if (typeof renderNode === 'string') {
      return renderNode;
    }

    if (Array.isArray(renderNode)) {
      return renderNode.map((child) => getNodeText(child)).join('');
    }

    if (isSimpleTextNode(renderNode)) {
      return renderNode.text;
    }

    if (
      typeof renderNode === 'object' &&
      renderNode !== null &&
      'content' in renderNode &&
      Array.isArray(renderNode.content)
    ) {
      return renderNode.content.map((child) => getNodeText(child)).join('');
    }

    return '';
  }

  function handleRoll() {
    const textContent = node.content ? getNodeText(node.content) : '';
    const notation = node.attrs?.notation || textContent;

    if (
      !notation ||
      typeof notation !== 'string' ||
      notation.trim().length === 0
    ) {
      return;
    }

    const { valid, error } = validateWithError(notation);

    if (!valid) {
      if (!isOpen.value) {
        toast.add({
          color: 'error',
          icon: 'i-ttg-dice-outline-d20',
          title: 'Некорректная нотация броска',
          description: error ?? 'Проверь формат записи броска.',
        });
      }

      addHistoryEntry({
        formula: notation,
        value: error ?? 'Некорректная нотация',
        isError: true,
      });

      return;
    }

    const rollResult = roll(notation);
    const numericValue = extractRollValue(rollResult);

    const displayValue = Number.isFinite(numericValue)
      ? numericValue.toLocaleString('ru-RU')
      : String(numericValue);

    const rollDetails = extractDiceRollDetails(rollResult);

    if (!isOpen.value) {
      toast.add({
        color: 'neutral',
        title: `Бросок ${notation}`,
        icon: 'i-ttg-dice-outline-d20',
        description: () =>
          h('span', [
            `Результат: `,
            h('span', { class: 'font-bold text-link' }, displayValue),
          ]),
      });
    }

    result.value = displayValue;
    details.value = [];

    incrementResultKey();

    addHistoryEntry({
      formula: notation,
      value: displayValue,
      isError: false,
      detail: formatDiceDetailsSummary(rollDetails),
      structuredDetails: rollDetails,
    });

    if (Number.isFinite(numericValue)) {
      notifyTableRoll(Math.round(numericValue));
    }
  }

  const children = computed(() =>
    node.content ? renderNodes(node.content) : [],
  );
</script>

<template>
  <span
    class="cursor-pointer text-link underline decoration-dotted underline-offset-2 hover:text-link hover:decoration-solid"
    @click.left.exact.prevent="handleRoll"
  >
    <component
      :is="vnode"
      v-for="(vnode, index) in children"
      :key="index"
    />
  </span>
</template>
