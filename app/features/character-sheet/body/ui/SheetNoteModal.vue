<script setup lang="ts">
  import { MarkupEditor } from '~ui/markup-editor';

  import { useCharacterSheet } from '../../composables';
  import { SHEET_NOTE_LABELS } from '../../model';

  // Идентификатор правимой заметки; null — форма создаёт новую запись.
  const { noteId } = defineProps<{
    noteId: string | null;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, addNote, updateNote } = useCharacterSheet();

  // Снимок заметки на момент открытия. Модалка размонтируется при закрытии,
  // поэтому setup выполняется заново на каждое открытие — снимок всегда свежий,
  // а реактивность здесь не нужна (правки применяются по кнопке).
  const editedNote = noteId
    ? (character.value.notes.find((note) => note.id === noteId) ?? null)
    : null;

  const draftTitle = ref(editedNote?.title ?? '');

  const draftContent = ref(editedNote?.content ?? '');

  const modalTitle = computed(() =>
    noteId ? SHEET_NOTE_LABELS.editTitle : SHEET_NOTE_LABELS.addTitle,
  );

  const applyLabel = computed(() =>
    noteId ? SHEET_NOTE_LABELS.saveAction : SHEET_NOTE_LABELS.addAction,
  );

  // Пустая заметка не нужна: без заголовка и текста карточка ничего не несёт.
  const isApplyDisabled = computed(
    () => !draftTitle.value.trim() && !draftContent.value.trim(),
  );

  function handleApply() {
    if (isApplyDisabled.value) {
      return;
    }

    const note = { title: draftTitle.value, content: draftContent.value };

    if (noteId) {
      updateNote(noteId, note);
    } else {
      addNote(note);
    }

    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="modalTitle"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-bold text-muted uppercase">
            {{ SHEET_NOTE_LABELS.titleField }}
          </span>

          <UInput
            v-model="draftTitle"
            :placeholder="SHEET_NOTE_LABELS.titlePlaceholder"
          />
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-bold text-muted uppercase">
            {{ SHEET_NOTE_LABELS.contentField }}
          </span>

          <MarkupEditor
            v-model="draftContent"
            :placeholder="SHEET_NOTE_LABELS.contentPlaceholder"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Отмена"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="applyLabel"
          color="primary"
          :disabled="isApplyDisabled"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
