<script setup lang="ts">
  import { Role } from '~/shared/types';
  import { CharacterSheetBody } from '~character-sheet/body';
  import {
    useCharacterSheet,
    useCharacterSheetDetail,
  } from '~character-sheet/composables';
  import { CharacterSheetList } from '~character-sheet/list';
  import {
    CHARACTER_SHEET_LIST_TITLE,
    CHARACTER_SHEET_ROUTE,
  } from '~character-sheet/model';

  definePageMeta({
    auth: { roles: [Role.ADMIN] },
  });

  useSeoMeta({
    title: CHARACTER_SHEET_LIST_TITLE,
  });

  const { character } = useCharacterSheet();
  const characterId = computed(() => character.value.id);

  const { detailId, isDetailOpen, isDetailDismissed, closeDetail } =
    useCharacterSheetDetail(characterId);

  /** Открывает выбранный лист на отдельной странице. */
  function handleExpand() {
    navigateTo(`${CHARACTER_SHEET_ROUTE}/${detailId.value}`);
  }
</script>

<template>
  <NuxtLayout
    name="section"
    :title="CHARACTER_SHEET_LIST_TITLE"
  >
    <template #controls>
      <p class="text-sm text-muted">
        Черновой лист. Сохранение появится позже.
      </p>
    </template>

    <template #default>
      <ClientOnly>
        <CharacterSheetList />

        <template #fallback>
          <div class="flex justify-center py-16">
            <UIcon
              name="tabler:loader-2"
              class="size-8 animate-spin text-muted"
            />
          </div>
        </template>
      </ClientOnly>
    </template>

    <template #detail>
      <ClientOnly>
        <div
          v-if="isDetailOpen"
          class="flex h-full flex-col overflow-y-auto p-4"
        >
          <CharacterSheetBody
            can-expand
            @close="closeDetail"
            @expand="handleExpand"
          />
        </div>

        <div
          v-else-if="isDetailDismissed"
          class="flex h-full w-full flex-col items-center justify-center p-6 text-center select-none"
        >
          <div class="flex max-w-xs flex-col items-center gap-3">
            <UIcon
              name="tabler:click"
              class="size-10 text-muted"
            />

            <h3 class="text-lg font-semibold text-highlighted">
              Лист не выбран
            </h3>

            <p class="text-sm text-secondary">
              Выберите лист персонажа из списка слева, чтобы открыть его здесь
            </p>
          </div>
        </div>

        <div
          v-else
          class="flex justify-center py-16"
        >
          <UIcon
            name="tabler:loader-2"
            class="size-8 animate-spin text-muted"
          />
        </div>
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
