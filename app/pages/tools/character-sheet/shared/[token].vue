<script setup lang="ts">
  import type { SheetKeyTarget } from '~character-sheet/model';

  import { CharacterSheetSkeleton } from '~character-sheet/body';
  import { CharacterSheetHost } from '~character-sheet/host';
  import {
    CHARACTER_SHEET_ROUTE,
    CHARACTER_SHEET_TITLE,
    getSheetPagePath,
    SHEET_HOST_LABELS,
  } from '~character-sheet/model';

  // Без definePageMeta с `auth`: страница открывается кем угодно, включая
  // анонима. Доступ решает токен, а не сессия — лист отдаёт публичная ручка,
  // а ручек записи по токену на бэке нет.
  useSeoMeta({
    title: CHARACTER_SHEET_TITLE,
    robots: 'noindex, nofollow',
  });

  const route = useRoute();

  // Защитная проверка параметра маршрута: массив или пустая строка → ''.
  const shareToken = computed(() => {
    const { token } = route.params;

    return typeof token === 'string' && token ? token : '';
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

  /**
   * Закрытие чужого листа возвращает к списку листов — там же лежит раздел
   * «Другие листы», из которого этот лист и открывают. Анониму, пришедшему по
   * ссылке, список объяснит, зачем нужен вход.
   */
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
      <!-- По ссылке лист грузится публичной ручкой, открыт на просмотр и не
        сохраняется: всё это решает хост по токену -->
      <CharacterSheetHost
        :key="shareToken"
        :share-token
        @close="handleClose"
        @retarget="handleRetarget"
      >
        <template #notFoundActions>
          <UButton to="/">
            {{ SHEET_HOST_LABELS.toHome }}
          </UButton>
        </template>
      </CharacterSheetHost>

      <template #fallback>
        <CharacterSheetSkeleton />
      </template>
    </ClientOnly>
  </NuxtLayout>
</template>
