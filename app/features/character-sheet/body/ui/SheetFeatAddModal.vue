<script setup lang="ts">
  import type { FeatCatalogItem, FeatSummary } from '../../model';

  import { FeatDrawer } from '~feats/drawer';

  import { useCharacterSheet } from '../../composables';
  import {
    buildFeatFeature,
    FEATS_DETAIL_BASE_PATH,
    FEATS_SEARCH_PATH,
    getCharacterFeatureId,
    parseFeatCatalog,
    parseFeatDetail,
  } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const toast = useToast();

  const overlay = useOverlay();

  const { character, addFeats } = useCharacterSheet();

  // Дровер описания черты с сайта; без destroyOnClose — повторный open()
  // после закрытия иначе падает («Overlay not found»).
  const featPreviewDrawer = overlay.create(FeatDrawer, {
    props: {
      url: '',
      onClose: () => featPreviewDrawer.close(),
    },
  });

  function handlePreview(url: string) {
    featPreviewDrawer.open({ url });
  }

  // Весь список черт грузится сразу при открытии (раздел «Черты» отдаёт его
  // одним запросом без пагинации), фильтрация по названию — на клиенте.
  const { data: featsList, status: listStatus } = await useAsyncData(
    'character-sheet:feats-list',
    async () => {
      const response = await $fetch<unknown>(FEATS_SEARCH_PATH, {
        method: 'GET',
        retry: 0,
      });

      return parseFeatCatalog(response);
    },
    { server: false },
  );

  const isListLoading = computed(() => listStatus.value === 'pending');

  const isListError = computed(() => listStatus.value === 'error');

  const searchTerm = ref('');

  /** Черновик выбора: url новых, ещё не добавленных черт. */
  const draftUrls = ref(new Set<string>());

  const isApplying = ref(false);

  /** Идентификаторы уже добавленных на лист особенностей. */
  const existingFeatureIds = computed(
    () => new Set(character.value.features.map((feature) => feature.id)),
  );

  const filteredFeats = computed<FeatCatalogItem[]>(() => {
    const query = searchTerm.value.trim().toLowerCase();

    const list = featsList.value ?? [];

    if (!query) {
      return list;
    }

    return list.filter(
      (feat) =>
        feat.name.toLowerCase().includes(query)
        || feat.nameEng.toLowerCase().includes(query),
    );
  });

  interface FeatCatalogRow extends FeatCatalogItem {
    isAdded: boolean;
    isSelected: boolean;
    rowClass: string;

    /** Класс курсора кнопки выбора: у добавленной черты выбор недоступен. */
    cursorClass: string;
  }

  interface FeatCatalogGroup {
    category: string;
    feats: FeatCatalogRow[];
  }

  // Группировка по категории (как в разделе «Черты»): категории и черты внутри
  // сортируются по алфавиту, уже добавленные черты помечаются отдельно.
  const displayGroups = computed<FeatCatalogGroup[]>(() => {
    const groupsByCategory = new Map<string, FeatCatalogRow[]>();

    for (const feat of filteredFeats.value) {
      const isAdded = existingFeatureIds.value.has(
        getCharacterFeatureId('feat', feat.url),
      );

      const isSelected = draftUrls.value.has(feat.url);

      const row: FeatCatalogRow = {
        ...feat,
        isAdded,
        isSelected,
        rowClass: isSelected ? 'bg-elevated' : '',
        cursorClass: isAdded
          ? 'cursor-default'
          : 'cursor-pointer after:cursor-pointer',
      };

      const existingGroup = groupsByCategory.get(feat.category);

      if (existingGroup) {
        existingGroup.push(row);
      } else {
        groupsByCategory.set(feat.category, [row]);
      }
    }

    return [...groupsByCategory.entries()]
      .map(([category, feats]) => ({
        category,
        feats: feats.sort((left, right) =>
          left.name.localeCompare(right.name, 'ru'),
        ),
      }))
      .sort((left, right) => left.category.localeCompare(right.category, 'ru'));
  });

  const selectedCountLabel = computed(() => `Выбрано: ${draftUrls.value.size}`);

  const isApplyDisabled = computed(
    () => !draftUrls.value.size || isApplying.value,
  );

  function toggleFeat(feat: FeatCatalogRow) {
    if (feat.isAdded) {
      return;
    }

    const nextUrls = new Set(draftUrls.value);

    if (nextUrls.has(feat.url)) {
      nextUrls.delete(feat.url);
    } else {
      nextUrls.add(feat.url);
    }

    draftUrls.value = nextUrls;
  }

  /** Загружает деталь черты по url; null — ответ не распознан. */
  async function fetchFeatDetail(url: string): Promise<FeatSummary | null> {
    const response = await $fetch<unknown>(`${FEATS_DETAIL_BASE_PATH}/${url}`, {
      method: 'GET',
      retry: 0,
    });

    return parseFeatDetail(response);
  }

  async function handleApply() {
    const urls = [...draftUrls.value];

    if (!urls.length || isApplying.value) {
      return;
    }

    isApplying.value = true;

    try {
      const results = await Promise.allSettled(urls.map(fetchFeatDetail));

      const features = results
        .map((result) => (result.status === 'fulfilled' ? result.value : null))
        .filter((summary): summary is FeatSummary => summary !== null)
        .map(buildFeatFeature);

      if (features.length) {
        addFeats(features);
      }

      // Часть черт не загрузилась — сообщаем, но добавляем успешные.
      if (features.length < urls.length) {
        toast.add({
          color: 'error',
          icon: 'tabler:alert-triangle',
          title: 'Не удалось добавить часть черт',
        });
      }

      emit('close');
    } finally {
      isApplying.value = false;
    }
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    title="Добавление черт"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex h-[65dvh] min-h-96 flex-col gap-4">
        <UInput
          v-model="searchTerm"
          icon="tabler:search"
          placeholder="Поиск по названию…"
          class="shrink-0"
        />

        <div
          v-if="isListLoading"
          class="flex grow items-center justify-center py-10"
        >
          <UIcon
            name="tabler:loader-2"
            class="size-6 animate-spin text-muted"
          />
        </div>

        <div
          v-else-if="isListError"
          class="flex grow items-center justify-center py-10 text-sm text-dimmed"
        >
          Не удалось загрузить черты
        </div>

        <div
          v-else
          class="flex min-h-0 grow flex-col gap-3 overflow-y-auto pr-1"
        >
          <div
            v-for="group in displayGroups"
            :key="group.category"
            class="flex flex-col gap-1"
          >
            <div class="flex items-center gap-2">
              <span
                class="shrink-0 text-[10px] font-bold tracking-wider text-muted uppercase"
              >
                {{ group.category }}
              </span>

              <div class="h-px grow bg-default/50" />
            </div>

            <div
              v-for="feat in group.feats"
              :key="feat.url"
              class="relative flex items-center gap-2 rounded-md pr-2 transition-colors hover:bg-elevated/60"
              :class="feat.rowClass"
            >
              <button
                type="button"
                class="flex min-w-0 grow items-center gap-2 px-3 py-1.5 text-left after:absolute after:inset-0"
                :class="feat.cursorClass"
                :disabled="feat.isAdded"
                :aria-label="`Выбрать черту: ${feat.name}`"
                @click.left.exact.prevent="toggleFeat(feat)"
              >
                <span class="truncate text-sm font-medium text-highlighted">
                  {{ feat.name }}
                </span>

                <UBadge
                  v-if="feat.sourceLabel"
                  size="sm"
                  color="neutral"
                  variant="subtle"
                  class="relative z-10 shrink-0"
                >
                  {{ feat.sourceLabel }}
                </UBadge>
              </button>

              <UTooltip text="Открыть описание черты">
                <UButton
                  icon="tabler:layout-sidebar-right-expand"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  square
                  class="relative z-10 shrink-0"
                  :aria-label="`Описание черты: ${feat.name}`"
                  @click.left.exact.prevent="handlePreview(feat.url)"
                />
              </UTooltip>

              <UTooltip
                v-if="feat.isAdded"
                text="Уже добавлена"
              >
                <UIcon
                  name="tabler:check"
                  class="relative z-10 size-4 shrink-0 text-success"
                />
              </UTooltip>

              <UIcon
                v-else-if="feat.isSelected"
                name="tabler:check"
                class="relative z-10 size-4 shrink-0 text-warning"
              />
            </div>
          </div>

          <span
            v-if="!displayGroups.length"
            class="px-3 py-6 text-center text-sm text-dimmed"
          >
            Ничего не найдено
          </span>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <span class="text-sm text-muted">{{ selectedCountLabel }}</span>

        <div class="flex gap-2">
          <UButton
            label="Отмена"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="handleCancel"
          />

          <UButton
            label="Добавить"
            color="primary"
            :loading="isApplying"
            :disabled="isApplyDisabled"
            @click.left.exact.prevent="handleApply"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
