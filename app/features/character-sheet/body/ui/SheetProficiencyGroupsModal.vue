<script setup lang="ts">
  import type {
    PlainProficiencyGroupKey,
    ProficiencyCatalogGroup,
  } from '../../model';

  import { useCharacterSheet } from '../../composables';
  import {
    CUSTOM_LANGUAGE_NAME_MAX_LENGTH,
    normalizeCatalogName,
    SHEET_LANGUAGE_LABELS,
  } from '../../model';

  const props = defineProps<{
    /** Заголовок модалки. */
    title: string;

    /** Редактируемая группа владений персонажа. */
    target: Extract<PlainProficiencyGroupKey, 'armor' | 'languages'>;

    /** Каталог групп владений. */
    groups: ProficiencyCatalogGroup[];
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setProficiencies } = useCharacterSheet();

  const catalogNames = new Set(
    props.groups.flatMap((group) => [group.all, ...group.items]),
  );

  // Записи вне каталога (произвольные строки) чекбоксами не редактируются и
  // сохраняются в конце списка: у языков ими управляет блок «Свой язык», у
  // брони они просто переносятся как есть.
  const customEntries = ref(
    character.value.proficiencies[props.target].filter(
      (name) => !catalogNames.has(name),
    ),
  );

  const customName = ref('');

  /** Вид каталога по нормализованному названию. */
  const catalogItemByKey = new Map(
    props.groups.flatMap((group) =>
      group.items.map((name): [string, string] => [
        normalizeCatalogName(name),
        name,
      ]),
    ),
  );

  /** Группа каталога по нормализованной подписи «вся группа». */
  const groupByAllKey = new Map(
    props.groups.map((group): [string, ProficiencyCatalogGroup] => [
      normalizeCatalogName(group.all),
      group,
    ]),
  );

  /** Свою запись вписывают только языкам: список брони закрыт каталогом. */
  const isCustomAllowed = computed(() => props.target === 'languages');

  const isCustomAddDisabled = computed(() => !customName.value.trim());

  // В черновике держим только конкретные виды: пункт «вся группа» производный —
  // включён, когда выбраны все виды группы. Сохранённая запись «вся группа»
  // разворачивается в полный список видов.
  const draftSelected = ref(
    new Set<string>(
      props.groups.flatMap((group) => {
        if (character.value.proficiencies[props.target].includes(group.all)) {
          return group.items;
        }

        return group.items.filter((name) =>
          character.value.proficiencies[props.target].includes(name),
        );
      }),
    ),
  );

  function isGroupFullySelected(group: ProficiencyCatalogGroup): boolean {
    return group.items.every((name) => draftSelected.value.has(name));
  }

  // Три группы (языки) раскладываются в три колонки, иначе — в две.
  const contentClass = computed(() =>
    props.groups.length === 3 ? 'sm:max-w-3xl' : 'sm:max-w-2xl',
  );

  const gridClass = computed(() =>
    props.groups.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
  );

  const displayGroups = computed(() =>
    props.groups.map((group) => ({
      key: group.key,
      title: group.title,
      allLabel: group.all,
      isAllSelected: isGroupFullySelected(group),
      items: group.items.map((name) => ({
        name,
        isSelected: draftSelected.value.has(name),
      })),
    })),
  );

  function toggleEntry(name: string) {
    if (draftSelected.value.has(name)) {
      draftSelected.value.delete(name);
    } else {
      draftSelected.value.add(name);
    }
  }

  function toggleGroupAll(groupKey: string) {
    const group = props.groups.find(
      (catalogGroup) => catalogGroup.key === groupKey,
    );

    if (!group) {
      return;
    }

    const isAllSelected = isGroupFullySelected(group);

    group.items.forEach((name) => {
      if (isAllSelected) {
        draftSelected.value.delete(name);
      } else {
        draftSelected.value.add(name);
      }
    });
  }

  /**
   * Добавляет свой язык. Название из каталога отмечает чекбокс (а подпись «вся
   * группа» — всю группу), иначе тот же язык попал бы в лист дважды.
   */
  function handleAddCustomEntry() {
    const name = customName.value.trim();

    if (!name) {
      return;
    }

    const key = normalizeCatalogName(name);

    const catalogItem = catalogItemByKey.get(key);

    if (catalogItem) {
      draftSelected.value.add(catalogItem);
      customName.value = '';

      return;
    }

    const catalogGroup = groupByAllKey.get(key);

    if (catalogGroup) {
      catalogGroup.items.forEach((itemName) => {
        draftSelected.value.add(itemName);
      });

      customName.value = '';

      return;
    }

    const isDuplicate = customEntries.value.some(
      (entry) => normalizeCatalogName(entry) === key,
    );

    if (!isDuplicate) {
      customEntries.value = [...customEntries.value, name];
    }

    customName.value = '';
  }

  function handleRemoveCustomEntry(entry: string) {
    customEntries.value = customEntries.value.filter((name) => name !== entry);
  }

  function handleApply() {
    const selectedFromCatalog = props.groups.flatMap((group) => {
      if (isGroupFullySelected(group)) {
        return [group.all];
      }

      return group.items.filter((name) => draftSelected.value.has(name));
    });

    setProficiencies(props.target, [
      ...selectedFromCatalog,
      ...customEntries.value,
    ]);

    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="title"
    :ui="{ content: contentClass }"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <div
          class="grid grid-cols-1 gap-3"
          :class="gridClass"
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
                {{ group.allLabel }}
              </span>

              <UCheckbox
                :model-value="group.isAllSelected"
                :aria-label="group.allLabel"
                @update:model-value="toggleGroupAll(group.key)"
              />
            </div>

            <div
              v-for="row in group.items"
              :key="row.name"
              class="flex items-center justify-between gap-2 text-sm"
            >
              <span class="text-toned">{{ row.name }}</span>

              <UCheckbox
                :model-value="row.isSelected"
                :aria-label="row.name"
                @update:model-value="toggleEntry(row.name)"
              />
            </div>
          </div>
        </div>

        <div
          v-if="isCustomAllowed"
          class="flex flex-col gap-2 rounded-lg border border-default/50 bg-elevated/20 p-3"
        >
          <span class="text-xs font-bold tracking-wider text-primary uppercase">
            {{ SHEET_LANGUAGE_LABELS.customTitle }}
          </span>

          <span class="text-xs text-dimmed">
            {{ SHEET_LANGUAGE_LABELS.customHint }}
          </span>

          <div class="flex items-center gap-2">
            <UInput
              v-model="customName"
              class="min-w-0 grow"
              :placeholder="SHEET_LANGUAGE_LABELS.customPlaceholder"
              :aria-label="SHEET_LANGUAGE_LABELS.customPlaceholder"
              :maxlength="CUSTOM_LANGUAGE_NAME_MAX_LENGTH"
              @keydown.enter.prevent="handleAddCustomEntry"
            />

            <UButton
              icon="tabler:plus"
              :label="SHEET_LANGUAGE_LABELS.addCustom"
              color="neutral"
              variant="subtle"
              :disabled="isCustomAddDisabled"
              @click.left.exact.prevent="handleAddCustomEntry"
            />
          </div>

          <div
            v-if="customEntries.length"
            class="flex flex-wrap gap-1.5"
          >
            <span
              v-for="entry in customEntries"
              :key="entry"
              class="flex items-center gap-1 rounded border border-default bg-default/40 py-1 pr-1 pl-2.5 text-[11px] text-toned"
            >
              {{ entry }}

              <UButton
                icon="tabler:x"
                color="error"
                variant="ghost"
                size="xs"
                square
                :aria-label="`${SHEET_LANGUAGE_LABELS.removeCustom}: ${entry}`"
                @click.left.exact.prevent="handleRemoveCustomEntry(entry)"
              />
            </span>
          </div>

          <span
            v-else
            class="text-xs text-dimmed italic"
          >
            {{ SHEET_LANGUAGE_LABELS.customEmpty }}
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
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
