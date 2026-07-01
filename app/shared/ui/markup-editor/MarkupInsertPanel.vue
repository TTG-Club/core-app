<script setup lang="ts">
  import type { Editor } from '@tiptap/vue-3';

  import type { MarkupTag } from './tags';

  /** Режим панели: поиск сущности раздела или ввод нотации кубика. */
  type PanelMode =
    | { kind: 'section'; tag: MarkupTag }
    | { kind: 'dice'; tag: MarkupTag };

  /** Минимальная форма результата поиска раздела (нужны имя и slug). */
  interface SectionSearchResult {
    url: string;
    name: { rus: string; eng?: string };
    source?: { name?: { label?: string } };
  }

  const { editor, mode } = defineProps<{
    editor: Editor;
    mode: PanelMode;
  }>();

  const emit = defineEmits<{ close: [] }>();

  /** Раздел (ключ тега) → сегмент эндпоинта /api/v2/<segment>/search. */
  const SEARCH_ENDPOINTS: Record<string, string> = {
    spell: 'spells',
    creature: 'bestiary',
    class: 'classes',
    feat: 'feats',
    background: 'backgrounds',
    magicItem: 'magic-items',
    item: 'item',
    glossary: 'glossary',
  };

  // Диапазон и текст выделения на момент открытия — вставка пойдёт сюда, даже
  // если фокус ушёл в поле панели.
  const range = {
    from: editor.state.selection.from,
    to: editor.state.selection.to,
  };

  const selectedText = editor.state.doc
    .textBetween(range.from, range.to, ' ')
    .trim();

  const query = ref(selectedText);
  const results = ref<SectionSearchResult[]>([]);
  const loading = ref(false);
  const activeIndex = ref(0);
  const inputRef = useTemplateRef<HTMLInputElement>('input');

  const endpoint = computed(() => SEARCH_ENDPOINTS[mode.tag.key] ?? '');

  onMounted(() => {
    nextTick(() => inputRef.value?.focus());
  });

  watchDebounced(
    query,
    async (value) => {
      if (mode.kind !== 'section') {
        return;
      }

      const search = value.trim();

      if (search.length < 2 || !endpoint.value) {
        results.value = [];

        return;
      }

      loading.value = true;

      try {
        const response = await $fetch<
          SectionSearchResult[] | { content: SectionSearchResult[] }
        >(`/api/v2/${endpoint.value}/search`, {
          method: 'get',
          query: { search },
        });

        results.value = Array.isArray(response) ? response : response.content;
        activeIndex.value = 0;
      } catch {
        results.value = [];
      } finally {
        loading.value = false;
      }
    },
    { debounce: 300, immediate: true },
  );

  /** Вставляет маркер {@...} как атомарный узел-чип в позицию выделения. */
  function insertRaw(raw: string) {
    editor
      .chain()
      .focus()
      .insertContentAt(range, { type: 'ttgMarker', attrs: { raw } })
      .run();

    emit('close');
  }

  function pickResult(result: SectionSearchResult) {
    const label = selectedText || result.name.rus;

    insertRaw(`{@${mode.tag.key} ${label} | url:${result.url}}`);
  }

  function confirmDice() {
    const notation = query.value.trim();

    if (!notation) {
      return;
    }

    insertRaw(`{@dice ${notation}}`);
  }

  function onEnter() {
    if (mode.kind === 'dice') {
      confirmDice();

      return;
    }

    const result = results.value[activeIndex.value];

    if (result) {
      pickResult(result);
    }
  }

  function moveActive(delta: number) {
    if (!results.value.length) {
      return;
    }

    activeIndex.value = Math.max(
      0,
      Math.min(results.value.length - 1, activeIndex.value + delta),
    );
  }

  function resultMeta(result: SectionSearchResult): string {
    return [result.name.eng, result.source?.name?.label]
      .filter(Boolean)
      .join(' · ');
  }
</script>

<template>
  <div class="border-b border-default bg-default shadow-lg">
    <div class="flex items-center gap-2 p-2">
      <UIcon
        :name="mode.kind === 'dice' ? 'tabler:dice' : 'tabler:search'"
        class="size-4 shrink-0 text-dimmed"
      />

      <input
        ref="input"
        v-model="query"
        :placeholder="
          mode.kind === 'dice'
            ? 'Нотация броска, напр. 2d6'
            : `Поиск: ${mode.tag.label}`
        "
        :aria-label="mode.kind === 'dice' ? 'Нотация броска' : 'Поиск сущности'"
        class="w-full bg-transparent text-sm text-default outline-none"
        @keydown.enter.prevent="onEnter"
        @keydown.esc.prevent="emit('close')"
        @keydown.down.prevent="moveActive(1)"
        @keydown.up.prevent="moveActive(-1)"
      />

      <UButton
        icon="tabler:x"
        aria-label="Закрыть"
        color="neutral"
        variant="ghost"
        size="xs"
        @click.left.exact.prevent="emit('close')"
      />
    </div>

    <div
      v-if="mode.kind === 'section'"
      class="max-h-56 overflow-y-auto border-t border-default"
    >
      <p
        v-if="loading"
        class="px-3 py-2 text-sm text-muted"
      >
        Поиск…
      </p>

      <p
        v-else-if="query.trim().length < 2"
        class="px-3 py-2 text-sm text-muted"
      >
        Введите минимум 2 символа
      </p>

      <p
        v-else-if="!results.length"
        class="px-3 py-2 text-sm text-muted"
      >
        Ничего не найдено
      </p>

      <ul
        v-else
        class="py-1"
      >
        <li
          v-for="(result, index) in results"
          :key="result.url"
        >
          <button
            type="button"
            class="flex w-full flex-col items-start gap-0.5 px-3 py-1.5 text-left"
            :class="index === activeIndex ? 'bg-elevated' : ''"
            @click.left.exact.prevent="pickResult(result)"
            @mouseenter="activeIndex = index"
          >
            <span class="text-sm text-default">{{ result.name.rus }}</span>

            <span
              v-if="resultMeta(result)"
              class="text-xs text-muted"
            >
              {{ resultMeta(result) }}
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
