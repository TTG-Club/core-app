<script setup lang="ts">
  import type { SheetKeyTarget } from '~character-sheet/model';

  import { Role } from '~/shared/types';
  import { CharacterSheetSkeleton } from '~character-sheet/body';
  import { CharacterSheetHost } from '~character-sheet/host';
  import {
    CHARACTER_SHEET_ROUTE,
    CHARACTER_SHEET_TITLE,
    getSheetPagePath,
    SHEET_HOST_LABELS,
  } from '~character-sheet/model';

  definePageMeta({
    auth: { roles: [Role.USER] },
  });

  useSeoMeta({
    title: CHARACTER_SHEET_TITLE,
    robots: 'noindex, nofollow',
  });

  const route = useRoute();

  // Защитная проверка параметра маршрута: массив или пустая строка → ''.
  const sheetId = computed(() => {
    const { id } = route.params;

    return typeof id === 'string' && id ? id : '';
  });

  /**
   * Лист просит показать вместо себя другой: право на правки выдали или
   * отозвали. Страница переходит на адрес этого листа, не оставляя прежний
   * в истории.
   * @param target - чей лист и чем он открывается; `null` — листа нет
   */
  function handleRetarget(target: SheetKeyTarget | null) {
    navigateTo(getSheetPagePath(target), { replace: true });
  }

  /** Закрытие листа возвращает к списку листов персонажей. */
  function handleClose() {
    navigateTo(CHARACTER_SHEET_ROUTE);
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="CHARACTER_SHEET_TITLE"
  >
    <ClientOnly>
      <!-- Ключ: другой лист по тому же маршруту — новый хост -->
      <CharacterSheetHost
        :key="sheetId"
        :character-id="sheetId"
        @close="handleClose"
        @retarget="handleRetarget"
      >
        <template #notFoundActions>
          <UButton :to="CHARACTER_SHEET_ROUTE">
            {{ SHEET_HOST_LABELS.toList }}
          </UButton>
        </template>
      </CharacterSheetHost>

      <template #fallback>
        <CharacterSheetSkeleton />
      </template>
    </ClientOnly>
  </NuxtLayout>
</template>
