<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { MarkupTag } from './tags';

  import { toMarkupSource } from '~ui/markup';

  import MarkupInsertPanel from './MarkupInsertPanel.vue';
  import {
    BLOCK_TAGS,
    FORMAT_TAGS,
    INLINE_TAGS,
    INTERACTIVE_TAGS,
    SECTION_TAGS,
  } from './tags';
  import { ttgFormatMarks, TtgMarker } from './tiptap';
  import { buildToolbarItems } from './toolbar-items';

  /** Режим панели ввода под тулбаром (поиск раздела / нотация кубика). */
  type InsertPanelMode =
    | { kind: 'section'; tag: MarkupTag }
    | { kind: 'dice'; tag: MarkupTag };

  // Маркеры {@...} в редакторе: форматирующие ({@i}/{@b}/…) — редактируемые марки
  // (можно вкладывать друг в друга и Markdown), остальные — атомарные чипы.
  const editorExtensions = [TtgMarker, ...ttgFormatMarks];

  // Наружу модель — всегда строка-исходник «Markdown + {@...}». Значение с
  // бэкенда приводится к строке (AST/JSON-обёртка → исходник) в `get`.
  const model = defineModel<string>({
    default: '',
    get: (value) => toMarkupSource(value),
  });

  const { placeholder = 'Опиши материал' } = defineProps<{
    placeholder?: string;
  }>();

  // false — визуальный режим (UEditor), true — сырой код (textarea).
  const showCode = ref(false);
  const textareaRef = useTemplateRef<HTMLTextAreaElement>('textarea');

  // Панель ввода под тулбаром: null — закрыта. Открывается кнопками раздела/кубика.
  const insertPanel = ref<InsertPanelMode | null>(null);

  function openSectionPanel(tag: MarkupTag) {
    insertPanel.value = { kind: 'section', tag };
  }

  function openDicePanel(tag: MarkupTag) {
    insertPanel.value = { kind: 'dice', tag };
  }

  function closeInsertPanel() {
    insertPanel.value = null;
  }

  // Те же группы и порядок, что и в визуальном тулбаре (форматы → блок →
  // kbd+интерактив → раздел), чтобы набор кнопок совпадал в обоих режимах.
  const codeToolbarGroups: MarkupTag[][] = [
    FORMAT_TAGS,
    BLOCK_TAGS,
    [...INLINE_TAGS, ...INTERACTIVE_TAGS],
  ];

  const sectionItems = computed<DropdownMenuItem[]>(() =>
    SECTION_TAGS.map((tag) => ({
      label: tag.label,
      icon: tag.icon,
      onSelect: () => insertIntoCode(tag),
    })),
  );

  function toggleMode() {
    closeInsertPanel();
    showCode.value = !showCode.value;
  }

  /**
   * Вставляет разметку тега в позицию курсора текстового поля режима кода:
   * оборачивает выделение либо подставляет значение-заглушку.
   */
  function insertIntoCode(tag: MarkupTag) {
    const element = textareaRef.value;

    if (!element) {
      return;
    }

    const { selectionStart, selectionEnd } = element;
    const source = model.value;

    const selected =
      source.slice(selectionStart, selectionEnd) || tag.placeholder;

    const inserted = `${tag.before}${selected}${tag.after}`;

    model.value =
      source.slice(0, selectionStart) + inserted + source.slice(selectionEnd);

    const cursor = selectionStart + tag.before.length;

    nextTick(() => {
      element.focus();
      element.setSelectionRange(cursor, cursor + selected.length);
    });
  }
</script>

<template>
  <div class="grid min-w-0 grid-cols-1 gap-2">
    <div class="flex items-center justify-start gap-2">
      <UButton
        variant="ghost"
        size="xs"
        :icon="showCode ? 'tabler:eye' : 'tabler:code'"
        @click.left.exact.prevent="toggleMode"
      >
        {{ showCode ? 'Визуальный вид' : 'Показать код' }}
      </UButton>
    </div>

    <ClientOnly>
      <!-- Общий контейнер с изменяемым размером (тянуть за нижний угол). Он
           ОДИН на оба режима, поэтому заданная высота сохраняется при
           переключении «код ↔ визуальный вид». -->
      <div
        class="flex h-72 min-h-40 min-w-0 resize-y flex-col overflow-hidden rounded-md border border-default focus-within:border-primary"
      >
        <UEditor
          v-if="!showCode"
          v-model="model"
          content-type="markdown"
          :extensions="editorExtensions"
          :placeholder
          class="flex min-h-0 min-w-0 flex-1 flex-col"
          :ui="{
            content: 'min-h-0 min-w-0 flex-1 overflow-y-auto',
            base: 'px-3 py-3 sm:px-3',
          }"
        >
          <template #default="{ editor }">
            <div class="relative shrink-0">
              <UEditorToolbar
                :editor
                :items="
                  buildToolbarItems(editor, {
                    onSection: openSectionPanel,
                    onDice: openDicePanel,
                  })
                "
                class="flex-wrap border-b border-default"
                :ui="{ group: 'flex-wrap' }"
              />

              <MarkupInsertPanel
                v-if="insertPanel"
                :key="`${insertPanel.kind}:${insertPanel.tag.key}`"
                :editor
                :mode="insertPanel"
                class="absolute inset-x-0 top-full z-20"
                @close="closeInsertPanel"
              />
            </div>
          </template>
        </UEditor>

        <div
          v-else
          class="flex min-h-0 min-w-0 flex-1 flex-col"
        >
          <div
            class="flex shrink-0 flex-wrap items-center gap-1 border-b border-default p-1"
          >
            <div
              v-for="(group, groupIndex) in codeToolbarGroups"
              :key="groupIndex"
              class="flex items-center gap-0.5"
            >
              <UTooltip
                v-for="tag in group"
                :key="tag.key"
                :text="tag.label"
              >
                <UButton
                  :icon="tag.icon"
                  :aria-label="tag.label"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  @click.left.exact.prevent="insertIntoCode(tag)"
                />
              </UTooltip>
            </div>

            <UDropdownMenu :items="sectionItems">
              <UButton
                icon="tabler:external-link"
                aria-label="Ссылка на раздел"
                color="neutral"
                variant="ghost"
                size="xs"
              />
            </UDropdownMenu>
          </div>

          <textarea
            ref="textarea"
            v-model="model"
            :placeholder
            class="min-h-0 w-full flex-1 resize-none bg-default px-3 py-3 font-mono text-sm leading-6 text-default outline-none"
          />
        </div>
      </div>

      <template #fallback>
        <UTextarea
          v-model="model"
          :rows="8"
          :placeholder
        />
      </template>
    </ClientOnly>
  </div>
</template>
