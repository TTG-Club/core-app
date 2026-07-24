<script setup lang="ts">
  import { Role } from '~/shared/types';
  import { CharacterSheetBody } from '~character-sheet/body';
  import {
    useCharacterSheetAutosave,
    useCharacterSheetDetail,
    useCharacterSheetLoader,
  } from '~character-sheet/composables';
  import { CharacterSheetList } from '~character-sheet/list';
  import {
    CHARACTER_SHEET_LIST_TITLE,
    CHARACTER_SHEET_ROUTE,
  } from '~character-sheet/model';
  import { UiResult } from '~ui/result';

  definePageMeta({
    auth: { roles: [Role.ADMIN] },
  });

  useSeoMeta({
    title: CHARACTER_SHEET_LIST_TITLE,
  });

  const { detailId, isDetailOpen, closeDetail } = useCharacterSheetDetail();

  const { status: detailStatus, load: reloadDetail } =
    useCharacterSheetLoader(detailId);

  useCharacterSheetAutosave();

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
          <div
            v-if="detailStatus === 'pending'"
            class="flex justify-center py-16"
          >
            <UIcon
              name="tabler:loader-2"
              class="size-8 animate-spin text-muted"
            />
          </div>

          <UiResult
            v-else-if="detailStatus === 'notFound'"
            status="404"
            title="Лист не найден"
            sub-title="Возможно, он был удалён или принадлежит другому пользователю"
          >
            <template #extra>
              <UButton @click.left.exact.prevent="closeDetail">
                К списку листов
              </UButton>
            </template>
          </UiResult>

          <UiResult
            v-else-if="detailStatus === 'error'"
            status="error"
            title="Не удалось загрузить лист"
          >
            <template #extra>
              <UButton @click.left.exact.prevent="reloadDetail">
                Повторить
              </UButton>
            </template>
          </UiResult>

          <CharacterSheetBody
            v-else-if="detailStatus === 'ready'"
            can-expand
            @close="closeDetail"
            @expand="handleExpand"
          />
        </div>

        <div
          v-else
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
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
