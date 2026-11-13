<script setup lang="ts">
  import type { ScreenSearchEntry } from '../model';

  import { useDmScreen } from '../composables';
  import {
    DM_SCREEN_ICONS,
    DM_SCREEN_SEARCH_API_PATH,
    DM_SCREEN_SEARCH_DELAY,
    DM_SCREEN_SEARCH_KEY,
    DM_SCREEN_SEARCH_MARK_CLASS,
    DM_SCREEN_SEARCH_MIN_LENGTH,
    DM_SCREEN_TEXT,
    screenSearchResponseSchema,
    toScreenSearchEntries,
  } from '../model';

  /**
   * Поиск по всему сайту прямо на ширме: найденная запись встаёт окном, не
   * уводя со страницы. Показываются только записи разделов, которые ширма
   * умеет открывать.
   */
  const { add, windows } = useDmScreen();

  const root = useTemplateRef<HTMLElement>('root');

  const input = ref('');

  const term = refDebounced(
    computed(() => input.value.trim()),
    DM_SCREEN_SEARCH_DELAY,
  );

  const isSearchable = computed(
    () => term.value.length >= DM_SCREEN_SEARCH_MIN_LENGTH,
  );

  const { data: entries, status } = useAsyncData<Array<ScreenSearchEntry>>(
    DM_SCREEN_SEARCH_KEY,
    async () => {
      if (!isSearchable.value) {
        return [];
      }

      return toScreenSearchEntries(
        screenSearchResponseSchema.parse(
          await $fetch(DM_SCREEN_SEARCH_API_PATH, {
            params: { query: term.value },
          }),
        ),
      );
    },
    { server: false, watch: [term], default: () => [], dedupe: 'cancel' },
  );

  const isPending = computed(() => status.value === 'pending');

  // Список закрывают клик мимо и Escape; новый запрос открывает его снова
  const isDismissed = ref(false);

  watch(input, () => {
    isDismissed.value = false;
  });

  const isOpen = computed(() => isSearchable.value && !isDismissed.value);

  const isEmpty = computed(
    () => status.value === 'success' && !entries.value.length,
  );

  const addedPaths = computed(
    () => new Set(windows.value.map((screenWindow) => screenWindow.path)),
  );

  const entryViews = computed(() =>
    entries.value.map((entry) => ({
      entry,
      markClass: addedPaths.value.has(entry.path)
        ? DM_SCREEN_SEARCH_MARK_CLASS.added
        : DM_SCREEN_SEARCH_MARK_CLASS.idle,
    })),
  );

  /** Прячет список найденного, не стирая запрос. */
  function dismiss(): void {
    isDismissed.value = true;
  }

  /** Возвращает список найденного: поле поиска снова в фокусе. */
  function reopen(): void {
    isDismissed.value = false;
  }

  onClickOutside(root, dismiss);

  /**
   * Кладёт найденную запись окном на ширму.
   * @param entry - найденная запись
   */
  function addEntry(entry: ScreenSearchEntry): void {
    add({ path: entry.path, title: entry.name });

    input.value = '';
  }
</script>

<template>
  <!-- На телефоне поиск занимает строку целиком, на широком экране стоит
  слева от кнопок шапки -->
  <div
    ref="root"
    class="relative w-full md:w-80"
    @keydown.esc="dismiss"
  >
    <UInput
      v-model="input"
      :icon="DM_SCREEN_ICONS.search"
      :placeholder="DM_SCREEN_TEXT.searchPlaceholder"
      :loading="isPending"
      class="w-full"
      @focus="reopen"
    />

    <div
      v-if="isOpen"
      class="absolute inset-x-0 top-full z-10 mt-1 flex max-h-[60dvh] flex-col overflow-y-auto rounded-md border border-default bg-default p-1 shadow-lg"
    >
      <p
        v-if="isEmpty"
        class="px-3 py-2 text-sm text-muted"
      >
        {{ DM_SCREEN_TEXT.searchEmpty }}
      </p>

      <button
        v-for="view in entryViews"
        :key="view.entry.path"
        type="button"
        class="flex items-center gap-3 rounded px-3 py-2 text-left transition-colors hover:bg-elevated"
        @click.left.exact.prevent="addEntry(view.entry)"
      >
        <UIcon
          :name="view.entry.icon"
          class="size-5 shrink-0 text-primary"
        />

        <span class="min-w-0 flex-auto">
          <span class="block truncate text-highlighted">
            {{ view.entry.name }}

            <span
              v-if="view.entry.englishName"
              class="text-muted"
            >
              [{{ view.entry.englishName }}]
            </span>
          </span>

          <span class="block truncate text-sm text-muted">
            {{ view.entry.sectionLabel }}
          </span>
        </span>

        <UIcon
          :name="DM_SCREEN_ICONS.add"
          class="size-5 shrink-0"
          :class="view.markClass"
        />
      </button>
    </div>
  </div>
</template>
