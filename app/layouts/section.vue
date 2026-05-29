<script setup lang="ts">
  import { SectionContent, SectionSidebar } from '~/shared/ui/section';
  import { AppFooter } from '~infrastructure/footer';

  defineProps<{
    title: string;
  }>();

  const route = useRoute();
  const alert = computed(() => route.meta.alert);

  const { isSplitActive } = useLayoutWidth();
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
      storage-key="ttg-section-split"
      :ui="{
        base: 'relative inset-auto flex flex-1 overflow-hidden h-dvh w-full',
      }"
      class="flex-auto"
    >
      <!-- Средняя колонка: Список -->
      <UDashboardPanel
        id="section-list"
        resizable
        :default-size="50"
        :min-size="30"
        :max-size="70"
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
