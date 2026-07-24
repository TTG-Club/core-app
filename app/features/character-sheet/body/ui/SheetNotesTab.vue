<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';
  import { MarkupEditor } from '~ui/markup-editor';

  import { useCharacterSheet } from '../../composables';
  import { parseStoredMarkupNodes, SHEET_TAB_EMPTY_LABELS } from '../../model';

  const { character, ensureEditable, setNotes } = useCharacterSheet();

  /** true — режим редактирования, false — режим просмотра. */
  const isEditing = ref(false);

  /** Черновик заметок; заполняется при входе в редактирование. */
  const draft = ref('');

  /** Узлы разметки сохранённых заметок для рендера в режиме просмотра. */
  const notesNodes = computed(() =>
    parseStoredMarkupNodes(character.value.notes),
  );

  const hasNotes = computed(() => notesNodes.value.length > 0);

  function handleEdit() {
    // Блокировка листа показывает подсказку и не пускает в редактирование.
    if (!ensureEditable()) {
      return;
    }

    draft.value = character.value.notes;
    isEditing.value = true;
  }

  function handleSave() {
    setNotes(draft.value);
    isEditing.value = false;
  }

  function handleCancel() {
    isEditing.value = false;
  }
</script>

<template>
  <div class="flex flex-col gap-3 pt-2">
    <template v-if="isEditing">
      <MarkupEditor
        v-model="draft"
        placeholder="Заметки о персонаже, зацепки, цели, союзники…"
      />

      <div class="flex justify-end gap-2">
        <UButton
          label="Отмена"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          label="Сохранить"
          color="primary"
          @click.left.exact.prevent="handleSave"
        />
      </div>
    </template>

    <template v-else>
      <div class="flex justify-end">
        <UButton
          icon="tabler:pencil"
          label="Редактировать"
          color="neutral"
          variant="ghost"
          size="sm"
          @click.left.exact.prevent="handleEdit"
        />
      </div>

      <MarkupRender
        v-if="hasNotes"
        :render-node="notesNodes"
        class="text-sm"
      />

      <div
        v-else
        class="flex h-64 items-center justify-center rounded-lg border border-dashed border-default text-sm text-dimmed"
      >
        {{ SHEET_TAB_EMPTY_LABELS.notes }}
      </div>
    </template>
  </div>
</template>
