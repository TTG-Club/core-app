<script setup lang="ts">
  import { FEAT_EDITOR_LABELS } from '../../model';

  /**
   * Разделитель между строками списка: они складываются, а не заменяют друг
   * друга. Показан явно — иначе «даёт и то, и другое» приходится угадывать.
   */
</script>

<template>
  <div class="flex items-center gap-2 px-1">
    <span class="h-px flex-1 bg-accented/40" />

    <span class="text-xs font-semibold tracking-wider text-dimmed">
      {{ FEAT_EDITOR_LABELS.rowsAnd }}
    </span>

    <span class="h-px flex-1 bg-accented/40" />
  </div>
</template>
