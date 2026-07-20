<script setup lang="ts">
  import type { WeaponProficiencyGroup } from '../../model';

  import { useCharacterSheet } from '../../composables';
  import {
    WEAPON_GROUP_TITLE_CLASSES,
    WEAPON_MASTERY_ICON,
    WEAPON_PROFICIENCY_GROUPS,
    WEAPON_PROFICIENCY_ICON,
  } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setProficiencies } = useCharacterSheet();

  const catalogNames = new Set(
    WEAPON_PROFICIENCY_GROUPS.flatMap((group) => [group.all, ...group.items]),
  );

  // Записи вне каталога (произвольные строки) не редактируются чекбоксами
  // и сохраняются в конце списков как есть.
  const unknownWeapons = character.value.proficiencies.weapons.filter(
    (name) => !catalogNames.has(name),
  );

  const unknownMasteries = character.value.proficiencies.weaponMasteries.filter(
    (name) => !catalogNames.has(name),
  );

  // В черновике держим только конкретные виды оружия: пункт «вся группа»
  // производный — включён, когда выбраны все виды группы. Сохранённая запись
  // «вся группа» разворачивается в полный список видов.
  const draftProficient = ref(
    new Set<string>(
      WEAPON_PROFICIENCY_GROUPS.flatMap((group) => {
        if (character.value.proficiencies.weapons.includes(group.all)) {
          return group.items;
        }

        return group.items.filter((name) =>
          character.value.proficiencies.weapons.includes(name),
        );
      }),
    ),
  );

  const draftMastery = ref(
    new Set<string>(
      character.value.proficiencies.weaponMasteries.filter((name) =>
        catalogNames.has(name),
      ),
    ),
  );

  function isGroupFullySelected(group: WeaponProficiencyGroup): boolean {
    return group.items.every((name) => draftProficient.value.has(name));
  }

  const displayGroups = computed(() =>
    WEAPON_PROFICIENCY_GROUPS.map((group) => ({
      key: group.key,
      title: group.title,
      titleClass: WEAPON_GROUP_TITLE_CLASSES[group.key],
      allLabel: group.all,
      isAllSelected: isGroupFullySelected(group),
      items: group.items.map((name) => ({
        name,
        isProficient: draftProficient.value.has(name),
        isMastered: draftMastery.value.has(name),
      })),
    })),
  );

  function toggleProficiency(name: string) {
    if (draftProficient.value.has(name)) {
      draftProficient.value.delete(name);

      // Мастерство без владения невозможно.
      draftMastery.value.delete(name);
    } else {
      draftProficient.value.add(name);
    }
  }

  function toggleMastery(name: string) {
    if (!draftProficient.value.has(name)) {
      return;
    }

    if (draftMastery.value.has(name)) {
      draftMastery.value.delete(name);
    } else {
      draftMastery.value.add(name);
    }
  }

  function toggleGroupAll(groupKey: WeaponProficiencyGroup['key']) {
    const group = WEAPON_PROFICIENCY_GROUPS.find(
      (catalogGroup) => catalogGroup.key === groupKey,
    );

    if (!group) {
      return;
    }

    const isAllSelected = isGroupFullySelected(group);

    group.items.forEach((name) => {
      if (isAllSelected) {
        draftProficient.value.delete(name);
        draftMastery.value.delete(name);
      } else {
        draftProficient.value.add(name);
      }
    });
  }

  function handleApply() {
    const selectedWeapons = WEAPON_PROFICIENCY_GROUPS.flatMap((group) => {
      if (isGroupFullySelected(group)) {
        return [group.all];
      }

      return group.items.filter((name) => draftProficient.value.has(name));
    });

    const selectedMasteries = WEAPON_PROFICIENCY_GROUPS.flatMap((group) =>
      group.items.filter((name) => draftMastery.value.has(name)),
    );

    setProficiencies('weapons', [...selectedWeapons, ...unknownWeapons]);

    setProficiencies('weaponMasteries', [
      ...selectedMasteries,
      ...unknownMasteries,
    ]);

    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    title="Владение и мастерство оружием"
    :ui="{ content: 'sm:max-w-3xl' }"
  >
    <template #body>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div
          v-for="group in displayGroups"
          :key="group.key"
          class="flex flex-col gap-2 rounded-lg border border-default/50 bg-elevated/20 p-3"
        >
          <span
            class="border-b border-default/50 pb-2 text-center text-xs font-bold tracking-wider uppercase"
            :class="group.titleClass"
          >
            {{ group.title }}
          </span>

          <div
            class="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-2 text-sm"
          >
            <span />

            <UTooltip
              text="Владение"
              class="justify-self-center"
            >
              <UIcon
                :name="WEAPON_PROFICIENCY_ICON"
                class="size-3.5 text-success"
              />
            </UTooltip>

            <UTooltip
              text="Мастерство"
              class="justify-self-center"
            >
              <UIcon
                :name="WEAPON_MASTERY_ICON"
                class="size-3.5 text-success"
              />
            </UTooltip>

            <span class="font-bold text-highlighted">
              {{ group.allLabel }}
            </span>

            <UCheckbox
              class="justify-self-center"
              :model-value="group.isAllSelected"
              :aria-label="group.allLabel"
              @update:model-value="toggleGroupAll(group.key)"
            />

            <span />

            <template
              v-for="row in group.items"
              :key="row.name"
            >
              <span class="text-toned">{{ row.name }}</span>

              <UCheckbox
                class="justify-self-center"
                :model-value="row.isProficient"
                :aria-label="`Владение: ${row.name}`"
                @update:model-value="toggleProficiency(row.name)"
              />

              <UCheckbox
                class="justify-self-center"
                :model-value="row.isMastered"
                :disabled="!row.isProficient"
                :aria-label="`Мастерство: ${row.name}`"
                @update:model-value="toggleMastery(row.name)"
              />
            </template>
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
