<script setup lang="ts">
  import type {
    CharacterToolProficiency,
    ToolCatalogEntry,
    ToolCatalogGroup,
    ToolProficiencyGroupKey,
  } from '../../model';

  import { ItemDrawer } from '~items/drawer';

  import { useCharacterSheet, useToolCatalog } from '../../composables';
  import {
    CUSTOM_TOOL_NAME_MAX_LENGTH,
    findToolInCatalog,
    getToolProficiencyKey,
    SHEET_TOOL_LABELS,
    unionToolProficiencies,
  } from '../../model';

  interface ToolRow extends ToolCatalogEntry {
    /** Ключ владения: по нему хранится выбор черновика. */
    key: string;

    isSelected: boolean;
  }

  interface ToolGroupView {
    key: ToolProficiencyGroupKey;
    title: string;
    isAllSelected: boolean;
    items: ToolRow[];
  }

  const emit = defineEmits<{
    close: [];
  }>();

  const overlay = useOverlay();

  const { character, setToolProficiencies } = useCharacterSheet();

  const { groups, catalogItems, isEmpty, load } = useToolCatalog();

  // Дровер описания инструмента; без destroyOnClose — повторный open() после
  // закрытия иначе падает («Overlay not found»).
  const toolPreviewDrawer = overlay.create(ItemDrawer, {
    props: {
      url: '',
      onClose: () => toolPreviewDrawer.close(),
    },
  });

  function handlePreview(toolUrl: string) {
    toolPreviewDrawer.open({ url: toolUrl });
  }

  /** Ключи выбранных инструментов каталога. */
  const selectedKeys = ref(new Set<string>());

  /** Инструменты, которых нет в каталоге сайта: свои и не распознанные. */
  const customTools = ref<CharacterToolProficiency[]>([]);

  const customToolName = ref('');

  /** Каталог загружен и черновик собран. */
  const isDraftReady = ref(false);

  /** Игрок уже правил черновик — пересобирать его по каталогу нельзя. */
  const isDraftTouched = ref(false);

  function isGroupFullySelected(group: ToolCatalogGroup): boolean {
    return (
      group.items.length > 0
      && group.items.every((catalogItem) =>
        selectedKeys.value.has(getToolProficiencyKey(catalogItem.name)),
      )
    );
  }

  /**
   * Раскладывает сохранённые владения на выбор в каталоге и свои инструменты:
   * что нашлось на сайте — чекбокс, остальное — свой инструмент.
   */
  function initDraft(): void {
    const keys = new Set<string>();
    const unmatched: CharacterToolProficiency[] = [];

    for (const tool of character.value.proficiencies.tools) {
      const catalogItem = findToolInCatalog(tool, catalogItems.value);

      if (catalogItem) {
        keys.add(getToolProficiencyKey(catalogItem.name));

        continue;
      }

      unmatched.push(tool);
    }

    selectedKeys.value = keys;
    customTools.value = unmatched;
  }

  onMounted(async () => {
    await load();

    initDraft();
    isDraftReady.value = true;
  });

  // Каталог мог доехать после сборки черновика (его грузят и мастера класса с
  // предысторией по общему ключу): пересобираем раскладку, пока игрок ничего не
  // менял, иначе владения с сайта остались бы «своими».
  watch(groups, () => {
    if (!isDraftTouched.value) {
      initDraft();
    }
  });

  const displayGroups = computed<ToolGroupView[]>(() =>
    groups.value.map((group) => ({
      key: group.key,
      title: group.title,
      isAllSelected: isGroupFullySelected(group),
      items: group.items.map((catalogItem) => {
        const key = getToolProficiencyKey(catalogItem.name);

        return {
          ...catalogItem,
          key,
          isSelected: selectedKeys.value.has(key),
        };
      }),
    })),
  );

  const isCustomAddDisabled = computed(() => !customToolName.value.trim());

  function toggleTool(key: string) {
    isDraftTouched.value = true;

    const nextKeys = new Set(selectedKeys.value);

    if (nextKeys.has(key)) {
      nextKeys.delete(key);
    } else {
      nextKeys.add(key);
    }

    selectedKeys.value = nextKeys;
  }

  function toggleGroupAll(groupKey: ToolProficiencyGroupKey) {
    isDraftTouched.value = true;

    const group = groups.value.find(
      (catalogGroup) => catalogGroup.key === groupKey,
    );

    if (!group) {
      return;
    }

    const isAllSelected = isGroupFullySelected(group);

    const nextKeys = new Set(selectedKeys.value);

    group.items.forEach((catalogItem) => {
      const key = getToolProficiencyKey(catalogItem.name);

      if (isAllSelected) {
        nextKeys.delete(key);
      } else {
        nextKeys.add(key);
      }
    });

    selectedKeys.value = nextKeys;
  }

  /**
   * Добавляет свой инструмент. Название, совпавшее с каталогом, отмечает запись
   * каталога — иначе владение осталось бы без ссылки на предмет.
   */
  function handleAddCustomTool() {
    const name = customToolName.value.trim();

    if (!name) {
      return;
    }

    isDraftTouched.value = true;

    const catalogItem = findToolInCatalog(
      { name, url: null },
      catalogItems.value,
    );

    if (catalogItem) {
      selectedKeys.value = new Set(selectedKeys.value).add(
        getToolProficiencyKey(catalogItem.name),
      );

      customToolName.value = '';

      return;
    }

    const key = getToolProficiencyKey(name);

    const isDuplicate = customTools.value.some(
      (tool) => getToolProficiencyKey(tool.name) === key,
    );

    if (!isDuplicate) {
      customTools.value = [...customTools.value, { name, url: null }];
    }

    customToolName.value = '';
  }

  function handleRemoveCustomTool(name: string) {
    isDraftTouched.value = true;

    customTools.value = customTools.value.filter((tool) => tool.name !== name);
  }

  function handleApply() {
    const selectedFromCatalog = groups.value.flatMap(
      (group): CharacterToolProficiency[] =>
        group.items.filter((catalogItem) =>
          selectedKeys.value.has(getToolProficiencyKey(catalogItem.name)),
        ),
    );

    setToolProficiencies(
      unionToolProficiencies(selectedFromCatalog, customTools.value),
    );

    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="SHEET_TOOL_LABELS.title"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div
        v-if="!isDraftReady"
        class="flex items-center justify-center py-10"
      >
        <UIcon
          name="tabler:loader-2"
          class="size-6 animate-spin text-muted"
        />
      </div>

      <div
        v-else
        class="flex flex-col gap-4"
      >
        <span
          v-if="isEmpty"
          class="text-xs text-dimmed italic"
        >
          {{ SHEET_TOOL_LABELS.catalogEmpty }}
        </span>

        <div
          v-else
          class="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <div
            v-for="group in displayGroups"
            :key="group.key"
            class="flex flex-col gap-2 rounded-lg border border-default/50 bg-elevated/20 p-3"
          >
            <span
              class="border-b border-default/50 pb-2 text-center text-xs font-bold tracking-wider text-primary uppercase"
            >
              {{ group.title }}
            </span>

            <div class="flex items-center justify-between gap-2 text-sm">
              <span class="font-bold text-highlighted">
                {{ SHEET_TOOL_LABELS.selectAll }}
              </span>

              <UCheckbox
                :model-value="group.isAllSelected"
                :aria-label="`${SHEET_TOOL_LABELS.selectAll}: ${group.title}`"
                @update:model-value="toggleGroupAll(group.key)"
              />
            </div>

            <div
              v-for="row in group.items"
              :key="row.key"
              class="flex items-center gap-1 text-sm"
            >
              <span class="min-w-0 grow text-toned">{{ row.name }}</span>

              <UTooltip :text="SHEET_TOOL_LABELS.preview">
                <UButton
                  icon="tabler:layout-sidebar-right-expand"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  square
                  class="shrink-0"
                  :aria-label="`${SHEET_TOOL_LABELS.preview}: ${row.name}`"
                  @click.left.exact.prevent="handlePreview(row.url)"
                />
              </UTooltip>

              <UCheckbox
                :model-value="row.isSelected"
                :aria-label="row.name"
                @update:model-value="toggleTool(row.key)"
              />
            </div>
          </div>
        </div>

        <div
          class="flex flex-col gap-2 rounded-lg border border-default/50 bg-elevated/20 p-3"
        >
          <span class="text-xs font-bold tracking-wider text-primary uppercase">
            {{ SHEET_TOOL_LABELS.customTitle }}
          </span>

          <span class="text-xs text-dimmed">
            {{ SHEET_TOOL_LABELS.customHint }}
          </span>

          <div class="flex items-center gap-2">
            <UInput
              v-model="customToolName"
              class="min-w-0 grow"
              :placeholder="SHEET_TOOL_LABELS.customPlaceholder"
              :maxlength="CUSTOM_TOOL_NAME_MAX_LENGTH"
              @keydown.enter.prevent="handleAddCustomTool"
            />

            <UButton
              icon="tabler:plus"
              label="Добавить"
              color="neutral"
              variant="subtle"
              :disabled="isCustomAddDisabled"
              @click.left.exact.prevent="handleAddCustomTool"
            />
          </div>

          <div
            v-if="customTools.length"
            class="flex flex-wrap gap-1.5"
          >
            <UBadge
              v-for="tool in customTools"
              :key="tool.name"
              :label="tool.name"
              color="neutral"
              variant="subtle"
              size="sm"
            >
              <template #trailing>
                <UButton
                  icon="tabler:x"
                  color="error"
                  variant="ghost"
                  size="xs"
                  square
                  :aria-label="`${SHEET_TOOL_LABELS.removeCustom}: ${tool.name}`"
                  @click.left.exact.prevent="handleRemoveCustomTool(tool.name)"
                />
              </template>
            </UBadge>
          </div>

          <span
            v-else
            class="text-xs text-dimmed italic"
          >
            {{ SHEET_TOOL_LABELS.customEmpty }}
          </span>
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
          label="Применить"
          color="primary"
          :disabled="!isDraftReady"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
