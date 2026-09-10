<script setup lang="ts">
  import type { HomeActivityTab } from './model';

  import {
    HOME_COMMENTS_ALL_LABEL,
    RECENT_COMMENTS_ROUTE,
  } from '~comments/model';
  import { HomeComments } from '~home/comments';
  import { HomeRecentChanges } from '~home/recent-changes';
  import { HomePanel } from '~home/ui-kit';

  import { HOME_ACTIVITY_TAB_DEFAULT, HOME_ACTIVITY_TABS } from './model';

  /**
   * Две ленты о жизни сайта — обсуждения читателей и правки каталога — стоят в
   * одной панели и переключаются вкладками: по отдельности каждая занимала
   * колонку целиком, а смотрят на них по очереди, а не одновременно.
   */
  const activeTab = ref<HomeActivityTab>(HOME_ACTIVITY_TAB_DEFAULT);

  const isComments = computed(() => activeTab.value === 'comments');

  // Подвал есть только у обсуждений: у обновлений каталога нет отдельной
  // страницы со всем списком.
  const footerRoute = computed(() =>
    isComments.value ? RECENT_COMMENTS_ROUTE : undefined,
  );

  const footerLabel = computed(() =>
    isComments.value ? HOME_COMMENTS_ALL_LABEL : undefined,
  );
</script>

<template>
  <HomePanel
    fill
    :to="footerRoute"
    :link-label="footerLabel"
    body-class="p-0"
    header-class="p-0"
  >
    <template #header>
      <!--
        Переключатель сделан не кнопками поверх шапки, а самой шапкой: две
        половины одной подписи, разделённые волосяной линией. Активная берёт
        акцент и подчёркивается снизу, вторая гаснет до `text-dimmed`. Так блок
        читается как обычная панель с моно-подписью, просто у неё два имени.

        Длинный in-[…]-модификатор гасит SSR-заглушку: до гидрации reka не
        рисует бегунок и подсвечивает активную вкладку через `before:`, из-за
        чего на первом рендере мелькала бы сплошная заливка.
      -->
      <UTabs
        v-model="activeTab"
        :items="HOME_ACTIVITY_TABS"
        :content="false"
        variant="link"
        color="primary"
        size="xs"
        class="w-full"
        :ui="{
          list: 'w-full gap-0 rounded-none border-b-0 bg-transparent p-0',
          indicator: 'h-px rounded-none bg-primary',
          trigger: [
            'flex-1 rounded-none border-l border-default px-2 py-3 first-of-type:border-l-0',
            'font-mono text-[10px] leading-none tracking-[0.12em] uppercase',
            'text-dimmed hover:text-toned data-[state=active]:text-primary',
            'in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:before:bg-transparent',
          ],
          leadingIcon: 'size-3.5',
        }"
      />
    </template>

    <!--
      Ленты монтируются по требованию: вторая вкладка не тянет свой запрос,
      пока её не открыли. Данные `useAsyncData` живут в кеше по ключу, поэтому
      возврат на вкладку показывает их сразу, без повторного скелетона.
    -->
    <HomeComments v-if="isComments" />

    <HomeRecentChanges v-else />
  </HomePanel>
</template>
