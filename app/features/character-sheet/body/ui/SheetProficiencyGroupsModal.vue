<script setup lang="ts">
  import type {
    ProficiencyCatalogGroup,
    ProficiencyGroupKey,
  } from '../../model';

  import { useCharacterSheet } from '../../composables';

  const props = defineProps<{
    /** Заголовок модалки. */
    title: string;

    /** Редактируемая группа владений персонажа. */
    target: Extract<ProficiencyGroupKey, 'armor' | 'tools' | 'languages'>;

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

  // Записи вне каталога (произвольные строки) не редактируются чекбоксами
  // и сохраняются в конце списка как есть.
  const unknownEntries = character.value.proficiencies[props.target].filter(
    (name) => !catalogNames.has(name),
  );

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

  function handleApply() {
    const selectedFromCatalog = props.groups.flatMap((group) => {
      if (isGroupFullySelected(group)) {
        return [group.all];
      }

      return group.items.filter((name) => draftSelected.value.has(name));
    });

    setProficiencies(props.target, [...selectedFromCatalog, ...unknownEntries]);
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
            class="border-b border-default/50 pb-2 text-center text-xs font-bold tracking-wider text-warning uppercase"
          >
            {{ group.title }}
          </span>

          <div class="flex items-center justify-between gap-2 text-sm">
            <span class="font-bold text-highlighted">{{ group.allLabel }}</span>

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
