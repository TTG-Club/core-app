<script setup lang="ts">
  import type { EntityRevision } from '../model';

  import {
    formatRevisionLabel,
    REVISION_SELECT_EMPTY_TEXT,
    REVISION_SELECT_PLACEHOLDER,
  } from '../model';

  const props = defineProps<{
    revisions: EntityRevision[];
    selectedVersion: number | undefined;
    loading: boolean;
  }>();

  const emit = defineEmits<{
    select: [version: number];
  }>();

  const revisionOptions = computed(() =>
    props.revisions.map((revision) => ({
      label: formatRevisionLabel(revision),
      value: revision.version,
    })),
  );

  const revisionPlaceholder = computed(() =>
    revisionOptions.value.length > 0
      ? REVISION_SELECT_PLACEHOLDER
      : REVISION_SELECT_EMPTY_TEXT,
  );

  /**
   * Передаёт выбранную версию форме для загрузки снимка.
   */
  function selectRevision(version: number): void {
    emit('select', version);
  }
</script>

<template>
  <USelectMenu
    :model-value="selectedVersion"
    :items="revisionOptions"
    :loading
    :disabled="loading || revisionOptions.length === 0"
    :placeholder="revisionPlaceholder"
    value-key="value"
    label-key="label"
    class="min-w-0 flex-1"
    @update:model-value="selectRevision"
  />
</template>
