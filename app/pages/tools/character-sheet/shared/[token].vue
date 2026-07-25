<script setup lang="ts">
  import { CharacterSheetBody } from '~character-sheet/body';
  import { useCharacterSheetLoader } from '~character-sheet/composables';
  import { CHARACTER_SHEET_TITLE } from '~character-sheet/model';
  import { UiResult } from '~ui/result';

  // Без definePageMeta с `auth`: в отличие от остальных страниц раздела эта
  // открывается кем угодно, включая анонима. Доступ решает токен, а не сессия —
  // лист отдаёт публичная ручка, а ручек записи по токену на бэке нет.
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

  // shared: лист грузится публичной ручкой, а состояние переводится в режим
  // просмотра. Автосохранение здесь не подключается сознательно — правок нет,
  // а его модульная очередь слала бы PUT в чужой лист.
  const { status, load } = useCharacterSheetLoader(shareToken, {
    shared: true,
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="CHARACTER_SHEET_TITLE"
  >
    <ClientOnly>
      <div
        v-if="status === 'pending' || status === 'idle'"
        class="flex justify-center py-16"
      >
        <UIcon
          name="tabler:loader-2"
          class="size-8 animate-spin text-muted"
        />
      </div>

      <UiResult
        v-else-if="status === 'notFound'"
        status="404"
        title="Лист недоступен"
        sub-title="Ссылка неверна или владелец отключил доступ по ней"
      >
        <template #extra>
          <UButton to="/"> На главную </UButton>
        </template>
      </UiResult>

      <UiResult
        v-else-if="status === 'error'"
        status="error"
        title="Не удалось загрузить лист"
      >
        <template #extra>
          <UButton @click.left.exact.prevent="load"> Повторить </UButton>
        </template>
      </UiResult>

      <CharacterSheetBody
        v-else
        :can-close="false"
      />

      <template #fallback>
        <div class="flex justify-center py-16">
          <UIcon
            name="tabler:loader-2"
            class="size-8 animate-spin text-muted"
          />
        </div>
      </template>
    </ClientOnly>
  </NuxtLayout>
</template>
