<script setup lang="ts">
  import type { SheetKeyTarget } from '~character-sheet/model';

  import { USER_TOKEN_COOKIE } from '#shared/consts';
  import { useCharacterSheetDetail } from '~character-sheet/composables';
  import { CharacterSheetControls } from '~character-sheet/controls';
  import { CharacterSheetHost } from '~character-sheet/host';
  import { CharacterSheetList } from '~character-sheet/list';
  import {
    CHARACTER_SHEET_LIST_TITLE,
    createSheetKey,
    getSheetPagePath,
    SHEET_HOST_LABELS,
    SHEET_LOGIN_PROMPT,
  } from '~character-sheet/model';
  import { UiResult } from '~ui/result';
  import { AuthModal } from '~user/auth-modal';

  // Без definePageMeta с `auth`: пункт «Лист персонажа» в меню и на главной
  // виден всем, поэтому и страница открывается анониму. Приватное содержимое
  // (список, импорт, панель деталей) остаётся за сессией — анониму вместо него
  // показывается приглашение войти.
  useSeoMeta({
    title: CHARACTER_SHEET_LIST_TITLE,
  });

  // Сессию решает кука токена, а не профиль: профиль догружается лениво уже
  // после монтирования, и залогиненный успевал бы увидеть приглашение войти.
  // Кука известна и на SSR, поэтому разметка сервера и клиента совпадает.
  const token = useCookie<string | null>(USER_TOKEN_COOKIE);

  const { isLoggedIn } = useUser();

  const hasSession = computed(() => isLoggedIn.value || Boolean(token.value));

  const isAuthOpen = ref(false);

  // Вход и выход меняют куку: и через общую модалку в шлеме сайта (там
  // меняется isLoggedIn), и через локальное окно (о конце входа говорит его
  // закрытие). Без сброса кэш `useCookie` помнит состояние на момент гидрации,
  // и приглашение не сменилось бы списком листов. Цикла нет: вотчер меняет
  // только кэш куки, на свои источники он не влияет.
  watch([isLoggedIn, isAuthOpen], () => {
    refreshCookie(USER_TOKEN_COOKIE);
  });

  // С сессией у layout появляется слот #detail, и в широком режиме он заново
  // собирает колонки: окно входа пересоздаётся открытым, а «закрыть» от старой
  // формы теряется вместе с ней. Поэтому окно закрывает сама страница.
  // Закрытие будит вотчер куки выше, а обновлённая кука может снова тронуть
  // `hasSession`, но цикл обрывается: окно уже закрыто, повторная запись
  // `false` ничего не меняет и вотчеры больше не срабатывают.
  whenever(hasSession, () => {
    isAuthOpen.value = false;
  });

  /** Открывает окно входа из приглашения. */
  function openAuth(): void {
    isAuthOpen.value = true;
  }

  // Панель показывает и свои листы (`?detail=<id>`), и чужие, сохранённые по
  // ссылке (`?detail=shared:<token>`): хосту листа хватает цели и режима.
  const {
    detailTarget,
    isSharedDetail,
    isDetailOpen,
    detailPagePath,
    closeDetail,
  } = useCharacterSheetDetail();

  // Свой лист хост получает идентификатором, чужой — токеном ссылки
  const detailHostProps = computed(() =>
    isSharedDetail.value
      ? { shareToken: detailTarget.value }
      : { characterId: detailTarget.value },
  );

  // Другой лист в панели — новый хост: лист задаётся ему один раз
  const detailHostKey = computed(() =>
    createSheetKey({
      source: isSharedDetail.value ? 'shared' : 'own',
      id: detailTarget.value,
    }),
  );

  /**
   * Лист в панели просит показать вместо себя другой: право на правки выдали
   * или отозвали. Как и раньше, открывается страница этого листа.
   * @param target - чей лист и чем он открывается; `null` — листа нет
   */
  function handleRetarget(target: SheetKeyTarget | null) {
    navigateTo(getSheetPagePath(target), { replace: true });
  }

  /** Открывает выбранный лист на отдельной странице. */
  function handleExpand() {
    navigateTo(detailPagePath.value);
  }
</script>

<template>
  <NuxtLayout
    name="section"
    :title="CHARACTER_SHEET_LIST_TITLE"
  >
    <!-- Импорт живёт там же, где в остальных разделах фильтры: под названием
      раздела. Действия над конкретным листом остаются в меню его карточки.
      Анониму слот не отдаётся: импорт — та же приватная ручка создания. -->
    <template
      v-if="hasSession"
      #controls
    >
      <ClientOnly>
        <CharacterSheetControls />

        <template #fallback>
          <div class="flex flex-col gap-2">
            <USkeleton class="h-8 w-full rounded-md" />

            <USkeleton class="h-3 w-3/4 rounded-sm" />
          </div>
        </template>
      </ClientOnly>
    </template>

    <template #default>
      <!-- Приглашение рендерится и на сервере: страница публичная, сессия
        известна по куке уже на SSR — анониму не мигает спиннер. -->
      <UiResult
        v-if="!hasSession"
        status="info"
        :title="SHEET_LOGIN_PROMPT.title"
        :sub-title="SHEET_LOGIN_PROMPT.subtitle"
      >
        <template #extra>
          <UButton
            icon="tabler:user"
            @click.left.exact.prevent="openAuth"
          >
            {{ SHEET_LOGIN_PROMPT.action }}
          </UButton>
        </template>
      </UiResult>

      <ClientOnly v-else>
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

      <AuthModal v-model="isAuthOpen" />
    </template>

    <!-- Правой панели у анонима нет вовсе: без слота layout не включает
      трёхколоночный режим, и приглашение занимает всю ширину. -->
    <template
      v-if="hasSession"
      #detail
    >
      <ClientOnly>
        <div
          v-if="isDetailOpen"
          class="flex h-full flex-col overflow-y-auto p-4"
        >
          <CharacterSheetHost
            :key="detailHostKey"
            v-bind="detailHostProps"
            can-expand
            @close="closeDetail"
            @expand="handleExpand"
            @retarget="handleRetarget"
          >
            <template #notFoundActions>
              <UButton @click.left.exact.prevent="closeDetail">
                {{ SHEET_HOST_LABELS.toList }}
              </UButton>
            </template>
          </CharacterSheetHost>
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
              {{ SHEET_HOST_LABELS.emptyTitle }}
            </h3>

            <p class="text-sm text-secondary">
              {{ SHEET_HOST_LABELS.emptyDescription }}
            </p>
          </div>
        </div>
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
