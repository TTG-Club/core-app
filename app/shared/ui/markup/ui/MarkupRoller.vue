<script setup lang="ts">
  import { computed, inject } from 'vue';

  import { useDiceRoller } from '~/composables/useDiceRoller';
  import { useDiceRollerState } from '~/features/roller/composables/useDiceRollerState';
  import {
    extractRollDetails,
    formatDetailSummary,
  } from '~/features/roller/utils';

  import { TABLE_ROLL_CONTEXT } from '../consts';

  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  const props = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  type AnyNode = RenderNode;

  function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  function getNodeType(node: unknown): string | undefined {
    if (!isObject(node)) {
      return undefined;
    }

    const t = node.type;

    return typeof t === 'string' ? t : undefined;
  }

  function hasContentArray(node: unknown): node is { content: RenderNode[] } {
    return (
      isObject(node) &&
      'content' in node &&
      Array.isArray((node as any).content)
    );
  }

  function hasText(node: unknown): node is { text: string } {
    return (
      isObject(node) && 'text' in node && typeof (node as any).text === 'string'
    );
  }

  function flattenText(nodes: RenderNode[] | undefined): string {
    if (!nodes) {
      return '';
    }

    return nodes
      .map((entry) => {
        if (typeof entry === 'string') {
          return entry;
        }

        if (Array.isArray(entry)) {
          return flattenText(entry);
        }

        const type = getNodeType(entry);

        if (type === 'text' && hasText(entry)) {
          return entry.text;
        }

        if (hasContentArray(entry)) {
          return flattenText(entry.content);
        }

        return '';
      })
      .join('');
  }

  function getNodeContentText(node: AnyNode): string {
    const type = getNodeType(node);

    if (type === 'text' && hasText(node)) {
      return node.text;
    }

    if (hasContentArray(node)) {
      return flattenText(node.content);
    }

    return '';
  }

  const rawNotation = computed(() => {
    const fromAttr = (props.node as any)?.attrs?.notation?.toString?.();

    return (fromAttr ?? getNodeContentText(props.node)).trim();
  });

  const children = computed(() => {
    if (hasContentArray(props.node)) {
      return props.renderNodes(props.node.content);
    }

    return [];
  });

  interface TableRollContext {
    onRoll: (value: number) => void;
  }

  const tableRollContext = inject<TableRollContext | null>(
    TABLE_ROLL_CONTEXT,
    null,
  );

  const toast = useToast();
  const diceRoller = useDiceRoller();
  const rollerState = useDiceRollerState();

  function handleRoll() {
    const notation = rawNotation.value;

    if (!notation) {
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

    const rollObject: any = diceRoller.roll(notation);
    const value: number = rollObject?.value ?? 0;

    const displayValue = Number.isFinite(value)
      ? value.toLocaleString('ru-RU')
      : String(value);

    // Extract details for history/display
    const details = extractRollDetails(rollObject);

    if (!rollerState.isOpen.value) {
      toast.add({
        color: 'neutral',
        title: `Результат: ${value}`,
        description: notation,
      });
    }

    rollerState.result.value = displayValue;
    rollerState.details.value = []; // Clear current view details as requested for text mode simplicity in modal view?
    // Actually, if we want consistency, maybe we SHOULD set them?
    // But the user said "if from text then not output [in the result box? or history?]".
    // If I set them here, `DiceRollerResult` WILL show them if modal is open.
    // Let's set them because the user likely wants to SEE the result if they open the history.
    // rollerState.details.value = details; // Uncomment if we want them in the "current result" box too.
    // The previous code CLEARED them. I will keep clearing them from "current result" view if that was intended,
    // BUT I will definitely pass them to history.

    rollerState.bumpResultKey();

    rollerState.addHistoryEntry({
      formula: notation,
      value: displayValue,
      isError: false,
      detail: formatDetailSummary(details), // Use the formatted summary
      structuredDetails: details, // Pass the structured details for chips in history
    });

    if (Number.isFinite(value)) {
      tableRollContext?.onRoll(Math.round(value));
    }
  }
</script>

<template>
  <button
    type="button"
    class="inline-flex items-baseline gap-1 rounded px-1 text-[var(--ui-text-muted)] underline decoration-dotted underline-offset-2 transition hover:text-[var(--ui-text-highlighted)]"
    @click="handleRoll"
  >
    <template
      v-for="(vnode, index) in children"
      :key="index"
    >
      <component :is="vnode" />
    </template>
  </button>
</template>
