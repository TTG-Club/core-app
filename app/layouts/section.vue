<script setup lang="ts">
  import {
    SECTION_SPLIT_LIST_SIZE,
    SECTION_SPLIT_STORAGE_KEY,
    SECTION_SPLIT_WIDE_DETAIL_STORAGE_KEY,
  } from '~/shared/consts';
  import { SectionContent, SectionSidebar } from '~/shared/ui/section';
  import { AppFooter } from '~infrastructure/footer';

  const { wideDetail = false } = defineProps<{
    title: string;
    /**
     * Карточка раздела по умолчанию шире списка: ей нужно место под колонку
     * свойств и навигацию рядом с текстом (страница класса).
     */
    wideDetail?: boolean;
  }>();

  const route = useRoute();
  const alert = computed(() => route.meta.alert);

  const { isSplitActive } = useLayoutWidth();

  const listDefaultSize = computed(() =>
    wideDetail
      ? SECTION_SPLIT_LIST_SIZE.wideDetail
      : SECTION_SPLIT_LIST_SIZE.default,
  );

  const splitStorageKey = computed(() =>
    wideDetail
      ? SECTION_SPLIT_WIDE_DETAIL_STORAGE_KEY
      : SECTION_SPLIT_STORAGE_KEY,
  );
</script>

<template>
  <!-- Трехколоночный режим (Wide Mode) -->
  <div
    v-if="isSplitActive && $slots.detail"
    class="flex min-h-dvh w-full flex-col lg:flex-row"
  >
    <SectionSidebar :title="title">
      <slot name="controls" />
    </SectionSidebar>

    <!-- Средняя и правая колонки (Dashboard Group) -->
    <UDashboardGroup
      storage="cookie"
      :storage-key="splitStorageKey"
      :ui="{
        base: 'relative inset-auto flex flex-1 overflow-hidden h-dvh w-full',
      }"
      class="flex-auto"
    >
      <!-- Средняя колонка: Список -->
      <UDashboardPanel
        id="section-list"
        resizable
        :default-size="listDefaultSize"
        :min-size="SECTION_SPLIT_LIST_SIZE.min"
        :max-size="SECTION_SPLIT_LIST_SIZE.max"
        :ui="{
          handle:
            'after:absolute after:inset-y-0 after:right-0 after:w-px after:transition hover:after:bg-(--ui-border-accented)',
        }"
        class="flex h-full flex-col border-r border-default py-3"
      >
        <div
          id="section-list-container"
          class="mr-1.5 flex h-full flex-auto flex-col gap-4 overflow-y-auto pr-3 pb-4 pl-4"
        >
          <SectionContent :alert="alert">
            <slot name="default" />
          </SectionContent>
        </div>
      </UDashboardPanel>

      <!-- Правая колонка: Детали -->
      <UDashboardPanel
        id="section-detail"
        class="flex h-full flex-col"
      >
        <slot name="detail" />
      </UDashboardPanel>
    </UDashboardGroup>
  </div>

  <!-- Стандартный режим (Default Mode / Mobile) -->
  <div
    v-else
    class="flex min-h-dvh w-full flex-col"
  >
    <div
      class="mx-auto flex min-h-dvh w-full flex-col lg:max-w-330 lg:flex-row"
    >
      <SectionSidebar :title="title">
        <slot name="controls" />
      </SectionSidebar>

      <div class="flex min-h-dvh flex-auto flex-col gap-4 px-4 pb-8 lg:pt-4">
        <SectionContent :alert="alert">
          <slot name="default" />
        </SectionContent>
      </div>
    </div>

    <AppFooter />
  </div>
</template>
