<script setup lang="ts">
  import { useCharacterSheetList } from '../composables';
  import {
    SHEET_IMPORT_ACCEPT,
    SHEET_IMPORT_HINT,
    SHEET_IMPORT_LABEL,
  } from '../model';

  const { isLoading, isMutating, importFromFile } = useCharacterSheetList();

  // Пока список едет с сервера, лимит листов неизвестен (0): клик в этот момент
  // упёрся бы в него и соврал про исчерпанный лимит. Мутации ждём по той же
  // причине — счётчик активных листов ещё не пересчитан.
  const isBusy = computed(() => isLoading.value || isMutating.value);

  /**
   * Импорт выбранного файла. Отказы (лимит листов, посторонний файл) объясняет
   * тостом сам композабл.
   *
   * @param files выбор из диалога.
   */
  function handleFiles(files: FileList | null): void {
    const file = files ? Array.from(files)[0] : undefined;

    if (!file) {
      return;
    }

    void importFromFile(file);
  }

  // `reset` — чтобы повторный выбор того же файла снова запускал импорт: без
  // сброса значение input не меняется и событие не приходит.
  const { open: openFileDialog, onChange } = useFileDialog({
    accept: SHEET_IMPORT_ACCEPT,
    multiple: false,
    reset: true,
  });

  onChange(handleFiles);

  /** Открывает выбор JSON-файла с листом персонажа. */
  function handleImportClick(): void {
    openFileDialog();
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <UButton
      icon="tabler:file-import"
      :label="SHEET_IMPORT_LABEL"
      :loading="isBusy"
      block
      @click.left.exact.prevent="handleImportClick"
    />

    <p class="text-xs text-muted">{{ SHEET_IMPORT_HINT }}</p>
  </div>
</template>
