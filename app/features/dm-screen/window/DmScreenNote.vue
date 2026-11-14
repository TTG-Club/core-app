<script setup lang="ts">
  import type { ScreenWindow } from '../model';

  import { MarkupRender } from '~ui/markup';

  import { useDmScreen } from '../composables';
  import {
    DM_SCREEN_ICONS,
    DM_SCREEN_NOTE_MAX_LENGTH,
    DM_SCREEN_NOTE_SAVE_DELAY,
    DM_SCREEN_TEXT,
    DM_SCREEN_TITLE_MAX_LENGTH,
    toScreenNoteBlocks,
  } from '../model';

  // Редактор разметки тяжёлый, а нужен только при правке заметки
  const MarkupEditor = defineAsyncComponent(() =>
    import('~ui/markup-editor').then((module) => module.MarkupEditor),
  );

  /**
   * Заметка мастера в окне ширмы: текст с разметкой сайта, который мастер
   * пишет сам. В просмотре ссылки на записи открываются окнами, как в любом
   * окне ширмы; в правке — название и редактор разметки. Новая пустая
   * заметка сразу открывается в правке. Текст сохраняется сам. Правку
   * переключает шапка окна (`v-model:editing`); в списке на телефоне шапки
   * нет, там кнопка внутри заметки (`showToggle`).
   */
  const { screenWindow, showToggle = false } = defineProps<{
    screenWindow: ScreenWindow;
    /** Показать кнопку правки внутри заметки: шапки окна рядом нет. */
    showToggle?: boolean;
  }>();

  const isEditing = defineModel<boolean>('editing', { default: false });

  const { update } = useDmScreen();

  const title = ref(screenWindow.title);
  const content = ref(screenWindow.content ?? '');

  // Пустую заметку читать незачем: она сразу открывается в правке
  if (!screenWindow.content?.trim()) {
    isEditing.value = true;
  }

  const isTooLong = computed(
    () => content.value.length > DM_SCREEN_NOTE_MAX_LENGTH,
  );

  const blocks = computed(() => toScreenNoteBlocks(content.value));

  const isEmpty = computed(() => !blocks.value.length);

  const toggleIcon = computed(() =>
    isEditing.value ? DM_SCREEN_ICONS.done : DM_SCREEN_ICONS.edit,
  );

  const toggleLabel = computed(() =>
    isEditing.value ? DM_SCREEN_TEXT.noteDone : DM_SCREEN_TEXT.noteEdit,
  );

  const isHeadShown = computed(() => isEditing.value || showToggle);

  // Слишком длинный текст из правки не выпускает
  const isToggleDisabled = computed(() => isEditing.value && isTooLong.value);

  /** Пишет название и текст в окно; слишком длинный текст не пишется. */
  function save(): void {
    if (isTooLong.value) {
      return;
    }

    const nextTitle = title.value.trim() || DM_SCREEN_TEXT.noteTitle;

    // Запись ширмы уходит на сервер: без изменений её не трогаем
    if (
      nextTitle === screenWindow.title
      && content.value === (screenWindow.content ?? '')
    ) {
      return;
    }

    update(screenWindow.id, { title: nextTitle, content: content.value });
  }

  const saveLater = useDebounceFn(save, DM_SCREEN_NOTE_SAVE_DELAY);

  watch([title, content], () => {
    void saveLater();
  });

  // Окно закрывают или сворачивают посреди набора: не потерять текст
  onBeforeUnmount(save);

  // Выход из правки сохраняет сразу, а слишком длинный текст из правки не
  // выпускает. Цикла нет: возврат в правку на втором проходе ничего не делает
  watch(isEditing, (editing) => {
    if (editing) {
      return;
    }

    if (isTooLong.value) {
      isEditing.value = true;

      return;
    }

    save();
  });

  /** Переключает просмотр и правку. */
  function toggle(): void {
    isEditing.value = !isEditing.value;
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      v-if="isHeadShown"
      class="flex items-center gap-2"
    >
      <UInput
        v-if="isEditing"
        v-model="title"
        :placeholder="DM_SCREEN_TEXT.noteTitlePlaceholder"
        :maxlength="DM_SCREEN_TITLE_MAX_LENGTH"
        class="min-w-0 flex-auto"
      />

      <UButton
        v-if="showToggle"
        :icon="toggleIcon"
        :label="toggleLabel"
        :disabled="isToggleDisabled"
        color="neutral"
        variant="soft"
        size="sm"
        class="ml-auto"
        @click.left.exact.prevent="toggle"
      />
    </div>

    <p
      v-if="isTooLong"
      class="text-sm text-error"
    >
      {{ DM_SCREEN_TEXT.noteTooLong }}
    </p>

    <MarkupEditor
      v-if="isEditing"
      v-model="content"
      :placeholder="DM_SCREEN_TEXT.notePlaceholder"
    />

    <p
      v-else-if="isEmpty"
      class="text-sm text-muted"
    >
      {{ DM_SCREEN_TEXT.noteEmpty }}
    </p>

    <MarkupRender
      v-else
      :render-node="blocks"
    />
  </div>
</template>
