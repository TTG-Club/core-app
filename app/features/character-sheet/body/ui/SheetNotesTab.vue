<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';

  import { useCharacterSheet } from '../../composables';
  import {
    parseStoredMarkupNodes,
    SHEET_NOTE_LABELS,
    SHEET_REVEAL_CONTROL_CLASS,
    SHEET_TAB_EMPTY_LABELS,
  } from '../../model';

  const emit = defineEmits<{
    'add-note': [];
    'edit-note': [noteId: string];
    'remove-note': [noteId: string];
  }>();

  // Добавление, правка и удаление меняют лист: без прав кнопки прячутся, а
  // карточки заметок остаются на прежних местах.
  const { character, editControlClass } = useCharacterSheet();

  // Заметки читаются, а не листаются, поэтому карточки развёрнуты по умолчанию;
  // свёрнутые запоминаются, пока вкладка открыта.
  const collapsedIds = ref(new Set<string>());

  function toggleNote(noteId: string) {
    if (collapsedIds.value.has(noteId)) {
      collapsedIds.value.delete(noteId);

      return;
    }

    collapsedIds.value.add(noteId);
  }

  function handleAdd() {
    emit('add-note');
  }

  function handleEdit(noteId: string) {
    emit('edit-note', noteId);
  }

  function handleRemove(noteId: string) {
    emit('remove-note', noteId);
  }

  const displayRows = computed(() =>
    character.value.notes.map((note) => {
      const isExpanded = !collapsedIds.value.has(note.id);

      const nodes = parseStoredMarkupNodes(note.content);

      return {
        id: note.id,
        title: note.title || SHEET_NOTE_LABELS.untitled,
        nodes,

        // Пустая заметка (один заголовок) тела не рисует — рамка была бы пустой.
        isContentVisible: isExpanded && nodes.length > 0,
        isExpanded,
        chevronClass: isExpanded ? 'rotate-180' : '',
      };
    }),
  );
</script>

<template>
  <div class="flex flex-col gap-3 pt-2">
    <div class="flex justify-end">
      <UButton
        icon="tabler:plus"
        :label="SHEET_NOTE_LABELS.add"
        color="neutral"
        variant="ghost"
        size="sm"
        :class="editControlClass"
        @click.left.exact.prevent="handleAdd"
      />
    </div>

    <template v-if="displayRows.length">
      <div
        v-for="note in displayRows"
        :key="note.id"
        class="flex flex-col rounded-lg border border-default/50 bg-elevated/20"
      >
        <div
          class="group/note relative flex w-full items-center gap-2 px-3 py-2"
        >
          <button
            type="button"
            class="flex min-w-0 grow cursor-pointer items-center text-left after:absolute after:inset-0 after:cursor-pointer"
            :aria-expanded="note.isExpanded"
            :aria-label="`${SHEET_NOTE_LABELS.openAria}: ${note.title}`"
            @click.left.exact.prevent="toggleNote(note.id)"
          >
            <span class="grow truncate text-sm font-medium text-highlighted">
              {{ note.title }}
            </span>
          </button>

          <UButton
            icon="tabler:pencil"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            class="relative z-10 shrink-0 opacity-0 transition-opacity group-hover/note:opacity-100 focus-visible:opacity-100"
            :class="[SHEET_REVEAL_CONTROL_CLASS, editControlClass]"
            :aria-label="`${SHEET_NOTE_LABELS.editAria}: ${note.title}`"
            @click.left.exact.prevent="handleEdit(note.id)"
          />

          <UButton
            icon="tabler:trash"
            color="error"
            variant="ghost"
            size="xs"
            square
            class="relative z-10 shrink-0 opacity-0 transition-opacity group-hover/note:opacity-100 focus-visible:opacity-100"
            :class="[SHEET_REVEAL_CONTROL_CLASS, editControlClass]"
            :aria-label="`${SHEET_NOTE_LABELS.removeAria}: ${note.title}`"
            @click.left.exact.prevent="handleRemove(note.id)"
          />

          <UIcon
            name="tabler:chevron-down"
            class="size-4 shrink-0 text-muted transition-transform"
            :class="note.chevronClass"
          />
        </div>

        <div
          v-if="note.isContentVisible"
          class="border-t border-default/50 px-3 py-2"
        >
          <MarkupRender
            :render-node="note.nodes"
            class="text-sm"
          />
        </div>
      </div>
    </template>

    <div
      v-else
      class="flex h-64 items-center justify-center rounded-lg border border-dashed border-default text-sm text-dimmed"
    >
      {{ SHEET_TAB_EMPTY_LABELS.notes }}
    </div>
  </div>
</template>
