<script setup lang="ts">
  import { computed } from 'vue';
  import { useDiceRoller, useDiceRollerState } from '~dice-roller/composables';
  import {
    extractDiceRollDetails,
    extractRollValue,
    formatDiceDetailsSummary,
  } from '~dice-roller/utils';

  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  const toast = useToast();
  const diceRoller = useDiceRoller();
  const rollerState = useDiceRollerState();

  function handleRoll() {
    const notation = node.attrs?.notation;

    if (
      !notation ||
      typeof notation !== 'string' ||
      notation.trim().length === 0
    ) {
      return;
    }

    const { valid, error } = diceRoller.validateWithError(notation);

    if (!valid) {
      if (!rollerState.isOpen.value) {
        toast.add({
          color: 'error',
          title: 'Некорректная нотация броска',
          description: error ?? 'Проверь формат записи броска.',
        });
      }

      rollerState.addHistoryEntry({
        formula: notation,
        value: error ?? 'Некорректная нотация',
        isError: true,
      });

      return;
    }

    const rollResult = diceRoller.roll(notation);
    const numericValue = extractRollValue(rollResult);

    const displayValue = Number.isFinite(numericValue)
      ? numericValue.toLocaleString('ru-RU')
      : String(numericValue);

    const details = extractDiceRollDetails(rollResult);

    if (!rollerState.isOpen.value) {
      toast.add({
        color: 'neutral',
        title: `Результат: ${numericValue}`,
        description: notation,
      });
    }

    rollerState.result.value = displayValue;
    rollerState.details.value = [];

    rollerState.incrementResultKey();

    rollerState.addHistoryEntry({
      formula: notation,
      value: displayValue,
      isError: false,
      detail: formatDiceDetailsSummary(details),
      structuredDetails: details,
    });

    if (Number.isFinite(numericValue)) {
      rollerState.notifyTableRoll(Math.round(numericValue));
    }
  }

  const children = computed(() =>
    node.content ? renderNodes(node.content) : [],
  );
</script>

<template>
  <UButton
    type="button"
    variant="link"
    color="neutral"
    class="inline-flex items-baseline gap-1 px-1 text-link underline decoration-dotted underline-offset-2 hover:text-link"
    @click.left.exact.prevent="handleRoll"
  >
    <component
      :is="vnode"
      v-for="(vnode, index) in children"
      :key="index"
    />
  </UButton>
</template>
