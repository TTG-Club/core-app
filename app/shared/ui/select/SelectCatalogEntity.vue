<script setup lang="ts">
  import type {
    CatalogPickerEntry,
    CatalogPickerSection,
  } from '~infrastructure/filter';

  import { z } from '~/utils/zod';

  import CatalogPickerModal from './CatalogPickerModal.vue';
  import { CATALOG_PICKER_LABELS } from './constants';

  /**
   * Поле выбора записи каталога: чипы выбранного и кнопка, открывающая окно с
   * фильтрами раздела ({@link CatalogPickerModal}).
   *
   * Выпадающего списка у полей каталога больше нет: у предметов и заклинаний их
   * сотни, и в списке искали одним лишь названием. Наружу поле выглядит так же,
   * как прежний селект, — `v-model` со слагами и снимок названий событием, —
   * поэтому формы, которые его показывают, не менялись.
   */
  const {
    section,
    title,
    multiple = false,
    disabled = false,
    excludeUrls = [],
    placeholder = '',
  } = defineProps<{
    /** Раздел каталога: ручки поиска и фильтров. */
    section: CatalogPickerSection;

    /** Заголовок окна выбора. */
    title: string;

    /** Выбирают несколько записей. */
    multiple?: boolean;

    disabled?: boolean;

    /** Слаги, занятые другими полями формы. */
    excludeUrls?: Array<string>;

    /** Подпись пустого поля; пусто — общая. */
    placeholder?: string;
  }>();

  /** Слаги выбранных записей — то же значение, что было у прежнего селекта. */
  const model = defineModel<string | Array<string> | undefined>();

  const emit = defineEmits<{
    /**
     * Выбранные записи ссылками со снимком названия: форма пишет их в JSONB
     * (`EntityRef`), где имя — снимок на момент сохранения, и взять его больше
     * неоткуда.
     */
    select: [refs: Array<{ url: string; name: string }>];
  }>();

  const overlay = useOverlay();

  /**
   * Названия выбранных записей по слагу. Пополняется выбором в окне и остаётся
   * между открытиями: у формы, загруженной с сервера, в значении одни слаги, и
   * без снимка чип показывал бы «shield-phb».
   */
  const names = ref<Record<string, string>>({});

  /** Схема записи раздела: из неё берётся название уже выбранного. */
  const detailSchema = z.object({
    url: z.string(),
    name: z.object({ rus: z.string().catch('') }).catch({ rus: '' }),
  });

  /**
   * Слаги, по которым запрос названия уже уходил, — и удачный, и нет. Иначе
   * запись, детали которой не отдались, запрашивалась бы на каждую правку.
   */
  const requestedUrls = new Set<string>();

  const selectedUrls = computed<Array<string>>(() => {
    if (Array.isArray(model.value)) {
      return model.value.filter(Boolean);
    }

    return model.value ? [model.value] : [];
  });

  const chips = computed<Array<CatalogPickerEntry>>(() =>
    selectedUrls.value.map((url) => ({
      url,
      name: names.value[url] ?? url,
      nameEng: '',
      source: '',
    })),
  );

  const buttonLabel = computed(() => {
    if (selectedUrls.value.length) {
      return CATALOG_PICKER_LABELS.change;
    }

    return placeholder || CATALOG_PICKER_LABELS.open;
  });

  /**
   * Записывает выбор окна: значение поля и снимок названий для чипов.
   *
   * @param entries выбранные записи каталога.
   */
  function apply(entries: Array<CatalogPickerEntry>): void {
    names.value = {
      ...names.value,
      ...Object.fromEntries(entries.map((entry) => [entry.url, entry.name])),
    };

    model.value = multiple
      ? entries.map((entry) => entry.url)
      : (entries[0]?.url ?? '');

    emit(
      'select',
      entries.map((entry) => ({ url: entry.url, name: entry.name })),
    );
  }

  /** Открывает окно выбора. */
  async function open(): Promise<void> {
    if (disabled) {
      return;
    }

    const modal = overlay.create(CatalogPickerModal, {
      props: {
        section,
        title,
        multiple,
        excludeUrls,
        modelValue: chips.value,
      },
    });

    const entries = await modal.open().result;

    if (entries) {
      apply(entries);
    }
  }

  /**
   * Догружает названия выбранных записей, которых поле ещё не знает.
   *
   * Названия нужны только чипам: значение формы — это слаги, и без них поле
   * показывало бы слаг вместо названия у всего, что пришло с сервера.
   */
  async function loadMissingNames(): Promise<void> {
    const detailPath = section.detailPath;

    if (!detailPath) {
      return;
    }

    const missing = selectedUrls.value.filter(
      (url) => !names.value[url] && !requestedUrls.has(url),
    );

    if (!missing.length) {
      return;
    }

    for (const url of missing) {
      requestedUrls.add(url);
    }

    const loaded = await Promise.all(
      missing.map(async (url) => {
        try {
          const response = await $fetch<unknown>(`${detailPath}/${url}`, {
            method: 'get',
            retry: 0,
          });

          const parsed = detailSchema.safeParse(response);

          return parsed.success ? { url, name: parsed.data.name.rus } : null;
        } catch {
          return null;
        }
      }),
    );

    const resolved = loaded.filter(
      (entry): entry is { url: string; name: string } => entry !== null,
    );

    if (!resolved.length) {
      return;
    }

    names.value = {
      ...names.value,
      ...Object.fromEntries(resolved.map((entry) => [entry.url, entry.name])),
    };
  }

  // Догрузка нужна и на первом показе, и когда в поле пришло чужое значение:
  // цикла нет — обработчик пишет только в подписи, а `requestedUrls` не даёт
  // запросить одно и то же дважды.
  watch(selectedUrls, () => void loadMissingNames(), { immediate: true });

  /** Убирает запись из выбранного. */
  function remove(url: string): void {
    const rest = chips.value.filter((entry) => entry.url !== url);

    apply(rest);
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <UButton
        icon="tabler:list-search"
        color="neutral"
        variant="subtle"
        class="min-w-0 grow justify-start"
        :disabled="disabled"
        :label="buttonLabel"
        @click.left.exact.prevent="open"
      />

      <UButton
        v-if="selectedUrls.length"
        icon="tabler:x"
        color="neutral"
        variant="ghost"
        :disabled="disabled"
        :aria-label="CATALOG_PICKER_LABELS.clear"
        @click.left.exact.prevent="apply([])"
      />
    </div>

    <div
      v-if="chips.length"
      class="flex flex-wrap gap-1"
    >
      <UBadge
        v-for="entry in chips"
        :key="entry.url"
        color="neutral"
        variant="subtle"
        class="gap-1"
      >
        {{ entry.name }}

        <UButton
          icon="tabler:x"
          color="neutral"
          variant="ghost"
          size="xs"
          :disabled="disabled"
          :aria-label="`${CATALOG_PICKER_LABELS.remove}: ${entry.name}`"
          @click.left.exact.prevent="remove(entry.url)"
        />
      </UBadge>
    </div>
  </div>
</template>
