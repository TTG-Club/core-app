<script setup lang="ts">
  import type { VttgGuideCode } from '../model';

  import VttgGuideCopyButton from './VttgGuideCopyButton.vue';

  /** Фрагмент кода в шаге инструкции: подпись, кнопка копирования и сам текст. */
  const { code } = defineProps<{
    code: VttgGuideCode;
  }>();
</script>

<template>
  <figure
    class="flex min-w-0 flex-col overflow-hidden rounded-md border border-default bg-elevated/50"
  >
    <figcaption
      class="flex items-center justify-between gap-2 border-b border-default py-1 pr-1 pl-3"
    >
      <span class="text-xs text-muted">{{ code.caption }}</span>

      <VttgGuideCopyButton :text="code.content" />
    </figcaption>

    <pre
      class="overflow-x-auto px-3 py-2 font-mono text-sm leading-6 text-highlighted"
    ><code>{{ code.content }}</code></pre>
  </figure>
</template>
