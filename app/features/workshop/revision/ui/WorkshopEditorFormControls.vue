<script setup lang="ts">
  import type { WorkshopRevisionControl } from '../model';

  import { EditorFormControls } from '~ui/editor';

  import RevisionSelect from './RevisionSelect.vue';

  const props = defineProps<{
    revisionControl: WorkshopRevisionControl;
  }>();

  /**
   * Передаёт выбранную версию контроллеру ревизий формы.
   */
  function selectRevision(version: number): void {
    void props.revisionControl.selectRevision(version);
  }
</script>

<template>
  <EditorFormControls>
    <template
      v-if="revisionControl.enabled"
      #revision
    >
      <RevisionSelect
        :revisions="revisionControl.revisions"
        :selected-version="revisionControl.selectedVersion"
        :loading="revisionControl.loading"
        @select="selectRevision"
      />
    </template>

    <template #preview="{ opened, changeVisibility }">
      <slot
        name="preview"
        :opened
        :change-visibility="changeVisibility"
      />
    </template>
  </EditorFormControls>
</template>
